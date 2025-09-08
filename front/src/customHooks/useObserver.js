import { useEffect, useRef, useState } from "react"
import EventBus from 'react-native-event-bus'

export const useObserver = () => {
    const containerRef = useRef()
    const isVisible = useRef(false)

    const options ={
        root: null,
        rootMargin: "0px",
        threshold: 1.0
    }
    const cb = (entries) => {
        EventBus.getInstance().fireEvent("toggleOpacity", isVisible.current ? isVisible.current : entries[0].isIntersecting)
        isVisible.current = false
    }

    useEffect(() => {
        const observer = new IntersectionObserver(cb,options)
        setTimeout(()=>{
            if(containerRef.current) observer.observe(containerRef.current)
        },1000)

        return () => {
            if(containerRef.current) observer.unobserve(containerRef.current)
        }
    }, [containerRef, isVisible.current])

    return [containerRef, isVisible]
}