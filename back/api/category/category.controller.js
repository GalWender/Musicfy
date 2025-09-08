const logger = require('../../services/logger.service')
const spotifyService = require('../../services/spotify.service')

// Live categories endpoint (supports locale and country)
async function getCategories(req, res) {
  try {
    const { locale, country, limit, offset } = req.query || {}
    const params = {
      locale,
      country: country || 'US',
      limit: limit ? +limit : 50,
      offset: offset ? +offset : 0,
    }
    const categories = await spotifyService.getCategories(params)
    res.send(categories)
  } catch (err) {
    logger.error('Failed to get categories', err)
    res.status(500).send({ err: 'Failed to get categories' })
  }
}

module.exports = {
  getCategories,
}
