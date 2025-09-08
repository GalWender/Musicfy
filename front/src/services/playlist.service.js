import axios from 'axios'

const YOUTUBE_KEY = import.meta.env.VITE_YOUTUBE_KEY

import { storageService } from './async-storage.service.js'
import { httpService } from './http.service.js'

// assert { type: 'json' }

const STORAGE_KEY = 'playlist_db'
let gAccessToken

export const playlistService = {
  query,
  getById,
  save,
  remove,
  getEmptyPlaylist,
  addPlaylistMsg,
  getCategories,
  getSpotifyItems,
  getYoutubeId,
  getSearchItems,
}
window.cs = playlistService

async function query(filterBy = {}) {
  // return httpService.get(STORAGE_KEY, filterBy)

  var playlists = await storageService.query(STORAGE_KEY)
  if (filterBy.txt) {
    const regex = new RegExp(filterBy.txt, 'i')
    playlists = playlists.filter((playlist) => regex.test(playlist.vendor) || regex.test(playlist.description))
  }
  if (filterBy.price) {
    playlists = playlists.filter((playlist) => playlist.price <= filterBy.price)
  }
  return playlists
}

async function getById(spotifyId) {
  // return storageService.get(STORAGE_KEY, playlistId)
  const play = await httpService.get(`playlist/${spotifyId}`)
  return play
}

async function getSearchItems(searchKey, searchType) {
  const resItems = await httpService.post(`playlist/search`, { searchKey, searchType })
  console.log(resItems)
  return resItems
}

async function remove(playlistId) {
  // await storageService.remove(STORAGE_KEY, playlistId)
  return httpService.delete(`playlist/${playlistId}`)
}
async function save(playlist) {
  var savedPlaylist
  if (playlist._id) {
    // savedPlaylist = await storageService.put(STORAGE_KEY, playlist)
    savedPlaylist = await httpService.put(`playlist/${playlist._id}`, playlist)
  } else {
    // Later, owner is set by the backend
    // playlist.owner = userService.getLoggedinUser()
    // savedPlaylist = await storageService.post(STORAGE_KEY, playlist)
    savedPlaylist = await httpService.post('playlist', playlist)
  }
  return savedPlaylist
}

async function addPlaylistMsg(playlistId, txt) {
  // const savedMsg = await httpService.post(`playlist/${playlistId}/msg`, {txt})
  return savedMsg
}

function getCategories() {
  return categories
}

function getEmptyPlaylist(track) {
  var tracks = []
  if (track) tracks.push(track)
  return {
    name: track?.title || 'My Playlist',
    description: '',
    owner: 'user',
    image: track?.imgUrl || 'https://res.cloudinary.com/dtaiyvzq5/image/upload/v1692020104/m2pslfiyjn8tgx9hs5pw.png',
    tracks,
    spotifyId: '1234s',
  }
}

async function getAccessToken(clientId, clientSecret) {
  try {
    // Encode client credentials (Client ID and Client Secret)
    const credentials = `${clientId}:${clientSecret}`
    const encodedCredentials = btoa(credentials)

    // Make a POST request to the token endpoint
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${encodedCredentials}`,
        },
      }
    )

    // Extract and return the access token from the response
    const { data } = response
    const accessToken = data.access_token
    const expiresIn = data.expires_in
    return { accessToken, expiresIn }
  } catch (error) {
    console.error('Error retrieving access token:', error.response ? error.response.data : error.message)
    throw error
  }
}

// getAccessToken(config.clientId, config.clientSecret)
//   .then((tokenData) => {
//     gAccessToken = tokenData.accessToken
//     console.log('Access Token:', tokenData.accessToken)
//     console.log('Expires In:', tokenData.expiresIn)
//   })
//   .catch((error) => {
//     console.error('Error:', error)
//   })

async function getYoutubeId(keyword, excludeIds = []) {
  try {
    if (!YOUTUBE_KEY) {
      console.warn('Missing VITE_YOUTUBE_KEY env var. Set it in front/.env or .env.local')
      return ''
    }
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&videoEmbeddable=true&type=video&maxResults=5&key=${YOUTUBE_KEY}&q=${encodeURIComponent(keyword)}`
    )

    const items = response?.data?.items || []
    const firstValid = items.find(it => it?.id?.videoId && !excludeIds.includes(it.id.videoId))
    return firstValid?.id?.videoId || ''
  } catch (error) {
    console.error('Error retrieving data:', error.response ? error.response.data : error.message)
    throw error
  }
}
async function getSpotifyItems(reqType, id) {
  const endpoints = {
    categPlaylists: `https://api.spotify.com/v1/browse/categories/${id}/playlists`,
    tracks: `https://api.spotify.com/v1/playlists/${id}/tracks`,
  }

  try {
    // Make a GET request to the Spotify API endpoint
    const response = await axios.get(endpoints[reqType], {
      headers: {
        Authorization: `Bearer ${gAccessToken}`,
      },
    })

    // Return the playlist data from the response
    const cleanData =
      reqType === 'categPlaylists'
        ? _cleanCategoryPlaylistsData(response.data)
        : _cleanPlaylistsTracksData(response.data)
    return cleanData
  } catch (error) {
    console.error('Error retrieving data:', error.response ? error.response.data : error.message)
    throw error
  }
}

function _cleanCategoryPlaylistsData(data) {
  return data.playlists.items.map((categoryPlaylist) => {
    return {
      id: categoryPlaylist.id,
      name: categoryPlaylist.name,
      description: categoryPlaylist.description,
      image: categoryPlaylist.images[0].url,
    }
  })
}

function _cleanPlaylistsTracksData(data) {
  return data.items.map((item) => {
    return {
      addedAt: item.added_at,
      id: item.track.id,
      title: item.track.name,
      artists: _cleanArtists(item.track.artists),
      imgUrl: item.track.album.images[0].url,
      formalDuration: item.track.duration_ms,
      album: item.track.album.name,
      youtubeId: '',
    }
  })
}

