const logger = require('../services/logger.service')
const asyncLocalStorage = require('../services/als.service')
let randomUUID
try {
  randomUUID = require('crypto').randomUUID
} catch (_) {
  randomUUID = null
}

function genReqId() {
  if (randomUUID) return randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function requestLogger(req, res, next) {
  const store = asyncLocalStorage.getStore() || {}
  // attach a request id and start time into the ALS store for correlation
  store.reqId = store.reqId || genReqId()
  store.reqStart = Date.now()
  try {
    // ensure all following async work shares these fields
    asyncLocalStorage.enterWith(store)
  } catch (_) {
    // if enterWith is not available in current node version, ignore
  }

  // Expose request id to clients
  res.setHeader('X-Request-Id', store.reqId)

  logger.info('[REQ_START]', {
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    query: req.query,
    ip: req.ip,
    ua: req.headers['user-agent']
  })

  res.on('finish', () => {
    const durationMs = Date.now() - (store.reqStart || Date.now())
    logger.info('[REQ_END]', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs
    })
  })

  next()
}

module.exports = requestLogger
