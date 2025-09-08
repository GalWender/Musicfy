import { categoryService } from '../../services/category.service.js'
import { playlistService } from '../../services/playlist.service.js'
import { addUserPlaylist, getLoggedinUser } from './user.actions.js'
import { userService } from '../../services/user.service.js'
import { trackService } from '../../services/track.service.js'
import { updatePlayer } from './player.actions.js'

export function loadPlaylists() {
  return async (dispatch, getState) => {
    try {
      // console.log('getting playlists');
      const filterBy = getState().playlistModule.filterBy
      const playlists = await playlistService.query(filterBy)
      dispatch({ type: 'SET_PLAYLISTS', playlists })
    } catch (err) {
      console.log('err:', err)
      try { dispatch(updatePlayer('isPlaying', false)) } catch(e) {}
    }
  }
}

export function addPlaylist() {
  let playlist = playlistService.getEmptyPlaylist()
  return async (dispatch) => {
    try {
      const user = getLoggedinUser()
      if (user._id !== 1234) playlist = await playlistService.save(playlist)
      dispatch({ type: 'ADD_PLAYLIST', playlist })
      return playlist
    } catch (err) {
      console.log('err:', err)
    }
  }
}

export function removePlaylist(playlistId) {
  return async (dispatch) => {
    try {
      const user = getLoggedinUser()
      var playlist
      if (user._id !== 1234) playlist = await playlistService.remove(playlistId)
      dispatch({ type: 'REMOVE_PLAYLIST', playlistId })
    } catch (err) {
      console.log('err:', err)
    }
  }
}

export function setFilterBy(filterBy) {
  return (dispatch) => {
    try {
      dispatch({ type: 'SET_FILTER_BY', filterBy: { ...filterBy } })
    } catch (err) {
      console.log('err:', err)
    }
  }
}

export function updateTrackIdx(byType, toUpdate) {
  return (dispatch) => {
    try {
      if (byType === 'dir')
        dispatch({ type: 'UPDATE_CURR_TRACK_IDX_BY_DIR', dir: toUpdate })
      else dispatch({ type: 'UPDATE_CURR_TRACK_IDX_BY_NUM', idx: toUpdate })
    } catch (err) {
      console.log('err:', err)
    }
  }
}

export function checkPlayerPlaylist() {
  return async (dispatch, getState) => {
    try {
      const { playerPlaylist, currPlaylist } = getState().playlistModule
      const playerPlaylistId = playerPlaylist._id
      const playlistId = currPlaylist._id
      const playerLen = playerPlaylist?.tracks?.length || 0
      const currLen = currPlaylist?.tracks?.length || 0
      if (!playerPlaylistId || playerPlaylistId !== playlistId || playerLen !== currLen) {
        dispatch({ type: 'SET_PLAYER_PLAYLIST' })
      }

    } catch (err) {
      console.log('err:',err);
    }
  }
}

export function getPlaylistById(spotifyId, sentPlaylist = null) {
  return async (dispatch) => {
    try {
      var playlist
      sentPlaylist ? playlist = sentPlaylist :
        playlist = await playlistService.getById(spotifyId)
      dispatch({ type: 'SET_PLAYLIST', playlist })
    } catch (err) {
      console.log('err:', err)
    }
  }
}

