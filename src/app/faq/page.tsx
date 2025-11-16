'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import Breadcrumbs from '@/components/BreadCrumbs'

export default function FAQPage() {
  useEffect(() => {
    const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
    const shouldLog = envMode === 'development' || envMode === 'testing'
    
    if (shouldLog) {
      console.log('❓ FAQ Page loaded:', {
        component: 'FAQPage',
        timestamp: new Date().toISOString()
      })
    }
  }, [])

  return (
    <div className="min-h-screen faq">
      {/* Hero Section - Dark with Green Overlay */}
      <section  
        className="hero relative overflow-hidden bg-[#0a0a0a] pb-8 pt-16"
        style={{
          background: `linear-gradient(
            45deg, 
            rgba(17, 17, 17, 0.9) 30%,
            rgba(28, 200, 28, 0.2) 125%
          ), url('/img/green-laser-background.jpg') center/cover no-repeat`
        }}
      >
        <div className="container mx-auto px-4 xl:max-w-7xl">
          <div className="flex justify-center items-center">

            <div className="hero-content text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight tracking-tight">Frequency Asked <span className="text-[#8DC63F] font-normal">Questions</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-100 mb-16 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Transform your cherished photos into stunning 3D crystal art pieces. 
                Our precision laser technology creates beautiful, lasting memories.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumbs - Unified Style */}
      <Breadcrumbs items={[{ label: 'Frequently Asked Questions' }]} />

      {/* FAQ Content - Light Background */}
      <section className="bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            
            {/* FAQ Item 1 */}
            <div className="mb-12">
              <h2 className="text-2xl font-light text-gray-900 mb-4">
                What's a 3D Photo Crystal?
              </h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                We're thrilled you asked! A 3D Photo Crystal is the most innovative way to preserve and showcase a physical representation of your favorite photo. At CrystalKeepsakes, we blend cutting-edge digital technology with expert craftsmanship to create intricate 2D or 3D laser engravings within durable crystal keepsakes.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We didn't invent crystal art; we perfected it.
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-8"></div>

            {/* FAQ Item 2 */}
            <div className="mb-12">
              <h2 className="text-2xl font-light text-gray-900 mb-4">
                Why Choose CrystalKeepsakes?
              </h2>
              <p className="text-gray-700 leading-relaxed">
                What sets us apart is our meticulous creative process. We don't just place a photo in an engraving machine and call it a day. Each custom crystal is a product of collaboration between top designers, advanced technology, and innovative thinking. Are we perfectionists? Absolutely. Passionate? Without a doubt.
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-8"></div>

            {/* FAQ Item 3 */}
            <div className="mb-12">
              <h2 className="text-2xl font-light text-gray-900 mb-4">
                Looking for Unique Gift Ideas?
              </h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                You've come to the right place. At CrystalKeepsakes, we specialize in helping you create unforgettable gifts for every occasion, from birthdays and graduations to anniversaries.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Need inspiration? Visit our{' '}
                <Link href="/about" className="text-[#72B01D] hover:text-[#5A8E17] underline">
                  about page
                </Link>
                {' '}for more information.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-[#72B01D] to-[#5A8E17] py-16 text-center text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-light mb-4">Still Have Questions?</h2>
          <p className="text-lg mb-8 opacity-95">We're here to help!</p>
          <Link 
            href="/contact" 
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#72B01D] font-semibold rounded-lg hover:shadow-xl transition-all duration-200"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  )
}
