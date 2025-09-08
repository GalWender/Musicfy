import { useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom"
import svgIcon from '../cmps/SvgIcon' 


export const MobileNavBar = () => {

    const navigate = useNavigate()

    useEffect(() => {
    },[]) 

    return (
        <div className='mobile-navbar'>
            <div className='btn-nav' onClick={() => navigate('/')}>{svgIcon({ iconName: 'home'})}</div>
            <div className='btn-nav' onClick={() => navigate('/search')}>{svgIcon({ iconName: 'search'})}</div>
            <div className='btn-nav' onClick={() => navigate('/library')}>{svgIcon({ iconName: 'lib'})}</div>
        </div>
    )
}