export function getYoutubeId(keyword,origin) {
  return async (dispatch, getState) => {
    try {
      const state = getState()
      const currPlaylist = state.playlistModule.currPlaylist
      const currIdx = state.playlistModule.currTrackIdx
      const track = currPlaylist?.tracks?.[currIdx]
      if (!track) return

      // 1) Try cache first
      try {
        console.log('[Player] getYoutubeId start', { keyword, origin, trackId: track.id })
        // Mark this track as loading while we resolve a YouTube ID
        try { dispatch(updatePlayer('loadingTrackId', track.id)) } catch(_) {}
        const cached = await trackService.getById(track.id)
        if (cached?.youtubeId) {
          console.log('[Player] cache hit for track', { trackId: track.id, youtubeId: cached.youtubeId })
          dispatch({ type: 'SET_YOUTUBE_ID', youtubeId: cached.youtubeId })
          try { dispatch(updatePlayer('loadingTrackId', null)) } catch(_) {}
          return
        }
      } catch (err) {
        // 404 or network error - proceed to fetch
        console.log('[Player] no cache entry, will fetch YouTube ID', { trackId: track.id })
      }

      // 2) Fallback: fetch from YouTube and cache
      console.log('[Player] fetching YouTube ID', { keyword, trackId: track.id })
      const youtubeId = await playlistService.getYoutubeId(keyword)
      if (!youtubeId) {
        console.warn('[Player] no YouTube result', { keyword, trackId: track.id })
        dispatch(updatePlayer('isPlaying', false))
        try { dispatch(updatePlayer('loadingTrackId', null)) } catch(_) {}
        return
      }
      console.log('[Player] received YouTube ID', { youtubeId, trackId: track.id })
      dispatch({ type: 'SET_YOUTUBE_ID', youtubeId })

      // Upsert track cache in backend (id + youtubeId and helpful metadata)
      try {
        console.log('[Player] upserting track cache', { trackId: track.id })
        await trackService.upsert({
          id: track.id,
          title: track.title,
          artists: track.artists,
          album: track.album,
          imgUrl: track.imgUrl,
          youtubeId,
        })
        console.log('[Player] upsert complete', { trackId: track.id })
      } catch (e) {
        console.log('Failed to upsert track cache:', e)
      }
      try { dispatch(updatePlayer('loadingTrackId', null)) } catch(_) {}
    } catch (err) {
      console.log('[Player] getYoutubeId error', err)
      try { dispatch(updatePlayer('loadingTrackId', null)) } catch(_) {}
    }
  }
}
export function searchItems(searchKey, searchType) {
  return async (dispatch, getState) => {
    try {
    const searchItems = searchKey ? await playlistService.getSearchItems(searchKey, searchType) : ''
     if(searchType === 'playlist') dispatch({ type: 'SET_SEARCH_ITEMS', searchItems })
     else dispatch({ type: 'SET_PLAYLIST_TRACKS', tracks: searchItems })
     dispatch({ type: 'SET_SEARCH_TYPE', searchType })
     dispatch({ type: 'SET_IS_SEARCH_ACTIVE', isSearchActive: searchItems ? true : false })
     changeSearchStatus(searchKey ? true : false)
    } catch (err) {
      console.log('err:', err)
    }
  }
}

export function changeSearchStatus(status) {
  console.log('status', status);
  return (dispatch) => {
    try {
      dispatch({ type: 'SET_IS_SEARCH_ACTIVE', isSearchActive: status })
    } catch (err) {
      console.log('err:', err)
    }
  }
}
export function changePlaylistColor(color) {
  return (dispatch) => {
    try {
      dispatch({ type: 'change-playlist-color', color })
    } catch (err) {
      console.log('err:', err)
    }
  }
}

export function getEmptyPlaylist(track) {
  return async (dispatch) => {
    var playlist = playlistService.getEmptyPlaylist(track)
    const user = getLoggedinUser()
    try {
      if (user._id !== 1234) playlist = await playlistService.save(playlist)
      const userPlaylist = {
        spotifyId: '1234s',
        id: playlist._id,
        name: playlist.name,
        image: playlist.image
      }
      await dispatch(addUserPlaylist(userPlaylist))
      if(!track) dispatch({ type: 'SET_PLAYLIST', playlist })
    }catch(err){
      console.log(err)
    }

  }
}

export function updatePlaylist(updatedPlaylist) {
  return async (dispatch) => {
    try{
      const playlist = await playlistService.save(updatedPlaylist)
      const userPlaylist = {
        spotifyId: '1234s',
        id: playlist._id,
        name: playlist.name,
        image: playlist.image
      }
      await dispatch(addUserPlaylist(userPlaylist))
      dispatch({ type: 'SET_PLAYLIST', playlist })
    }catch(err){
      console.log(err)
    }
  }
}

export function addTrack(playlistId, track) {
  return async (dispatch)=>{
    try{
      track.addedAt = Date.now()
      const playlist = await playlistService.getById(playlistId)
      if (playlist.tracks.length === 1 && !playlist.tracks[0].imgUrl) playlist.tracks.splice(0,1,track)
      else playlist.tracks.unshift(track)
      playlistService.save(playlist)

    }catch(err){
      console.log(err)
    }
  }

}
export function removeTrack(playlistId, trackId) {
  return async (dispatch)=>{
    try{
      const playlist = await playlistService.getById(playlistId)
      const updatedPlaylist = {...playlist, tracks:playlist.tracks.filter(track => track.id !== trackId)}
      await playlistService.save(updatedPlaylist)
      dispatch({ type: 'SET_PLAYLIST', playlist: updatedPlaylist })

    }catch(err){
      console.log(err)
    }
  }

}
