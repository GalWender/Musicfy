import { playlistService } from "../../services/playlist.service.js"

export function updatePlayer(prop, value) {
  return (dispatch) => {
    try {
      dispatch({ type: 'UPDATE_PLAYER', prop, value })
    } catch (err) {
      console.log('err:', err)
    }
  }
}
export function updateCurrTime() {
  return (dispatch) => {
    try {
      dispatch({ type: 'UPDATE_CURR_TIME_BY_INTERVAL' })
    } catch (err) {
      console.log('err:', err)
    }
  }
}

export function toggleProp(prop) {
  return (dispatch) => {
    try {
      dispatch({ type: 'TOGGLE_PROP', prop })
    } catch (err) {
      console.log('err:', err)
    }
  }
}

export function shuffleIdxs(playlistLength) {
  return (dispatch) => {
    try {
      dispatch({ type: 'SHUFFLE_IDXS', playlistLength })
    } catch (err) {
      console.log('err:', err)
    }
  }
}