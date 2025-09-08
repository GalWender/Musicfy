const express = require('express')
const { query, add, remove } = require('./review.controller')

const router = express.Router()

router.get('/', query)
router.post('/', add)
router.delete('/:id', remove)

module.exports = router
