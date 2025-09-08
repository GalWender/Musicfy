const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const { ObjectId } = require('mongodb')

module.exports = {
  query,
  add,
  remove,
}

async function query(filterBy = {}) {
  try {
    const collection = await dbService.getCollection('review')
    const criteria = {}
    if (filterBy.name) {
      criteria['byUser.fullname'] = { $regex: filterBy.name, $options: 'i' }
    }
    const reviews = await collection.find(criteria).toArray()
    return reviews
  } catch (err) {
    logger.error('cannot find reviews', err)
    throw err
  }
}

async function add(review) {
  try {
    const collection = await dbService.getCollection('review')
    const toAdd = {
      txt: review.txt,
      byUser: review.byUser || null,
      aboutUser: review.aboutUser || null,
      createdAt: review.createdAt || Date.now(),
    }
    const res = await collection.insertOne(toAdd)
    toAdd._id = res.insertedId.toString()
    return toAdd
  } catch (err) {
    logger.error('cannot insert review', err)
    throw err
  }
}

async function remove(id) {
  try {
    const collection = await dbService.getCollection('review')
    await collection.deleteOne({ _id: ObjectId(id) })
    return { _id: id }
  } catch (err) {
    logger.error('cannot remove review', err)
    throw err
  }
}
