import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { HomeList } from '../cmps/HomeList'
import { loadCategories, setFilterBy } from '../store/actions/categories.actions'
import { useObserver } from '../customHooks/useObserver'
import { categoryService } from '../services/category.service'
import { playlistService } from '../services/playlist.service'
import { Loader } from '../cmps/Loader'

export const Home = () => {

    const dispatch = useDispatch()
    const categories = useSelector(state => state.categoryModule.categories)
    const [homeRows, setHomeRows] = useState(null)
    const [containerRef] = useObserver()

    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
    });

    const handleResize = () => {
        setDimensions({
            width: window.innerWidth,
        });
    }

    useEffect(() => {
      window.addEventListener("resize", handleResize)

      return () => {window.removeEventListener("resize", handleResize)}

    }, [])

    useEffect(() => {
        getCategories({txt:"HomePage"})
    },[])

    // When live categories arrive, fetch a few playlists per category for Home rows
    // Do NOT refetch on window resize to avoid repeated API calls
    useEffect(() => {
        if (!categories || !Array.isArray(categories)) return
        console.log('[Home] live categories', { count: categories.length, sample: categories[0] })
        const pick = categories.slice(0, 6) // show first 6 categories as rows
        ;(async () => {
            try {
                // Determine target per row once, based on current width
                const w = (typeof window !== 'undefined') ? window.innerWidth : 1200
                const MIN_PER_ROW = w < 975 ? 6 : (w < 1500 ? 8 : 10)
                const rows = await Promise.all(pick.map(async (cat) => {
                    let items = await categoryService.getById(cat.id, cat.name)
                    if (!Array.isArray(items)) items = []
                    // If too few items, pad with search results (deduped)
                    if (items.length < MIN_PER_ROW) {
                        try {
                            const extras = await playlistService.getSearchItems(cat.name, 'playlist')
                            const have = new Set(items.map(p => p.spotifyId || p.id))
                            const toAdd = (extras || []).filter(e => {
                                const key = e.spotifyId || e.id
                                return key && !have.has(key)
                            }).slice(0, MIN_PER_ROW - items.length)
                            items = items.concat(toAdd)
                        } catch (e) {
                            console.log('[Home] padding search failed', e)
                        }
                    }
                    console.log('[Home] row', { title: cat.name, id: cat.id, count: items.length, sample: items[0] })
                    return { id: cat.id, title: cat.name, playlists: items }
                }))
                setHomeRows(rows)
            } catch (err) {
                console.log('Failed loading home rows', err)
                setHomeRows([])
            }
        })()
    }, [categories])
    
    const getCategories = (filterBy) => {
        dispatch(setFilterBy(filterBy))
        dispatch(loadCategories())
    }


    if(!categories) return <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}><Loader label="Loading categories..." /></div>
    if(!homeRows) return <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}><Loader label="Loading playlists..." /></div>
    return (
        <div className='home-container'>
            <div ref={containerRef}></div>
            {homeRows.map((row, idx) => {
                return <HomeList id={row.id} title={row.title} playlists={row.playlists} idx={idx} key={row.id} width={dimensions.width}/>
            })}
        </div>
    )
}
