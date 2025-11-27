# Comprehensive Pricing, Categories & Cart System Plan

**Date:** November 16, 2025
**Branch:** v5
**Status:** 📋 Planning Phase - REVIEW BEFORE IMPLEMENTATION

---

## 🎯 Goals Summary

1. **Reliable Pricing System** - Admin panel as single source of truth
2. **Advanced Pricing Structure** - Cost, base price, margins, sales, coupons, events
3. **Manual Category Management** - Override auto-detection when needed
4. **Cart → Cockpit3D Integration** - Proper payload structure for order confirmation

---

## 📊 ISSUE 1: Pricing System Overhaul

### Current Problem:
```
❌ Catalog prices not reliable
❌ Only basePrice tracked
❌ No cost/margin tracking
❌ No coupon/discount system
❌ No event pricing
```

### Proposed Solution: Complete Pricing Model

#### Product Type Definition:
```typescript
interface ProductPricing {
  // Base Economics
  costPrice: number;           // What we pay (internal only)
  basePrice: number;           // Regular retail price
  profitMargin: number;        // Percentage (e.g., 40 = 40%)
  
  // Sales & Discounts
  salePrice?: number;          // Temporary sale price
  saleActive: boolean;         // Is sale currently active
  saleStartDate?: string;      // ISO date
  saleEndDate?: string;        // ISO date
  
  // Coupons & Discounts
  couponCodes?: CouponCode[];  // Array of applicable coupons
  quantityDiscount?: {         // Bulk pricing
    qty: number;
    discountPercent: number;
  }[];
  
  // Event Pricing
  eventPricing?: {
    eventName: string;         // "Christmas", "Valentine's Day", etc.
    eventPrice: number;
    startDate: string;
    endDate: string;
    active: boolean;
  }[];
  
  // Calculated Fields (auto-calculated)
  currentPrice: number;        // Final price customer pays
  youSave?: number;           // Discount amount
  discountPercent?: number;   // Discount percentage
}

interface CouponCode {
  code: string;              // "SAVE10"
  type: 'percent' | 'fixed'; // Percentage or fixed amount
  value: number;             // 10 (%) or 5.00 ($)
  minPurchase?: number;      // Minimum order value
  maxDiscount?: number;      // Cap on discount
  validFrom: string;
  validUntil: string;
  active: boolean;
}
```

#### Admin Panel Updates Needed:
```
Pricing Tab → New Structure:

┌─────────────────────────────────────┐
│ COST & PRICING                      │
├─────────────────────────────────────┤
│ Cost Price (What we pay):    $___  │
│ Profit Margin:                ___% │
│ Base Price (Auto):           $___  │ ← Calculated from cost + margin
│ Override Base Price:         $___  │ ← Manual override if needed
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ SALE PRICING                        │
├─────────────────────────────────────┤
│ ☑ On Sale                           │
│ Sale Price:                  $___  │
│ Start Date:              [____]    │
│ End Date:                [____]    │
│ Auto-activate sale:      ☐         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ EVENT PRICING                       │
├─────────────────────────────────────┤
│ + Add Event Pricing                 │
│                                     │
│ Event: [Christmas 2025 ▼]          │
│ Special Price:           $___      │
│ Start: [12/01/2025]    End: [__]  │
│ ☑ Active                            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ COUPON CODES                        │
├─────────────────────────────────────┤
│ + Add Coupon Code                   │
│                                     │
│ Codes applicable to this product:   │
│ • SAVE10 (10% off) ✓ Active        │
│ • HOLIDAY25 (25% off) ✓ Active     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ QUANTITY DISCOUNTS                  │
├─────────────────────────────────────┤
│ Buy 5+:   5% off                   │
│ Buy 10+:  10% off                  │
│ Buy 25+:  15% off                  │
│ + Add Tier                          │
└─────────────────────────────────────┘
```

---

## 📁 ISSUE 2: Manual Category Management

### Current Problem:
```
❌ Only auto-detection (name-based)
❌ Can't manually add "Memorial" if product doesn't have keyword
❌ No "Occasions" category option
❌ Can't override incorrect auto-detection
```

