// app/api/stripe/create-checkout-session/route.ts
// Development-only Stripe Checkout Session Creator
// NOTE: This is for DEVELOPMENT only. Production uses PHP at /api/stripe/create-checkout-session.php

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== STRIPE CHECKOUT SESSION REQUEST ===');
    
    // Get Stripe key from environment
    const stripeSecretKey = process.env.STRIPE_DEVELOPMENT_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.error('❌ Stripe secret key not found');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Stripe not configured. Please add STRIPE_DEVELOPMENT_SECRET_KEY to .env.local' 
        },
        { status: 500 }
      );
    }
    
    // Import Stripe
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    });
    
    // Parse request body
    const body = await request.json();
    const { cartItems, subtotal, orderNumber } = body;
    
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      );
    }
    
    console.log(`✓ Cart items: ${cartItems.length}`);
    
    // Build line items for Stripe
    const lineItems = cartItems.map((item: any) => {
      const priceInCents = Math.round((item.price || 0) * 100);
      console.log(`  - ${item.name} (SKU: ${item.sku}): $${item.price} x ${item.quantity}`);
      
      return {
        price_data: {
          currency: 'usd',
          unit_amount: priceInCents,
          product_data: {
            name: item.name || 'Product',
            description: `SKU: ${item.sku || 'UNKNOWN'}`,
          },
        },
        quantity: item.quantity || 1,
      };
    });
    
    // Get base URL from request
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const successUrl = `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/cart`;
    
    console.log(`Success URL: ${successUrl}`);
    console.log(`Cancel URL: ${cancelUrl}`);
    
    // Prepare metadata
    const cartSummary = cartItems.map((item: any) => ({
      sku: item.sku || 'UNKNOWN',
      name: item.name || 'Product',
      qty: item.quantity || 1,
    }));
    
    const metadata = {
      order_number: orderNumber || `DEV-${Date.now()}`,
      environment: 'development',
      items_count: String(cartItems.length),
      cart_items: JSON.stringify(cartSummary).substring(0, 500),
    };
    
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: metadata,
      
      // Collect shipping address
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      
      // Shipping options
      shipping_options: [
        { shipping_rate: 'shr_1RRRX82YE48VQlzYpcQsdaSE' }, // 3-5 Business Days
        { shipping_rate: 'shr_1RRRZF2YE48VQlzY3XrqHEPm' }, // 5-7 Ground Ship
        { shipping_rate: 'shr_1RRRZp2YE48VQlzYYqNzpUQj' }, // 7-10 Ground Ship
        { shipping_rate: 'shr_1RRRaI2YE48VQlzYUG3v8RPf' }, // 10-14 Ground Ship
        { shipping_rate: 'shr_1RRRbE2YE48VQlzYypBEVG4V' }, // 3-4 Weeks Postal
      ],
      
      // Allow promo codes
      allow_promotion_codes: true,
      
      // Enable automatic tax
      automatic_tax: { enabled: true },
    });
    
    console.log(`✓ Checkout session created: ${session.id}`);
    console.log('=== REQUEST COMPLETE ===');
    
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      order_number: metadata.order_number,
    });
    
  } catch (error: any) {
    console.error('❌ Stripe Checkout Error:', error.message);
    console.error('Stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create checkout session' 
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
