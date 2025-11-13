'use client'

import Link from 'next/link'
import { useState, useEffect, FormEvent, ChangeEvent } from 'react' 
import { logger } from '@/utils/logger'

interface FormData {
  name: string
  phone: string
  email: string
  comment: string
}

interface FormErrors {
  [key: string]: string
}

export default function ContactPage() {
  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    comment: ''
  })

  // Validation and submission state
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'danger' | 'warning'
    message: string
  } | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Check session for previous submission
  useEffect(() => {
    const submitted = sessionStorage.getItem('contactSubmitted')
    if (submitted) {
      setHasSubmitted(true)
      logger.info('Contact form already submitted this session')
    }
  }, [])

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    // Phone validation (optional)
    if (formData.phone.trim()) {
      const phoneRegex = /^[\d\s\-\(\)]+$/
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Invalid phone number'
      }
    }
    
    // Message validation
    if (!formData.comment.trim()) {
      newErrors.comment = 'Message is required'
    } else if (formData.comment.length < 10) {
      newErrors.comment = 'Message must be at least 10 characters'
    }
    
    setErrors(newErrors)
    const isValid = Object.keys(newErrors).length === 0
    
    if (isValid) {
      logger.success('Form validation passed')
    } else {
      logger.error('Form validation failed', newErrors)
    }
    
    return isValid
  }

  // Handle input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Prevent duplicate submissions
    if (hasSubmitted) {
      setSubmitStatus({
        type: 'warning',
        message: 'You already submitted a message this session'
      })
      return
    }
    
    // Validate
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    setSubmitStatus(null)
    logger.api('POST /api/sendContact.php', formData)
    
    try {
      const response = await fetch('/api/sendContact.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const text = await response.text()
      const data = JSON.parse(text)
      
      if (response.ok) {
        logger.success('Contact form submitted', data)
        
        setSubmitStatus({
          type: 'success',
          message: data.message || 'Thank you! We\'ll contact you soon.'
        })
        
        // Mark as submitted
        sessionStorage.setItem('contactSubmitted', 'true')
        setHasSubmitted(true)
        
        // Clear form
        setFormData({
          name: '',
          phone: '',
          email: '',
          comment: ''
        })
      } else {
        throw new Error(data.error || 'Submission failed')
      }
    } catch (error: any) {
      logger.error('Contact form error', error)
      
      setSubmitStatus({
        type: 'danger',
        message: error.message || 'An error occurred. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}      
      <section className="hero px-8 py-16 text-center">
        <div className="hero-content max-w-xl mx-auto">
          <h1 className="primary-header mb-4">Contact Us</h1>
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
          <span className="text-text-tertiary">Contact Us</span>
        </div>
      </nav>
      
      {/* Contact Form Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            
            {/* Status Alert */}
            {submitStatus && (
              <div 
                className={`mb-6 p-4 rounded-lg border ${
                  submitStatus.type === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : submitStatus.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="flex-1">{submitStatus.message}</p>
                  <button
                    onClick={() => setSubmitStatus(null)}
                    className="ml-4 text-current hover:opacity-70"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Name Field */}
              <div>
                <label 
                  htmlFor="contact-name" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Name <span className="text-red-600">*</span>
                </label>
                <input
                  autoComplete="name"
                  type="text"
                  name="name"
                  id="contact-name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting || hasSubmitted}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.name 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  } focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors`}
                  placeholder="Your full name"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label 
                  htmlFor="contact-phone" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone
                </label>
                <input
                  autoComplete="tel"
                  type="tel"
                  id="contact-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isSubmitting || hasSubmitted}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.phone 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  } focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors`}
                  placeholder="(555) 123-4567"
                />
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label 
                  htmlFor="contact-email" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  autoComplete="email"
                  type="email"
                  name="email"
                  id="contact-email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting || hasSubmitted}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  } focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Message Field */}
              <div>
                <label 
                  htmlFor="contact-comment" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Message <span className="text-red-600">*</span>
                </label>
                <textarea
                  autoComplete="off"
                  rows={5}
                  id="contact-comment"
                  name="comment"
                  value={formData.comment}
                  onChange={handleChange}
                  disabled={isSubmitting || hasSubmitted}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.comment 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  } focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors resize-none`}
                  placeholder="Tell us about your project or question..."
                />
                {errors.comment && (
                  <p className="mt-2 text-sm text-red-600">{errors.comment}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || hasSubmitted}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isSubmitting ? 'Sending...' : hasSubmitted ? 'Message Sent' : 'Send Message'}
              </button>

              {/* Required Fields Note */}
              <p className="text-sm text-gray-500 mt-4">
                <span className="text-red-600">*</span> Required fields
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}