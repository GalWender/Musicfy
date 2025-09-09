import { useEffect, useState } from 'react'
import { HomeList } from '../cmps/HomeList'
import { useObserver } from '../customHooks/useObserver'
import { Loader } from '../cmps/Loader'
import { httpService } from '../services/http.service'

export const Home = () => {

    const [featured, setFeatured] = useState(null)
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
        // Single backend call which maps Spotify featured playlists to card shape
        ;(async () => {
            try {
                const items = await httpService.get('home/featured', { limit: 18 })
                setFeatured([{ id: 'featured', title: 'Featured', playlists: items || [] }])
            } catch (err) {
                console.log('Failed loading featured playlists', err)
                setFeatured([])
            }
        })()
    }, [])

    // No categories flow; homepage is a single featured row


    if(!featured) return <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}><Loader label="Loading playlists..." /></div>
    return (
        <div className='home-container'>
            <div ref={containerRef}></div>
            {featured.map((row, idx) => (
                <HomeList id={row.id} title={row.title} playlists={row.playlists} idx={idx} key={row.id} width={dimensions.width}/>
            ))}
        </div>
    )
}
