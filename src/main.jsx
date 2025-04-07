import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { HelmetProvider } from 'react-helmet-async'

// Register GSAP plugins globally
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register plugins
gsap.registerPlugin(ScrollTrigger)

import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/main.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
)