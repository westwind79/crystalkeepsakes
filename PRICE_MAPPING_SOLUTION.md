# Cockpit3D Price Mapping - Complete Solution

## Date: 2025-01-14

---

## The Root Cause

You're absolutely right! The prices DON'T match your Cockpit3D portal because:

1. **Missing Prices in Raw Data**: The Cockpit3D API returns option values WITHOUT prices when `change_qty: true`
2. **Hardcoded Fallback Prices**: The PHP data fetcher has fallback prices:
   - 2D Backdrop: $12
   - 3D Backdrop: $15  
   - Custom Text: $9.50
3. **Lightbase Prices Missing**: Lightbase option values have NO price field in the API
4. **Size Prices Missing**: Size variations don't include their actual prices

## Where Prices SHOULD Come From

According to the Cockpit3D API documentation:

### For Products with `change_qty: true`:
When an option has `change_qty: true`, it means that option value is actually a **separate product** that needs to be looked up in the products list.

**Example:**
```json
{
  "name": "Light Base",
  "values": [
    {
      "id": "207",
      "name": "Lightbase Rectangle",
      "change_qty": true  // ← This is a separate product!
    }
  ]
}
```

You need to:
1. Find product with SKU = "Lightbase_Rectangle" in the products list
2. Get its price from `product.price`

### Current Data Flow (BROKEN):

```
Cockpit3D API
  ↓
cockpit3d-raw-products.js (no option prices)
  ↓
cockpit3d-data-fetcher.php (looks for prices that don't exist)
  ↓
Uses fallback hardcoded prices
  ↓
cockpit3d-products.js (wrong prices!)
  ↓
Website shows incorrect prices
```

### Correct Data Flow (FIXED):

```
Cockpit3D API
  ↓
cockpit3d-raw-products.js (products with change_qty flags)
  ↓
cockpit3d-data-fetcher.php
  - For each option with change_qty=true:
    1. Look up that product ID in products list
    2. Get price from that product
    3. Map it to the option
  ↓
cockpit3d-products.js (correct prices from portal!)
  ↓
Website shows YOUR prices
```

---

## Solution: Price Lookup Mapping

### Step 1: Create Price Lookup Function

Add this to `/app/api/cockpit3d-data-fetcher.php`:

```php
/**
 * Look up price for an option value that has change_qty=true
 * These are separate products, so we need to find them in the products list
 */
private function lookupOptionPrice($valueId, $valueName, $allProducts) {
    // Try to find by ID first
    foreach ($allProducts as $product) {
        if ($product['id'] === $valueId) {
            console_log("✅ Found price by ID", [
                'id' => $valueId,
                'name' => $valueName,
                'price' => $product['price']
            ]);
            return (float)$product['price'];
        }
    }
    
    // Try to find by matching SKU/name
    $searchName = str_replace(' ', '_', $valueName);
    foreach ($allProducts as $product) {
        if ($product['sku'] === $searchName || 
            strtolower($product['sku']) === strtolower($searchName)) {
            console_log("✅ Found price by SKU", [
                'sku' => $product['sku'],
                'name' => $valueName,
                'price' => $product['price']
            ]);
            return (float)$product['price'];
        }
    }
    
    console_log("⚠️ No price found for option", [
        'id' => $valueId,
        'name' => $valueName
    ]);
    
    return null;
}
```

### Step 2: Update extractProductLightbases()

```php
private function extractProductLightbases($productOptions, $allProducts = []) {
    $lightbases = [
        [
            'id' => 'none',
            'name' => 'No Base',
            'price' => null
        ]
    ];
    
    foreach ($productOptions as $option) {
        if ($option['name'] === 'Light Base' && isset($option['values']) && is_array($option['values'])) {
            foreach ($option['values'] as $value) {
                // Check if this option has change_qty = true
                $hasChangeQty = isset($value['change_qty']) && $value['change_qty'] === true;
                
                // If change_qty=true, lookup price from products list
                $price = null;
                if ($hasChangeQty && !empty($allProducts)) {
                    $price = $this->lookupOptionPrice($value['id'], $value['name'], $allProducts);
                } else if (isset($value['price']) && is_numeric($value['price'])) {
                    $price = (float)$value['price'];
                }
                
                $lightbases[] = [
                    'id' => (string)$value['id'],
                    'name' => $value['name'],
                    'price' => $price
                ];
                
                if ($price === null) {
                    console_log("⚠️ Lightbase without price", $value['name']);
                }
            }
            break;
        }
    }
    
    return $lightbases;
}
```

