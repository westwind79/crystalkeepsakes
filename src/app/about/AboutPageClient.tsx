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
    logDev('About Page loaded', {
      component: 'AboutPageClient',
      timestamp: new Date().toISOString(),
      environment: process.env.NEXT_PUBLIC_ENV_MODE,
      url: typeof window !== 'undefined' ? window.location.href : 'SSR'
    })
  }, [])

  return (
    <div className="about-page">
      {/* Hero Section */}      
      <section className="hero px-8 py-16 text-center">
        <div className="hero-content max-w-xl mx-auto">
          <h1 className="primary-header mb-4">About Us</h1>
          <p className="lead text-gray-100">         
            Welcome to CrystalKeepsakes, where cherished moments are transformed into stunning 3D laser-engraved crystal creations.
          </p>
        </div>
      </section>

      {/* Breadcrumbs */}
      <nav className="breadcrumbs py-4">
        <div className="container mx-auto px-4">
          <Link href="/" className="hover:text-brand-400 transition-colors">Home</Link>  
          <span className="mx-2 text-gray-600">/</span>
          <span className="text-text-tertiary">About Us</span>
        </div>
      </nav>
      
      {/* Main About Content */}
      <section className="about-preview bg-dark py-5">
          <div className="mx-auto max-w-3xl">
            <div className="mx-auto">
              
              {/* What 3D Crystal Engraving Means Section */}
              <div className="align-items-center mb-5">
                <div>
                  <h2 className="mb-4">What 3D Crystal Engraving Means to Us</h2>
                  <p className="mb-4">
                    Since the beginning of time, humans have sought ways to preserve important 
                    moments and protect them from the relentless passage of time. Stone Age 
                    storytellers carved cave drawings to celebrate their epic hunting adventures. 
                    Renaissance nobles commissioned elaborate oil paintings to showcase their 
                    legacy and sense of style. Across history, nearly every form of art has 
                    shared one purpose: making memories last.
                  </p>
                  <p className="mb-4">
                    Photography changed everything. It gave us the power to freeze moments in 
                    time and relive them endlessly. Digital photography took it a step further. 
                    We can now store thousands of photos on devices, share them instantly through 
                    social media, and ensure they never fade or degrade.
                  </p>
                  <p className="mb-4">
                    But there&apos;s a catch. We&apos;re capturing more moments than ever, yet digital 
                    photos are intangible. We can view them but not hold them.
                  </p>
                  <p className="mb-4">
                    That&apos;s where CrystalKeepsakes comes in. Say hello to the Personalized 3D Photo Crystal.
                  </p>
                </div>
              </div>

              <div className="spacer-gradient my-5"></div>

              {/* Noah Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                <div className="order-1 order-md-1 mb-4 mb-md-0">
                  <div className="text-center about-photo">
                    <Image
                      src={getImagePath('img/noahs-keepsake-1.png')}
                      alt="Noah's 3D Crystal"
                      width={0}
                      height={0}
                      style={{ width: '100%', height: 'auto' }}
                      className="img-fluid rounded-xl shadow"
                      onError={() => logDev('❌ Image failed to load: noahs-keepsake-1.png')}
                      onLoad={() => logDev('✅ Image loaded: noahs-keepsake-1.png')}
                    />
                  </div>
                </div>
                <div className="order-2 order-md-2">
                  <h2 className="mb-4">Noah</h2>
                  <p className="lead mb-4">Visionary Designer and Master Developer</p>
                  <p className="mb-4">
                    Noah is the creative force and technical mastermind behind CrystalKeepsakes. 
                    With an innate talent for design and an unmatched understanding of 3D laser 
                    technology, Noah combines artistry with cutting-edge innovation. His journey 
                    began with a deep fascination for how light and precision can transform 
                    ordinary materials into extraordinary keepsakes.
                  </p>
                  <p className="mb-4">
                    With years of expertise in 3D modeling and laser engraving, Noah has pushed 
                    the boundaries of what&apos;s possible in personalized crystal gifts. He 
                    meticulously oversees the design and production process to ensure that every 
                    piece is a true work of art. Whether it&apos;s a family portrait, a beloved pet, 
                    or a timeless moment frozen in crystal, Noah&apos;s dedication to perfection 
                    ensures that your memories are captured beautifully.
                  </p>
                </div>
              </div>

              <div className="spacer-gradient my-5"></div>

              {/* Janell Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                <div md={4} className="order-1 order-md-2 mb-4 mb-md-0">
                  <div className="text-center about-photo">
                    <Image
                      src={getImagePath('img/janell-clipboard.jpg')}
                      alt="Janell"
                      width={0}
                      height={0}
                      style={{ width: '100%', height: 'auto' }}
                      className="img-fluid rounded-xl shadow"
                      onError={() => logDev('❌ Image failed to load: janell-clipboard.jpg')}
                      onLoad={() => logDev('✅ Image loaded: janell-clipboard.jpg')}
                    />
                  </div>
                </div>
                <div md={8} className="order-2 order-md-1">
                  <h2 className="mb-4">Janell</h2>
                  <p className="lead mb-4">Sales Maven and Customer Service Enthusiast</p>
                  <p className="mb-4">
                    Janell is the heart and soul of CrystalKeepsakes&apos; customer experience. 
                    With a natural flair for sales and a genuine passion for connecting with 
                    people, Janell ensures that every customer feels valued and heard. Her 
                    philosophy is simple: every interaction is an opportunity to create a 
                    lasting relationship.
                  </p>
                  <p className="mb-4">
                    Janell&apos;s love for customer service is more than a job; it&apos;s her calling. 
                    She believes that every gift tells a story, and she&apos;s committed to helping 
                    you tell yours. Her exceptional attention to detail and unwavering commitment 
                    to satisfaction ensure that your vision is brought to life in the most 
                    meaningful way possible.
                  </p>
                </div>
              </div>

              <div className="spacer-gradient my-5"></div>

              {/* Together Section */}
              <div className="text-center">
                <div>
                  <h2 className="mb-4">Together, Creating Lasting Memories</h2>
                  <p className="lead">
                    Noah and Janell&apos;s partnership is the cornerstone of CrystalKeepsakes.
                  </p>
                  <p className="mb-4">
                    Together, they have built a company rooted in innovation, creativity, and 
                    unparalleled customer care. Their shared mission is to provide gifts that 
                    not only celebrate special occasions but also become treasured keepsakes 
                    for years to come. From anniversaries and weddings to graduations and 
                    memorials, CrystalKeepsakes offers a unique way to preserve life&apos;s most 
                    cherished memories.
                  </p>
                  <p className="mb-4">
                    At CrystalKeepsakes, we believe in the power of personalization, the beauty 
                    of crystal, and the importance of connection. We invite you to explore our 
                    collection and experience the artistry and dedication that make each piece 
                    truly special. Thank you for allowing us to be part of your most meaningful 
                    moments.
                  </p>
                </div>
              </div>

            </div>
          </div>
      </section>

      {/* Contact CTA */}
      <section className="contact-cta py-5 text-center">
        <div>
          <h2 className="mb-4">Ready to Create Your Crystal?</h2>
          <p className="lead mb-4">
            Let us help you preserve your most precious memories in stunning crystal form.
          </p>
          <Link 
            href="/contact" 
            className="btn btn-secondary py-3 px-6 rounded-lg"
            onClick={() => logDev('🔗 Contact CTA clicked from About page')}
          >
            Get Started Today
          </Link>
        </div>
      </section>
    </div>
  )
}