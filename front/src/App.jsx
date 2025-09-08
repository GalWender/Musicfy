import React, { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import './assets/styles/styles.scss'
import { router } from './router'
import { Loader } from './cmps/Loader'

import EventBus from 'react-native-event-bus'
import { useDispatch, useSelector } from 'react-redux'
import { loadPlaylists } from './store/actions/playlists.actions'

const App = () => {
  const dispatch = useDispatch()
  const playlists = useSelector((state) => state.playlistModule.playlists)

  useEffect(() => {
    getPlaylists()
  }, [])

  const getPlaylists = async () => {
    dispatch(loadPlaylists())
  }

  function closeModal() {
    EventBus.getInstance().fireEvent('closeModal')
  }

  if (!playlists) return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <Loader label="Loading app..." />
    </div>
  )
  return (
    <div onClick={closeModal}>
      <RouterProvider router={router} />
    </div>
  )
}
export default App
