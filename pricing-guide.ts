// GUIDE: Using Your Own Pricing with Cockpit3D Fulfillment
// Version: 1.0.0 | Date: 2025-10-23

/**
 * THE STRATEGY:
 * 
 * 1. Customer shops on YOUR site with YOUR prices
 * 2. Customer pays YOU via Stripe (your full retail price)
 * 3. You submit order to Cockpit3D for fulfillment (they don't see your price)
 * 4. You pay Cockpit3D their wholesale/cost price (via invoice later)
 * 5. You keep the margin as profit
 * 
 * Cockpit3D is just a fulfillment partner - they don't need your selling prices!
 */

// ============================================================================
// STEP 1: Map Your Products to Cockpit3D SKUs
// ============================================================================

export interface ProductMapping {
  yourSKU: string           // Your internal SKU
  yourPrice: number         // What you charge customers
  cockpit3dSKU: string      // Their SKU for order submission
  cockpit3dProductId: string // Their product ID
}

const PRODUCT_MAPPINGS: ProductMapping[] = [
  {
    yourSKU: 'CK-DIAMOND-5X5',
    yourPrice: 89.99,
    cockpit3dSKU: 'Cut_Corner_Diamond',
    cockpit3dProductId: '104'
  },
  {
    yourSKU: 'CK-DIAMOND-6X6',
    yourPrice: 109.99,
    cockpit3dSKU: 'Cut_Corner_Diamond',
    cockpit3dProductId: '104'
  },
  // Add all your products...
]

// ============================================================================
// STEP 2: Map Your Options to Cockpit3D Option IDs
// ============================================================================

export interface OptionMapping {
  yourOptionName: string
  yourOptionValue: string
  yourPrice: number          // What you charge for this add-on
  cockpit3dOptionId: string
  cockpit3dValueId: string
}

const OPTION_MAPPINGS: OptionMapping[] = [
  // Sizes
  {
    yourOptionName: 'size',
    yourOptionValue: '5x5cm',
    yourPrice: 0,  // Included in base price
    cockpit3dOptionId: '151',
    cockpit3dValueId: '202'
  },
  {
    yourOptionName: 'size',
    yourOptionValue: '6x6cm',
    yourPrice: 20,  // +$20 over base
    cockpit3dOptionId: '151',
    cockpit3dValueId: '549'
  },
  
  // Light bases
  {
    yourOptionName: 'lightBase',
    yourOptionValue: 'rectangle',
    yourPrice: 29.99,
    cockpit3dOptionId: '152',
    cockpit3dValueId: '207'
  },
  {
    yourOptionName: 'lightBase',
    yourOptionValue: 'rotating',
    yourPrice: 39.99,
    cockpit3dOptionId: '152',
    cockpit3dValueId: '476'
  },
  
  // Add all your options...
]

// ============================================================================
// STEP 3: Calculate Order Total (For Stripe)
// ============================================================================

interface CartItem {
  sku: string
  quantity: number
  selectedOptions: Record<string, string>
}

export function calculateYourPrice(items: CartItem[]): number {
  let total = 0
  
  for (const item of items) {
    // Find product mapping
    const product = PRODUCT_MAPPINGS.find(p => p.yourSKU === item.sku)
    if (!product) continue
    
    // Add base price
    total += product.yourPrice * item.quantity
    
    // Add option prices
    for (const [optionName, optionValue] of Object.entries(item.selectedOptions)) {
      const option = OPTION_MAPPINGS.find(
        o => o.yourOptionName === optionName && o.yourOptionValue === optionValue
      )
      if (option) {
        total += option.yourPrice * item.quantity
      }
    }
  }
  
  return total
}

// ============================================================================
// STEP 4: Build Cockpit3D Order (No Prices Sent!)
// ============================================================================

