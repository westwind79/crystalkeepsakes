# Crystal Keepsakes - Admin Panel Enhancement PRD

## Original Problem Statement
User reported 3 issues with Admin Panel:
1. Light bases disappearing when unchecked in 3D Crystal Urn/Candles - options should remain visible
2. Price sync between standalone light base products and product options not working
3. Products with multiple sizes (like Cut Corner Diamond) only showing ONE base price instead of price range

## Architecture & Implementation

### Changes Made (Jan 29, 2026)
1. **MASTER_LIGHTBASES constant** - Added master list of all available light bases to ensure options never disappear
2. **LIGHTBASE_PRODUCT_MAP** - Maps lightbase option IDs to standalone product IDs for price syncing
3. **Enhanced getProductData()** - Ensures all master light bases are present with proper enabled state and synced prices
4. **Enhanced updateProduct()** - Syncs lightbase prices bidirectionally when standalone product prices change
5. **Price Range Display** - Product list now shows "$min - $max" for products with multiple sizes

### Key Files Modified
- `/app/src/app/admin/page.tsx` - Main admin panel component

## What's Been Implemented

### Issue 1: Light Bases Never Disappear ✅
- All 10 light base options always visible
- Unchecked options remain with empty checkbox
- Options: No Base, Lightbase Rectangle, Lightbase Square, Lightbase Wood Small/Medium/Long, Rotating LED, Wooden Premium Base Mini, Concave Lightbase, Ornament Stand

### Issue 2: Price Sync ✅
- Changing standalone lightbase product price syncs to all products using that lightbase
- Bidirectional sync when changing option price in product

### Issue 3: Size-Based Pricing ✅
- Product list shows price range (e.g., "$50 - $70") for products with sizes
- Individual size prices editable
- Base Price auto-calculated from smallest enabled size

## Core Requirements (Static)
- Next.js application for crystal keepsake e-commerce
- Admin panel for product management
- Price management with size options
- Light base options with global price sync

## P0/P1/P2 Features Remaining

### P0 (Critical) - Complete
- ✅ Light base options visibility
- ✅ Price synchronization
- ✅ Size-based pricing display

### P1 (High Priority) - Backlog
- None identified

### P2 (Nice to Have) - Future
- Batch editing for multiple products
- Price history tracking
- Export/import functionality

## Next Tasks
- User testing of all 3 fixes
- Consider adding undo functionality for price changes
