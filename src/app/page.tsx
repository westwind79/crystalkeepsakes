// page.tsx - Homepage
// Version: 3.0.0 - Elegant & Modern Light Theme
// ✅ Fixed Swiper image sizing
// ✅ GSAP animations (page load + ScrollTrigger)
// ✅ Light elegant design
// ✅ Consistent spacing and typography

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

// Import Swiper styles
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
    name: "3D Crystal Candle",
    image: "/img/products/cockpit3d/248/cockpit3d_248_3D_Crystal_Candle.png",
  },
  {
    id: 2,
    name: "Memorial Crystal",    
    priority: false,
    image: "/img/products/brooks-memorial.jpg",
  },
  {
    id: 3,
    name: "Square Gift Crystal",    
    priority: false,
    image: "/img/products/lalena-gift-square.jpg", 
  },
  {
    id: 4,
    name: "Rectangle Vertical",
    priority: false,
    image: "/img/products/cockpit3d/114/cockpit3d_114_Rectangle_Vertical_Crystals.png",
  }
]

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null)
  const featuredRef = useRef<HTMLElement>(null)
  const processRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
    const shouldLog = envMode === 'development' || envMode === 'testing'
    
    if (shouldLog) {
      console.log('🏠 Homepage loaded - Elegant Light Theme v3.0', {
        component: 'HomePage',        
        timestamp: new Date().toISOString(),
        features: ['Light Theme', 'GSAP', 'Swiper Fixed', 'ScrollTrigger']
      })
    }

    // GSAP Animations
    const ctx = gsap.context(() => {
      // Page load: Fade in hero content
      gsap.from('.hero-content', {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.2
      })

      // Hero headline: Stagger words
      gsap.from('.hero-headline', {
        opacity: 0,
        y: 30,
        duration: 1,
        ease: 'power3.out'
      })

      // Hero CTA buttons: Stagger
      gsap.from('.hero-cta a', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
        delay: 0.6
      })

      // Swiper: Fade in
      gsap.from('.hero-swiper', {
        opacity: 0,
        scale: 0.95,
        duration: 0.8,
        ease: 'power2.out',
        delay: 0.4
      })

      // ScrollTrigger: Featured Products section
      if (featuredRef.current) {
        gsap.from(featuredRef.current, {
          scrollTrigger: {
            trigger: featuredRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none'
          },
          opacity: 0,
          y: 50,
          duration: 0.8,
          ease: 'power2.out'
        })
      }

      // ScrollTrigger: Process section
      if (processRef.current) {
        gsap.from('.process-step', {
          scrollTrigger: {
            trigger: processRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none'
          },
          opacity: 0,
          y: 30,
          duration: 0.6,
          stagger: 0.15,
          ease: 'power2.out'
        })
      }
    })

    return () => ctx.revert()
  }, [])

  return (
    <div className="home bg-white">
      
      {/* Hero Section - Light & Elegant */}
      <section 
        ref={heroRef} 
        className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-gray-100 py-16 sm:py-20 lg:py-28"
      >
        <div className="container mx-auto px-4 xl:max-w-7xl">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left: Hero Content */}
            <div className="hero-content text-center lg:text-left">
              <h1 className="hero-headline text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 mb-6 leading-tight tracking-tight">
                MEMORIES<br/>
                PRESERVED IN<br/>
                <span className="text-brand-500 font-normal">CRYSTAL</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Transform your cherished photos into stunning 3D crystal art pieces. 
                Our precision laser technology creates beautiful, lasting memories.
              </p>

              {/* CTA Buttons */}
              <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  href="/products" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-base"
                  data-testid="browse-designs-btn"
                >
                  Browse Designs
                </Link>
                <Link 
                  href="/about" 
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-brand-500 text-brand-500 hover:bg-gray-50 font-medium rounded-lg transition-all duration-200 text-base"
                  data-testid="learn-more-btn"
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Right: Swiper - Fixed Image Sizing */}
            <div className="hero-swiper">
              <Swiper
                effect={'cards'}
                grabCursor={true}
                modules={[EffectCards, Autoplay]}
                cardsEffect={{
                  slideShadows: false,
                  rotate: true,
                  perSlideRotate: 2,
                  perSlideOffset: 8,
                }}
                initialSlide={0}
                speed={700}
                preventClicks={true}
                preventClicksPropagation={true}
                onTouchEnd={(swiper) => {
                  swiper.allowTouchMove = true
                }}
                autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                className="mySwiper" 
              >
                {heroSwiperSlides.map(slide => (
                  <SwiperSlide key={slide.id}>
                    <Image 
                      src={slide.image}
                      alt={slide.name}  
                      fill
                      sizes="450px"
                      className="object-contain"
                      priority={slide.priority}
                    />          
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section ref={featuredRef}>
        <FeaturedProducts limit={6} title="Featured Designs" />
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* Process Section - How It Works */}
      <section ref={processRef} className="bg-gray-50 py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 xl:max-w-7xl">
          <h2 className="text-center text-3xl sm:text-4xl font-light text-gray-900 mb-12">
            How We Create Your Crystal
          </h2>
          
          {/* Process Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Step 1 */}
            <div className="process-step text-center bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Upload Photo</h3>
              <p className="text-gray-600 leading-relaxed">Choose your favorite high-quality photo</p>
            </div>
            
            {/* Step 2 */}
            <div className="process-step text-center bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Customize Design</h3>
              <p className="text-gray-600 leading-relaxed">Select your crystal shape and options</p>
            </div>
            
            {/* Step 3 */}
            <div className="process-step text-center bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-6xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Laser Engraving</h3>
              <p className="text-gray-600 leading-relaxed">Precision green lasers create your 3D crystal</p>
            </div>
            
            {/* Step 4 */}
            <div className="process-step text-center bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-6xl mb-4">🚚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Safe Delivery</h3>
              <p className="text-gray-600 leading-relaxed">Receive your crystal art safely packaged</p>
            </div>
            
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 xl:max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Text Content - 8 columns */}
            <div className="lg:col-span-7">
              <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-6">
                Crafted with Precision
              </h2>
              
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Perfect for anniversaries, graduations, birthdays, weddings, and memorials, 
                each piece is crafted to showcase memories in stunning, light-catching detail.
              </p>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                CrystalKeepsakes isn't just a company delivering exceptional products and services. 
                We're a team of dedicated individuals with one shared mission: to make your experience unforgettable. 
                From graphic designers and production technicians to customer support specialists, 
                everyone at CrystalKeepsakes is committed to helping you create the perfect 3D crystal.
              </p>
              
              <p className="text-gray-600 leading-relaxed">
                Have questions? Check out our{' '}
                <Link href="/faq" className="text-brand-500 hover:text-brand-600 font-medium underline transition-colors">
                  FAQ page
                </Link>
                {' '}or reach out to us directly. We're here to help!
              </p>
            </div>
            
            {/* Image - 5 columns */}
            <div className="lg:col-span-5">
              <div className="relative w-full max-w-md h-96 mx-auto lg:ml-auto lg:mr-0 rounded-2xl overflow-hidden shadow-lg">
                <Image 
                  src="/img/noahs-keepsake-1.png"
                  alt="CrystalKeepsakes Example"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-brand-500 to-brand-600 py-16 sm:py-20 text-center text-white">
        <div className="container mx-auto px-4 xl:max-w-4xl">
          <h2 className="text-3xl sm:text-4xl font-light mb-6">
            Ready to Create Your Crystal?
          </h2>
          <p className="text-lg sm:text-xl mb-8 leading-relaxed opacity-95">
            Let us help you preserve your most precious memories in stunning crystal form.
          </p>
          <Link 
            href="/contact" 
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-600 font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-base"
            data-testid="get-started-btn"
          >
            Get Started Today
          </Link>
        </div>
      </section>
      
    </div>
  )
}