export function buildCockpit3DOrder(
  items: CartItem[],
  customerInfo: any,
  stripePaymentId: string
) {
  return {
    retailer_id: process.env.COCKPIT3D_RETAILER_ID, // Still need this!
    
    address: {
      email: customerInfo.email,
      firstname: customerInfo.firstName,
      lastname: customerInfo.lastName,
      telephone: customerInfo.phone,
      region: customerInfo.state,
      country: customerInfo.country,
      street: customerInfo.address,
      city: customerInfo.city,
      postcode: customerInfo.zipCode,
      shipping_method: 'air',
      destination: 'customer_home',
      staff_user: 'Web Order',
      order_id: stripePaymentId,  // Use Stripe payment ID as order reference
      voyage_code: ''
    },
    
    items: items.map(item => {
      const product = PRODUCT_MAPPINGS.find(p => p.yourSKU === item.sku)
      
      return {
        sku: product?.cockpit3dSKU || item.sku,
        qty: String(item.quantity),
        client_item_id: `${stripePaymentId}-${item.sku}`,
        
        // Map your options to their option IDs
        options: mapOptions(item.selectedOptions),
        
        // Image if provided
        original_photo: item.imageUrl || '',
        cropped_photo: item.maskedImageUrl || '',
        
        // Custom text
        special_instructions: item.customText || '',
        
        "2d": false
      }
    })
  }
}

function mapOptions(selectedOptions: Record<string, string>) {
  const mapped = []
  
  for (const [optionName, optionValue] of Object.entries(selectedOptions)) {
    const mapping = OPTION_MAPPINGS.find(
      o => o.yourOptionName === optionName && o.yourOptionValue === optionValue
    )
    
    if (mapping) {
      mapped.push({
        id: mapping.cockpit3dOptionId,
        qty: "1",
        value: mapping.cockpit3dValueId
      })
    }
  }
  
  return mapped
}

// ============================================================================
// STEP 5: Complete Checkout Flow
// ============================================================================

export async function processCheckout(cart: CartItem[], customerInfo: any) {
  // 1. Calculate YOUR selling price
  const totalAmount = calculateYourPrice(cart)
  
  // 2. Charge customer via Stripe (YOUR price)
  const paymentIntent = await fetch('/api/stripe/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: totalAmount * 100,  // Cents
      orderId: `CK-${Date.now()}`
    })
  }).then(r => r.json())
  
  // 3. Confirm payment
  const stripe = await getStripe()
  const { error } = await stripe!.confirmPayment({
    elements,
    redirect: 'if_required'
  })
  
  if (error) throw error
  
  // 4. Submit order to Cockpit3D for fulfillment (no prices sent)
  const cockpitOrder = buildCockpit3DOrder(cart, customerInfo, paymentIntent.id)
  
  const fulfillment = await fetch('/api/cockpit3d/submit-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cockpitOrder)
  }).then(r => r.json())
  
  // 5. Done! Customer paid YOU, Cockpit3D will fulfill
  return {
    success: true,
    orderId: paymentIntent.id,
    cockpitOrderId: fulfillment.orderId,
    amountCharged: totalAmount
  }
}

// ============================================================================
// IMPORTANT NOTES
// ============================================================================

/**
 * 1. PRICING SEPARATION
 *    - Customer sees YOUR prices on YOUR site
 *    - Stripe charges YOUR prices
 *    - Cockpit3D never sees YOUR prices
 *    - You pay Cockpit3D separately (monthly invoice)
 * 
 * 2. MARGIN CALCULATION
 *    Your Profit = (Your Price) - (Cockpit3D Cost)
 *    Example: You charge $89.99, they charge you $50, profit = $39.99
 * 
 * 3. RETAILER_ID
 *    You still need this for order submission!
 *    Run the PHP scripts I gave you to find it.
 * 
 * 4. PRICING UPDATES
 *    Update YOUR prices anytime in your code
 *    Cockpit3D billing is separate
 * 
 * 5. SALES/PROMOTIONS
 *    Run sales on YOUR site independently
 *    Your margin shrinks during sales, but you control it
 */