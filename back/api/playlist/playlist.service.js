const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const { ObjectId } = require('mongodb')

module.exports = {
  getById,
  add,
  update,
  remove,
}

async function getById(id) {
  try {
    const collection = await dbService.getCollection('playlist')
    const playlist = await collection.findOne({ _id: ObjectId(id) })
    if (!playlist) return null
    playlist._id = playlist._id.toString()
    return playlist
  } catch (err) {
    logger.error('Failed to get playlist', err)
    throw err
  }
}

async function add(playlist) {
  try {
    const toSave = {
      name: playlist.name || 'My Playlist',
      description: playlist.description || '',
      image: playlist.image || '',
      tracks: playlist.tracks || [],
      createdAt: Date.now(),
    }
    const collection = await dbService.getCollection('playlist')
    const res = await collection.insertOne(toSave)
    toSave._id = res.insertedId.toString()
    return toSave
  } catch (err) {
    logger.error('Failed to add playlist', err)
    throw err
  }
}

async function update(playlist) {
  try {
    const id = playlist._id
    const toSave = {
      name: playlist.name,
      description: playlist.description,
      image: playlist.image,
      tracks: playlist.tracks || [],
    }
    const collection = await dbService.getCollection('playlist')
    await collection.updateOne({ _id: ObjectId(id) }, { $set: toSave })
    return { _id: id, ...toSave }
  } catch (err) {
    logger.error('Failed to update playlist', err)
    throw err
  }
}

async function remove(id) {
  try {
    const collection = await dbService.getCollection('playlist')
    await collection.deleteOne({ _id: ObjectId(id) })
    return { _id: id }
  } catch (err) {
    logger.error('Failed to remove playlist', err)
    throw err
  }
}