function _cleanArtists(artists) {
  return artists.map((artist) => artist.name)
}
// async function getAccessToken(clientId, clientSecret) {
//   try {
//     // Encode client credentials (Client ID and Client Secret) in Base64
//     const credentials = `${clientId}:${clientSecret}`;
//     const encodedCredentials = Buffer.from(credentials).toString('base64');

//     // Make a POST request to the token endpoint
//     const response = await axios.post(
//       'https://accounts.spotify.com/api/token',
//       new URLSearchParams({
//         grant_type: 'client_credentials',
//       }).toString(),
//       {
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//           Authorization: `Basic ${encodedCredentials}`,
//         },
//       }
//     );

//     // Extract and return the access token from the response
//     const { data } = response;
//     const accessToken = data.access_token;
//     const expiresIn = data.expires_in;
//     return { accessToken, expiresIn };
//   } catch (error) {
//     console.error('Error retrieving access token:', error.response ? error.response.data : error.message);
//     throw error;
//   }
// }

// // Usage example
// const clientId = '5bb32cffdbd64dcbad190f888ccb0b6c';
// const clientSecret = '700bf1887f98431ca60a37bb2b889730';

// getAccessToken(clientId, clientSecret)
//   .then((tokenData) => {
//     console.log('Access Token:', tokenData.accessToken);
//     console.log('Expires In:', tokenData.expiresIn);
//   })
//   .catch((error) => {
//     console.error('Error:', error);
//   });

