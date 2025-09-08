const logger = require('../services/logger.service')
const authService = require('../api/auth/auth.service')

async function requireAuth(req, res, next) {
  const authHeader = req.get('authorization') || ''
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  const token = req?.cookies?.loginToken || bearerToken
  if (!token) return res.status(401).send('Not Authenticated')
  const loggedinUser = authService.validateToken(token)
  if (!loggedinUser) return res.status(401).send('Not Authenticated')
  next()
}

async function requireAdmin(req, res, next) {
  const authHeader = req.get('authorization') || ''
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  const token = req?.cookies?.loginToken || bearerToken
  if (!token) return res.status(401).send('Not Authenticated')
  const loggedinUser = authService.validateToken(token)
  if (!loggedinUser.isAdmin) {
    logger.warn(loggedinUser.fullname + 'attempted to perform admin action')
    res.status(403).end('Not Authorized')
    return
  }
  next()
}

module.exports = {
  requireAuth,
  requireAdmin,
}
