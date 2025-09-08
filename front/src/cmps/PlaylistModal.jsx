import { useEffect, useState } from "react"
import { useSelector,useDispatch } from "react-redux"
import { addTrack, getEmptyPlaylist } from '../store/actions/playlists.actions'
import EventBus from 'react-native-event-bus'

export const PlaylistModal = ({track}) => {

    const dispatch = useDispatch()
    const userPlaylists = useSelector(state => { return [ ...state.userModule.loggedInUser.playlist ] })

    useEffect(()=>{
      return EventBus.getInstance().fireEvent("unfreeze")
    },[])

    function HandleTrack(playlistId){
      const idx = userPlaylists.findIndex(playlist => playlist.id === playlistId)
      const playlistSpotId = userPlaylists[idx].spotifyId + playlistId
      dispatch(addTrack(playlistSpotId,track))
      EventBus.getInstance().fireEvent("closeModal")
      EventBus.getInstance().fireEvent("unfreeze")
    }
    
    function createPlaylist() {
      dispatch(getEmptyPlaylist(track))
      EventBus.getInstance().fireEvent("closeModal")
      EventBus.getInstance().fireEvent("unfreeze")
    }
    
    return (
      <div className='modal-list' onClick={(e)=> e.stopPropagation()} onMouseEnter={() => EventBus.getInstance().fireEvent("freeze")} onMouseLeave={()=> EventBus.getInstance().fireEvent("unfreeze")}>
        <p className="playlist create" onClick={createPlaylist} >Create playlist</p>
        {userPlaylists && userPlaylists.map((playlist)=>{
            if(playlist.spotifyId === '1234s') return <p className="playlist" key={playlist.id} onClick={()=>HandleTrack(playlist.id)}>{playlist.name}</p>
        })}
      </div>
    )
  }