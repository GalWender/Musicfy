const logger = require('../../services/logger.service')
const spotifyService = require('../../services/spotify.service')

async function getFeatured(req, res) {
  const startedAt = Date.now()
  try {
    const { limit = 18 } = req.query || {}
    // One-call homepage: use a single Spotify search for playlists.
    // Configurable via HOME_SEARCH_QUERY, defaults to 'Pop'.
    const query = process.env.HOME_SEARCH_QUERY || 'Pop'
    logger.debug('home.featured - single search row', { query, limit: Number(limit) || 18 })
    const items = await spotifyService.search(query, 'playlist', Number(limit) || 18)
    logger.info('home.featured - success (single search)', { query, count: items?.length || 0, durationMs: Date.now() - startedAt })
    res.send(items)
  } catch (err) {
    const status = err?.response?.status
    const data = err?.response?.data
    logger.error('home.featured - failed', { status, data, message: err?.message })
    res.status(500).send({ err: 'Failed to get featured playlists' })
  }
}

module.exports = { getFeatured }
