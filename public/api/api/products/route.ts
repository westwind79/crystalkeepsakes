// app/api/products/route.ts
import { NextResponse } from 'next/server'
import { config } from '@/lib/config'

const ENV_MODE = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
const shouldLog = ENV_MODE === 'development' || ENV_MODE === 'testing'

// Type definitions
interface Product {
  id: number | string
  name: string
  slug: string
  basePrice: number
  description: string
  images: { src: string; isMain: boolean }[]
  categories?: string[]
  sizes?: any[]
  lightBases?: any[]
  backgroundOptions?: any[]
  textOptions?: any[]
  sku?: string
  requiresImage?: boolean
}

// Cache
let cachedProducts: Product[] | null = null
let cacheTime: number | null = null
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

/**
 * Get the correct API base URL based on environment
 */
function getApiBaseUrl(): string {
  const MAMP_PORT = process.env.MAMP_PORT || '8888' // Get port from env
  
  switch (ENV_MODE) {
    case 'development':
      // Local MAMP - use port from env
      return `http://localhost:${MAMP_PORT}/crystalkeepsakes/api`
    
    case 'testing':
      // Testing on production server (GoDaddy)
      return 'https://crystalkeepsakes.com/api'
    
    case 'production':
      // Production on GoDaddy
      return 'https://crystalkeepsakes.com/api'
    
    default:
      return `http://localhost:${MAMP_PORT}/crystalkeepsakes/api`
  }
}

/**
 * Fetch products from PHP script that loads from CockPit3D
 */
async function fetchProductsFromPHP(): Promise<Product[]> {
  const apiUrl = getApiBaseUrl()
  // FIXED: Removed '2' from filename
  const endpoint = `${apiUrl}/cockpit3d-data-fetcher.php?action=generate-products`
  
  if (shouldLog) {
    console.log(`📄 Fetching products from: ${endpoint}`)
  }

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Don't cache during development
      cache: ENV_MODE === 'development' ? 'no-store' : 'default'
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch products from PHP')
    }

    if (shouldLog) {
      console.log(`✅ Loaded ${data.total_count || 0} products from PHP`)
      console.log(`   Static: ${data.static_count || 0}, CockPit3D: ${data.cockpit3d_count || 0}`)
    }

    return data.products || []

  } catch (error: any) {
    console.error('❌ Error fetching from PHP:', error.message)
    throw error
  }
}

export async function GET() {
  try {
    // Check cache first
    const now = Date.now()
    if (cachedProducts && cacheTime && (now - cacheTime < CACHE_DURATION)) {
      if (shouldLog) {
        console.log(`📦 API: Returning ${cachedProducts.length} cached products`)
      }
      return NextResponse.json({ 
        success: true, 
        products: cachedProducts,
        count: cachedProducts.length,
        cached: true,
        environment: ENV_MODE
      })
    }

    if (shouldLog) {
      console.log(`📄 API: Fetching fresh products (${ENV_MODE} mode)`)
    }

    // Fetch from PHP script
    const products = await fetchProductsFromPHP()

    // Update cache
    cachedProducts = products
    cacheTime = now

    if (shouldLog) {
      console.log(`✅ API: Loaded ${products.length} products (cached for 1 hour)`)
    }

    return NextResponse.json({ 
      success: true, 
      products: products,
      count: products.length,
      cached: false,
      environment: ENV_MODE
    })
    
  } catch (error: any) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        environment: ENV_MODE 
      },
      { status: 500 }
    )
  }
}