const categories = [
  {
    id: '0JQ5DAqbMKFzHmL4tf05da',
    name: 'Mood',
    image: 'https://t.scdn.co/media/original/mood-274x274_976986a31ac8c49794cbdc7246fd5ad7_274x274.jpg',
    backgroundColor: '#b49bc8',
  },
  {
    id: '0JQ5DAqbMKFEC4WFtoNRpw',
    name: 'Pop',
    image: 'https://t.scdn.co/media/derived/pop-274x274_447148649685019f5e2a03a39e78ba52_0_0_274_274.jpg',
    backgroundColor: '#f037a5',
  },
  {
    id: '0JQ5DAqbMKFFzDl7qN9Apr',
    name: 'Chill',
    image: 'https://t.scdn.co/media/derived/chill-274x274_4c46374f007813dd10b37e8d8fd35b4b_0_0_274_274.jpg',
    backgroundColor: '#9cf0e1',
  },
  {
    id: '0JQ5DAqbMKFA6SOHvT3gck',
    name: 'Party',
    image: 'https://t.scdn.co/images/fada056dcfd54cd28faf80d62b7059c6.jpeg',
    backgroundColor: '#d7f27d',
  },
  {
    id: '0JQ5DAqbMKFQ00XGBls6ym',
    name: 'Hip-Hop',
    image: 'https://t.scdn.co/media/original/hip-274_0a661854d61e29eace5fe63f73495e68_274x274.jpg',
    backgroundColor: '#8d67ab',
  },
  {
    id: '0JQ5DAqbMKFCbimwdOYlsl',
    name: 'Focus',
    image: 'https://t.scdn.co/media/original/genre-images-square-274x274_5e50d72b846a198fcd2ca9b3aef5f0c8_274x274.jpg',
    backgroundColor: '#503750',
  },
  {
    id: '0JQ5DAqbMKFDXXwE9BDJAr',
    name: 'Rock',
    image: 'https://t.scdn.co/media/derived/rock_9ce79e0a4ef901bbd10494f5b855d3cc_0_0_274_274.jpg',
    backgroundColor: '#7358ff',
  },
  {
    id: '0JQ5DAqbMKFFtlLYUHv8bT',
    name: 'Alternative',
    image: 'https://t.scdn.co/images/ee9451b3ed474c82b1da8f9b5eafc88f.jpeg',
    backgroundColor: '#af2896',
  },
  {
    id: '0JQ5DAqbMKFPw634sFwguI',
    name: 'EQUAL',
    image: 'https://t.scdn.co/images/084155aeaa724ea1bd393a017d67b709',
    backgroundColor: '#148a08',
  },
  {
    id: '0JQ5DAqbMKFCWjUTdzaG0e',
    name: 'Indie',
    image: 'https://t.scdn.co/images/fe06caf056474bc58862591cd60b57fc.jpeg',
    backgroundColor: '#eb1e32',
  },
  {
    id: '0JQ5DAqbMKFHOzuVTgTizF',
    name: 'Dance/Electronic',
    image: 'https://t.scdn.co/media/derived/edm-274x274_0ef612604200a9c14995432994455a6d_0_0_274_274.jpg',
    backgroundColor: '#0d73ec',
  },
  {
    id: '0JQ5DAqbMKFLb2EqgLtpjC',
    name: 'Wellness',
    image: 'https://t.scdn.co/images/3710b68657574bc79df14bd74629e5ac',
    backgroundColor: '#509bf5',
  },
  {
    id: '0JQ5DAqbMKFCuoRTxhYWow',
    name: 'Sleep',
    image: 'https://t.scdn.co/media/derived/sleep-274x274_0d4f836af8fab7bf31526968073e671c_0_0_274_274.jpg',
    backgroundColor: '#1e3264',
  },
  {
    id: '0JQ5DAqbMKFRKBHIxJ5hMm',
    name: 'Tastemakers',
    image: 'https://t.scdn.co/images/b4182906bf244b4994805084c057e9ee.jpeg',
    backgroundColor: '#1e3264',
  },
  {
    id: '0JQ5DAqbMKFIVNxQgRNSg0',
    name: 'Decades',
    image: 'https://t.scdn.co/images/b611cf5145764c64b80e91ccd5f357c8',
    backgroundColor: '#ba5d07',
  },
  {
    id: '0JQ5DAqbMKFAXlCG6QvYQ4',
    name: 'Workout',
    image: 'https://t.scdn.co/media/links/workout-274x274.jpg',
    backgroundColor: '#777777',
  },
  {
    id: '0JQ5DAqbMKFx0uLQR2okcc',
    name: 'At Home',
    image: 'https://t.scdn.co/images/04da469dd7be4dab96659aa1fa9f0ac9.jpeg',
    backgroundColor: '#b49bc8',
  },
  {
    id: '0JQ5DAqbMKFAQy4HL4XU2D',
    name: 'Travel',
    image: 'https://t.scdn.co/media/derived/travel-274x274_1e89cd5b42cf8bd2ff8fc4fb26f2e955_0_0_274_274.jpg',
    backgroundColor: '#2d46b9',
  },
  {
    id: '0JQ5DAqbMKFy78wprEpAjl',
    name: 'Folk & Acoustic',
    image: 'https://t.scdn.co/images/7fe0f2c9c91f45a3b6bae49d298201a4.jpeg',
    backgroundColor: '#283ea3',
  },
  {
    id: '0JQ5DAqbMKFLVaM30PMBm4',
    name: 'Summer',
    image: 'https://t.scdn.co/images/8e508d7eb5b843a89c368c9507ecc429.jpeg',
    backgroundColor: '#283ea3',
  },
  {
    id: '0JQ5DAqbMKFEZPnFQSFB1T',
    name: 'R&B',
    image: 'https://t.scdn.co/media/derived/r-b-274x274_fd56efa72f4f63764b011b68121581d8_0_0_274_274.jpg',
    backgroundColor: '#dc148c',
  },
  {
    id: '0JQ5DAqbMKFIpEuaCnimBj',
    name: 'Soul',
    image: 'https://t.scdn.co/media/derived/soul-274x274_266bc900b35dda8956380cffc73a4d8c_0_0_274_274.jpg',
    backgroundColor: '#dc148c',
  },
  {
    id: '0JQ5DAqbMKFAJ5xb0fwo9m',
    name: 'Jazz',
    image: 'https://t.scdn.co/images/568f37f1cab54136939d63bd1f59d40c',
    backgroundColor: '#f59b23',
  },
  {
    id: '0JQ5DAqbMKFRieVZLLoo9m',
    name: 'Instrumental',
    image: 'https://t.scdn.co/images/384c2b595a1648aa801837ff99961188',
    backgroundColor: '#477d95',
  },
  {
    id: '0JQ5DAqbMKFAjfauKLOZiv',
    name: 'Punk',
    image: 'https://t.scdn.co/media/derived/punk-274x274_f3f1528ea7bbb60a625da13e3315a40b_0_0_274_274.jpg',
    backgroundColor: '#233268',
  },
  {
    id: '0JQ5DAqbMKFQFQN0rnK48G',
    name: 'Flamenco',
    image: 'https://t.scdn.co/images/37780cd0347248e38195515fc7ca061a.jpeg',
    backgroundColor: '#ff4632',
  },
  {
    id: '0JQ5DAqbMKFDkd668ypn6O',
    name: 'Metal',
    image: 'https://t.scdn.co/media/original/metal_27c921443fd0a5ba95b1b2c2ae654b2b_274x274.jpg',
    backgroundColor: '#777777',
  },
  {
    id: '0JQ5DAqbMKFxXaXKP7zcDp',
    name: 'Latin',
    image: 'https://t.scdn.co/images/26a60378-a374-4cd7-b894-28efa5e154cb.jpg',
    backgroundColor: '#e1118b',
  },
  {
    id: '0JQ5DAqbMKFPrEiAOxgac3',
    name: 'Classical',
    image: 'https://t.scdn.co/media/derived/classical-274x274_abf78251ff3d90d2ceaf029253ca7cb4_0_0_274_274.jpg',
    backgroundColor: '#e1118b',
  },
  {
    id: '0JQ5DAqbMKFObNLOHydSW8',
    name: 'Caribbean',
    image: 'https://t.scdn.co/images/495fadcefe234607b14b2db3381f3f5d.jpeg',
    backgroundColor: '#0d73ec',
  },
  {
    id: '0JQ5DAqbMKFCfObibaOZbv',
    name: 'Gaming',
    image: 'https://t.scdn.co/images/0d39395309ba47838ef12ce987f19d16.jpeg',
    backgroundColor: '#e8115b',
  },
  {
    id: '0JQ5DAqbMKFQiK2EHwyjcU',
    name: 'Blues',
    image: 'https://t.scdn.co/images/6fe5cd3ebc8c4db7bb8013152b153505',
    backgroundColor: '#1e3264',
  },
  {
    id: 'funk',
    name: 'Funk',
    image: 'https://t.scdn.co/images/f4f0987fcab446fcaa7173acb5e25701.jpeg',
    backgroundColor: '#e61e32',
  },
  {
    id: '0JQ5DAqbMKFF9bY76LXmfI',
    name: 'Frequency',
    image: 'https://t.scdn.co/images/cad629fb65a14de4beddb38510e27cb1',
    backgroundColor: '#ffc864',
  },
  {
    id: '0JQ5DAqbMKFQIL0AXnG5AK',
    name: 'Trending',
    image: 'https://t.scdn.co/media/derived/trending-274x274_7b238f7217985e79d3664f2734347b98_0_0_274_274.jpg',
    backgroundColor: '#ff4632',
  },
  {
    id: '0JQ5DAqbMKFFoimhOqWzLB',
    name: 'Kids & Family',
    image: 'https://t.scdn.co/images/664bb84f7a774e1eadb7c227aed98f3c',
    backgroundColor: '#8d67ab',
  },
  {
    id: '0JQ5DAqbMKFKLfwjuJMoNC',
    name: 'Country',
    image: 'https://t.scdn.co/images/a2e0ebe2ebed4566ba1d8236b869241f.jpeg',
    backgroundColor: '#b49bc8',
  },
  {
    id: '0JQ5DAqbMKFGvOw3O4nLAf',
    name: 'K-Pop',
    image: 'https://t.scdn.co/images/2078afd91e4d431eb19efc5bee5ab131.jpeg',
    backgroundColor: '#148a08',
  },
  {
    id: '0JQ5DAqbMKFLjmiZRss79w',
    name: 'Ambient',
    image: 'https://t.scdn.co/images/9210c5a26e6a4b4da2c3ea8e5f87fff8',
    backgroundColor: '#477d95',
  },
  {
    id: '0JQ5DAqbMKFF1br7dZcRtK',
    name: 'Pride',
    image: 'https://t.scdn.co/images/c5495b9f0f694ffcb39c9217d4ed4375',
    backgroundColor: '#477d95',
  },
]

