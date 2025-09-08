import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHeaderObserver } from '../customHooks/useHeaderObserver'
import { useObserver } from '../customHooks/useObserver'
import { changePlaylistColor, getPlaylistById, updateTrackIdx } from '../store/actions/playlists.actions'
import { PlaylistList } from '../cmps/PlaylistList'
import { updatePlayer } from '../store/actions/player.actions'
import { FastAverageColor } from 'fast-average-color'
import { Loader } from '../cmps/Loader'
import { addUserTrack, removeUserTrack } from '../store/actions/user.actions'

import SvgIcon from '../cmps/SvgIcon'


export const Lib = () => {

    const dispatch = useDispatch()
    const playlist = useSelector(state => state.playlistModule.currPlaylist)
    const likedTracks = useSelector(state => { return { ...state.userModule.loggedInUser }.likedTracks })
    const playerSettings = useSelector(state => state.playerModule)
    const [headerRef, headerName] = useHeaderObserver()
    const [containerRef] = useObserver()
    const [bgc, setBgc] = useState()
    const fac = new FastAverageColor()


    useEffect(() => {
        // Always set a Liked Songs playlist, even if there are 0 liked tracks,
        // so the UI can render instead of being stuck on "Loading..."
        const likedPlaylist = {
            name: "Liked Songs",
            image: "https://res.cloudinary.com/dtaiyvzq5/image/upload/v1691582678/rbbevfg1fevxrjqe3gws.png",
            description: '',
            tracks: likedTracks || [],
            spotifyId: 123
        }
        dispatch(getPlaylistById(null, likedPlaylist))
    }, [likedTracks])

    useEffect(() => {
        if (playlist.name === 'My Playlist') return
        headerName.current = playlist.name
        if (!playlist?.image) return
        fac.getColorAsync(playlist.image)
            .then(color => {
                setBgc(color.rgba)
                dispatch(changePlaylistColor(color.hexa))
            })
            .catch(e => {
                console.log(e)
            })
    }, [playlist?.name])

    useEffect(() => {
        return () => {
            dispatch(changePlaylistColor('#000000'))
        }
    }, [])

    function handleTrack(isLiked, track) {
        if (isLiked) {
            dispatch(removeUserTrack(track.id))
        }
        else {
            dispatch(addUserTrack(track))
        }
    }

    const playTrack = (trackIdx, isPlaying) => {
        dispatch(updateTrackIdx('num', trackIdx))
        dispatch(updatePlayer('isPlaying', isPlaying))
    }
    if (playlist.name !== 'Liked Songs') return (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
            <Loader label="Loading Liked Songs..." />
        </div>
    )
    return (
        <section className="playlist">
            <section className='playlist-header' style={{ backgroundColor: bgc || '' }}>
                <div className='img-container'>
                    <img src={playlist.image} alt="" />
                </div>
                <section className='playlist-info'>
                    <p>Playlist</p>
                    <h1 className='playlist-name'>{playlist.name}</h1>
                    <p className='playlist-disc'>{playlist.description}</p>
                </section>
            </section>
            <section className='playlist-action' style={{ backgroundColor: bgc || '' }}>
                <button className='btn-play' onClick={() => dispatch(updatePlayer('isPlaying', !playerSettings.isPlaying))}>
                    {SvgIcon({ iconName: playerSettings.isPlaying ? 'player-pause' : 'player-play' })}
                </button>
                <button className='btn-more'>{SvgIcon({ iconName: 'dots' })}</button>
                <div ref={headerRef}></div>
            </section>
            <div ref={containerRef}></div>
            <PlaylistList playlist={playlist} playTrack={playTrack} handleTrack={handleTrack} />
        </section>
    )
}