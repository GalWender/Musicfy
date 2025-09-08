const logger = require('../../services/logger.service')
const reviewService = require('./review.service')
const userService = require('../user/user.service')
const authService = require('../auth/auth.service')
const sockets = require('../../services/socket.service')

async function query(req, res) {
  try {
    const filterBy = {
      name: req.query?.name || '',
      sort: req.query?.sort || '',
    }
    const reviews = await reviewService.query(filterBy)
    res.send(reviews)
  } catch (err) {
    logger.error('Failed to get reviews', err)
    res.status(500).send({ err: 'Failed to get reviews' })
  }
}

async function add(req, res) {
  try {
    const { txt, aboutUserId } = req.body
    const loggedinUser = authService.validateToken(req?.cookies?.loginToken)

    const aboutUser = await userService.getById(aboutUserId)

    const reviewToAdd = {
      txt,
      byUser: loggedinUser
        ? { _id: loggedinUser._id, fullname: loggedinUser.fullname, imgUrl: loggedinUser.imgUrl }
        : null,
      aboutUser: aboutUser
        ? { _id: aboutUser._id, fullname: aboutUser.fullname, imgUrl: aboutUser.imgUrl }
        : { _id: aboutUserId },
      createdAt: Date.now(),
    }

    const saved = await reviewService.add(reviewToAdd)

    // realtime events
    sockets.broadcast({ type: 'review-added', data: saved })
    if (reviewToAdd.aboutUser?._id) {
      sockets.emitToUser({ type: 'review-about-you', data: saved, userId: reviewToAdd.aboutUser._id })
    }

    res.send(saved)
  } catch (err) {
    logger.error('Failed to add review', err)
    res.status(500).send({ err: 'Failed to add review' })
  }
}

async function remove(req, res) {
  try {
    await reviewService.remove(req.params.id)
    res.send({ msg: 'Removed successfully' })
  } catch (err) {
    logger.error('Failed to remove review', err)
    res.status(500).send({ err: 'Failed to remove review' })
  }
}

module.exports = {
  query,
  add,
  remove,
}