// const catIds = ['0JQ5DAqbMKFzHmL4tf05da', '0JQ5DAqbMKFEC4WFtoNRpw', '0JQ5DAqbMKFFzDl7qN9Apr']

// (() => {
//     utilService.saveToStorage(STORAGE_KEY, playlistSave)
// })()

// function getCatInfo() {
//     info = {
//         1: {
//             id: "0JQ5DAqbMKFzHmL4tf05da",
//             name: "Mood",
//             imgUrl: "https://t.scdn.co/media/original/mood-274x274_976986a31ac8c49794cbdc7246fd5ad7_274x274.jpg",
//             backgroundColor: "#b49bc8"
//         }
//     }

//     return info[catIds] || {}

// }
// const categories = [{
//             "id": "0JQ5DAqbMKFzHmL4tf05da",
//             "name": "Mood",
//             "imgUrl": "https://t.scdn.co/media/original/mood-274x274_976986a31ac8c49794cbdc7246fd5ad7_274x274.jpg",
//             "backgroundColor": "#b49bc8"
//         },
//         {
//             "id": "0JQ5DAqbMKFEC4WFtoNRpw",
//             "name": "Pop",
//             "imgUrl": "https://t.scdn.co/media/derived/pop-274x274_447148649685019f5e2a03a39e78ba52_0_0_274_274.jpg",
//             "backgroundColor": "#f037a5"
//         }
//         {
//             "id": "0JQ5DAqbMKFFzDl7qN9Apr",
//             "name": "Chill",
//             "imgUrl": "https://t.scdn.co/media/derived/chill-274x274_4c46374f007813dd10b37e8d8fd35b4b_0_0_274_274.jpg",
//             "backgroundColor": "#9cf0e1"
//         },
//         {
//             "id": "0JQ5DAqbMKFA6SOHvT3gck",
//             "name": "Party",
//             "imgUrl": "https://t.scdn.co/images/fada056dcfd54cd28faf80d62b7059c6.jpeg",
//             "backgroundColor": "#d7f27d"
//         },
//         {
//             "id": "0JQ5DAqbMKFQ00XGBls6ym",
//             "name": "Hip-Hop",
//             "imgUrl": "https://t.scdn.co/media/original/hip-274_0a661854d61e29eace5fe63f73495e68_274x274.jpg",
//             "backgroundColor": "#8d67ab"
//         },
//         {
//             "id": "0JQ5DAqbMKFCbimwdOYlsl",
//             "name": "Focus",
//             "imgUrl": "https://t.scdn.co/media/original/genre-images-square-274x274_5e50d72b846a198fcd2ca9b3aef5f0c8_274x274.jpg",
//             "backgroundColor": "#503750"
//         },
//         {
//             "id": "0JQ5DAqbMKFDXXwE9BDJAr",
//             "name": "Rock",
//             "imgUrl": "https://t.scdn.co/media/derived/rock_9ce79e0a4ef901bbd10494f5b855d3cc_0_0_274_274.jpg",
//             "backgroundColor": "#7358ff"
//         },
//         {
//             "id": "0JQ5DAqbMKFFtlLYUHv8bT",
//             "name": "Alternative",
//             "imgUrl": "https://t.scdn.co/images/ee9451b3ed474c82b1da8f9b5eafc88f.jpeg",
//             "backgroundColor": "#af2896"
//         },
//         {
//             "id": "0JQ5DAqbMKFPw634sFwguI",
//             "name": "EQUAL",
//             "imgUrl": "https://t.scdn.co/images/084155aeaa724ea1bd393a017d67b709",
//             "backgroundColor": "#148a08"
//         },
//         {
//             "id": "0JQ5DAqbMKFCWjUTdzaG0e",
//             "name": "Indie",
//             "imgUrl": "https://t.scdn.co/images/fe06caf056474bc58862591cd60b57fc.jpeg",
//             "backgroundColor": "#eb1e32"
//         },
//         {
//             "id": "0JQ5DAqbMKFHOzuVTgTizF",
//             "name": "Dance/Electronic",
//             "imgUrl": "https://t.scdn.co/media/derived/edm-274x274_0ef612604200a9c14995432994455a6d_0_0_274_274.jpg",
//             "backgroundColor": "#0d73ec"
//         },
//         {
//             "id": "0JQ5DAqbMKFLb2EqgLtpjC",
//             "name": "Wellness",
//             "imgUrl": "https://t.scdn.co/images/3710b68657574bc79df14bd74629e5ac",
//             "backgroundColor": "#509bf5"
//         },
//         {
//             "id": "0JQ5DAqbMKFCuoRTxhYWow",
//             "name": "Sleep",
//             "imgUrl": "https://t.scdn.co/media/derived/sleep-274x274_0d4f836af8fab7bf31526968073e671c_0_0_274_274.jpg",
//             "backgroundColor": "#1e3264"
//         },
//         {
//             "id": "0JQ5DAqbMKFRKBHIxJ5hMm",
//             "name": "Tastemakers",
//             "imgUrl": "https://t.scdn.co/images/b4182906bf244b4994805084c057e9ee.jpeg",
//             "backgroundColor": "#1e3264"
//         },
//         {
//             "id": "0JQ5DAqbMKFIVNxQgRNSg0",
//             "name": "Decades",
//             "imgUrl": "https://t.scdn.co/images/b611cf5145764c64b80e91ccd5f357c8",
//             "backgroundColor": "#ba5d07"
//         },
//         {
//             "id": "0JQ5DAqbMKFAXlCG6QvYQ4",
//             "name": "Workout",
//             "imgUrl": "https://t.scdn.co/media/links/workout-274x274.jpg",
//             "backgroundColor": "#777777"
//         },
//         {
//             "id": "0JQ5DAqbMKFx0uLQR2okcc",
//             "name": "At Home",
//             "imgUrl": "https://t.scdn.co/images/04da469dd7be4dab96659aa1fa9f0ac9.jpeg",
//             "backgroundColor": "#b49bc8"
//         },
//         {
//             "id": "0JQ5DAqbMKFAQy4HL4XU2D",
//             "name": "Travel",
//             "imgUrl": "https://t.scdn.co/media/derived/travel-274x274_1e89cd5b42cf8bd2ff8fc4fb26f2e955_0_0_274_274.jpg",
//             "backgroundColor": "#2d46b9"
//         },
//         {
//             "id": "0JQ5DAqbMKFy78wprEpAjl",
//             "name": "Folk & Acoustic",
//             "imgUrl": "https://t.scdn.co/images/7fe0f2c9c91f45a3b6bae49d298201a4.jpeg",
//             "backgroundColor": "#283ea3"
//         },
//         {
//             "id": "0JQ5DAqbMKFLVaM30PMBm4",
//             "name": "Summer",
//             "imgUrl": "https://t.scdn.co/images/8e508d7eb5b843a89c368c9507ecc429.jpeg",
//             "backgroundColor": "#283ea3"
//         },
//         {
//             "id": "0JQ5DAqbMKFEZPnFQSFB1T",
//             "name": "R&B",
//             "imgUrl": "https://t.scdn.co/media/derived/r-b-274x274_fd56efa72f4f63764b011b68121581d8_0_0_274_274.jpg",
//             "backgroundColor": "#dc148c"
//         },
//         {
//             "id": "0JQ5DAqbMKFIpEuaCnimBj",
//             "name": "Soul",
//             "imgUrl": "https://t.scdn.co/media/derived/soul-274x274_266bc900b35dda8956380cffc73a4d8c_0_0_274_274.jpg",
//             "backgroundColor": "#dc148c"
//         },
//         {
//             "id": "0JQ5DAqbMKFAJ5xb0fwo9m",
//             "name": "Jazz",
//             "imgUrl": "https://t.scdn.co/images/568f37f1cab54136939d63bd1f59d40c",
//             "backgroundColor": "#f59b23"
//         },
//         {
//             "id": "0JQ5DAqbMKFRieVZLLoo9m",
//             "name": "Instrumental",
//             "imgUrl": "https://t.scdn.co/images/384c2b595a1648aa801837ff99961188",
//             "backgroundColor": "#477d95"
//         },
//         {
//             "id": "0JQ5DAqbMKFAjfauKLOZiv",
//             "name": "Punk",
//             "imgUrl": "https://t.scdn.co/media/derived/punk-274x274_f3f1528ea7bbb60a625da13e3315a40b_0_0_274_274.jpg",
//             "backgroundColor": "#233268"
//         },
//         {
//             "id": "0JQ5DAqbMKFQFQN0rnK48G",
//             "name": "Flamenco",
//             "imgUrl": "https://t.scdn.co/images/37780cd0347248e38195515fc7ca061a.jpeg",
//             "backgroundColor": "#ff4632"
//         },
//         {
//             "id": "0JQ5DAqbMKFDkd668ypn6O",
//             "name": "Metal",
//             "imgUrl": "https://t.scdn.co/media/original/metal_27c921443fd0a5ba95b1b2c2ae654b2b_274x274.jpg",
//             "backgroundColor": "#777777"
//         },
//         {
//             "id": "0JQ5DAqbMKFxXaXKP7zcDp",
//             "name": "Latin",
//             "imgUrl": "https://t.scdn.co/images/26a60378-a374-4cd7-b894-28efa5e154cb.jpg",
//             "backgroundColor": "#e1118b"
//         },
//         {
//             "id": "0JQ5DAqbMKFPrEiAOxgac3",
//             "name": "Classical",
//             "imgUrl": "https://t.scdn.co/media/derived/classical-274x274_abf78251ff3d90d2ceaf029253ca7cb4_0_0_274_274.jpg",
//             "backgroundColor": "#e1118b"
//         },
//         {
//             "id": "0JQ5DAqbMKFObNLOHydSW8",
//             "name": "Caribbean",
//             "imgUrl": "https://t.scdn.co/images/495fadcefe234607b14b2db3381f3f5d.jpeg",
//             "backgroundColor": "#0d73ec"
//         },
//         {
//             "id": "0JQ5DAqbMKFCfObibaOZbv",
//             "name": "Gaming",
//             "imgUrl": "https://t.scdn.co/images/0d39395309ba47838ef12ce987f19d16.jpeg",
//             "backgroundColor": "#e8115b"
//         },
//         {
//             "id": "0JQ5DAqbMKFQiK2EHwyjcU",
//             "name": "Blues",
//             "imgUrl": "https://t.scdn.co/images/6fe5cd3ebc8c4db7bb8013152b153505",
//             "backgroundColor": "#1e3264"
//         },
//         {
//             "id": "funk",
//             "name": "Funk",
//             "imgUrl": "https://t.scdn.co/images/f4f0987fcab446fcaa7173acb5e25701.jpeg",
//             "backgroundColor": "#e61e32"
//         },
//         {
//             "id": "0JQ5DAqbMKFF9bY76LXmfI",
//             "name": "Frequency",
//             "imgUrl": "https://t.scdn.co/images/cad629fb65a14de4beddb38510e27cb1",
//             "backgroundColor": "#ffc864"
//         },
//         {
//             "id": "0JQ5DAqbMKFQIL0AXnG5AK",
//             "name": "Trending",
//             "imgUrl": "https://t.scdn.co/media/derived/trending-274x274_7b238f7217985e79d3664f2734347b98_0_0_274_274.jpg",
//             "backgroundColor": "#ff4632"
//         },
//         {
//             "id": "0JQ5DAqbMKFFoimhOqWzLB",
//             "name": "Kids & Family",
//             "imgUrl": "https://t.scdn.co/images/664bb84f7a774e1eadb7c227aed98f3c",
//             "backgroundColor": "#8d67ab"
//         },
//         {
//             "id": "0JQ5DAqbMKFKLfwjuJMoNC",
//             "name": "Country",
//             "imgUrl": "https://t.scdn.co/images/a2e0ebe2ebed4566ba1d8236b869241f.jpeg",
//             "backgroundColor": "#b49bc8"
//         },
//         {
//             "id": "0JQ5DAqbMKFGvOw3O4nLAf",
//             "name": "K-Pop",
//             "imgUrl": "https://t.scdn.co/images/2078afd91e4d431eb19efc5bee5ab131.jpeg",
//             "backgroundColor": "#148a08"
//         },
//         {
//             "id": "0JQ5DAqbMKFLjmiZRss79w",
//             "name": "Ambient",
//             "imgUrl": "https://t.scdn.co/images/9210c5a26e6a4b4da2c3ea8e5f87fff8",
//             "backgroundColor": "#477d95"
//         },
//         {
//             "id": "0JQ5DAqbMKFF1br7dZcRtK",
//             "name": "Pride",
//             "imgUrl": "https://t.scdn.co/images/c5495b9f0f694ffcb39c9217d4ed4375",
//             "backgroundColor": "#477d95"
//         },
//         {
//             "id": "0JQ5DAqbMKFLVaM30PMBm4",
//             "name": "Summer",
//             "imgUrl": "https://t.scdn.co/images/8e508d7eb5b843a89c368c9507ecc429.jpeg",
//             "backgroundColor": "#8d67ab"
//         }
//     ]
// TEST DATA
// const playlist = {
//     "description": "songs you can’t help but scream along to",
//     "id": "37i9dQZF1DX2KwEtNSejGe",
//     "imgUrl": "https://i.scdn.co/image/ab67706f00000003a83ff89e84f67350d0de273a",
//     "name": "pop songs we can all scream",
//     "owner": "spotify",
//     "tracks": [{
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Call Me Maybe",
//             "artist": "Carly Rae Jepsen",
//             "album": "Kiss (Deluxe)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273a111f7769013f1731e9c697c"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "What Makes You Beautiful",
//             "artist": "One Direction",
//             "album": "Up All Night",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2734a5584795dc73860653a9a3e"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "We Are Never Ever Getting Back Together (Taylor's Version)",
//             "artist": "Taylor Swift",
//             "album": "Red (Taylor's Version)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273318443aab3531a0558e79a4d"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "One Last Time",
//             "artist": "Ariana Grande",
//             "album": "My Everything (Deluxe)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273deec12a28d1e336c5052e9aa"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Wild Ones (feat. Sia)",
//             "artist": "Flo Rida",
//             "album": "Wild Ones",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273871d85943145dde548f4ae09"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Stronger (What Doesn't Kill You)",
//             "artist": "Kelly Clarkson",
//             "album": "Stronger (Deluxe Version)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273253e3f8fce535f72a6b2c4ba"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Rolling in the Deep",
//             "artist": "Adele",
//             "album": "21",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2732118bf9b198b05a95ded6300"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Umbrella",
//             "artist": "Rihanna",
//             "album": "Good Girl Gone Bad: Reloaded",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273f9f27162ab1ed45b8d7a7e98"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Hips Don't Lie (feat. Wyclef Jean)",
//             "artist": "Shakira",
//             "album": "Oral Fixation, Vol. 2 (Expanded Edition)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b27327ddd747545c0d0cfe7595fa"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Just Dance",
//             "artist": "Lady Gaga",
//             "album": "The Fame",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273631810af03785dbad83f5c81"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "I Kissed A Girl",
//             "artist": "Katy Perry",
//             "album": "One Of The Boys",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273cd3978ebe35d93a07249b97f"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "She Looks So Perfect",
//             "artist": "5 Seconds of Summer",
//             "album": "5 Seconds Of Summer",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b27393432e914046a003229378da"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Raise Your Glass",
//             "artist": "P!nk",
//             "album": "Raise Your Glass",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2736f3451faa271fbe470685f34"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Shut Up and Dance",
//             "artist": "WALK THE MOON",
//             "album": "TALKING IS HARD",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b27343294cfa2688055c9d821bf3"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "TiK ToK",
//             "artist": "Kesha",
//             "album": "Animal (Expanded Edition)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2737a6339d6ddfd579f77559b3c"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "We Can't Stop",
//             "artist": "Miley Cyrus",
//             "album": "Bangerz (Deluxe Version)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2736b18d0490878750cd69abf2c"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Give Me Everything (feat. Ne-Yo, Afrojack & Nayer)",
//             "artist": "Pitbull",
//             "album": "Planet Pit (Deluxe Version)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2731dc7483a9fcfce54822a2f19"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Bang Bang",
//             "artist": "Jessie J",
//             "album": "Sweet Talker (Deluxe Version)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273930f686fe89425c7b6bf9a7d"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Work from Home (feat. Ty Dolla $ign)",
//             "artist": "Fifth Harmony",
//             "album": "7/27 (Deluxe)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273d03fa6f4e758282b7920b5c8"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Toxic",
//             "artist": "Britney Spears",
//             "album": "In The Zone",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273efc6988972cb04105f002cd4"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "good 4 u",
//             "artist": "Olivia Rodrigo",
//             "album": "SOUR",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Shake It Off",
//             "artist": "Taylor Swift",
//             "album": "1989",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2739abdf14e6058bd3903686148"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Classic",
//             "artist": "MKTO",
//             "album": "MKTO",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2739474419f15773875a495eed3"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "SexyBack (feat. Timbaland)",
//             "artist": "Justin Timberlake",
//             "album": "FutureSex/LoveSounds",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273c6ba98fd3f3b396a6c6f7091"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Maneater - Radio Version",
//             "artist": "Nelly Furtado",
//             "album": "Girl Power Tracks",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273c3ee319c9a25f3b4343e0344"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Shout Out to My Ex",
//             "artist": "Little Mix",
//             "album": "Glory Days (Expanded Edition)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2733042c53026e29faf3a21c9f9"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Run the World (Girls)",
//             "artist": "Beyoncé",
//             "album": "4",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273ff5429125128b43572dbdccd"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "24K Magic",
//             "artist": "Bruno Mars",
//             "album": "24K Magic",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273232711f7d66a1e19e89e28c5"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Starships",
//             "artist": "Nicki Minaj",
//             "album": "Pink Friday ... Roman Reloaded",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b27385235715597dcd07bb9e0f84"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Lush Life",
//             "artist": "Zara Larsson",
//             "album": "So Good",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2739e1683774b22648f4f178ed3"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Only Girl (In The World)",
//             "artist": "Rihanna",
//             "album": "Loud (Japan Version)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b27331548865f7c729290b96c794"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Baby",
//             "artist": "Justin Bieber",
//             "album": "My World 2.0",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273629dc9e2e3bc20bbd7d92e4a"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Ugly Heart",
//             "artist": "G.R.L.",
//             "album": "G.R.L.",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273cc5da1d919f3ee4b8318b38d"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "California Gurls",
//             "artist": "Katy Perry",
//             "album": "Teenage Dream: The Complete Confection",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273937af329667311f4b2831616"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Party In The U.S.A.",
//             "artist": "Miley Cyrus",
//             "album": "The Time Of Our Lives",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273d6c3ad6a2a27471e1d5e8103"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Ridin' Solo",
//             "artist": "Jason Derulo",
//             "album": "Jason Derulo",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273c7b1b93cd2dcb8d528a30a1d"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Boom Clap",
//             "artist": "Charli XCX",
//             "album": "SUCKER",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273b3f49d38597780046ad62b87"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Paper Planes",
//             "artist": "M.I.A.",
//             "album": "Kala",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273a8ea5b2ab46dc5fc899ef81e"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "American Boy",
//             "artist": "Estelle",
//             "album": "Shine",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b27398dc3e242a818007dd67b7c5"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Best Song Ever",
//             "artist": "One Direction",
//             "album": "Midnight Memories (Deluxe)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2732f76b797c382bedcafdf45e1"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "The Sweet Escape",
//             "artist": "Gwen Stefani",
//             "album": "The Sweet Escape",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2738dd53da15b55d402dfc3a20e"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Fancy",
//             "artist": "Iggy Azalea",
//             "album": "The New Classic (Deluxe Version)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273b1c6cf12c9fb4f9014b711ba"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Want U Back",
//             "artist": "Cher Lloyd",
//             "album": "Sticks & Stones",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273392d37cdeccdcdb378fed318"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Price Tag",
//             "artist": "Jessie J",
//             "album": "Who You Are (Platinum Edition)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2739900b995cd1a81c35c574ab0"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "How We Do (Party)",
//             "artist": "Rita Ora",
//             "album": "ORA",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2735e75a5b55e3ec710a76fbea7"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Dance with Me Tonight",
//             "artist": "Olly Murs",
//             "album": "In Case You Didn't Know",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273ff2057b7343d2233451ff8e7"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Since U Been Gone",
//             "artist": "Kelly Clarkson",
//             "album": "Breakaway",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b27303dadde4d9d305c1c3e0d91c"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Love Me Again",
//             "artist": "John Newman",
//             "album": "Tribute",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273c31ce98936c6c5d0deefe978"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Glamorous",
//             "artist": "Fergie",
//             "album": "The Dutchess",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2730283b8c1365d34315f5807bf"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "We Found Love",
//             "artist": "Rihanna",
//             "album": "Talk That Talk",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273bef074de9ca825bddaeb9f46"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Memories (feat. Kid Cudi)",
//             "artist": "David Guetta",
//             "album": "One Love (Deluxe)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273b2e43ed3850e072831f7b2c6"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Black Magic",
//             "artist": "Little Mix",
//             "album": "Get Weird (Expanded Edition)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273995994477ea1ae8097978bf8"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "I Love It (feat. Charli XCX)",
//             "artist": "Icona Pop",
//             "album": "THIS IS... ICONA POP",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2734e2e6035e60579c7bdc6fb33"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "What Do You Mean?",
//             "artist": "Justin Bieber",
//             "album": "Purpose (Deluxe)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273f46b9d202509a8f7384b90de"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "I Knew You Were Trouble (Taylor's Version)",
//             "artist": "Taylor Swift",
//             "album": "Red (Taylor's Version)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273318443aab3531a0558e79a4d"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Telephone",
//             "artist": "Lady Gaga",
//             "album": "The Fame Monster (Deluxe Edition)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2735c9890c0456a3719eeecd8aa"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "I Like It",
//             "artist": "Cardi B",
//             "album": "Invasion of Privacy",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273a0caffda54afd0a65995bbab"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Glad You Came",
//             "artist": "The Wanted",
//             "album": "Battleground (Deluxe Edition)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b27317a142a78128fb7c54ab9aa4"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Unwritten",
//             "artist": "Natasha Bedingfield",
//             "album": "Unwritten",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273b337e1ca6629a53c66a3b0d4"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "It Girl",
//             "artist": "Jason Derulo",
//             "album": "Future History (Deluxe Edition)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273644681440f5bf0fa272b0745"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "positions",
//             "artist": "Ariana Grande",
//             "album": "Positions",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2735ef878a782c987d38d82b605"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Super Bass",
//             "artist": "Nicki Minaj",
//             "album": "Pink Friday (Complete Edition)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273aa7d2641af0fa4c1f76fafbf"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Promiscuous",
//             "artist": "Nelly Furtado",
//             "album": "Loose",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273a6f439c8957170652f9410e2"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Superstar",
//             "artist": "Jamelia",
//             "album": "Thank You",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273ac27b4f5d1ad74f433274cd5"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Wannabe",
//             "artist": "Spice Girls",
//             "album": "Spice",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b27363facc42e4a35eb3aa182b59"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Time of Our Lives",
//             "artist": "Pitbull",
//             "album": "Globalization",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2731e340d1480e7bb29a45e3bd7"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Domino",
//             "artist": "Jessie J",
//             "album": "Who You Are (Platinum Edition)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2739900b995cd1a81c35c574ab0"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Can't Hold Us (feat. Ray Dalton)",
//             "artist": "Macklemore & Ryan Lewis",
//             "album": "The Heist",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b27398a02fef3a8b1d80a0f164ec"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Say My Name",
//             "artist": "Destiny's Child",
//             "album": "The Writing's On The Wall",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2733718df75b57340c1947747e8"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Live Your Life",
//             "artist": "T.I.",
//             "album": "Paper Trail",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273b6d4478c6f91f1cb2d326c78"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Dynamite",
//             "artist": "Taio Cruz",
//             "album": "The Rokstarr Hits Collection",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b27366c3eb32692a0ae487079cf1"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Fight For This Love",
//             "artist": "Cheryl",
//             "album": "3 Words",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2730c8a195a0b99ddb449ec4b8b"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "So What",
//             "artist": "P!nk",
//             "album": "Funhouse (Expanded Edition)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2735a45d5041e4ffcb9f756f740"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Good Time",
//             "artist": "Owl City",
//             "album": "The Midsummer Station",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273cf5459850259268f98b07f7a"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Rude Boy",
//             "artist": "Rihanna",
//             "album": "Rated R",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273ab647295c0c97446c1f1a3b5"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Boss Bitch",
//             "artist": "Doja Cat",
//             "album": "Boss Bitch",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b27310356a0e81371e6644cb1371"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "I Gotta Feeling",
//             "artist": "Black Eyed Peas",
//             "album": "THE E.N.D. (THE ENERGY NEVER DIES)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273382514f0114ba8f4a16d5db4"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "All About Tonight",
//             "artist": "Pixie Lott",
//             "album": "Young Foolish Happy (Deluxe Edition)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b27340af958ef49c378666fe8998"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Bad Romance",
//             "artist": "Lady Gaga",
//             "album": "The Fame Monster (Deluxe Edition)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2735c9890c0456a3719eeecd8aa"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Single Ladies (Put a Ring on It)",
//             "artist": "Beyoncé",
//             "album": "I AM...SASHA FIERCE",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273e13de7b8662b085b0885ffef"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "We R Who We R",
//             "artist": "Kesha",
//             "album": "Cannibal (Expanded Edition)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2733556ff5e46e50eb27be71ebe"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Uptown Funk (feat. Bruno Mars)",
//             "artist": "Mark Ronson",
//             "album": "Uptown Special",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273e419ccba0baa8bd3f3d7abf2"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "History",
//             "artist": "One Direction",
//             "album": "Made In The A.M. (Deluxe Edition)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273241e4fe75732c9c4b49b94c3"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Blank Space",
//             "artist": "Taylor Swift",
//             "album": "1989",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2739abdf14e6058bd3903686148"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Ghost",
//             "artist": "Ella Henderson",
//             "album": "Chapter One",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b27397e683c96c753930a39159fc"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "All About That Bass",
//             "artist": "Meghan Trainor",
//             "album": "Title (Deluxe)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2733b11178cccd78ec77fc12dbc"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Say It Right",
//             "artist": "Nelly Furtado",
//             "album": "Loose",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273a6f439c8957170652f9410e2"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "I Really Like You",
//             "artist": "Carly Rae Jepsen",
//             "album": "Emotion (Deluxe Expanded Edition)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2735708b3925c13b1b8d6fac466"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Don't Stop The Music",
//             "artist": "Rihanna",
//             "album": "Good Girl Gone Bad: Reloaded",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273f9f27162ab1ed45b8d7a7e98"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Watermelon Sugar",
//             "artist": "Harry Styles",
//             "album": "Fine Line",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b27377fdcfda6535601aff081b6a"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "A Thousand Miles",
//             "artist": "Vanessa Carlton",
//             "album": "Best Of",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273a88fa19b7543b39a3ea542d9"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Birthday",
//             "artist": "Katy Perry",
//             "album": "PRISM",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2731e9a057052d59004caf47e22"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Worth It (feat. Kid Ink)",
//             "artist": "Fifth Harmony",
//             "album": "Reflection (Deluxe)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2735bdd9e580fdda5e676a25e6a"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Jenny from the Block (feat. Jadakiss & Styles P.) - Track Masters Remix",
//             "artist": "Jennifer Lopez",
//             "album": "Jenny From The Block - The Remixes",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273d5cf73c1679244d959651dff"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Halo",
//             "artist": "Beyoncé",
//             "album": "I AM...SASHA FIERCE",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273801c4d205accdba0a468a10b"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Steal My Girl",
//             "artist": "One Direction",
//             "album": "FOUR (Deluxe)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273d304ba2d71de306812eebaf4"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Ain't Your Mama",
//             "artist": "Jennifer Lopez",
//             "album": "Ain't Your Mama",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273b1ab92b8e26ab1cb783ffe15"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Bitch Better Have My Money",
//             "artist": "Rihanna",
//             "album": "Bitch Better Have My Money",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273c137319751a89295f921cce8"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Don't Call Me Up",
//             "artist": "Mabel",
//             "album": "Ivy To Roses (Mixtape)",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b273fb4278cf3d557dc89ca80ad5"
//         },
//         {
//             "addedAt": "2023-04-11T18:10:48Z",
//             "title": "Born This Way",
//             "artist": "Lady Gaga",
//             "album": "Born This Way",
//             "imgUrl": "https://i.scdn.co/image/ab67616d0000b2734ba15b951a5cff36133ca5bd"
//         }
//     ]
// };
// ;(() => {
//  utilService.saveToStorage(STORAGE_KEY, playlist)
// })()
