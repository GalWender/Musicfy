import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from "react-router-dom"
import { useSelector } from 'react-redux'
import EventBus from 'react-native-event-bus'
import { utilService } from '../services/util.service'
import SvgIcon from '../cmps/SvgIcon'
import svgIcon from '../cmps/SvgIcon'
import { PlaylistModal } from './PlaylistModal'


export const PlaylistPreview = ({ track, idx, playTrack, playlistId, handleTrack, origin, handleRemoveTrack }) => {

    const navigate = useNavigate()
    const playerSettings = useSelector(state => state.playerModule)
    const loadingTrackId = useSelector(state => state.playerModule.loadingTrackId)
    const currTrack = useSelector(state => {return {...state.playlistModule.playerPlaylist?.tracks[state.playlistModule.currTrackIdx]}})
    const playerPlaylistId = useSelector(state => {return state.playlistModule.playerPlaylist._id})
    const currPlatlistSpotifyId = useSelector(state => state.playlistModule.currPlaylist.spotifyId)
    const [isLiked, setIsLiked] = useState(false)
    const userLikedTracks = useSelector(state => { return { ...state.userModule.loggedInUser }.likedTracks })
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isPlaylistOpen, setIsPlaylistOpen] = useState(false)
    const [isTrackInPlayer, setIsTrackInPlayer] = useState(false)
    const [isCurrTrack, setIsCurrTrack] = useState(false)

    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
    });

    const handleResize = () => {
        setDimensions({
            width: window.innerWidth,
        });
    }

    useEffect(() => {
      window.addEventListener("resize", handleResize)

      return () => {window.removeEventListener("resize", handleResize)}

    }, [])

    useEffect(()=>{
        if (playlistId === playerPlaylistId && currTrack.id === track.id) {
            setIsTrackInPlayer(true)
        }else setIsTrackInPlayer(false)
        
    },[playerPlaylistId, currTrack.id])


    useEffect(() => {
        setIsLiked(state => state = userLikedTracks?.some(likedTrack => likedTrack.id === track.id))
        setIsPlaylistOpen(false)
    }, [])

    useEffect(() => {
        EventBus.getInstance().addListener("closeModal", () => {
            setIsModalOpen(false)
        })

        return EventBus.getInstance().removeListener("closeModal")
    }, [])

    function handleTrackPrev(isLiked, track) {
        setIsLiked(prevState => prevState = !prevState)
        handleTrack(isLiked, track)
    }

    function toggleModal(e) {
        e.stopPropagation()
        if (!isModalOpen) {
            EventBus.getInstance().fireEvent("closeModal")
            try { EventBus.getInstance().fireEvent('freeze') } catch (_) {}
            setIsModalOpen(true)
        } else {
            try { EventBus.getInstance().fireEvent('unfreeze') } catch (_) {}
            setIsPlaylistOpen(false)
            setIsModalOpen(false)
        }
    }

    function handlePlaylistModal(e){
        e.stopPropagation()
        if(dimensions.width < 550)setIsPlaylistOpen(prevState=>!prevState)

    }

    const requestPlay = (idx, shouldPlay) => {
        try { EventBus.getInstance().fireEvent('userPlayIntent') } catch (_) {}
        playTrack(idx, shouldPlay)
    }

    const isLoadingThisTrack = loadingTrackId === track.id

    return (
        <section className={`playlist-preview ${(playerSettings.isPlaying && isTrackInPlayer && !isLoadingThisTrack) ? 'playing' : ''}`} >
            <button className='btn-player' onClick={() => requestPlay(idx, (playerSettings.isPlaying && isTrackInPlayer ? false : true))}>
                {SvgIcon({ iconName: (loadingTrackId === track.id) ? 'spinner' : ((playerSettings.isPlaying && isTrackInPlayer) ? 'equalizer' : 'player-play') })}
            </button>
            <section className='track-title' onClick={() => requestPlay(idx, (playerSettings.isPlaying && isTrackInPlayer ? false : true))}>
                <div className='track-img'>
                    <img src={track.imgUrl} alt="" />
                </div>
                <section className='track-info'>
                    <h1 className={(playerSettings.isPlaying && isTrackInPlayer && !isLoadingThisTrack) ? 'green-header' : ''} onClick={() => console.log(`track ${track.title}`)}>{track.title}</h1>
                    <p onClick={() => console.log(`artist ${track.artists}`)}>{track.artists[0]}</p>
                </section>
            </section>
            <section className='track-album' onClick={() => console.log(`album ${track.album}`)}>
                <p>{track.album}</p>
            </section>

            <section className='track-date'>
                <p>{origin !== 'search' ? utilService.dateAdded(track.addedAt) : ''}</p>
            </section>
            <section className='like-time'>
                <button className={isLiked ? 'btn-heart fill' : 'btn-heart'} onClick={() => handleTrackPrev(isLiked, track)}>
                    {SvgIcon({ iconName: isLiked ? 'heart-fill' : 'heart-no-fill' })}
                </button>
                <section className='track-duration'>
                    {utilService.timeFormat(track.formalDuration / 600)}
                </section>
            </section>
            <section className='track-option' onClick={toggleModal}>
                {svgIcon({ iconName: 'dots' })}
            </section>
            {isModalOpen && createPortal(
                (
                    <section className='track-modal' onClick={() => { setIsModalOpen(false); setIsPlaylistOpen(false); try { EventBus.getInstance().fireEvent('unfreeze') } catch (_) {} }}>
                        <div className='sheet-content' onClick={(e) => e.stopPropagation()}>
                            <div className='sheet-handle'></div>
                            <div className='sheet-track'>
                                <img className='art' src={track.imgUrl} alt='' />
                                <div className='meta'>
                                    <h3>{track.title}</h3>
                                    <p>{track.artists && track.artists[0]}</p>
                                </div>
                            </div>
                            <div className='actions'>
                                <button className='like-btn' onClick={() => handleTrackPrev(isLiked, track)}>
                                    {!isLiked ? 'Add to Liked Songs' : 'Remove from Liked Songs'}
                                </button>
                                {currPlatlistSpotifyId === '1234s' && (
                                    <button className='like-btn' onClick={() => handleRemoveTrack(track.id)}>
                                        Remove track from playlist
                                    </button>
                                )}
                                <button className={'add-btn' + (isPlaylistOpen ? ' open' : '')} onClick={handlePlaylistModal}>
                                    <span className='icon'>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                            <path d="M6 9l6 6 6-6" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </span>
                                    <span className='label'>Add to playlist</span>
                                </button>
                                <PlaylistModal track={track} />
                                <button className='cancel-btn' onClick={() => { setIsModalOpen(false); setIsPlaylistOpen(false); try { EventBus.getInstance().fireEvent('unfreeze') } catch (_) {} }}>Cancel</button>
                            </div>
                        </div>
                    </section>
                ),
                document.body
            )}
        </section>
    )
}