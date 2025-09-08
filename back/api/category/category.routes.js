const express = require('express')
const { getCategories } = require('./category.controller')

const router = express.Router()

// Live categories listing (supports locale and country query params)
router.get('/', getCategories)

module.exports = router
