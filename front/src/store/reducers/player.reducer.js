const INITIAL_STATE = {
  isPlaying: false,
  volume: 30,
  trackDuration: 0,
  currTime: 0,
  isShuffleMode: false,
  isRepeatMode: false,
  isCued: false,
  shuffledIdxs: [],
  loadingTrackId: null,
}

export function playerReducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case 'UPDATE_PLAYER':
      return {
        ...state,
        [action.prop]: action.value,
      }
    case 'UPDATE_CURR_TIME_BY_INTERVAL':
      return {
        ...state,
        currTime: state.currTime + 1,
      }
    case 'TOGGLE_PROP':
      return {
        ...state,
        [action.prop]: !state[action.prop],
      }
    case 'SHUFFLE_IDXS':
      return {
        ...state,
        shuffledIdxs: _shuffleIdxs(action.playlistLength),
      }
    default:
      return state
  }
}

function _shuffleIdxs(arrLength) {
  let array = _createIdxsArr(arrLength)
  let currentIndex = arrLength
  let randomIndex 

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--

    // And swap it with the current element.
    ;[array[currentIndex], array[randomIndex]] = [array[randomIndex],array[currentIndex],]
  }

  return array
}

function _createIdxsArr(arrLength) {
  let idxs = []
  for (let i = 0; i < arrLength; i++) {
    idxs.push(i)
  }

  return idxs
}
