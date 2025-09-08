import React, { useEffect, useState } from 'react'

import { useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"

import { PlaylistList } from '../cmps/PlaylistList'
import { Category } from '../views/Category'
import { addUserTrack, removeUserTrack } from '../store/actions/user.actions'
import { updateTrackIdx, changeSearchStatus, checkPlayerPlaylist } from '../store/actions/playlists.actions'
import { loadCategories } from '../store/actions/categories.actions'
import { updatePlayer } from '../store/actions/player.actions'

export const Search = () => {

  const categories = useSelector(state => state.categoryModule.categories)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const playlist = useSelector(state => { return { ...state.playlistModule.currPlaylist } })
  const searchItems = useSelector(state => state.playlistModule.searchItems)
  const searchType = useSelector(state => state.playlistModule.searchType)
  const isSearchActive = useSelector(state => state.playlistModule.isSearchActive)

  useEffect(() => {
    console.log('isSearchActive', isSearchActive)
    // Load live categories for the Home/Browse grid
    if (!categories) dispatch(loadCategories({ txt: 'HomePage', country: 'US' }))
    return () => {
      dispatch(changeSearchStatus(false))
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

function playTrack(trackIdx, isPlaying) {
    dispatch(checkPlayerPlaylist())
    dispatch(updateTrackIdx('num', trackIdx))
    dispatch(updatePlayer('isPlaying', isPlaying))
}

  return (
    <>
    {!isSearchActive && <section className='search-container'>
      <h3>Browse all</h3>
      <section className='categories-container'>
        {!categories && <div>Loading categories...</div>}
        {categories && categories.map(categ => {
          return (<article className='category-card' style={{ backgroundColor: categ.backgroundColor }} onClick={() => navigate({
            pathname: `/Category/${categ.id}`,
            search: `?name=${categ.name}`
          })} key={categ.id}>
            <p>{categ.name}</p>
            <img src={categ.image} />
          </article>)
        })}
      </section>
    </section>}
    {isSearchActive && searchType === 'track' && <PlaylistList playlist={playlist} playTrack={playTrack} handleTrack={handleTrack} origin='search'/>}
    {searchItems.length && searchType === 'playlist' && <Category searchItems={searchItems} origin='search'/>}
    </>
  )
}
