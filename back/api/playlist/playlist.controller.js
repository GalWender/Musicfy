const logger = require('../../services/logger.service')
const spotifyService = require('../../services/spotify.service')
const playlistService = require('./playlist.service')

async function getPlaylist(req, res) {
  const { id } = req.params
  const startedAt = Date.now()
  logger.info('playlist.getPlaylist - incoming', { id })
  try {
    if (!id || typeof id !== 'string') {
      logger.warn('playlist.getPlaylist - missing/invalid id', { id })
      return res.status(400).send({ err: 'Invalid playlist id' })
    }

    // User-created playlist: prefixed with 1234s
    if (id.startsWith('1234s')) {
      const mongoId = id.slice(5)
      // Basic check for Mongo ObjectId (24 hex chars)
      const isValidMongoId = /^[a-fA-F0-9]{24}$/.test(mongoId)
      if (!isValidMongoId) {
        logger.warn('playlist.getPlaylist - invalid mongoId after prefix', { id, mongoId })
        return res.status(400).send({ err: 'Invalid user playlist id' })
      }
      logger.debug('playlist.getPlaylist - user playlist branch', { id, mongoId })
      const playlist = await playlistService.getById(mongoId)
      if (!playlist) {
        logger.warn('playlist.getPlaylist - user playlist not found', { id, mongoId })
        return res.status(404).send({ err: 'Playlist not found' })
      }
      // Ensure shape for frontend
      playlist.spotifyId = '1234s'
      logger.info('playlist.getPlaylist - user playlist success', { id, durationMs: Date.now() - startedAt })
      return res.send(playlist)
    }

    // Spotify playlist branch
    logger.debug('playlist.getPlaylist - spotify branch', { id })
    const playlist = await spotifyService.getPlaylist(id)
    logger.info('playlist.getPlaylist - spotify success', { id, trackCount: playlist?.tracks?.length || 0, durationMs: Date.now() - startedAt })
    return res.send(playlist)
  } catch (err) {
    const status = err?.response?.status || err?.status
    const data = err?.response?.data || err?.data
    logger.error('playlist.getPlaylist - failed', { id, status, data, message: err?.message })
    if (status && [400, 401, 403, 404].includes(status)) {
      return res.status(status).send({ err: 'Failed to get playlist', details: data })
    }
    res.status(500).send({ err: 'Failed to get playlist' })
  }
}

async function searchPlaylistsOrTracks(req, res) {
  try {
    const { searchKey, searchType } = req.body
    const startedAt = Date.now()
    logger.info('playlist.search - incoming', { searchType, searchKey })
    const items = await spotifyService.search(searchKey, searchType)
    logger.info('playlist.search - success', { searchType, count: items?.length || 0, durationMs: Date.now() - startedAt })
    res.send(items)
  } catch (err) {
    const status = err?.response?.status
    const data = err?.response?.data
    logger.error('playlist.search - failed', { status, data, message: err?.message })
    res.status(500).send({ err: 'Failed to perform search' })
  }
}

async function getCategoryPlaylists(req, res) {
  try {
    const { categoryId } = req.params
    const { name } = req.query || {}
    const startedAt = Date.now()
    logger.info('playlist.category - incoming', { categoryId, name })
    const items = await spotifyService.getCategoryPlaylists(categoryId)
    if (!items || items.length === 0) {
      logger.warn('playlist.getCategoryPlaylists - empty, fallback search', { categoryId, name })
      if (name) {
        try {
          const fallback = await spotifyService.search(name, 'playlist')
          logger.info('playlist.category - fallback search success', { name, count: fallback?.length || 0 })
          return res.send(fallback)
        } catch (e) {
          logger.error('playlist.getCategoryPlaylists - fallback search failed', { categoryId, name, message: e?.message })
        }
      }
    }
    logger.info('playlist.category - success', { categoryId, count: items?.length || 0, durationMs: Date.now() - startedAt })
    res.send(items)
  } catch (err) {
    const status = err?.response?.status
    const data = err?.response?.data
    logger.error('playlist.category - failed', { categoryId: req?.params?.categoryId, status, data, message: err?.message })
    res.status(500).send({ err: 'Failed to get category playlists' })
  }
}

async function addPlaylist(req, res) {
  try {
    const playlist = req.body
    const saved = await playlistService.add(playlist)
    // Ensure consistent shape for user playlists
    const withPrefix = { ...saved, spotifyId: '1234s' }
    res.send(withPrefix)
  } catch (err) {
    logger.error('Failed to add playlist', err)
    res.status(500).send({ err: 'Failed to add playlist' })
  }
}

async function updatePlaylist(req, res) {
  try {
    const { id } = req.params
    const playlist = { ...req.body, _id: id }
    const saved = await playlistService.update(playlist)
    // Ensure consistent shape for user playlists
    const withPrefix = { ...saved, spotifyId: '1234s' }
    res.send(withPrefix)
  } catch (err) {
    logger.error('Failed to update playlist', err)
    res.status(500).send({ err: 'Failed to update playlist' })
  }
}

async function removePlaylist(req, res) {
  try {
    const { id } = req.params
    await playlistService.remove(id)
    res.send({ msg: 'Removed successfully' })
  } catch (err) {
    logger.error('Failed to remove playlist', err)
    res.status(500).send({ err: 'Failed to remove playlist' })
  }
}

module.exports = {
  getPlaylist,
  searchPlaylistsOrTracks,
  getCategoryPlaylists,
  addPlaylist,
  updatePlaylist,
  removePlaylist,
}
