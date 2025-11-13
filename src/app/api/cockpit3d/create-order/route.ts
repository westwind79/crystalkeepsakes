// app/api/cockpit3d/create-order/route.ts
// API route to submit orders to Cockpit3D after payment success

import { NextRequest, NextResponse } from 'next/server'
import { buildCockpit3DOrder, validateCockpit3DOrder } from '@/lib/cockpit3d-order-builder'
import { createOrder } from '@/lib/cockpit3d'
import { logger } from '@/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      orderNumber,
      cartItems,
      customer,
      paymentIntentId,
      stripeCustomerId
    } = body

    if (!orderNumber || !cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    logger.info('Creating Cockpit3D order', {
      orderNumber,
      itemCount: cartItems.length,
      hasCustomer: !!customer
    })

    // Build Cockpit3D order structure
    const cockpit3DOrder = buildCockpit3DOrder(
      orderNumber,
      cartItems,
      customer
    )

    // Validate order before submission
    const validation = validateCockpit3DOrder(cockpit3DOrder)
    if (!validation.isValid) {
      logger.error('Invalid Cockpit3D order', { errors: validation.errors })
      return NextResponse.json(
        { 
          error: 'Invalid order data', 
          details: validation.errors 
        },
        { status: 400 }
      )
    }

    // Submit to Cockpit3D API
    try {
      const cockpit3DResponse = await createOrder(cockpit3DOrder)
      
      logger.success('Order submitted to Cockpit3D', {
        orderNumber,
        cockpit3dOrderId: cockpit3DResponse.id,
        status: cockpit3DResponse.status
      })

      return NextResponse.json({
        success: true,
        orderNumber,
        cockpit3dOrderId: cockpit3DResponse.id,
        cockpit3dStatus: cockpit3DResponse.status,
        message: 'Order submitted successfully'
      })

    } catch (cockpit3DError: any) {
      logger.error('Cockpit3D API error', cockpit3DError)
      
      // Don't fail the order - save for manual review
      return NextResponse.json({
        success: false,
        orderNumber,
        error: 'Failed to submit to Cockpit3D - order will be processed manually',
        details: cockpit3DError.message,
        requiresManualReview: true
      })
    }

  } catch (error: any) {
    logger.error('Order creation failed', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
