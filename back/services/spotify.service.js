const axios = require('axios')
const logger = require('./logger.service')

let gAccessToken = null
let gTokenExpiresAt = 0

async function getAccessToken() {
  try {
    if (gAccessToken && Date.now() < gTokenExpiresAt - 60 * 1000) {
      logger.debug('spotify.getAccessToken - reuse cached token')
      return gAccessToken
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    if (!clientId || !clientSecret) throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in environment')

    const startedAt = Date.now()
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    logger.debug('spotify.getAccessToken - requesting new token')
    const resp = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${authHeader}`,
        },
      }
    )
    gAccessToken = resp.data.access_token
    gTokenExpiresAt = Date.now() + resp.data.expires_in * 1000
    logger.info('spotify.getAccessToken - success', { durationMs: Date.now() - startedAt })
    return gAccessToken
  } catch (err) {
    const status = err?.response?.status
    const data = err?.response?.data
    logger.error('spotify.getAccessToken - failed', { status, data, message: err?.message })
    throw err
  }
}

// Lightweight probe to verify Spotify auth works in the current environment
async function probeAuth() {
  try {
    const token = await getAccessToken()
    return { ok: !!token, expiresAt: gTokenExpiresAt }
  } catch (err) {
    // Let caller handle error and log context
    throw err
  }
}

async function _get(url, params = {}) {
  const token = await getAccessToken()
  const startedAt = Date.now()
  try {
    logger.debug('spotify._get - request', { url, params })
    const resp = await axios.get(url, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    })
    logger.info('spotify._get - success', { url, status: resp.status, durationMs: Date.now() - startedAt })
    return resp.data
  } catch (err) {
    const status = err?.response?.status
    const data = err?.response?.data
    logger.error('spotify._get - failed', { url, params, status, data, message: err?.message, durationMs: Date.now() - startedAt })
    throw err
  }
}

function _mapPlaylistCard(p) {
  if (!p || !p.id) return null
  return {
    spotifyId: p.id,
    name: p.name || '',
    description: p.description || '',
    image: Array.isArray(p.images) && p.images[0]?.url ? p.images[0].url : '',
  }
}

function _mapTrackItem(item) {
  const t = item.track || item
  return {
    addedAt: item.added_at || new Date().toISOString(),
    id: t.id,
    title: t.name,
    artists: (t.artists || []).map((a) => a.name),
    imgUrl: t.album?.images?.[0]?.url || '',
    formalDuration: t.duration_ms,
    album: t.album?.name || '',
    youtubeId: '',
  }
}

// Helpers and API for live categories
function _hashToIndex(str, mod) {
  let sum = 0
  for (let i = 0; i < (str || '').length; i++) sum = (sum + str.charCodeAt(i)) % 2147483647
  return sum % mod
}

function _pickColorForId(id) {
  const palette = [
    '#b49bc8','#f037a5','#9cf0e1','#d7f27d','#8d67ab','#503750','#7358ff','#af2896',
    '#148a08','#eb1e32','#0d73ec','#509bf5','#1e3264','#ba5d07','#777777','#2d46b9',
    '#283ea3','#dc148c','#f59b23','#477d95','#233268','#ff4632','#e1118b'
  ]
  return palette[_hashToIndex(id || '', palette.length)]
}

function _mapCategoryItem(cat) {
  if (!cat || !cat.id) return null
  const image = Array.isArray(cat.icons) && cat.icons[0]?.url ? cat.icons[0].url : ''
  return {
    id: cat.id,
    name: cat.name || '',
    image,
    backgroundColor: _pickColorForId(cat.id),
  }
}

async function getCategories({ limit = 50, offset = 0, country = 'US', locale } = {}) {
  try {
    const params = { limit, offset, country }
    if (locale) params.locale = locale
    logger.debug('spotify.getCategories - start', params)
    const data = await _get('https://api.spotify.com/v1/browse/categories', params)
    const mapped = (data.categories?.items || [])
      .filter((c) => c && c.id)
      .map(_mapCategoryItem)
      .filter(Boolean)
    logger.info('spotify.getCategories - mapped', { count: mapped.length })
    return mapped
  } catch (err) {
    const status = err?.response?.status
    logger.error('spotify.getCategories - failed', { status, message: err?.message })
    throw err
  }
}

async function getPlaylist(playlistId) {
  logger.debug('spotify.getPlaylist - start', { playlistId })
  const data = await _get(`https://api.spotify.com/v1/playlists/${playlistId}`)
  const mapped = {
    _id: playlistId,
    spotifyId: playlistId,
    name: data.name,
    description: data.description,
    image: data.images?.[0]?.url || '',
    tracks: (data.tracks?.items || []).map(_mapTrackItem),
  }
  logger.info('spotify.getPlaylist - mapped', { playlistId, trackCount: mapped.tracks.length })
  return mapped
}

async function getCategoryPlaylists(categoryId, desired = 36, country = 'US') {
  try {
    const pageSize = 20
    logger.debug('spotify.getCategoryPlaylists - start', { categoryId, desired, country })
    let offset = 0
    let all = []
    while (all.length < desired) {
      const data = await _get(`https://api.spotify.com/v1/browse/categories/${categoryId}/playlists`, { limit: pageSize, offset, country })
      const page = (data.playlists?.items || [])
        .filter((p) => p && p.id)
        .map(_mapPlaylistCard)
        .filter(Boolean)
      all = all.concat(page)
      if (!data.playlists?.next) break
      offset += pageSize
    }
    const mapped = all.slice(0, desired)
    logger.info('spotify.getCategoryPlaylists - mapped', { categoryId, count: mapped.length })
    return mapped
  } catch (err) {
    if (err?.response?.status === 404) {
      logger.warn('spotify.getCategoryPlaylists - 404 returning empty', { categoryId })
      return []
    }
    logger.error('spotify.getCategoryPlaylists - failed', { categoryId, message: err?.message })
    throw err
  }
}

async function search(searchKey, searchType, limit = 20) {
  try {
    logger.debug('spotify.search - start', { searchType, searchKey })
    const data = await _get('https://api.spotify.com/v1/search', {
      q: searchKey,
      type: searchType,
      limit,
    })
    if (searchType === 'playlist') {
      const mapped = (data.playlists?.items || [])
        .filter((p) => p && p.id)
        .map(_mapPlaylistCard)
        .filter(Boolean)
      logger.info('spotify.search - mapped', { searchType, count: mapped.length })
      return mapped
    } else if (searchType === 'track') {
      const mapped = (data.tracks?.items || []).map(_mapTrackItem)
      logger.info('spotify.search - mapped', { searchType, count: mapped.length })
      return mapped
    } else {
      logger.warn('spotify.search - unsupported type', { searchType })
      return []
    }
  } catch (err) {
    const status = err?.response?.status
    logger.error('spotify.search - failed', { searchType, status, message: err?.message })
    throw err
  }
}

module.exports = {
  getPlaylist,
  getCategoryPlaylists,
  search,
  getCategories,
  probeAuth,
}
