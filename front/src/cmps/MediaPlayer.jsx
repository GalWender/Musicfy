import { useEffect, useRef, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { updateTrackIdx, getYoutubeId } from '../store/actions/playlists.actions'
import { updatePlayer, updateCurrTime, toggleProp, shuffleIdxs } from '../store/actions/player.actions'

import SvgIcon from './SvgIcon'
import { useLocation } from "react-router-dom"
import EventBus from 'react-native-event-bus'

export const MediaPlayer = () => {

  const currTrack = useSelector(state => state.playlistModule.playerPlaylist?.tracks[state.playlistModule.currTrackIdx])
  const currPlaylist = useSelector(state => state.playlistModule.currPlaylist)
  const currIdx = useSelector(state => state.playlistModule.currTrackIdx)
  const playlistLength = useSelector(state => state.playlistModule.currPlaylist?.tracks.length)
  const playerSettings = useSelector(state => state.playerModule)
  const loadingTrackId = useSelector(state => state.playerModule.loadingTrackId)
  const intervalIdRef = useRef()
  const player = useRef(null)
  const Location = useLocation()
  const userGesturePlayRef = useRef(false)

  const dispatch = useDispatch()
  const dbg = (...args) => console.log('[Player]', ...args)

  useEffect(() => {
    if(!currTrack) return
    dbg('track change/youtubeId effect', { trackId: currTrack?.id, youtubeId: currTrack?.youtubeId })
    if (!player.current) startIframe()
    else loadNewVideo()
  }, [currTrack?.youtubeId])

  // Only resolve YouTube ID when user initiates playback (handled in isPlaying effect below)
  // Ensure we fetch youtubeId even if the player is not yet ready (first-load case)
  useEffect(() => {
    if (!currTrack) return
    if (playerSettings.isPlaying && !currTrack.youtubeId) {
      if (currTrack.title) {
        const keyword = (currTrack.artists && currTrack.artists.length)
          ? `${currTrack.title}- ${currTrack.artists[0]}`
          : `${currTrack.title}`
        dispatch(getYoutubeId(keyword, Location.pathname))
      }
    }
  }, [playerSettings.isPlaying, currTrack?.id, currTrack?.youtubeId])

  useEffect(() => {
    if (!player.current) return
    if (!currTrack) return
    dbg('isPlaying effect', { isPlaying: playerSettings.isPlaying, trackId: currTrack?.id, hasYoutubeId: !!currTrack?.youtubeId })
    if (playerSettings.isPlaying) {
      if (!currTrack.youtubeId) {
        // Fetch and cache YouTube ID on-demand when playback starts
        if (currTrack.title) {
          const keyword = (currTrack.artists && currTrack.artists.length)
            ? `${currTrack.title}- ${currTrack.artists[0]}`
            : `${currTrack.title}`
          dbg('dispatch getYoutubeId', { keyword })
          dispatch(getYoutubeId(keyword, Location.pathname))
        }
      } else {
        try {
          dbg('attempt playVideo (has youtubeId)')
          player.current.unMute()
          player.current.setVolume(playerSettings.volume)
          player.current.playVideo()
        } catch (_) {}
      }
    } else {
      dbg('pauseVideo by state')
      player.current.pauseVideo()
    }
  }, [playerSettings.isPlaying, currTrack?.id, currTrack?.youtubeId])

  useEffect(() => {
    if (!player.current) return
    if (playerSettings.isCued) {
      dispatch(toggleProp('isCued'))
      if (playerSettings.isPlaying) player.current.playVideo()
    }
  }, [playerSettings.isCued])

  useEffect(() => {
    if (!player.current) return
    if (playerSettings.currTime === Math.floor(player.current.getDuration())) {
      checkNextTrack()
    }
  }, [playerSettings.currTime])

  function loadNewVideo() {
    if(!player.current.cueVideoById) return
    dbg('cueVideoById', { trackId: currTrack?.id, youtubeId: currTrack?.youtubeId })
    player.current.cueVideoById(currTrack?.youtubeId, 0)
    clearInterval(intervalIdRef.current)
    dispatch(updatePlayer('currTime', 0))
    if (playerSettings.isPlaying) {
      dbg('attempt playVideo after cue')
      player.current.playVideo()
      intervalIdRef.current = setInterval(() => {
        dispatch(updateCurrTime())
      }, 1000)
    }
  }

  function startIframe() {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api"

    window.onYouTubeIframeAPIReady = loadVideo

    var firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    dbg('injected YouTube Iframe API')
  }

  function loadVideo() {

    player.current = new window.YT.Player(`playerRef`, {
      videoId: currTrack?.youtubeId,
      height: '0',
      width: '0',
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange
      },
    })
    dbg('created YT.Player', { initialYoutubeId: currTrack?.youtubeId })

  }

  function onPlayerReady() {
    dbg('onPlayerReady')
    // Ensure initial volume and unmute on ready
    try {
      player.current.unMute()
      player.current.setVolume(playerSettings.volume)
    } catch (_) {}
    dispatch(updatePlayer('trackDuration', player.current.getDuration()))
    // If the user has already requested play (or isPlaying is true), attempt to start immediately
    try {
      if (playerSettings.isPlaying || userGesturePlayRef.current) {
        player.current.unMute()
        player.current.setVolume(playerSettings.volume)
        player.current.playVideo()
        userGesturePlayRef.current = false
      }
    } catch (_) {}
  }

  function onPlayerStateChange() {
    const state = player.current.getPlayerState()
    dbg('onStateChange', { state })
    if (state === window.YT.PlayerState.CUED) {
      dispatch(toggleProp('isCued'))
      dispatch(updatePlayer('trackDuration', player.current.getDuration()))
      // If a user gesture requested play while video was cueing, honor it now
      if (playerSettings.isPlaying || userGesturePlayRef.current) {
        try {
          player.current.unMute()
          player.current.setVolume(playerSettings.volume)
          player.current.playVideo()
        } catch (_) {}
        userGesturePlayRef.current = false
      }
    }
  }

  // Listen for an explicit user gesture intent to play, so we can call playVideo immediately
  useEffect(() => {
    const handler = () => {
      userGesturePlayRef.current = true
      if (player.current && currTrack?.youtubeId) {
        try {
          player.current.unMute()
          player.current.setVolume(playerSettings.volume)
          player.current.playVideo()
        } catch (_) {}
      }
    }
    EventBus.getInstance().addListener('userPlayIntent', handler)
    return () => {
      EventBus.getInstance().removeListener('userPlayIntent', handler)
    }
  }, [currTrack?.youtubeId, playerSettings.volume])

  function handleVolumeChange(ev) {
    dispatch(updatePlayer('volume', +ev.target.value))

    player.current.setVolume(ev.target.value)
  }

  function handleTimeChange(ev) {
    dispatch(updatePlayer('currTime', +ev.target.value))

    player.current.seekTo(ev.target.value)
    if (!playerSettings.isPlaying) player.current.pauseVideo()
  }

  function togglePlay() {
    if (!currTrack) return
    dbg('togglePlay clicked', { isPlaying: playerSettings.isPlaying, trackId: currTrack?.id, youtubeId: currTrack?.youtubeId })
    if (playerSettings.isPlaying) stopTrack()
    else {
      // If at end of last track force next on manual click
      const safeDur = player.current && player.current.getDuration ? Math.floor(player.current.getDuration()) : 0
      if (currIdx === playlistLength - 1 && playerSettings.currTime === safeDur) {
        checkNextTrack(1, true)
      }
      // Mark this as a direct user play intent for autoplay policies
      try { EventBus.getInstance().fireEvent('userPlayIntent') } catch (_) {}
      try {
        if (player.current) {
          player.current.unMute()
          player.current.setVolume(playerSettings.volume)
          player.current.playVideo()
        }
      } catch (_) {}
      playTrack()
    }
  }

  function stopTrack() {
    dispatch(updatePlayer('isPlaying', false))
    clearInterval(intervalIdRef.current)
  }

  function playTrack() {
    dispatch(updatePlayer('isPlaying', true))
    intervalIdRef.current = setInterval(() => {
      dispatch(updateCurrTime())
    }, 1000)
  }
  function getVolumeIcon() {
    let icon = 'volume-mute'
    if (playerSettings.volume >= 66) icon = 'volume-high'
    else if (playerSettings.volume >= 33) icon = 'volume-medium'
    else if (playerSettings.volume > 0) icon = 'volume-low'

    return icon
  }

  function timeFormat(duration) {
    // Hours, minutes and seconds
    const hrs = ~~(duration / 3600);
    const mins = ~~((duration % 3600) / 60);
    const secs = ~~duration % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    let ret = "";

    if (hrs > 0) {
      ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
  }

  function shufflePlaylist() {
    dispatch(toggleProp('isShuffleMode'))
    if (!playerSettings.isShuffleMode) dispatch(shuffleIdxs(playlistLength))
  }


  function repeatPlaylist() {
    dispatch(toggleProp('isRepeatMode'))
  }

  function checkNextTrack(dir = 1, byClick = false) {
    if (!playerSettings.isShuffleMode) {
      if (currIdx < playlistLength - 1 || playerSettings.isRepeatMode || byClick) dispatch(updateTrackIdx('dir', dir))
      else stopTrack()
    }
    else {
      if (playerSettings.shuffledIdxs.length) {
        var nextIdx = playerSettings.shuffledIdxs.pop()
        dispatch(updateTrackIdx('num', nextIdx))
      } else if (playerSettings.isRepeatMode || byClick) {
        dispatch(shuffleIdxs(playlistLength))
        dispatch(updateTrackIdx('dir', dir))
      } else stopTrack()
    }
  }
  return (
    <div className={ currTrack?.title? 'player-container' : 'player-container empty'}>
      <div className="track-container">
        <img src={currTrack?.imgUrl} />
        <div className="track-details">
          <p className="track-title">{currTrack?.title}</p>
          {
            currTrack?.tracks &&
            <p className="track-artist">{currTrack?.artists[0]}</p>
          }
        </div>
        { currTrack?.title && <i>{SvgIcon({ iconName: 'heart-empty' })}</i> }
      </div>
      <div className="player-control">
        <div className="control-btns">
          <div className="side-btns left-side">
            <i onClick={shufflePlaylist} style={{ color: playerSettings.isShuffleMode ? '#1db954' : '#ffffffb3' }}>{SvgIcon({ iconName: 'shuffle' })}</i>
            <i onClick={() => checkNextTrack(-1, true)}>{SvgIcon({ iconName: 'prev-track' })}</i>
          </div>
          <i onClick={togglePlay} className="play-btn">
            {SvgIcon({ iconName: (loadingTrackId === currTrack?.id) ? 'spinner' : (playerSettings.isPlaying ? 'player-pause' : 'player-play') })}
          </i>
          <div className="side-btns right-side">
            <i onClick={() => checkNextTrack(1, true)}>{SvgIcon({ iconName: 'next-track' })}</i>
            <i onClick={repeatPlaylist} style={{ color: playerSettings.isRepeatMode ? '#1db954' : '#ffffffb3' }}>{SvgIcon({ iconName: 'repeat' })}</i>
          </div>
        </div>
        <div className="playback-bar">
          <div className="progress-time elapsed">{timeFormat(playerSettings.currTime)}</div>
          <div className="progress-container progress-bar">
            <progress className="prog progress-bar" type="progress" onChange={handleTimeChange} value={playerSettings.currTime} min="0" max={playerSettings.trackDuration}></progress>
            <input className="prog input-bar timestamp" id="fontController" type="range"
              onChange={handleTimeChange} value={playerSettings.currTime} min="0" max={playerSettings.trackDuration} />
          </div>

          <div className="progress-time duration">{timeFormat(playerSettings.trackDuration)}</div>
        </div>
      </div>
      <div className="side-container">
        <i>{SvgIcon({ iconName: 'lyrics' })}</i>
        <i>{SvgIcon({ iconName: getVolumeIcon() })}</i>
        <div className="progress-container volume-bar">
          <progress className="prog progress-bar" type="progress" onChange={handleVolumeChange} value={playerSettings.volume} min="0" max="100"></progress>
          <input className="prog input-bar timestamp" id="fontController" type="range"
            onChange={handleVolumeChange} value={playerSettings.volume} min="0" max="100" />
        </div>
      </div>
      <div id="playerRef"></div>
    </div>
  )
}