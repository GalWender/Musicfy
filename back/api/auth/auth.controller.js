const authService = require('./auth.service')
const logger = require('../../services/logger.service')
const userService = require('../user/user.service')

async function verifyUsername(req, res) {
        const {username} = req.query
    try {
        const isVerified = await authService.verifyUsername(username)
        res.send(isVerified)
    } catch (err) {
        logger.error(`User was not verify ${username}` + err)
        res.status(401).send({ err: 'Failed to verify' })
    }
}

async function login(req, res) {
    const { username, password } = req.body
    try {
        const user = await authService.login(username, password)
        // console.log('user form authService:', user)
        const loginToken = authService.getLoginToken(user)
        logger.info('User login: ', user)
        res.cookie('loginToken', loginToken)
        res.json(user)
    } catch (err) {
        logger.error('Failed to Login ' + err)
        res.status(401).send({ err: 'Failed to Login' })
    }
}

async function signup(req, res) {
    try {
        const { username, password, fullname, imgUrl, assignments = [] } = req.body
        const account = await authService.signup(username, password, fullname, imgUrl, assignments)
        logger.debug(`auth.route - new account created: ` + JSON.stringify(account))
        const user = await authService.login(username, password)
        const loginToken = authService.getLoginToken(user)
        logger.info('User login: ', user)
        res.cookie('loginToken', loginToken)
        res.json(user)
    } catch (err) {
        logger.error('Failed to signup ' + err)
        res.status(500).send({ err: 'Failed to signup' })
    }
}

async function logout(req, res) {
    try {
        res.clearCookie('loginToken')
        res.send({ msg: 'Logged out successfully' })
    } catch (err) {
        res.status(500).send({ err: 'Failed to logout' })
    }
}

// Guest login: reuse a single shared guest user (create if missing) and issue a login token
async function guest(req, res) {
    try {
        const GUEST_USERNAME = process.env.GUEST_USERNAME || 'guest'
        const GUEST_PASSWORD = process.env.GUEST_PASSWORD || 'guest'
        const fullname = 'Guest'
        const imgUrl = req.body?.imgUrl || 'https://cdn.pixabay.com/photo/2020/07/01/12/58/icon-5359553_1280.png'

        // Check if shared guest user exists
        let existing = await userService.getByUsername(GUEST_USERNAME)
        if (!existing) {
            logger.info('Creating shared guest user')
            await authService.signup(GUEST_USERNAME, GUEST_PASSWORD, fullname, imgUrl, [])
        }

        // Login with the shared guest credentials
        const user = await authService.login(GUEST_USERNAME, GUEST_PASSWORD)

        const loginToken = authService.getLoginToken(user)
        logger.info('Guest login (shared): ', { _id: user._id, username: user.username })
        res.cookie('loginToken', loginToken)
        res.json(user)
    } catch (err) {
        logger.error('Failed to create guest', err)
        res.status(500).send({ err: 'Failed to create guest user' })
    }
}

module.exports = {
    verifyUsername,
    login,
    signup,
    logout,
    guest
}