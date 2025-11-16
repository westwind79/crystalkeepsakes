// Homepage - Original dark hero + light content + GSAP animations
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

import 'swiper/css'
import 'swiper/css/effect-cards'
import './css/swiper.css'

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
    const ctx = gsap.context(() => {
      // Hero animations
      gsap.from('.hero-content', {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.2
      })

      gsap.from('.hero-cta a', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
        delay: 0.6
      })

      gsap.from('.hero-swiper', {
        opacity: 0,
        scale: 0.95,
        duration: 0.8,
        ease: 'power2.out',
        delay: 0.4
      })

      // ScrollTrigger animations
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
    <div className="home">
      
      {/* ORIGINAL Dark Hero */}
      <section 
        ref={heroRef} 
        className="hero relative overflow-hidden min-h-[75vh] bg-[#0a0a0a] py-16 sm:py-20 lg:py-28"
        style={{
          background: `linear-gradient(
            45deg, 
            rgba(17, 17, 17, 0.9) 30%,
            rgba(28, 200, 28, 0.2) 125%
          ), url('/img/flag-background-2.png') center/cover no-repeat`
        }}
      >
        <div className="container mx-auto px-4 xl:max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div className="hero-content text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight tracking-tight">
                MEMORIES<br/>
                PRESERVED IN<br/>
                <span className="text-[#8DC63F] font-normal">CRYSTAL</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-200 mb-16 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Transform your cherished photos into stunning 3D crystal art pieces. 
                Our precision laser technology creates beautiful, lasting memories.
              </p>
 
              <div className="hero-cta grid sm:grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/products" className="btn-primary inline-flex px-3 py-2 text-centeralign-center justify-center rounded-lg">
                  Browse Designs
                </Link>
                <Link href="/about" className="btn btn-outline-light inline-flex px-3 py-2 align-center justify-center rounded-lg"> 
                  Learn More
                </Link>
              </div>
            </div>

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
                autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                className="mySwiper" 
              >
                {heroSwiperSlides.map(slide => (
                  <SwiperSlide key={slide.id} className="rounded-2xl">
                    <Image 
                      src={slide.image}
                      alt={slide.name}  
                      fill
                      width={0}
                      height={0}
                      className="w-full object-cover rounded-xl p-4"
                      priority={slide.priority}
                    />          
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            
          </div>
        </div>
      </section>

      {/* Featured Products - Light Theme */}
      <section ref={featuredRef}>
        <FeaturedProducts limit={6} title="Featured Designs" />
      </section>

      {/* Testimonials - Alternating Background */}
      <Testimonials />

      {/* Process Section - Alternating Background */}
      <section ref={processRef} className="bg-gray-100 py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 xl:max-w-7xl">
          <h2 className="text-center text-3xl sm:text-4xl font-light text-gray-900 mb-12">
            How We Create Your Crystal
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="process-step text-center bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Upload Photo</h3>
              <p className="text-gray-600 leading-relaxed">Choose your favorite high-quality photo</p>
            </div>
            
            <div className="process-step text-center bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Customize Design</h3>
              <p className="text-gray-600 leading-relaxed">Select your crystal shape and options</p>
            </div>
            
            <div className="process-step text-center bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-6xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Laser Engraving</h3>
              <p className="text-gray-600 leading-relaxed">Precision green lasers create your 3D crystal</p>
            </div>
            
            <div className="process-step text-center bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-6xl mb-4">🚚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Safe Delivery</h3>
              <p className="text-gray-600 leading-relaxed">Receive your crystal art safely packaged</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Preview - Light Background */}
      <section className="bg-[var(--surface-200)] py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 xl:max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-6">
                Crafted with Precision
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Perfect for anniversaries, graduations, birthdays, weddings, and memorials, 
                each piece is crafted to showcase memories in stunning, light-catching detail.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Have questions? Check out our{' '}
                <Link href="/faq" className="text-[#72B01D] hover:text-[#5A8E17] font-medium underline">
                  FAQ page
                </Link>
                {' '}or reach out to us directly.
              </p>
            </div>
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

      {/* CTA Section - Green Gradient */}
      <section className="bg-gradient-to-br from-[#72B01D] to-[#5A8E17] py-16 sm:py-20 text-center text-white">
        <div className="container mx-auto px-4 xl:max-w-4xl">
          <h2 className="text-3xl sm:text-4xl font-light mb-6">
            Ready to Create Your Crystal?
          </h2>
          <p className="text-lg sm:text-xl mb-8 leading-relaxed opacity-95">
            Let us help you preserve your most precious memories in stunning crystal form.
          </p>
          <Link 
            href="/contact" 
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#72B01D] font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            Get Started Today
          </Link>
        </div>
      </section>
      
    </div>
  )
}
