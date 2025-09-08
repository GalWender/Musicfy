
const INITIAL_STATE = {
  loggedInUser: {
    _id: '',
    fullname: '',
    imgUrl: null,
    playlist: [],
    likedTracks: [],
  }
}

export function userReducer(state = INITIAL_STATE, action) {

  switch (action.type) {
    case 'UPDATE_USER':
      return {
        ...state,
        loggedInUser: {
          ...state.loggedInUser,
          ...action.user,
          playlist: action.user?.playlist || [],
          likedTracks: action.user?.likedTracks || [],
        }
      }

    default:
      return state;
  }
}