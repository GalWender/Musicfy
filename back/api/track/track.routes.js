const express = require('express')
const { getTrack, upsertTrack } = require('./track.controller')

const router = express.Router()

router.get('/:id', getTrack)
router.post('/', upsertTrack)

module.exports = router
