import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { signup } from '../store/actions/user.actions'


import SvgIcon  from '../cmps/SvgIcon'

export const Signup = () => {

    const dispatch = useDispatch()
    const navigate = useNavigate()
    const currUser = useSelector(state => state.userModule.loggedInUser)


    useEffect(() => {
        console.log(currUser)
        if(currUser.fullname) navigate('/')
    }, [currUser.fullname])

    function Signup(ev) {
        ev.preventDefault()
        const user = {
            fullname: ev.target[0].value, 
            username:ev.target[2].value, 
            password: ev.target[1].value,
            playlist:[]
        }
        dispatch(signup(user))
        ev.target[0].value = ''
        ev.target[1].value = ''
        ev.target[2].value = ''
    }

    
    return (
        <section className='signup'>
            <section className='header'>
            <div className='logo' onClick={() => navigate('/')}>{SvgIcon({ iconName: 'logo' })} <h2>Musicfy</h2> </div>
            <h2 className='header-txt'>Sign up for free to listen.</h2>
            </section>

            <button className='login-google'>
                <div className='google-icon' >{SvgIcon({iconName:'google-g'})}</div>
                <span>
                    Sign up with Google
                </span>
            </button>

            <span className='or'>Or</span>

            <section className='form-container'>
                <h1 className='form-txt'>Create an account</h1>
                <form action="" className='signup-form' onSubmit={Signup}>

                    <label htmlFor="fullname">
                        <span>What's your full name?</span>
                        <input id='fullname' type="text" placeholder='Type in youre full name'/>
                    </label>

                    <label htmlFor="username">
                        <span>What will be youre username?</span>
                        <input id='username' type="text" placeholder='Type in youre username'/>
                    </label>
                    
                    <label htmlFor="password">
                        <span>Create password</span>
                        <input id='password' type="password" placeholder='Type in youre password'/>
                    </label>

                    <button className='signup-btn'>Sign Up</button>
                </form>
            </section>

            <section className='login-navigate'>
                <span className='txt'>Have an account? </span>
                <span className='navigate' onClick={() => navigate(`/login`)}>
                    Log in.
                </span>
            </section>
        </section>
    )
}