### Proposed Solution: Hybrid System

#### Data Structure:
```typescript
interface ProductCategories {
  // Auto-detected (read-only display)
  autoDetected: string[];      // ['3d-crystals', 'heart-shapes']
  
  // Manual overrides
  manualCategories: string[];  // ['memorial', 'occasions']
  
  // Combined (what's actually used)
  activeCategories: string[];  // autoDetected + manualCategories
  
  // Settings
  disableAutoDetection: boolean; // Ignore auto-detect completely
}
```

#### Admin Panel - Categories Tab:
```
┌─────────────────────────────────────┐
│ AUTO-DETECTED CATEGORIES            │
├─────────────────────────────────────┤
│ Based on product name/ID:            │
│ • 3D Crystals                        │
│ • Heart Shapes                       │
│                                      │
│ ☐ Disable auto-detection             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ MANUAL CATEGORIES                    │
├─────────────────────────────────────┤
│ Add categories manually:             │
│                                      │
│ ☑ Memorial & Tribute                 │
│ ☑ Occasions                          │
│ ☐ Wedding & Anniversary              │
│ ☐ Birthday                           │
│ ☐ Graduation                         │
│ ☐ Baby & Newborn                     │
│ ☐ Pet Memorial                       │
│ ☐ Religious                          │
│ ☐ Sports & Hobbies                   │
│ ☐ Corporate Gifts                    │
│                                      │
│ + Add Custom Category                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ACTIVE CATEGORIES (Final)            │
├─────────────────────────────────────┤
│ These will appear on the website:    │
│                                      │
│ • 3D Crystals (auto) ✓              │
│ • Heart Shapes (auto) ✓             │
│ • Memorial & Tribute (manual) ✓     │
│ • Occasions (manual) ✓              │
└─────────────────────────────────────┘
```

#### New Categories to Add:
```typescript
const OCCASION_CATEGORIES = [
  {
    value: 'memorial',
    label: 'Memorial & Tribute',
    icon: '🕊️',
    description: 'Honor and remember loved ones'
  },
  {
    value: 'occasions',
    label: 'Special Occasions',
    icon: '🎉',
    description: 'All special moments'
  },
  {
    value: 'wedding',
    label: 'Wedding & Anniversary',
    icon: '💍',
    description: 'Celebrate love and commitment'
  },
  {
    value: 'birthday',
    label: 'Birthday',
    icon: '🎂',
    description: 'Birthday celebrations'
  },
  {
    value: 'graduation',
    label: 'Graduation',
    icon: '🎓',
    description: 'Academic achievements'
  },
  {
    value: 'baby',
    label: 'Baby & Newborn',
    icon: '👶',
    description: 'Welcome new arrivals'
  },
  {
    value: 'religious',
    label: 'Religious',
    icon: '✝️',
    description: 'Faith-based occasions'
  },
  {
    value: 'corporate',
    label: 'Corporate Gifts',
    icon: '💼',
    description: 'Business and corporate gifting'
  }
];
```

---

## 🛒 ISSUE 3: Cart → Cockpit3D Payload Structure

### Current Problem:
```
❌ Cart data structure doesn't match Cockpit3D requirements
❌ No clear mapping for order confirmation
❌ Missing fields for API submission
```

### Cockpit3D API Requirements (Document What's Needed):

**What we need to know:**
1. What is the EXACT payload structure Cockpit3D expects?
2. What are the required fields?
3. How are custom images handled?
4. How are options (sizes, lightbases, etc.) sent?
5. What's the authentication method?

