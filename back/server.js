const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()
const http = require('http').createServer(app)

//?- Express App Config
// Disable ETag so API GETs always return bodies (not 304 with empty body for XHR)
app.set('etag', false)
app.use(cookieParser())
app.use(express.json())
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'public')))
} else {
    const corsOptions = {
        origin: [
            'http://127.0.0.1:3000',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://localhost:5173',
        ],
        credentials: true
    }
    app.use(cors(corsOptions))
}

//?- Routes
const authRoutes = require('./api/auth/auth.routes')
const userRoutes = require('./api/user/user.routes')
const boardRoutes = require('./api/board/board.routes')
const taskRoutes = require('./api/task/task.routes')
const playlistRoutes = require('./api/playlist/playlist.routes')
const trackRoutes = require('./api/track/track.routes')
const categoryRoutes = require('./api/category/category.routes')
const reviewRoutes = require('./api/review/review.routes')

const {setupSocketAPI} = require('./services/socket.service')
const setupAsyncLocalStorage = require('./middlewares/setupAls.middleware')
const requestLogger = require('./middlewares/requestLogger.middleware')
app.all('*', setupAsyncLocalStorage)
app.use(requestLogger)

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/board', boardRoutes)
app.use('/api/task', taskRoutes)
app.use('/api/playlist', playlistRoutes)
app.use('/api/track', trackRoutes)
app.use('/api/category', categoryRoutes)
app.use('/api/review', reviewRoutes)
setupSocketAPI(http)


app.get('/**', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

const logger = require('./services/logger.service')
const port = process.env.PORT
http.listen(port, () => {
    logger.info('Server is running on port: ' + port)
})