import { userService } from '../../services/user.service'
import { removePlaylist } from './playlists.actions'

export function login(userCred) {

    return async (dispatch) => {
        try {
            const user = await userService.login(userCred)
            dispatch({ type: 'UPDATE_USER', user})
        } catch (err) {
            console.log('err:', err)
        }
    }
}

export function signup(userCred) {

    return async (dispatch) => {
        try {
            await userService.signup(userCred)
            const user = await userService.login(userCred)
            dispatch({ type: 'UPDATE_USER', user})
        } catch (err) {
            console.log('err:', err)
        }
    }
}

export function logout() {

    return async (dispatch, getState) => {
        try {
            var user = getState().userModule.loggedInUser
            if(user._id !== 1234) await userService.logout()
            user = {
                fullname: '',
                imgUrl: null,
                playlist: []
            }
            dispatch({ type: 'UPDATE_USER', user})
        } catch (err) {
            console.log('err:', err)
        }
    }
}

export function getLoggedinUser() {
    return async (dispatch) => {
        try {
            let loggedInUser = await userService.getLoggedinUser()
            // If no user in session, create a guest session (backend sets cookie)
            if (!loggedInUser) {
                loggedInUser = await userService.guest()
            }
            if (loggedInUser?.fullname) {
                const user = await userService.getById(loggedInUser._id)
                if (user) dispatch({ type: 'UPDATE_USER', user })
            }
        } catch(err) {
            console.log('err:', err)
        }
    }
}

export function addUserPlaylist(playlist) {
    return async (dispatch, getState) => {
        try {
            const user = getState().userModule.loggedInUser
            var idx
            playlist.id ? idx = user.playlist.findIndex(currplaylist => currplaylist.id === playlist.id) 
                : idx = user.playlist.findIndex(currplaylist => currplaylist.spotifyId === playlist.spotifyId)
            if ( idx === -1) user.playlist.push({...playlist })
            else user.playlist[idx] = playlist
            await userService.update(user)
            dispatch({ type: 'UPDATE_USER', user})
        } catch(err) {
            console.log('err:', err)
        }
    }
}
export function removeUserPlaylist(playlistId) {
    return async (dispatch, getState) => {
        try {
            const user = getState().userModule.loggedInUser
            user.playlist = user.playlist.filter( playlist => playlist.spotifyId !== playlistId && playlist.id !== playlistId.slice(5,playlistId.length))
            if (playlistId.includes('1234s')) await dispatch(removePlaylist(playlistId.slice(5,playlistId.length)))
            await userService.update(user)
            dispatch({ type: 'UPDATE_USER', user})
        } catch(err) {
            console.log('err:', err)
        }
    }
}

export function addUserTrack(track) {
    return async (dispatch, getState) => {
        try {
            const user = getState().userModule.loggedInUser
            user.likedTracks? user.likedTracks.push({...track }) : user.likedTracks = [track]
            await userService.update(user)
            dispatch({ type: 'UPDATE_USER', user})
        } catch(err) {
            console.log('err:', err)
        }
    }
}
export function removeUserTrack(trackId) {
    return async (dispatch, getState) => {
        try {
            const user = getState().userModule.loggedInUser
            user.likedTracks = user.likedTracks.filter( likedTrack => likedTrack.id !== trackId )
            await userService.update(user)
            dispatch({ type: 'UPDATE_USER', user})
        } catch(err) {
            console.log('err:', err)
        }
    }
}