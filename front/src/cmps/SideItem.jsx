import SvgIcon from './SvgIcon'
import { useSelector } from 'react-redux'

export const SideItem = ({ categ, selected, directTo }) => {

  const isPlaying = useSelector(state => state.playerModule.isPlaying)
  const playerPlaylist = useSelector(state => state.playlistModule.playerPlaylist)

  const getClass = () => {
    let classStr = `${categ.icon ? 'nav-categ' : 'user-categ'} ${categ.icon || ''}`
    if (categ.path === '/' && selected === 'home' || categ.spotifyId === selected || categ.spotifyId+categ.id === selected || categ.path?.slice(1) === selected) classStr += ' selected'
    return classStr
  }

  const getIcon = () => {
    return categ.icon === selected ? selected + '-full' : categ.icon
  }

  const isThisPlaying = () => {
    if (!isPlaying || !playerPlaylist?._id) return false
    // User-created playlist (stored with spotifyId === '1234s' and id = mongo _id)
    if (categ.spotifyId === '1234s') {
      return playerPlaylist.spotifyId === '1234s' && playerPlaylist._id === categ.id
    }
    // Spotify playlist saved by user (has spotifyId)
    const compareId = categ._id || categ.spotifyId
    return compareId && playerPlaylist._id === compareId
  }
  return (
    <div onClick={() => directTo(categ.path || `/Playlist/${categ._id || (categ.spotifyId === '1234s' ? (categ.spotifyId+categ.id) : categ.spotifyId)}`)} className={`${getClass()} ${(!categ.icon && isThisPlaying()) ? 'playing' : ''}`}>
      {categ.icon && <i className='side-icon'>{SvgIcon({ iconName: getIcon() })}</i>}
      <div className='img-container'>
        {categ.image && <img className='side-img' src={categ.image}/>}
        {!categ.icon && isThisPlaying() && (
          <span className='playing-overlay'>{SvgIcon({ iconName: 'equalizer' })}</span>
        )}
      </div>
      <p data-title={categ.name} title={categ.name}>{categ.name}</p>
    </div>

  )
}