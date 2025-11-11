// app/products/[slug]/ProductDetailClient.tsx
// v1.0.0 - 2025-01-03 - Migrated from Bootstrap to Tailwind CSS
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ImageEditor from '@/components/ImageEditor'

// Environment
const ENV_MODE = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
const isDevelopment = ENV_MODE === 'development' || ENV_MODE === 'testing'

// TypeScript Interfaces
interface Size {
  id: string
  name: string
  price: number
}

interface LightBase {
  id: string
  name: string
  price: number | null
}

interface BackgroundOption {
  id: string
  name: string
  price: number
}

interface TextOption {
  id: string
  name: string
  price: number
}

interface ProductImage {
  src: string
  isMain: boolean
}

interface Product {
  id: number | string
  name: string
  slug: string
  sku: string
  basePrice: number
  description: string
  longDescription?: string
  images: ProductImage[]
  sizes?: Size[]
  lightBases?: LightBase[]
  backgroundOptions?: BackgroundOption[]
  textOptions?: TextOption[]
  requiresImage?: boolean
  categories?: string[]
  maskImageUrl?: string // IMPORTANT: Mask for the image editor
}

export default function ProductDetailClient() {
 
  const params = useParams()
  const router = useRouter()
  
  // Product State
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  
  // Selection State
  const [selectedSize, setSelectedSize] = useState<Size | null>(null)
  const [selectedLightBase, setSelectedLightBase] = useState<LightBase | null>(null)
  const [selectedBackground, setSelectedBackground] = useState<BackgroundOption | null>(null)
  const [selectedTextOption, setSelectedTextOption] = useState<TextOption | null>(null)
  const [customText, setCustomText] = useState({ line1: '', line2: '' })
  const [quantity, setQuantity] = useState(1)
  
  // Image State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [maskedImage, setMaskedImage] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  
  // Fetch product on mount
  useEffect(() => {
    if (params.slug) {
      fetchProduct(params.slug as string)
    }
  }, [params.slug])

  /**
   * Fetch product data - READ FROM CACHED FILE
   */
  const fetchProduct = async (slug: string) => {
    try {
      if (isDevelopment) {
        console.log('📷 Product: Fetching product', { slug, envMode: ENV_MODE })
      }
      
      // Import from cached file directly
      const { cockpit3dProducts } = await import('../../../data/cockpit3d-products.js')
      
      if (isDevelopment) {
        console.log(`📦 Loaded ${cockpit3dProducts.length} products from cache`)
      }
      
      // Find product by slug
      const foundProduct = cockpit3dProducts.find((p: Product) => p.slug === slug)
      
      if (!foundProduct) {
        throw new Error('Product not found')
      }
      
      setProduct(foundProduct)
      
      // Set default selections
      if (foundProduct.sizes && foundProduct.sizes.length > 0) {
        setSelectedSize(foundProduct.sizes[0])
      }
      
      if (foundProduct.lightBases && foundProduct.lightBases.length > 0) {
        setSelectedLightBase(foundProduct.lightBases[0])
      }
      
      if (foundProduct.backgroundOptions && foundProduct.backgroundOptions.length > 0) {
        setSelectedBackground(foundProduct.backgroundOptions[0])
      }
      
      if (foundProduct.textOptions && foundProduct.textOptions.length > 0) {
        setSelectedTextOption(foundProduct.textOptions[0])
      }
      
      if (isDevelopment) {
        console.log('✅ Product loaded:', foundProduct.name)
      }
      
    } catch (err: any) {
      console.error('❌ Failed to fetch product', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle image file upload
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (isDevelopment) {
      console.log('📸 Image selected:', { name: file.name, size: file.size })
    }

    // Validate
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large (max 5MB)')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageData = event.target?.result as string
      setUploadedImage(imageData)
      setShowEditor(true) // Open editor immediately
    }
    reader.readAsDataURL(file)
  }

  /**
   * Handle save from ImageEditor
   */
  const handleImageSave = (compressedImage: string) => {
    if (isDevelopment) {
      console.log('💾 Compressed image ready:', compressedImage.substring(0, 50) + '...')
    }
    
    // Save the masked/compressed image
    setMaskedImage(compressedImage)
    
    // TODO: Send to Cockpit3D API if needed
    // await uploadToCockpit3D(compressedImage)
  }

  /**
   * Calculate total price
   */
  const calculateTotal = (): number => {
    let total = selectedSize?.price || product?.basePrice || 0
    
    if (selectedLightBase?.price) total += selectedLightBase.price
    if (selectedBackground?.price) total += selectedBackground.price
    if (selectedTextOption?.price) total += selectedTextOption.price
    
    return total * quantity
  }

  /**
   * Add to cart
   */
  const handleAddToCart = () => {
    // Validation
    if (product?.requiresImage && !maskedImage) {
      alert('Please upload and prepare your image')
      return
    }
    if (!selectedSize && product?.sizes && product.sizes.length > 0) {
      alert('Please select a size')
      return
    }

    const cartItem = {
      cartId: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: product!.id,
      name: product!.name,
      slug: product!.slug,
      quantity,
      price: calculateTotal(),
      options: {
        size: selectedSize || undefined,
        lightBase: selectedLightBase || undefined,
        background: selectedBackground || undefined,
        textOption: selectedTextOption || undefined,
        customText: selectedTextOption?.id === 'customText' ? customText : undefined,
        rawImageUrl: uploadedImage || undefined,
        maskedImageUrl: maskedImage || undefined,
      }
    }

    // Get existing cart
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    cart.push(cartItem)
    localStorage.setItem('cart', JSON.stringify(cart))

    if (isDevelopment) {
      console.log('✅ Added to cart:', cartItem)
    }

    // Redirect to cart
    router.push('/cart')
  }

  /**
   * Loading State
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--dark-bg)] text-[var(--dark-text)] pt-[100px]">
        <div className="flex items-center justify-center py-12">
          <div 
            className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"
            role="status"
          >
            <span className="sr-only">Loading product...</span>
          </div>
        </div>
      </div>
    )
  }

  /**
   * Error State
   */
  if (error || !product) {
    return (
      <div className="min-h-screen bg-[var(--dark-bg)] text-[var(--dark-text)] pt-[100px]">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto bg-red-900/20 border border-red-500 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-red-400 mb-3">
              ⚠️ Product Not Found
            </h2>
            <p className="text-gray-300 mb-4">
              {error || 'The product you are looking for does not exist.'}
            </p>
            <Link 
              href="/products" 
              className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              ← Back to Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /**
   * Main Product Detail View
   */
  return (
    <div className="min-h-screen bg-[var(--dark-bg)] text-[var(--dark-text)] pt-[100px]">
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs - uses your custom .breadcrumb CSS */}
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="breadcrumb flex gap-2 text-sm">
              <li className="breadcrumb-item">
                <Link href="/" className="hover:underline">Home</Link>
              </li>
              <li className="breadcrumb-item text-gray-500">/</li>
              <li className="breadcrumb-item">
                <Link href="/products" className="hover:underline">Products</Link>
              </li>
              <li className="breadcrumb-item text-gray-500">/</li>
              <li className="breadcrumb-item active">{product.name}</li>
            </ol>
          </nav>

          {/* Product Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="mb-4">
              <div 
                className="relative w-full pt-[100%] rounded-lg overflow-hidden bg-black/20"
              >
                <Image
                  src={product.images[0]?.src || 'https://placehold.co/800x800?text=No+Image'}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Product Info */}
            <div>         
              <h1 className="primary-header mb-4">{product.name}</h1>
              <p className="lead text-lg mb-6">{product.description}</p>
              
              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xl font-semibold mb-3">Select Size</h4>
                  <div className="flex gap-2 flex-wrap">
                    {product.sizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size)}
                        className={`btn px-4 py-2 rounded-lg transition-all ${
                          selectedSize?.id === size.id 
                            ? 'btn-primary' 
                            : 'btn-outline-light'
                        }`}
                      >
                        {size.name} - ${size.price.toFixed(2)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Upload */}
              {product.requiresImage && (
                <div className="mb-6">
                  <h4 className="text-xl font-semibold mb-3">Upload Your Image</h4>
                  
                  {/* Check if mask exists */}
                  {!product.maskImageUrl ? (
                    <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
                      <p className="text-yellow-400">
                        ⚠️ Product mask not configured. Contact support.
                      </p>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={!product.maskImageUrl}
                        className="block w-full text-sm text-gray-300 
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-green-600 file:text-white
                          hover:file:bg-green-700
                          cursor-pointer border border-gray-600 rounded-lg
                          bg-[var(--dark-bg-secondary)]"
                      />
                      
                      {maskedImage && (
                        <div className="mt-3 p-3 bg-green-900/20 border border-green-500 rounded-lg">
                          <p className="text-green-400 mb-2">✅ Image ready for engraving</p>
                          <button 
                            onClick={() => setShowEditor(true)}
                            className="btn-outline-secondary px-3 py-1 text-sm rounded-lg"
                          >
                            Edit Again
                          </button>
                        </div>
                      )}
                      
                      {uploadedImage && !maskedImage && (
                        <p className="text-yellow-400 mt-2">
                          ⚠️ Please finalize your image in the editor
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Light Base */}
              {product.lightBases && product.lightBases.length > 1 && (
                <div className="mb-6">
                  <h4 className="text-xl font-semibold mb-3">Light Base</h4>
                  <select 
                    value={selectedLightBase?.id || ''}
                    onChange={(e) => {
                      const base = product.lightBases?.find(b => b.id === e.target.value)
                      setSelectedLightBase(base || null)
                    }}
                    className="w-full px-4 py-2 bg-[var(--dark-bg-secondary)] border border-gray-600 rounded-lg text-gray-300 focus:border-green-500 focus:outline-none"
                  >
                    {product.lightBases.map((base) => (
                      <option key={base.id} value={base.id}>
                        {base.name} {base.price ? `- $${base.price.toFixed(2)}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Background */}
              {product.backgroundOptions && product.backgroundOptions.length > 1 && (
                <div className="mb-6">
                  <h4 className="text-xl font-semibold mb-3">Background</h4>
                  <select
                    value={selectedBackground?.id || ''}
                    onChange={(e) => {
                      const bg = product.backgroundOptions?.find(b => b.id === e.target.value)
                      setSelectedBackground(bg || null)
                    }}
                    className="w-full px-4 py-2 bg-[var(--dark-bg-secondary)] border border-gray-600 rounded-lg text-gray-300 focus:border-green-500 focus:outline-none"
                  >
                    {product.backgroundOptions.map((bg) => (
                      <option key={bg.id} value={bg.id}>
                        {bg.name} {bg.price > 0 ? `- $${bg.price.toFixed(2)}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Text Options */}
              {product.textOptions && product.textOptions.length > 1 && (
                <div className="mb-6">
                  <h4 className="text-xl font-semibold mb-3">Text Engraving</h4>
                  <select
                    value={selectedTextOption?.id || ''}
                    onChange={(e) => {
                      const opt = product.textOptions?.find(o => o.id === e.target.value)
                      setSelectedTextOption(opt || null)
                    }}
                    className="w-full px-4 py-2 bg-[var(--dark-bg-secondary)] border border-gray-600 rounded-lg text-gray-300 focus:border-green-500 focus:outline-none"
                  >
                    {product.textOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name} {opt.price > 0 ? `- $${opt.price.toFixed(2)}` : ''}
                      </option>
                    ))}
                  </select>

                  {selectedTextOption?.id === 'customText' && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Line 1
                        </label>
                        <input
                          type="text"
                          value={customText.line1}
                          onChange={(e) => setCustomText({ ...customText, line1: e.target.value })}
                          maxLength={30}
                          className="w-full px-4 py-2 bg-[var(--dark-bg-secondary)] border border-gray-600 rounded-lg text-gray-300 focus:border-green-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Line 2
                        </label>
                        <input
                          type="text"
                          value={customText.line2}
                          onChange={(e) => setCustomText({ ...customText, line2: e.target.value })}
                          maxLength={30}
                          className="w-full px-4 py-2 bg-[var(--dark-bg-secondary)] border border-gray-600 rounded-lg text-gray-300 focus:border-green-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <h4 className="text-xl font-semibold mb-3">Quantity</h4>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-32 px-4 py-2 bg-[var(--dark-bg-secondary)] border border-gray-600 rounded-lg text-gray-300 focus:border-green-500 focus:outline-none"
                />
              </div>

              {/* Price & Add to Cart */}
              <h3 className="text-3xl font-bold text-[var(--brand-400)] mb-4">
                ${calculateTotal().toFixed(2)}
              </h3>

              <button 
                onClick={handleAddToCart}
                disabled={product.requiresImage && !maskedImage}
                className={`btn btn-primary px-6 py-3 text-lg rounded-lg ${
                  product.requiresImage && !maskedImage 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
              >
                Add to Cart
              </button>

              {product.requiresImage && !maskedImage && (
                <p className="text-yellow-400 mt-3">
                  ⚠️ Please upload and prepare your image
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Image Editor Modal - uses your custom modal CSS */}
      <ImageEditor
        show={showEditor}
        onHide={() => setShowEditor(false)}
        uploadedImage={uploadedImage}
        maskImage={product.maskImageUrl || '/img/masks/default-mask.png'}
        onSave={handleImageSave}
      />

      {/* Dev Info */}
      {isDevelopment && (
        <div className="fixed bottom-2.5 right-2.5 bg-black/80 text-[#72B01D] p-2.5 rounded-md text-xs max-w-[250px]">
          <strong className="text-red-500">DEV MODE</strong><br />
          Product: {product.name}<br />
          Price: ${calculateTotal().toFixed(2)}<br />
          Image: {maskedImage ? '✅' : '❌'}
        </div>
      )}
    </div>
  )
}