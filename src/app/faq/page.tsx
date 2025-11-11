'use client'
import { Metadata } from 'next'
import React, { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
// import { Container, Row, Col } from 'react-bootstrap'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCards, Autoplay } from 'swiper/modules'



// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

// Utility function for image paths (temporary)
const getImagePath = (path: string): string => {
  return path.startsWith('/') ? path : `/${path}`
}

export default function FAQPage() {
  const heroRef = useRef<HTMLElement>(null)

  // Development logging
  useEffect(() => {
    const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
    const shouldLog = envMode === 'development' || envMode === 'testing'
    
    if (shouldLog) {
      console.log('🏠 FAQ loaded (Bootstrap + Next.js):', {
        component: 'FAQ Page',
        timestamp: new Date().toISOString(),
        environment: envMode,
        url: typeof window !== 'undefined' ? window.location.href : 'SSR',
        features: ['Bootstrap', 'GSAP', 'Swiper', 'TypeScript']
      })
    }
  }, [])
 

  return (
    <div className="faq">
      {/* Hero */}
      <section className="hero px-8 py-16 text-center">
        <div className="hero-content max-w-xl mx-auto">
          <h1 className="primary-header mb-4">Frequently Asked Questions</h1>
          <p className="lead">         
              Welcome to CrystalKeepsakes, where cherished moments are transformed into stunning 3D laser-engraved crystal creations.
          </p>
        </div>
      </section>

      {/* Breadcrumbs - uses your custom .breadcrumb CSS */}
      <nav className="breadcrumbs py-4">
        <div className="container mx-auto px-4">
          <Link href="/" className="hover:text-brand-400 transition-colors">Home</Link>  
          <span className="mx-2 text-gray-600">/</span>
          <span className="text-text-tertiary">Frequently Asked Questions</span>
        </div>
      </nav>

      <section className="py-5 bg-dark">        
        <div className="max-w-3xl mx-auto">
          <h2 className="mb-4">What&apos;s a 3D Photo Crystal?</h2>
          <p className="mb-4">We&apos;re thrilled you asked! A 3D Photo Crystal is the most innovative way to preserve and showcase a physical representation of your favorite photo. At CrystalKeepsakes, we blend cutting-edge digital technology with expert craftsmanship to create intricate 2D or 3D laser engravings within durable crystal keepsakes. Our creations protect your cherished images and transform them into breathtaking 3D art. Simply put, we make memories last forever.</p>
          <p className="mb-4">We didn&apos;t invent crystal art; we perfected it.</p>

          <div className="spacer-gradient mb-5 mt-5"></div>  
          <h2 className="mb-4">Why Choose CrystalKeepsakes?</h2>
          <p className="mb-4">What sets us apart is our meticulous creative process. We don&apos;t just place a photo in an engraving machine and call it a day. Each custom crystal is a product of collaboration between top designers, advanced technology, and innovative thinking. Are we perfectionists? Absolutely. Passionate? Without a doubt. When you purchase a personalized photo crystal from CrystalKeepsakes, you&apos;re investing in a custom masterpiece crafted by a team that truly cares.</p>

          <div className="spacer-gradient mb-5 mt-5"></div>  
          <h2 className="mb-4">Looking for Unique Gift Ideas?</h2>
          <p className="mb-4">You&apos;ve come to the right place. At CrystalKeepsakes, we specialize in helping you create unforgettable gifts for every occasion, from birthdays and graduations to anniversaries. Our user-friendly online personalization process makes it easy for you to design a meaningful, custom keepsake while leaving you with more time to celebrate life&apos;s special moments with loved ones.</p>
          <p className="mb-4">Need inspiration? Visit our blog for creative gift ideas and helpful tips to make every celebration extraordinary.</p>

          {/*<h2>We Are People.</h2>
          <p>CrystalKeepsakes isn&apos;t just a company delivering exceptional products and services. We&apos;re a team of dedicated individuals with one shared mission: to make your experience unforgettable. From graphic designers and production technicians to customer support specialists, everyone at CrystalKeepsakes is committed to helping you create the perfect 3D crystal, from start to finish.</p>
          <p>Think of our website as an extension of our team, here to guide you through the process even when we&apos;re not available in person. Have questions? Check out our FAQ page or reach out to us directly. We&apos;re here to help!</p>*/}
        </div> 
      </section>
    </div>
  )
}