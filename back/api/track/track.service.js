const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')

module.exports = {
  getById,
  upsert,
}

async function getById(id) {
  try {
    const collection = await dbService.getCollection('track')
    const track = await collection.findOne({ id })
    if (!track) return null
    if (track._id) track._id = track._id.toString()
    return track
  } catch (err) {
    logger.error('Failed to get track', err)
    throw err
  }
}

async function upsert(track) {
  try {
    if (!track || !track.id) throw new Error('Missing track id')
    const toSave = {
      id: track.id,
      title: track.title || '',
      artists: track.artists || [],
      album: track.album || '',
      imgUrl: track.imgUrl || '',
      youtubeId: track.youtubeId || '',
      updatedAt: Date.now(),
    }

    const collection = await dbService.getCollection('track')
    await collection.updateOne({ id: toSave.id }, { $set: toSave }, { upsert: true })
    return toSave
  } catch (err) {
    logger.error('Failed to upsert track', err)
    throw err
  }
}
