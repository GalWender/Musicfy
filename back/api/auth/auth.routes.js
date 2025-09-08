const express = require('express')
const {login, signup, logout, verifyUsername, guest} = require('./auth.controller')

const router = express.Router()

router.get('/verifyUsername', verifyUsername)
router.post('/login', login)
router.post('/signup', signup)
router.post('/logout', logout)
router.post('/guest', guest)

module.exports = router