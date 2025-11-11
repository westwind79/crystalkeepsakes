// app/about/AboutPageClient.tsx
'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
// import { Container, Row, Col } from 'react-bootstrap'

// Utility function for image paths
const getImagePath = (path: string): string => {
  return path.startsWith('/') ? path : `/${path}`
}

// Environment-based logging utility
const logDev = (message: string, data?: any) => {
  const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
  
  if (envMode === 'development' || envMode === 'testing') {
    console.log(`[${envMode.toUpperCase()}] ${message}`, data || '')
  }
}

export default function AboutPageClient() {
  // Development logging on component mount
  useEffect(() => {
    logDev('Order Confirmation Page loaded', {
      component: 'OrderConfirmationClient',
      timestamp: new Date().toISOString(),
      environment: process.env.NEXT_PUBLIC_ENV_MODE,
      url: typeof window !== 'undefined' ? window.location.href : 'SSR'
    })
  }, [])

  return (
    <div className="order-confirmation-page">
      {/* Hero Section */}      
      <section className="hero px-8 py-16 text-center">
        <div className="hero-content max-w-xl mx-auto">
          <h1 className="primary-header mb-4">Your Order Has Been Submitted</h1>
         {/* <p className="lead">         
            Welcome to CrystalKeepsakes, where cherished moments are transformed into stunning 3D laser-engraved crystal creations.
          </p>*/}
        </div>
      </section>

      
      {/* Main About Content */}
      <section className="order-details bg-dark py-5">
          <div className="mx-auto max-w-3xl">
            <div className="mx-auto">
              
 				{/*<!-- order confirmation content -->*/}
 				

              <div className="spacer-gradient my-5"></div>

              

          

            </div>
          </div>
      </section> 
    </div>
  )
}