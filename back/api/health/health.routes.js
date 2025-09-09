const express = require('express')
const { basic, deep } = require('./health.controller')

const router = express.Router()

router.get('/', basic)
router.get('/deep', deep)

module.exports = router
