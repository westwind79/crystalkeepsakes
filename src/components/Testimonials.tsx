'use client'

import React from 'react'

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
  return (
    <section className="bg-surface-900 py-16 md:py-20">
      <div className="w-full max-w-7xl mx-auto px-4">
        <h2 className="text-center mb-12 text-3xl md:text-4xl font-light tracking-wide text-gray-50">
          Customer Stories
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map(testimonial => (
            <div 
              key={testimonial.id}
              className="bg-surface-800 p-8 rounded-lg border border-surface-700 hover:border-brand-500/50 transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-brand-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              
              {/* Content */}
              <p className="text-gray-300 mb-6 leading-relaxed font-light">
                "{testimonial.content}"
              </p>
              
              {/* Author */}
              <div className="border-t border-surface-700 pt-4">
                <p className="font-medium text-gray-50">{testimonial.name}</p>
                <p className="text-sm text-gray-400">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
