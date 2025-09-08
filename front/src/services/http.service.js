import Axios from 'axios'
// import { router } from '@/router'

const BASE_URL = import.meta.env.PROD
    ? '/api/'
    : (import.meta.env.VITE_API_BASE_URL || '//localhost:3030/api/')

const axios = Axios.create({
    withCredentials: true
})

export const httpService = {
    get(endpoint, data) {
        return ajax(endpoint, 'GET', data)
    },
    // Same as get but does not log on error (useful for expected 404 cache misses)
    getSilent(endpoint, data) {
        return ajax(endpoint, 'GET', data, { silent: true })
    },
    post(endpoint, data) {
        return ajax(endpoint, 'POST', data)
    },
    put(endpoint, data) {
        return ajax(endpoint, 'PUT', data)
    },
    delete(endpoint, data) {
        return ajax(endpoint, 'DELETE', data)
    }
}

async function ajax(endpoint, method = 'GET', data = null, opts = {}) {
    try {
        const res = await axios({
            url: `${BASE_URL}${endpoint}`,
            method,
            data,
            params: (method === 'GET') ? data : null
        })
        return res.data
    } catch (err) {
        if (!opts.silent) {
            console.log(`Had Issues ${method}ing to the backend, endpoint: ${endpoint}, with data:`, data)
            console.dir(err)
        }
        if (err.response && err.response.status === 401) {
            sessionStorage.clear()
            // window.location.assign('/')
            // Depends on routing startegy - hash or history
            // window.location.assign('/#/login')
            // window.location.assign('/login')
            // router.push('/login')
        }
        throw err
    }
}