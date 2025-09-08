import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login } from '../store/actions/user.actions'


import SvgIcon  from '../cmps/SvgIcon'

export const Login = () => {

    const dispatch = useDispatch()
    const navigate = useNavigate()
    const currUser = useSelector(state => state.userModule.loggedInUser)


    useEffect(() => {
        if(currUser.fullname) navigate('/')
    }, [currUser.fullname])

    function loginUser(ev) {
        ev.preventDefault()
        const user = {username:ev.target[0].value, password: ev.target[1].value}
        dispatch(login(user))
        ev.target[0].value = ''
        ev.target[1].value = ''
    }

    
    return (
        <section className='login'>
            <section className='header'>
            <div className='logo' onClick={() => navigate('/')}>{SvgIcon({ iconName: 'logo' })} <h2>Musicfy</h2> </div>
            </section>

            <section className='login-container'>
                <section className='login-actions'>
                    <h2>Log in to Musicfy</h2>
                    <button className='login-google'>
                        <div className='google-icon' >{SvgIcon({iconName:'google-g'})}</div>
                        <span>
                            Continue with Google
                        </span>
                    </button>
                    <hr />
                    <form action="" className='login-form' onSubmit={loginUser}>
                        <label htmlFor="username">
                            Email or username
                            <input id='username' type="text" placeholder='Email or username' />
                        </label>
                        <label htmlFor="pass">
                            Passward
                            <input id='pass' type="password" placeholder='Passward' />
                        </label>
                        <button className='login-btn'>Log In</button>
                    </form>
                    <hr />
                </section>
            </section>
        </section>
    )
}
