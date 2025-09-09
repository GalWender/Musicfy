const logger = require('../../services/logger.service')
const spotifyService = require('../../services/spotify.service')

async function getFeatured(req, res) {
  const startedAt = Date.now()
  try {
    const { limit = 18, country = 'US', locale } = req.query || {}
    const items = await spotifyService.getFeaturedPlaylists({
      limit: Number(limit) || 18,
      country,
      locale,
    })
    logger.info('home.featured - success', { count: items?.length || 0, durationMs: Date.now() - startedAt })
    res.send(items)
  } catch (err) {
    const status = err?.response?.status
    const data = err?.response?.data
    logger.error('home.featured - failed', { status, data, message: err?.message })
    res.status(500).send({ err: 'Failed to get featured playlists' })
  }
}

module.exports = { getFeatured }
