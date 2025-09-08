import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from 'react-redux'
import { useHeaderObserver } from '../customHooks/useHeaderObserver'
import { useObserver } from '../customHooks/useObserver'
import { changePlaylistColor, getEmptyPlaylist, getPlaylistById, updateTrackIdx, updatePlaylist } from '../store/actions/playlists.actions'
import { PlaylistList } from '../cmps/PlaylistList'
import { updatePlayer } from '../store/actions/player.actions'
import { FastAverageColor } from 'fast-average-color'
import { removeUserPlaylist, addUserPlaylist, addUserTrack, removeUserTrack  } from '../store/actions/user.actions'
import { ImageUpload } from '../cmps/ImageUpload'
import { EditModal } from '../cmps/EditModal'

import SvgIcon from '../cmps/SvgIcon'


export const EditPlaylist = () => {
    
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const params = useParams()
    const fac = new FastAverageColor()
    const playlist = useSelector(state => {return {...state.playlistModule.currPlaylist}})
    const playerSettings = useSelector(state => state.playerModule)
    const [bgc, setBgc] = useState()
    const [isModaOpen, setIsModalOpen] = useState(false)
    const [headerRef, headerName] = useHeaderObserver()
    const [containerRef, isVisible] = useObserver()
    const currId = useRef(null)
    

    useEffect(() => {
        currId.current = playlist._id
        dispatch(getEmptyPlaylist())
    }, [])

    useEffect(()=>{
        // Wait until both _id and spotifyId are present to avoid navigating to undefined<id>
        if (!playlist?._id || !playlist?.spotifyId) return
        if (playlist._id === currId.current) return
        navigate(`/playlist/${playlist.spotifyId + playlist._id}`)
    },[playlist._id, playlist.spotifyId])
    
    useEffect(() => {
        if (playlist.image === null){
            dispatch(changePlaylistColor('#000000'))
            setBgc('#000000')
            return
        } 
        isVisible.current = true
        if(playlist.spotifyId) headerName.current = playlist.name
        fac.getColorAsync(playlist.image)
            .then(color => {
                setBgc(color.rgba)
                dispatch(changePlaylistColor(color.hexa))
            })
            .catch(e => {
                console.log(e)
            })
    },[playlist.image])

    useEffect(() => {
        return () => {
            dispatch(changePlaylistColor('#000000'))
        }
    }, [])

    function handleTrack(isLiked, track) {
        if(isLiked) {
            dispatch(removeUserTrack(track.id))
        }
        else {
            dispatch(addUserTrack(track))
        }
    }

    const playTrack = (trackIdx,isPlaying) =>{
        // Ensure player playlist matches current playlist before playing
        dispatch(checkPlayerPlaylist())
        dispatch(updateTrackIdx('num', trackIdx))
        dispatch(updatePlayer('isPlaying', isPlaying))
    }

    async function updatePlaylistImg(imgUrl){
        const updatedPlaylist = {...playlist, image:imgUrl}
        savePlaylist(updatedPlaylist)
    }

    function savePlaylist(playlist){
        dispatch(updatePlaylist(playlist))
    }

    return (
        <section className="edit">
            {
                isModaOpen &&
                <EditModal savePlaylist={savePlaylist} updatePlaylistImg = {updatePlaylistImg} setIsModalOpen={setIsModalOpen}/>
            }
            <section className='playlist-header' style={{ backgroundColor: bgc || '#000000'}}>
                <div className='img-container'>
                    <ImageUpload updatePlaylistImg = {updatePlaylistImg} playlistImg = {playlist.image} />
                </div>
                <section className='playlist-info' onClick={() => setIsModalOpen(true)}>
                    <p>Playlist</p>
                    <h1 className='playlist-name'>{playlist.name}</h1>
                    <p className='playlist-disc'>{playlist.description}</p>
                </section>
            </section>
            <section className='playlist-action' style={{ backgroundColor: bgc || '#000000' }}>
                <button className='btn-play' onClick={() => dispatch(updatePlayer('isPlaying', !playerSettings.isPlaying))}>
                    {SvgIcon({ iconName: playerSettings.isPlaying ? 'player-pause' : 'player-play' })}
                </button>
                <button className='btn-more'>{SvgIcon({ iconName: 'dots' })}</button>
                <div ref={headerRef}></div>
            </section>
            <div ref={containerRef}></div>
            {playlist?.tracks?.length > 1 && <PlaylistList playlist={playlist} playTrack={playTrack} handleTrack={handleTrack}/>}
        </section>
    )
}
