import SvgIcon from './SvgIcon'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from 'react-redux'

import { SideItem } from './SideItem'
import { addPlaylist } from '../store/actions/playlists.actions'

export const SideNav = () => {

  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const userPlaylists = useSelector(state => {return {...state.userModule.loggedInUser}})

  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (location.pathname === `/`) setSelected('home')
    else if (location.pathname.substring(1, 9) === 'Playlist') setSelected(`${location.pathname.slice(10)}`)
    else setSelected(`${location.pathname.slice(1)}`)
  }, [location.pathname])

  useEffect(() => {
  }, [])
  
  const NavCateg = [{ name: 'Home', icon: 'home', path: '/' },
  { name: 'Search', icon: 'search', path: '/search' },
  { name: 'Your Library', icon: 'lib', path: '/lib' },
  { name: 'Create Playlist', icon: 'plus', path: '/create' },
  { name: 'Liked Songs', icon: 'heart', path: '/lib' },
  ]

  const directTo = (path) => {
    // if (path === '/create') {
    //   addUserPlaylist()
    //   path = '/'
    // }
    navigate(path)
  }

  function addUserPlaylist() {
    dispatch(addPlaylist())
  }

  return (

    <div className='side-nav-container'>
      <div className='logo'>{SvgIcon({ iconName: 'logo' })} <h2>Musicfy</h2> </div>

      <section className='upper-container'>
        {NavCateg.map((categ, idx) => {
          return (
            <SideItem categ={categ} selected={selected} directTo={directTo} key={idx} />
          )
        })}
        <hr />
      </section>
      <section className='user-categ-container'>
        {userPlaylists.playlist?.map((categ, idx) => {
          return (
            <SideItem categ={categ} selected={selected} directTo={directTo} key={idx} />
          )
        })}
      </section>
    </div>
  )
}

// "editor.mouseWheelZoom": true,