import { useEffect, useRef } from "react"
import EventBus from 'react-native-event-bus'

export const useHeaderObserver = () => {
    const headerRef = useRef()
    const headerName = useRef()
    const isDone = useRef(false)

    const options = {
        root: null,
        rootMargin: "0px",
        threshold: 1.0
    }
    const cb = (entries) => {
        if (!entries[0].isIntersecting && !isDone.current) EventBus.getInstance().fireEvent("headerName", headerName.current)
        else EventBus.getInstance().fireEvent("headerName", '')
    }

    useEffect(() => {
        isDone.current = false
        const observer = new IntersectionObserver(cb, options)
        setTimeout(() => {
            if (headerRef.current) observer.observe(headerRef.current)
        }, 1000)

        return () => {
            EventBus.getInstance().fireEvent("headerName", '')
            if (headerRef.current) observer.unobserve(headerRef.current)
            isDone.current = true
        }
    }, [headerRef.current])

    return [headerRef, headerName]
}