'use client'

import React, { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Customer",
    content: "The crystal quality exceeded my expectations. A beautiful way to preserve our wedding memories.",
    rating: 5
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Gift Buyer",
    content: "Ordered this as a gift for my parents' anniversary. They were moved to tears. Exceptional craftsmanship.",
    rating: 5
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Collector",
    content: "I've purchased three different designs. Each one is stunning and the attention to detail is remarkable.",
    rating: 5
  }
]

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!sectionRef.current) return

      const ctx = gsap.context(() => {
        // Set initial visibility to ensure elements are visible by default
        gsap.set('.testimonial-card', { opacity: 1, y: 0 })
        gsap.set('.star-icon', { opacity: 1, scale: 1 })

        // Animate testimonial cards sliding in from bottom
        const cards = gsap.utils.toArray('.testimonial-card')
        if (cards.length > 0) {
          gsap.from(cards, {
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 75%',
              toggleActions: 'play none none none'
            },
            y: 60,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: 'power3.out'
          })
        }

        // Animate stars fading in one by one
        const stars = gsap.utils.toArray('.star-icon')
        if (stars.length > 0) {
          gsap.from(stars, {
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 75%',
              toggleActions: 'play none none none'
            },
            scale: 0,
            opacity: 0,
            duration: 0.4,
            stagger: 0.1,
            ease: 'back.out(2)'
          })
        }
      }, sectionRef)

      return () => ctx.revert()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <section ref={sectionRef} className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-16 md:py-20 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        <h2 className="text-center mb-12 text-3xl md:text-4xl font-light tracking-wide text-gray-900">
          Customer Stories
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.id}
              className="testimonial-card bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-purple-200 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg 
                    key={i} 
                    className="star-icon w-6 h-6 text-yellow-400 drop-shadow-md" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    style={{ transitionDelay: `${index * 200 + i * 100}ms` }}
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              
              {/* Content */}
              <p className="text-gray-700 mb-6 leading-relaxed text-base">
                "{testimonial.content}"
              </p>
              
              {/* Author */}
              <div className="border-t border-purple-200 pt-4">
                <p className="font-semibold text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-purple-600">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
