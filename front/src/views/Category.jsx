import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useDispatch, useSelector } from 'react-redux'
import { HomePreview } from '../cmps/HomePreivew'
import { useObserver } from '../customHooks/useObserver'
import { useHeaderObserver } from '../customHooks/useHeaderObserver'
import { getCategoryPlaylists } from '../store/actions/categories.actions'
import { playlistService } from '../services/playlist.service'
import { Loader } from '../cmps/Loader'

export const Category = ({searchItems, origin}) => {

    const categoryPlaylist = origin === 'search' ? searchItems : useSelector(state => state.categoryModule.catagoryPlaylists)
    const categories = playlistService.getCategories()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const params = useParams()
    const [cmpStyle, setCmpStyle] = useState(null)
    const [containerRef] = useObserver()
    const [headerRef, setHeaderName] = useHeaderObserver()
    const [searchParams] = useSearchParams()
    const [category, setCategory] = useState({})

    // Deterministic color picker (fallback when category not in static list)
    function pickColorForId(id) {
        const palette = ['#b49bc8','#f037a5','#9cf0e1','#d7f27d','#8d67ab','#503750','#7358ff','#af2896','#148a08','#eb1e32','#0d73ec','#509bf5','#1e3264','#ba5d07','#777777','#2d46b9','#283ea3','#dc148c','#f59b23','#477d95','#233268','#ff4632','#e1118b']
        let sum = 0
        for (let i = 0; i < (id || '').length; i++) sum = (sum + id.charCodeAt(i)) % 2147483647
        return palette[sum % palette.length]
    }

    useEffect(() => {
        if(origin === 'search') return
        const currCategory = categories.find(cate=> cate.id === params.id)
        const nameFromQuery = (typeof window !== 'undefined') ? new URLSearchParams(window.location.search).get('name') : null
        if (currCategory) {
            setCategory(currCategory)
            setHeaderName.current = currCategory.name
            setCmpStyle({'backgroundColor':currCategory.backgroundColor})
            getCategory(currCategory.name)
        } else {
            const fallbackName = nameFromQuery || params.id
            setCategory({ id: params.id, name: fallbackName })
            setHeaderName.current = fallbackName
            setCmpStyle({ backgroundColor: pickColorForId(params.id) })
            getCategory(fallbackName)
        }
    }, [params.id])

    async function getCategory(categoryName) {
        dispatch(getCategoryPlaylists(params.id, categoryName))
    }

    if (!categoryPlaylist) return (<Loader label="Loading playlists..." />)
    return (
        <section className='category'>
            <div ref={containerRef}></div>
            {origin !== 'search' && <section className='category-header' style={cmpStyle}>
                <h1>{category.name}</h1>
                <div ref={headerRef}></div>
            </section>}

            <section className='category-list'>
                {categoryPlaylist.map(item => {
                    return <HomePreview playlistData={item} key={item.spotifyId} />
                })}
            </section>

        </section>
    )
}