### Step 3: Update transformCockpit3dProduct() Call

```php
// Line ~437 - pass $rawProducts to extractProductLightbases
if (!$isKeychainOrOrnament) {
    if (isset($rawProduct['options']) && is_array($rawProduct['options'])) {
        $transformed['lightBases'] = $this->extractProductLightbases(
            $rawProduct['options'],
            $rawProducts  // ← ADD THIS - pass all products for lookup
        );
        console_log("✅ Lightbases extracted from product options", count($transformed['lightBases']));
    }
}
```

### Step 4: Update Size Options Extraction

```php
// Line ~410-430 - update size extraction
if ($option['name'] === 'Size' && isset($option['values'])) {
    $transformed['sizes'] = array_map(function($value) use ($rawProduct, $rawProducts) {
        // Check if change_qty=true (meaning separate product)
        $hasChangeQty = isset($value['change_qty']) && $value['change_qty'] === true;
        
        if ($hasChangeQty) {
            // Look up price from products list
            $price = $this->lookupOptionPrice($value['id'], $value['name'], $rawProducts);
        } else if (isset($value['price']) && is_numeric($value['price'])) {
            $price = (float)$value['price'];
        } else {
            $price = (float)$rawProduct['price']; // fallback to base price
        }

        return [
            'id' => (string)$value['id'],
            'name' => $value['name'],
            'price' => $price
        ];
    }, $option['values']);
}
```

---

## Testing the Fix

### 1. Check Raw Data for change_qty

```bash
# Check if lightbases have change_qty flag
grep -A 5 '"id": "207"' src/data/cockpit3d-raw-products.js
```

Expected:
```json
{
  "id": "207",
  "name": "Lightbase Rectangle",
  "change_qty": true  // ← Should be present
}
```

### 2. Check if Lightbase is in Products List

```bash
# Search for lightbase as a product
grep -i "Lightbase Rectangle" src/data/cockpit3d-raw-products.js | head -5
```

Expected: Should find it listed as a product with a price.

### 3. Rebuild Products

```bash
# Run the data fetcher
http://localhost:8888/crystalkeepsakes/api/cockpit3d-data-fetcher.php?action=generate-products
```

### 4. Verify Prices

```javascript
// Check the final output
const products = require('./src/data/cockpit3d-products.js').cockpit3dProducts;
const diamond = products.find(p => p.name.includes('Diamond'));

console.log('Lightbases:', diamond.lightBases);
// Should show prices now!
```

---

## Expected vs Actual Prices

Based on your Cockpit3D portal, verify these prices after the fix:

| Option | Current (Wrong) | Portal (Correct) | Status |
|--------|----------------|------------------|--------|
| 2D Backdrop | $12 (hardcoded) | ? | Check portal |
| 3D Backdrop | $15 (hardcoded) | ? | Check portal |
| Custom Text | $9.50 (hardcoded) | ? | Check portal |
| Lightbase Rectangle | Missing | ? | Check portal |
| Rotating LED | Missing | ? | Check portal |

---

## Alternative: Manual Price Override File

If the API doesn't provide prices correctly, create a price mapping file:

**File:** `/app/api/price-overrides.json`

```json
{
  "lightbases": {
    "207": 25.00,
    "476": 35.00,
    "857": 60.00,
    "206": 25.00
  },
  "backgrounds": {
    "2d": 12.00,
    "3d": 15.00
  },
  "text": {
    "custom": 9.50
  },
  "sizes": {
    "202": 70.00,
    "549": 85.00,
    "550": 105.00
  }
}
```

Then load it in the data fetcher:
```php
$priceOverrides = json_decode(file_get_contents(__DIR__ . '/price-overrides.json'), true);
```

---

## Next Steps

1. **Check your Cockpit3D portal** for the actual prices
2. **Decide**: Should we:
   - a) Fix the data fetcher to lookup prices from products list?
   - b) Create a manual price override file based on your portal?
   - c) Both (price override as fallback)?

3. **Once prices are correct**, we can move to:
   - Fix cart data structure
   - Fix Stripe checkout integration
   - Complete Cockpit3D order fulfillment

**Which approach do you prefer?**
