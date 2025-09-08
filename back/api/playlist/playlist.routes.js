const express = require('express')
const {
  getPlaylist,
  searchPlaylistsOrTracks,
  getCategoryPlaylists,
  addPlaylist,
  updatePlaylist,
  removePlaylist,
} = require('./playlist.controller')

const router = express.Router()

// Category playlists (must be before the dynamic :id route)
router.get('/category/:categoryId', getCategoryPlaylists)

// Search playlists/tracks
router.post('/search', searchPlaylistsOrTracks)

// CRUD for user-created playlists
router.post('/', addPlaylist)
router.put('/:id', updatePlaylist)
router.delete('/:id', removePlaylist)

// Get a playlist by Spotify ID or a user-created playlist by prefixed ID (e.g., 1234s<MONGO_ID>)
router.get('/:id', getPlaylist)

module.exports = router
