'use client'

import Link from 'next/link'
import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import Breadcrumbs from '@/components/BreadCrumbs'

interface FormData {
  name: string
  phone: string
  email: string
  topic: string
  orderNumber: string
  comment: string
}

const CONTACT_TOPICS = [
  { value: '', label: 'Select a topic...' },
  { value: 'order_problem', label: 'Problem with Order' },
  { value: 'website_issue', label: 'Website Issue' },
  { value: 'product_question', label: 'Product Question' },
  { value: 'custom_request', label: 'Custom Design Request' },
  { value: 'other', label: 'Other' }
]

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '', 
    phone: '', 
    email: '', 
    topic: '',
    orderNumber: '',
    comment: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.topic) newErrors.topic = 'Please select a topic'
    if (formData.topic === 'order_problem' && !formData.orderNumber.trim()) {
      newErrors.orderNumber = 'Order number is required for order problems'
    }
    if (!formData.comment.trim()) newErrors.comment = 'Message is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setIsSubmitting(true)
    setSubmitStatus(null)
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSubmitStatus({ success: true, message: 'Thank you! Your message has been sent successfully.' })
        setFormData({ name: '', phone: '', email: '', topic: '', orderNumber: '', comment: '' })
        setHasSubmitted(true)
      } else {
        setSubmitStatus({ success: false, message: data.error || 'Failed to send message. Please try again.' })
      }
    } catch (error) {
      setSubmitStatus({ success: false, message: 'Network error. Please check your connection and try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen contact">
      <section  
        className="hero relative overflow-hidden pb-8 pt-16"
        style={{
          background: `linear-gradient(
            45deg, 
            rgba(17, 17, 17, 0.9) 30%,
            rgba(28, 200, 28, 0.2) 125%
          ), url('/img/laser-background-lg.jpg') center/cover no-repeat`
        }}
      >
        <div className="container mx-auto px-4 xl:max-w-7xl">
          <div className="flex justify-center items-center">

            <div className="hero-content text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight tracking-tight">Contact <span className="text-[#8DC63F] font-normal">Us</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-100 mb-16 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Transform your cherished photos into stunning 3D crystal art pieces. 
                Our precision laser technology creates beautiful, lasting memories.
              </p>
            </div>
          </div>
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
