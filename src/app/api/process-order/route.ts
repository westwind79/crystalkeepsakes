// app/api/process-order/route.ts
// Process order after successful Stripe payment
// 1. Build Cockpit3D order structure
// 2. Submit to Cockpit3D API
// 3. Send confirmation email

import { NextRequest, NextResponse } from 'next/server'
import { buildCockpit3DOrder, validateCockpit3DOrder } from '@/lib/cockpit3d-order-builder'

// Cockpit3D API config
const COCKPIT3D_API_URL = process.env.COCKPIT3D_API_URL || 'https://api.cockpit3d.com'
const COCKPIT3D_USERNAME = process.env.COCKPIT3D_USERNAME
const COCKPIT3D_PASSWORD = process.env.COCKPIT3D_PASSWORD
const COCKPIT3D_RETAILER_ID = process.env.COCKPIT3D_RETAILER_ID

interface ProcessOrderRequest {
  orderNumber: string
  cartItems: any[]
  customer: {
    email: string
    firstName?: string
    lastName?: string
    phone?: string
  }
  shippingInfo: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  paymentIntentId?: string
  stripeSessionId?: string
  receipt_email?: string
}

export async function POST(request: NextRequest) {
  console.log('📦 [PROCESS-ORDER] Starting order processing...')
  
  try {
    const body: ProcessOrderRequest = await request.json()
    
    const {
      orderNumber,
      cartItems,
      customer,
      shippingInfo,
      stripeSessionId
    } = body

    console.log('📦 [PROCESS-ORDER] Order details:', {
      orderNumber,
      itemCount: cartItems?.length,
      customer: customer?.email,
      hasShipping: !!shippingInfo
    })

    // Validate required fields
    if (!orderNumber || !cartItems || cartItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: orderNumber and cartItems'
      }, { status: 400 })
    }

    // Build customer info for Cockpit3D
    const customerInfo = {
      email: customer?.email || body.receipt_email || 'unknown@example.com',
      firstName: customer?.firstName || 'Customer',
      lastName: customer?.lastName || '',
      phone: customer?.phone || '',
      shippingAddress: {
        street1: shippingInfo?.address || '',
        city: shippingInfo?.city || '',
        state: shippingInfo?.state || '',
        zipCode: shippingInfo?.zipCode || '',
        country: shippingInfo?.country || 'US'
      }
    }

    // Build Cockpit3D order
    console.log('📦 [PROCESS-ORDER] Building Cockpit3D order structure...')
    const cockpit3DOrder = buildCockpit3DOrder(orderNumber, cartItems, customerInfo)
    
    // Validate the order
    const validation = validateCockpit3DOrder(cockpit3DOrder)
    console.log('📦 [PROCESS-ORDER] Order validation:', validation)
    
    if (!validation.isValid) {
      console.warn('⚠️ [PROCESS-ORDER] Order validation warnings:', validation.errors)
    }

    // Prepare response
    const result: any = {
      success: true,
      orderNumber,
      cockpit3d: {
        submitted: false,
        order: cockpit3DOrder,
        validation
      },
      email: {
        sent: false
      }
    }

    // Submit to Cockpit3D API (if credentials are configured)
    if (COCKPIT3D_USERNAME && COCKPIT3D_PASSWORD && COCKPIT3D_RETAILER_ID) {
      console.log('📤 [PROCESS-ORDER] Submitting to Cockpit3D API...')
      
      try {
        const cockpitResponse = await fetch(`${COCKPIT3D_API_URL}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${COCKPIT3D_USERNAME}:${COCKPIT3D_PASSWORD}`).toString('base64')}`
          },
          body: JSON.stringify(cockpit3DOrder)
        })

        const cockpitResult = await cockpitResponse.json()
        
        result.cockpit3d.submitted = cockpitResponse.ok
        result.cockpit3d.apiResponse = cockpitResult
        result.cockpit3d.apiStatus = cockpitResponse.status
        
        console.log('📤 [PROCESS-ORDER] Cockpit3D API response:', {
          status: cockpitResponse.status,
          ok: cockpitResponse.ok,
          result: cockpitResult
        })

      } catch (apiError: any) {
        console.error('❌ [PROCESS-ORDER] Cockpit3D API error:', apiError)
        result.cockpit3d.error = apiError.message
      }
    } else {
      console.log('⚠️ [PROCESS-ORDER] Cockpit3D credentials not configured - order NOT submitted')
      result.cockpit3d.message = 'Cockpit3D credentials not configured. Order saved but not submitted to API.'
      
      // Log the order structure for debugging
      console.log('📋 [PROCESS-ORDER] Cockpit3D Order Structure (not submitted):')
      console.log(JSON.stringify(cockpit3DOrder, null, 2))
    }

    // TODO: Send confirmation email
    // This would integrate with SendGrid, Resend, or another email service
    result.email.message = 'Email service not configured'

    console.log('✅ [PROCESS-ORDER] Order processing complete:', {
      orderNumber,
      cockpit3dSubmitted: result.cockpit3d.submitted,
      emailSent: result.email.sent
    })

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('❌ [PROCESS-ORDER] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process order'
    }, { status: 500 })
  }
}

// GET endpoint to check order status or test the API
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Process Order API is running',
    config: {
      cockpit3d_configured: !!(COCKPIT3D_USERNAME && COCKPIT3D_PASSWORD && COCKPIT3D_RETAILER_ID),
      api_url: COCKPIT3D_API_URL
    }
  })
}
