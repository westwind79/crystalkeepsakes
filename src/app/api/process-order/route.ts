// app/api/process-order/route.ts
// Complete order processing: Stripe → Cockpit3D → Email Notification
// Version: 1.0.0

import { NextRequest, NextResponse } from 'next/server'
import { buildCockpit3DOrder, validateCockpit3DOrder } from '@/lib/cockpit3d-order-builder'
import { logger } from '@/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      orderNumber,
      cartItems,
      customer,
      paymentIntentId,
      stripeSessionId,
      shippingInfo,
      receipt_email
    } = body

    if (!orderNumber || !cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    logger.info('Processing complete order', {
      orderNumber,
      itemCount: cartItems.length,
      hasCustomer: !!customer,
      paymentIntentId
    })

    const results = {
      orderNumber,
      success: false,
      cockpit3d: { submitted: false, orderId: null, error: null },
      email: { sent: false, error: null }
    }

    // Step 1: Build Cockpit3D order structure
    const cockpit3DOrder = buildCockpit3DOrder(
      orderNumber,
      cartItems,
      customer
    )

    // Validate order before submission
    const validation = validateCockpit3DOrder(cockpit3DOrder)
    if (!validation.isValid) {
      logger.error('Invalid Cockpit3D order', { errors: validation.errors })
      results.cockpit3d.error = validation.errors.join(', ')
    } else {
      // Step 2: Submit to Cockpit3D API
      try {
        const cockpit3DResponse = await submitToCockpit3D(cockpit3DOrder)
        
        logger.success('Order submitted to Cockpit3D', {
          orderNumber,
          cockpit3dOrderId: cockpit3DResponse.id
        })

        results.cockpit3d.submitted = true
        results.cockpit3d.orderId = cockpit3DResponse.id

      } catch (cockpit3DError: any) {
        logger.error('Cockpit3D API error', cockpit3DError)
        results.cockpit3d.error = cockpit3DError.message
      }
    }

    // Step 3: Send email notification (regardless of Cockpit3D status)
    try {
      const emailPayload = {
        orderId: orderNumber,
        paymentId: paymentIntentId,
        cartItems: cartItems.map((item: any) => ({
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price || item.totalPrice,
          options: extractOptionsForEmail(item)
        })),
        shippingInfo: shippingInfo || {
          name: `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim(),
          email: receipt_email || customer?.email,
          phone: customer?.phone,
          address: customer?.shippingAddress
        },
        receipt_email: receipt_email || customer?.email,
        cockpit3dOrderId: results.cockpit3d.orderId,
        cockpit3dStatus: results.cockpit3d.submitted ? 'Submitted' : 'Manual Review Required'
      }

      const emailResponse = await sendOrderEmail(emailPayload)
      
      if (emailResponse.success) {
        logger.success('Order notification email sent', { orderNumber })
        results.email.sent = true
      } else {
        throw new Error(emailResponse.error || 'Email sending failed')
      }

    } catch (emailError: any) {
      logger.error('Email notification error', emailError)
      results.email.error = emailError.message
    }

    // Determine overall success
    results.success = results.email.sent || results.cockpit3d.submitted

    return NextResponse.json({
      success: results.success,
      orderNumber: results.orderNumber,
      cockpit3d: results.cockpit3d,
      email: results.email,
      message: results.success 
        ? 'Order processed successfully' 
        : 'Order saved but requires manual review'
    })

  } catch (error: any) {
    logger.error('Order processing failed', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * Extract options for email display
 */
function extractOptionsForEmail(item: any): Record<string, any> {
  const options: Record<string, any> = {}

  // Size
  if (item.size || item.sizeDetails) {
    const sizeInfo = item.sizeDetails || item.size
    options.size = sizeInfo.sizeName || sizeInfo.name
  }

  // Options array (new format)
  if (Array.isArray(item.options)) {
    item.options.forEach((opt: any) => {
      if (opt.category === 'lightBase' && opt.value !== 'none') {
        options.lightBase = opt.value
      } else if (opt.category === 'background') {
        options.background = opt.value
      } else if (opt.category === 'customText') {
        if (opt.line1 || opt.line2) {
          options.customText = { line1: opt.line1, line2: opt.line2 }
        }
      }
    })
  }
  // Old flat options object
  else if (item.options && typeof item.options === 'object') {
    if (item.options.lightBase && item.options.lightBase !== 'none') {
      options.lightBase = typeof item.options.lightBase === 'string' 
        ? item.options.lightBase 
        : item.options.lightBase.name
    }
    if (item.options.background) {
      options.background = typeof item.options.background === 'string'
        ? item.options.background
        : item.options.background.name
    }
    if (item.options.customText) {
      options.customText = item.options.customText
    }
  }

  // Custom text
  if (item.customText) {
    options.customText = item.customText
  }

  // Custom image flag
  if (item.customImageId) {
    options.hasCustomImage = true
    options.imageId = item.customImageId
  }

  return options
}

/**
 * Submit order to Cockpit3D API
 */
async function submitToCockpit3D(order: any): Promise<any> {
  const apiUrl = process.env.COCKPIT3D_BASE_URL || 'https://api.cockpit3d.com'
  const username = process.env.COCKPIT3D_USERNAME
  const password = process.env.COCKPIT3D_PASSWORD

  if (!username || !password) {
    throw new Error('Cockpit3D credentials not configured')
  }

  // Create Basic Auth header
  const authToken = Buffer.from(`${username}:${password}`).toString('base64')

  const response = await fetch(`${apiUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authToken}`
    },
    body: JSON.stringify(order)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Cockpit3D API error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  return result
}

/**
 * Send order notification email
 * Calls the PHP endpoint for email sending
 */
async function sendOrderEmail(orderData: any): Promise<{ success: boolean; error?: string }> {
  try {
    // Call PHP email endpoint
    const phpEmailUrl = process.env.NEXT_PUBLIC_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/send-order-notification.php`
      : '/api/send-order-notification.php'

    const response = await fetch(phpEmailUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    })

    if (!response.ok) {
      throw new Error(`Email API error: ${response.status}`)
    }

    const result = await response.json()
    return result

  } catch (error: any) {
    logger.error('Email sending failed', error)
    return {
      success: false,
      error: error.message
    }
  }
}