#### Proposed Cart Item Structure:
```typescript
interface CartItem {
  // Product Identity
  productId: string;
  productName: string;
  slug: string;
  
  // Pricing (matches new pricing model)
  basePrice: number;
  currentPrice: number;        // After discounts
  quantity: number;
  subtotal: number;
  
  // Discounts Applied
  discounts: {
    type: 'sale' | 'coupon' | 'event' | 'quantity';
    code?: string;             // For coupons
    amount: number;
    description: string;
  }[];
  
  // Product Options
  selectedSize?: {
    id: string;
    name: string;
    price: number;
  };
  selectedLightBase?: {
    id: string;
    name: string;
    price: number;
  };
  selectedBackground?: {
    id: string;
    name: string;
    price: number;
  };
  customText?: {
    text: string;
    price: number;
  };
  
  // Custom Image
  customImage?: {
    originalUrl: string;
    maskedUrl?: string;
    uploadedAt: string;
  };
  
  // For Cockpit3D
  cockpit3dData: {
    productId: string;         // Cockpit3D product ID
    variantId?: string;        // If applicable
    options: {
      [key: string]: any;      // Cockpit3D format
    };
    imageUrls: string[];       // Processed images
    // ... other required fields
  };
}
```

#### Order Confirmation → Cockpit3D Flow:
```
1. Stripe Payment Success
   ↓
2. Order Confirmation Page
   ↓
3. Transform Cart → Cockpit3D Payload
   ↓
4. POST to Cockpit3D API
   ↓
5. Send Email Notifications
   - Customer confirmation
   - Admin notification
   ↓
6. Store order in database (if needed)
```

---

## 📝 Implementation Priority

### Phase 1: Pricing System (HIGH PRIORITY)
**Files to Modify:**
- `/app/src/app/admin/products/page.tsx` - Admin pricing UI
- `/app/src/types/` - New pricing types
- `/app/src/utils/pricingCalculator.ts` - NEW - Price calculation logic
- `/app/src/components/ProductCard.tsx` - Show correct price
- `/app/src/components/ProductDetailClient.tsx` - Use new pricing

**Tasks:**
1. Create comprehensive pricing type definitions
2. Add pricing fields to admin panel
3. Create price calculator utility
4. Update frontend to use calculated prices
5. Add coupon code validator
6. Add event pricing scheduler

### Phase 2: Manual Categories (MEDIUM PRIORITY)
**Files to Modify:**
- `/app/src/utils/categoriesConfig.ts` - Add manual categories
- `/app/src/app/admin/products/page.tsx` - Category management UI
- `/app/src/app/products/page.tsx` - Show all categories

**Tasks:**
1. Add new occasion categories
2. Create manual category checkboxes in admin
3. Merge auto + manual categories
4. Update category filters on products page

### Phase 3: Cart → Cockpit3D (CRITICAL)
**Files to Modify:**
- `/app/src/types/cart.ts` - Cart item structure
- `/app/src/lib/cartUtils.ts` - Cart transformers
- `/app/src/app/order-confirmation/` - Order submission
- `/app/src/lib/cockpit3d-api.ts` - NEW - API client

**Tasks:**
1. **FIRST:** Document Cockpit3D API requirements
2. Create cart → Cockpit3D transformer
3. Build API submission handler
4. Add email notification system
5. Error handling & retry logic

---

## ❓ Questions Before Implementation

### Pricing Questions:
1. What profit margin percentage do you typically use?
2. Should profit margin be product-specific or global?
3. Do you want automatic price calculations or manual override?
4. How do you want to handle coupon code creation? (Global or per-product?)

### Category Questions:
1. Should I add all the suggested occasion categories?
2. Any other categories you need?
3. Should auto-detection be on by default with manual override option?

### Cockpit3D Questions:
1. **CRITICAL:** Do you have API documentation for Cockpit3D?
2. What endpoint do we POST orders to?
3. What authentication is required?
4. How are custom images submitted?
5. What's the response format?
6. Is there a sandbox/test environment?

---

## 🚀 Next Steps

**BEFORE I IMPLEMENT ANYTHING:**

1. **REVIEW THIS PLAN** - Tell me what looks good and what needs adjustment
2. **ANSWER QUESTIONS** - Especially Cockpit3D API details
3. **PRIORITIZE** - What should I build first?
4. **PROVIDE API DOCS** - For Cockpit3D integration (if available)

Once approved, I'll implement in phases with testing after each phase.

---

**Status:** ⏸️ AWAITING YOUR REVIEW & APPROVAL
