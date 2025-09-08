import { useEffect } from 'react'
import { useNavigate } from "react-router-dom"


export const HomePreview = ({ playlistData = {}, skeleton = false }) => {

    const navigate = useNavigate()

    useEffect(() => {
        // console.log('playlistData', playlistData)
    },[]) 

    if (skeleton) {
        return (
            <div className='home-preview skeleton'>
                <div className='img-preview' />
                <div className='skeleton-text' />
                <div className='skeleton-text small' />
            </div>
        )
    }

    const img = playlistData.image || playlistData.images?.[0]?.url || ''
    const pid = playlistData.spotifyId || playlistData.id

    return (
        <div className='home-preview' onClick={() => navigate(`/Playlist/${pid}`)}>
            <img src={img} alt="" className='img-preview' />
            <h1>{playlistData.name}</h1>
            <p>{playlistData.description}</p>
        </div>
    )
}