// page.tsx - Homepage
// Version: 2.0.0 | Date: 2025-11-02
// Converted from Bootstrap to Tailwind CSS
// CHANGELOG: Removed all Bootstrap classes, replaced with Tailwind utilities

'use client'

import React, { useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCards, Autoplay } from 'swiper/modules'
import FeaturedProducts from '@/components/FeaturedProducts'
import Testimonials from '@/components/Testimonials'

// Import Swiper styles - only on this page
import 'swiper/css'
import 'swiper/css/effect-cards'
import './css/swiper.css'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const heroSwiperSlides = [
  {
    id: 1,
    priority: true,
    name: "Three",
    image: "/img/products/cockpit3d/248/cockpit3d_248_3D_Crystal_Candle.png",
  },
  {
    id: 2,
    name: "One",    
    priority: false,
    image: "/img/products/brooks-memorial.jpg",
  },
  {
    id: 3,
    name: "Two",    
    priority: false,
    image: "/img/products/lalena-gift-square.jpg", 
  },
  {
    id: 4,
    name: "Three",
    priority: false,
    image: "/img/products/cockpit3d/114/cockpit3d_114_Rectangle_Vertical_Crystals.png",
  }
]

const getImagePath = (path: string): string => {
  return path.startsWith('/') ? path : `/${path}`
}

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
    const shouldLog = envMode === 'development' || envMode === 'testing'
    
    if (shouldLog) {
      console.log('🏠 Homepage loaded (Tailwind + Next.js):', {
        component: 'HomePage',        
        timestamp: new Date().toISOString(),
        environment: envMode,
        features: ['Tailwind', 'GSAP', 'Swiper', 'TypeScript']
      })
    }
  }, [])

  return (
    <div className="home">      
      {/* Hero Section */}
      <section ref={heroRef} className="hero pt-16 pb-0">
        <div className="container mx-auto px-4 xl:max-w-7xl">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-6 items-center"> 

            <div className="hero-content">
              <h1 className="mb-4 hero-headline">
                MEMORIES<br/>PRESERVED&nbsp;IN<br/>CRYSTAL
              </h1>
              <h2 className="mb-6 leading-relaxed text-gray-50">
                Transform your cherished photos into stunning 3D crystal art pieces. 
                Our precision laser technology creates beautiful, lasting memories.
              </h2>

              <div className="hero-cta items-center">
                <Link 
                  href="/products" 
                  className="btn uppercase rounded-md px-4 py-3 btn-primary"
                >
                  Browse Designs
                </Link>
                <Link 
                  href="/about" 
                  className="btn uppercase rounded-md px-4 py-3 btn-secondary"
                >
                  Learn More
                </Link>
              </div>

            </div>

            <div className="hero-image">
              <Swiper
                effect={'cards'}
                grabCursor={true}
                modules={[EffectCards, Autoplay]}
                cardsEffect={{
                  slideShadows: false,
                  rotate: true,
                  perSlideRotate: 3,
                  perSlideOffset: 4,
                }}
                initialSlide={0}
                speed={900}
                preventClicks={true}
                preventClicksPropagation={true}
                onTouchEnd={(swiper) => {
                  swiper.allowTouchMove = true
                }}
                autoplay={{
                  delay: 3500,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                className="w-full max-w-md mx-auto" 
              >
                {heroSwiperSlides.map(slide => (
                  <SwiperSlide key={slide.id} className="!h-[400px] md:!h-[500px] rounded-xl">
                     <Image 
                        src={slide.image}
                        alt={slide.name}  
                        fill
                        className="object-contain" 
                      />          
                </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <FeaturedProducts limit={6} title="Featured Designs" />

      {/* Process Section */}
      <section className="process-section bg-component-light-bg py-12 md:py-16">
        <div className="w-full max-w-7xl mx-auto px-4">
          <h2 className="text-center mb-12 text-3xl md:text-4xl font-light text-component-light-text">
            How We Create Your Crystal
          </h2>
          
          {/* Process Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="process-step text-center p-6">
              <div className="text-6xl mb-4">📸</div>
              <h5 className="text-xl font-semibold mb-2 text-component-light-text">Upload Photo</h5>
              <p className="text-gray-600">Choose your favorite high-quality photo</p>
            </div>
            
            {/* Step 2 */}
            <div className="process-step text-center p-6">
              <div className="text-6xl mb-4">🎨</div>
              <h5 className="text-xl font-semibold mb-2 text-component-light-text">Customize Design</h5>
              <p className="text-gray-600">Select your crystal shape and options</p>
            </div>
            
            {/* Step 3 */}
            <div className="process-step text-center p-6">
              <div className="text-6xl mb-4">⚡</div>
              <h5 className="text-xl font-semibold mb-2 text-component-light-text">Laser Engraving</h5>
              <p className="text-gray-600">We use precision lasers to create your 3D crystal</p>
            </div>
            
            {/* Step 4 */}
            <div className="process-step text-center p-6">
              <div className="text-6xl mb-4">🚚</div>
              <h5 className="text-xl font-semibold mb-2 text-component-light-text">Safe Delivery</h5>
              <p className="text-gray-600">Receive your crystal art safely packaged</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <section className="bg-green py-12 md:py-16">
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Text Content - 8 columns on desktop */}
            <div className="md:col-span-8">
              <h2 className="mb-6 text-3xl md:text-4xl font-light">Crafted with Precision</h2>
              <p className="text-lg md:text-xl mb-6 leading-relaxed">
                Perfect for anniversaries, graduations, birthdays, weddings, and memorials, 
                each piece is crafted to showcase memories in stunning, light-catching detail.
              </p>
              
              <p className="mb-6 leading-relaxed">
                CrystalKeepsakes isn&apos;t just a company delivering exceptional products and services. 
                We&apos;re a team of dedicated individuals with one shared mission: to make your experience unforgettable. 
                From graphic designers and production technicians to customer support specialists, 
                everyone at CrystalKeepsakes is committed to helping you create the perfect 3D crystal, from start to finish.
              </p>
              
              <p className="leading-relaxed">
                Think of our website as an extension of our team, here to guide you through the process 
                even when we&apos;re not available in person. Have questions? Check out our{' '}
                <Link href="/faq" className="text-brand-300 hover:text-brand-200 underline transition-colors">
                  FAQ page
                </Link>
                {' '}or reach out to us directly. We&apos;re here to help!
              </p>
            </div>
            
            {/* Image - 4 columns on desktop */}
            <div className="md:col-span-4">
              <div className="text-center">
                <div className="relative w-full max-w-xs h-80 mx-auto">
                  <Image 
                    src={getImagePath('img/noahs-keepsake-1.png')}
                    alt="CrystalKeepsakes Example"
                    fill
                    className="rounded-2xl shadow-lg object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="bg-green-gradient py-12 md:py-16 text-center">
        <div className="w-full max-w-4xl mx-auto px-4">
          <h2 className="mb-6 text-3xl md:text-4xl font-light">Ready to Create Your Crystal?</h2>
          <p className="text-lg md:text-xl mb-8 leading-relaxed">
            Let us help you preserve your most precious memories in stunning crystal form.
          </p>
          <Link 
            href="/contact" 
            className="bg-white text-brand-600 px-8 py-3 rounded text-lg font-bold hover:bg-gray-100 transition-colors inline-block shadow-lg"
          >
            Get Started Today
          </Link>
        </div>
      </section>
    </div>
  )
}