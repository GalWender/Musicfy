import { useEffect, useState } from 'react'
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"


export const UserModule = ({logout}) => {

    const currUser = useSelector(state => state.userModule.loggedInUser)
    const navigate = useNavigate()

    return (
        <section className='user-modal'>
            <div onClick={logout} className='logout'>Log out</div>
        </section>
    ) 
}