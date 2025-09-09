import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import EventBus from 'react-native-event-bus'
import { useSelector, useDispatch } from "react-redux"
import { updatePlayer } from '../store/actions/player.actions'
import { searchItems } from '../store/actions/playlists.actions'
import { getLoggedinUser, logout} from '../store/actions/user.actions'
import { UserModule } from './UserModal'
import { utilService } from '../services/util.service'


import SvgIcon from './SvgIcon'

export const Header = () => {

    const navigate = useNavigate()
    const dispatch = useDispatch()
    const location = useLocation()
    const playerSettings = useSelector(state => state.playerModule)
    const playlistColor = useSelector(state => state.playlistModule.playlistColor)
    const currUser = useSelector(state => state.userModule.loggedInUser)
    const [isPrev,setIsPrev] = useState()
    const [isNext,setIsNext] = useState()
    const [isSearch, setIsSearch] = useState()
    const isSearchActive = useSelector(state => state.playlistModule.isSearchActive)
    const [isPlaylist, setIsPlaylist] = useState()
    const [headerBgc, setHeaderBgc] = useState("#00000080")
    const [headerName, setHeaderName] = useState('')
    const [isFocus, setIsFocus] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [width, setWidth] = useState(window.innerWidth)
    const [searchOption,setSearchOption] = useState('track')
    const [searchKey,setSearchKey] = useState('')
    const timer = useRef()
    
    const handleResize = () => {
        setWidth(window.innerWidth)
    }

    useEffect(() => {
      window.addEventListener("resize", handleResize)

      return () => {window.removeEventListener("resize", handleResize)}

    }, [])
    const [searchType, setSearchType] = useState('artist')

    // PWA install state
    const [canInstall, setCanInstall] = useState(false)
    const deferredPromptRef = useRef(null)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        EventBus.getInstance().addListener("toggleOpacity",  (data) =>{
            if(data){
                setHeaderBgc(prevState=> {
                    return prevState.slice(0,7) + '80'
                })
            } 
            else {
                setHeaderBgc(prevState => {
                    return prevState.slice(0,7) + 'ff'
                })
            }
        })
        
        return EventBus.getInstance().removeListener("toggleOpacity")
    },[])

    // Detect PWA install availability and installed state
    useEffect(() => {
        const onBeforeInstallPrompt = (e) => {
            e.preventDefault()
            deferredPromptRef.current = e
            setCanInstall(true)
        }
        const onAppInstalled = () => {
            setCanInstall(false)
            deferredPromptRef.current = null
        }
        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
        window.addEventListener('appinstalled', onAppInstalled)

        // Track display-mode changes (installed/standalone)
        const mq = window.matchMedia('(display-mode: standalone)')
        setIsStandalone(mq.matches)
        const onChange = (e) => {
            setIsStandalone(e.matches)
            if (e.matches) setCanInstall(false)
        }
        try { mq.addEventListener('change', onChange) } catch { mq.addListener(onChange) }

        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
            window.removeEventListener('appinstalled', onAppInstalled)
            try { mq.removeEventListener('change', onChange) } catch { mq.removeListener(onChange) }
        }
    }, [])

    async function onInstallClick() {
        try {
            const promptEvent = deferredPromptRef.current
            if (!promptEvent) {
                // Fallback: basic instructions if the browser throttled the prompt or doesn't support it
                alert('Install via your browser menu: Look for "Install app" or "Add to Home screen" in the menu.')
                return
            }
            promptEvent.prompt()
            await promptEvent.userChoice
            deferredPromptRef.current = null
            setCanInstall(false)
        } catch (_) { }
    }

    useEffect(() => {
        location.pathname.includes('Playlist')? setIsPlaylist(true) : setIsPlaylist(false)
        location.pathname.includes('search')? setIsSearch(true) : setIsSearch(false)
    },[location.pathname])
    
    useEffect(() => {
        setHeaderBgc(playlistColor + '80')
    }, [playlistColor])

    useEffect(() => {
        EventBus.getInstance().addListener("headerName",  (data) =>{
            setHeaderName(data)
        })
        dispatch(getLoggedinUser())

        return EventBus.getInstance().removeListener("headerName")
    },[])

    useEffect(() => {
        EventBus.getInstance().addListener("closeModal",  () =>{
            setIsModalOpen(false)
        })

        return EventBus.getInstance().removeListener("closeModal")
    },[])

    useEffect(() => {
        setIsPrev(location.key === 'default') 
        setIsNext(history.length > 1 && history.length - history.state.idx !== 2)
    }, [location.key])

    const handleClick = (num) => {
        navigate(num)
    }

    function onLogout() {
        dispatch(logout())
    }

    function toggleModal(e){
        e.stopPropagation()
        setIsModalOpen(state => state = !state)
    }

    function handleInput(ev) {
     
        utilService.debounce(()=> {
            setSearchKey(ev.target.value)
            dispatch(searchItems(ev.target.value, searchOption))
        })()
    }
   
    function handleSearchOption(option) {
        setSearchOption(option)
        dispatch(searchItems(searchKey, option))
    }
    return (
        <section className='header-container flex' style={{'backgroundColor':!isSearch? headerBgc : "#000000ff"}}>
            {(width > 550 || (!headerName && !isSearch)) && <div className='action flex'>
                <button className='btn-action' disabled={isPrev} onClick={() => handleClick(-1)}>
                    {SvgIcon({ iconName: 'prev' })}
                </button>
                <button className='btn-action' disabled={!isNext} onClick={() => handleClick(1)}>
                    {SvgIcon({ iconName: 'next' })}
                </button>
            </div>}
            <section className='content-container'>
                { isPlaylist && 
                    <button className='btn-play' hidden={!headerName} onClick={() => dispatch(updatePlayer('isPlaying', !playerSettings.isPlaying))}>
                        {SvgIcon({ iconName: playerSettings.isPlaying ? 'player-pause' : 'player-play' })}
                    </button>
                }
                <div className='header-name'>{headerName}</div>
                { isSearch &&
                    <div className={isFocus?' search-box focus': 'search-box'}>
                        {SvgIcon({iconName: 'search'})}
                        <textarea cols={1} rows={1} type="text" onInput={handleInput} onFocus={()=>setIsFocus(true)} onBlur={()=>setIsFocus(false)} placeholder='What do you want to listen to?' />
                    </div>
                }
            </section>
            {!isStandalone && (
                <button className={'btn-install' + (canInstall ? '' : ' pending')} onClick={onInstallClick} title={canInstall ? 'Install app' : 'Install (use browser menu if disabled)'}>Install app</button>
            )}
            {currUser.fullname ? 
                <section className='user-container' onClick={toggleModal}>
                    <img src={currUser.imgUrl} alt="" />
                    { isModalOpen &&
                        <UserModule logout={onLogout}/>
                    }
                </section> 
                :
                <section className='login-container'>
                    <button className='btn-signup' onClick={()=> navigate('/signup')}>Sign up</button>
                    <button className='btn-login' onClick={()=> navigate('/login')}>
                        <span>
                            Log in
                        </span>
                    </button>
                </section>
            }
           {isSearchActive && searchKey && <section className='search-bar'>
                <button className={searchOption === 'playlist'?'search-action active': 'search-action'} onClick={()=>handleSearchOption('playlist')}>Playlists</button>
                <button className={searchOption === 'track'?'search-action active': 'search-action'} onClick={()=>handleSearchOption('track')}>Songs</button>
                {/* <button className={searchOption === 'artist'?'search-action active': 'search-action'} onClick={()=>setSearchOption('artist')}>Artists</button> */}
                {/* <button className={searchOption === 'album'?'search-action active': 'search-action'} onClick={()=>setSearchOption('album')}>Albums</button> */}
            </section>}
        </section>
    )
}
