const INITIAL_STATE = {
  playlists: null,
  currPlaylist: {
    name: '',
    id: '',
    image: '',
    description: '',
    tracks: [],
  },
  currTrackIdx: 0,
  playerPlaylist: {
    _id: '',
    tracks: []
  },
  filterBy: {},
  playlistColor: '#000000',
  searchItems: [],
  searchType: 'track',
  isSearchActive: false
}

export function playlistReducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case 'SET_PLAYLISTS':
      return {
        ...state,
        playlists: [...action.playlists],
      }
    case 'SET_PLAYLIST':
      return {
        ...state,
        currPlaylist: action.playlist,
      }
    case 'SET_PLAYER_PLAYLIST':
      return {
        ...state,
        playerPlaylist: {...state.currPlaylist},
      }
    case 'SET_PLAYLIST_DATA':
      return {
        ...state,
        currPlaylist: { ...action.data, tracks: state.currPlaylist.tracks },
      }
    case 'SET_PLAYLIST_TRACKS':
      return {
        ...state,
        currPlaylist: { ...state.currPlaylist, tracks: [...action.tracks] },
      }
    case 'SET_YOUTUBE_ID':
      const updatedTracks = [...state.currPlaylist.tracks]
      updatedTracks[state.currTrackIdx] = {
        ...updatedTracks[state.currTrackIdx],
        youtubeId: action.youtubeId,
      }
      // Also update the playerPlaylist so the player uses the same youtubeId
      const updatedPlayerTracks = state.playerPlaylist?.tracks?.length
        ? [...state.playerPlaylist.tracks]
        : []
      if (updatedPlayerTracks.length > state.currTrackIdx) {
        updatedPlayerTracks[state.currTrackIdx] = {
          ...updatedPlayerTracks[state.currTrackIdx],
          youtubeId: action.youtubeId,
        }
      }

      return {
        ...state,
        currPlaylist: {
          ...state.currPlaylist,
          tracks: updatedTracks,
        },
        playerPlaylist: {
          ...state.playerPlaylist,
          tracks: updatedPlayerTracks,
        },
      }
    case 'UPDATE_CURR_TRACK_IDX_BY_NUM':
      return {
        ...state,
        currTrackIdx: action.idx,
      }
    case 'UPDATE_CURR_TRACK_IDX_BY_DIR':
      return {
        ...state,
        currTrackIdx: _validateIdx(
          state.currTrackIdx,
          state.currPlaylist.tracks.length,
          action.dir
        ),
      }
    case 'ADD_PLAYLIST':
      return {
        ...state,
        playlists: [action.playlist, ...state.playlists],
      }
    case 'REMOVE_PLAYLIST':
      return {
        ...state,
        playlists: state.playlists.filter(
          (playlist) => playlist._id !== action.playlistId
        ),
      }
    case 'UPDATE_PLAYLIST':
      return {
        ...state,
        playlists: state.playlists.map((playlist) =>
          playlist._id === action.playlist._id ? action.playlist : playlist
        ),
      }
    case 'SET_FILTER_BY':
      return {
        ...state,
        filterBy: { ...action.filterBy },
      }
    case 'SET_FILTER_BY':
      return {
        ...state,
        filterBy: { ...action.filterBy },
      }
    case 'SET_SEARCH_ITEMS':
      console.log(action.searchItems, action.searchType);
      return {
        ...state,
        searchItems: [...action.searchItems],
      }

    case 'SET_SEARCH_TYPE':
      return {
        ...state,
        searchType: action.searchType,
      }

    case 'SET_IS_SEARCH_ACTIVE':
      return {
        ...state,
        isSearchActive: action.isSearchActive,
      }

    case 'change-playlist-color':
      return {
        ...state,
        playlistColor: action.color,
      }
    default:
      return state
  }
}

function _validateIdx(currTrackIdx, currPlaylistLength, dir) {
  if (currTrackIdx + dir >= currPlaylistLength) return 0
  else if (currTrackIdx + dir < 0) return currPlaylistLength - 1
  else return currTrackIdx + dir
}
