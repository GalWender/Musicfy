import React from 'react'
import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'

import { Header } from '../cmps/Header'
import { SideNav } from '../cmps/SideNav'
import { MediaPlayer } from '../cmps/MediaPlayer'
import { MobileNavBar } from './MobileNavBar'
import EventBus from 'react-native-event-bus'

export const AppIndex = () => {
  const [isScrollable, setIsScrollable] = useState(true)

  useEffect(() => {
    EventBus.getInstance().addListener("freeze", () => {
      setIsScrollable(false)
    })

    EventBus.getInstance().addListener("unfreeze", () => {
      setIsScrollable(true)
    })
    return EventBus.getInstance().removeListener("freeze") && EventBus.getInstance().removeListener("unfreeze")
  }, [])

  return (
    <section className='main-layout'>
      <SideNav />
      <section className={isScrollable ? "content-container" : "content-container freeze"}>
        <Header />
        <Outlet />
      </section>
      <MediaPlayer />
      <MobileNavBar />
    </section>
  )
}