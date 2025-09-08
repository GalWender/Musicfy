import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { ImageUpload } from './ImageUpload'


export const EditModal = ({updatePlaylistImg, savePlaylist, setIsModalOpen}) => {


    const playlist = useSelector(state => {return {...state.playlistModule.currPlaylist}})
    const [playlistValue, setPlaylistValue] = useState(playlist)
    const [isDone, setIsDone] = useState(true)

    useEffect(()=>{
        // Sync modal form when playlist changes (image/name/description)
        setPlaylistValue(playlist)
    },[playlist.image, playlist.name, playlist.description])

    function handlePlaylist(ev){
        if (!isDone) return
        const { id, value } = ev.target
        setIsDone(false)
        setPlaylistValue((prevState) => ({ ...prevState, [id]: value }))
        setIsDone(true)
    }

    function save(){
        savePlaylist(playlistValue)
        setIsModalOpen(false)
    }


    return (
        <section className='edit-modal'>
            <section className='edit-header'>
                <h1 className='header-txt'>Edit details</h1>
                <button className='btn-close' onClick={()=>setIsModalOpen(false)}>X</button>
            </section>
            <section className='contant-container'>
                <ImageUpload updatePlaylistImg = {updatePlaylistImg} playlistImg={playlistValue.image}/>
                <input type='text' id='name' className='playlist-name' value={playlistValue.name} placeholder='Playlist name' onChange={handlePlaylist} />
                <textarea type='text' id='description' className='playlist-disc' value={playlistValue.description} placeholder='Add discription' onChange={handlePlaylist} />
            </section>
            <button className='btn-save' onClick={save}>Save</button>
            <section className='edit-footer'>
                <p>By proceeding, you agree to give Spotify access to the image you choose to upload. Please make sure you have the right to upload the image.</p>
            </section>
        </section>
    )
}