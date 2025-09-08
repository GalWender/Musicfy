import { applyMiddleware, combineReducers, compose, legacy_createStore as createStore } from 'redux'
import thunk from 'redux-thunk'
import { playlistReducer } from './reducers/playlists.reducer'
import { playerReducer } from './reducers/player.reducer'
import { categoryReducer } from './reducers/categories.reducer'
import { songReducer } from './reducers/songs.reducer'
import { userReducer } from './reducers/user.reducer'

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

const rootReducer = combineReducers({
    playlistModule: playlistReducer,
    playerModule: playerReducer,
    userModule: userReducer,
    songModule: songReducer,
    categoryModule:categoryReducer,

})

export const store = createStore(rootReducer, composeEnhancers(applyMiddleware(thunk)))

// window.gStore = store