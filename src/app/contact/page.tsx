'use client'

import Link from 'next/link'
import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import Breadcrumbs from '@/components/BreadCrumbs'

interface FormData {
  name: string
  phone: string
  email: string
  comment: string
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '', phone: '', email: '', comment: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<any>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    // Form submit logic here
  }

  return (
    <div className="min-h-screen contact">
      <section className="hero flex align-center justify-center text-center">
        <div className="hero-content max-w-xl mx-auto">
          <h1 className="hero-header text-4xl font-light text-white mb-4">Contact Us</h1>
          <p className="text-lg text-gray-200">
            Everything you need to know about our 3D crystal keepsakes
          </p>
        </div>
      </section>

      <Breadcrumbs items={[{ label: 'Contact' }]} />

      <section className="bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                <textarea
                  name="comment"
                  rows={5}
                  value={formData.comment}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-sm"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}
