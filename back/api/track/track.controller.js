const trackService = require('./track.service')
const logger = require('../../services/logger.service')

async function getTrack(req, res) {
  try {
    const { id } = req.params
    const track = await trackService.getById(id)
    if (!track) return res.status(404).send({ err: 'Track not found' })
    res.send(track)
  } catch (err) {
    logger.error('Failed to get track', err)
    res.status(500).send({ err: 'Failed to get track' })
  }
}

async function upsertTrack(req, res) {
  try {
    const track = req.body
    if (!track?.id) return res.status(400).send({ err: 'Missing track id' })
    const saved = await trackService.upsert(track)
    res.send(saved)
  } catch (err) {
    logger.error('Failed to upsert track', err)
    res.status(500).send({ err: 'Failed to upsert track' })
  }
}

module.exports = {
  getTrack,
  upsertTrack,
}
