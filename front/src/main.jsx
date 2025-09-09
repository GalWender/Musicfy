import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
// import './index.css'
import { store } from './store'
import { Provider } from 'react-redux';

ReactDOM.createRoot(document.getElementById('root')).render(

  <Provider store={store}>
    <App />
  </Provider>

)

// Register service worker for PWA (works on production/https or localhost)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
