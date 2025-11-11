// utils/logger.ts
// Version: 1.3.0 | Date: 2025-11-05
// ✅ Fixed: Added missing warn() method
// Environment-aware logging utility

const ENV_MODE = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
const IS_DEV = ENV_MODE === 'development'
const IS_TEST = ENV_MODE === 'testing'
const IS_PROD = ENV_MODE === 'production'

// Only log in dev and testing modes
const shouldLog = IS_DEV || IS_TEST

export const logger = {
  // API calls
  api: (endpoint: string, data?: any) => {
    if (!shouldLog) return
    console.log(`🌐 API Call: ${endpoint}`, data)
  },

  // Success messages
  success: (message: string, data?: any) => {
    if (!shouldLog) return
    console.log(`✅ ${message}`, data)
  },

  // Warning messages
  warn: (message: string, data?: any) => {
    if (!shouldLog) return
    console.warn(`⚠️ ${message}`, data)
  },

  // Error tracking
  error: (message: string, error?: any) => {
    if (!shouldLog) return
    console.error(`❌ ${message}`, error)
  },

  // Image loading
  image: (status: 'loading' | 'loaded' | 'error', path: string) => {
    if (!shouldLog) return
    const icon = status === 'loaded' ? '✅' : status === 'error' ? '❌' : '⏳'
    console.log(`${icon} Image ${status}: ${path}`)
  },

  // Order processing
  order: (step: string, data?: any) => {
    if (!shouldLog) return
    console.log(`📦 Order ${step}:`, data)
  },

  // Product data
  product: (action: string, data?: any) => {
    if (!shouldLog) return
    console.log(`🔷 Product ${action}:`, data)
  },

  // Payment processing
  payment: (step: string, data?: any) => {
    if (!shouldLog) return
    console.log(`💳 Payment ${step}:`, data)
  },

  // General info
  info: (message: string, data?: any) => {
    if (!shouldLog) return
    console.log(`ℹ️ ${message}`, data)
  }
}

export const isDevelopment = IS_DEV
export const isTesting = IS_TEST
export const isProduction = IS_PROD