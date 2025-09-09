const express = require('express')
const { getFeatured } = require('./home.controller')

const router = express.Router()

// Single Spotify request for the homepage
router.get('/featured', getFeatured)

module.exports = router
