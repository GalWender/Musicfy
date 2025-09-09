const logger = require('../../services/logger.service')
const spotifyService = require('../../services/spotify.service')

async function basic(req, res) {
  const info = {
    status: 'ok',
    nodeEnv: process.env.NODE_ENV,
    hasDbUrl: !!process.env.DB_URL,
    hasSpotifyClientId: !!process.env.SPOTIFY_CLIENT_ID,
    hasSpotifyClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
    time: new Date().toISOString(),
  }
  logger.info('health.basic', info)
  res.send(info)
}

async function deep(req, res) {
  const startedAt = Date.now()
  try {
    const probe = await spotifyService.probeAuth()
    const payload = {
      status: 'ok',
      tokenOk: !!probe?.ok,
      expiresAt: probe?.expiresAt || null,
      durationMs: Date.now() - startedAt,
    }
    logger.info('health.deep', payload)
    res.send(payload)
  } catch (err) {
    const payload = {
      status: 'error',
      message: err?.message,
      durationMs: Date.now() - startedAt,
    }
    logger.error('health.deep - failed', payload)
    res.status(500).send(payload)
  }
}

module.exports = { basic, deep }
