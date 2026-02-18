<?php
/**
 * Test Order Payload Script
 * Tests the complete order flow from checkout to Cockpit3D
 * 
 * Run: php api/test-order-flow.php
 */

require_once __DIR__ . '/env-loader.php';

echo "=================================================\n";
echo "Crystal Keepsakes - Order Payload Test\n";
echo "=================================================\n\n";

// Check environment
echo "📋 Environment Check:\n";
echo "  COCKPIT3D_API_URL: " . (getEnvVar('COCKPIT3D_API_URL') ?: 'NOT SET (will use dev URL)') . "\n";
echo "  COCKPIT3D_USERNAME: " . (getEnvVar('COCKPIT3D_USERNAME') ? '✓ SET' : '✗ NOT SET') . "\n";
echo "  COCKPIT3D_PASSWORD: " . (getEnvVar('COCKPIT3D_PASSWORD') ? '✓ SET' : '✗ NOT SET') . "\n";
echo "  COCKPIT3D_RETAILER_ID: " . (getEnvVar('COCKPIT3D_RETAILER_ID') ?: getEnvVar('COCKPIT3D_RETAIL_ID') ?: 'NOT SET') . "\n";
echo "  NEXT_PUBLIC_ENV_MODE: " . (getEnvVar('NEXT_PUBLIC_ENV_MODE') ?: 'NOT SET') . "\n";
echo "\n";

// Light base mapping (same as in PHP files)
$LIGHTBASE_COCKPIT3D_MAP = [
    'lightbase-rectangle' => '105',
    'lightbase-square' => '106',
    'lightbase-wood-small' => '107',
    'lightbase-wood-medium' => '108',
    'lightbase-wood-long' => '119',
    'rotating-led-lightbase' => '160',
    'concave-lightbase' => '276',
    'ornament-stand' => '279',
    'wooden-premium-base-mini' => '107',
];

// Simulate a cart item as it would come from the frontend
$testCartItem = [
    'productId' => '104',
    'cockpit3d_id' => '104',
    'name' => 'Cut Corner Diamond',
    'sku' => 'CCD-001',
    'price' => 92.50, // Base + options
    'quantity' => 1,
    'sizeDetails' => [
        'sizeId' => '202',
        'sizeName' => 'Cut Corner Diamond (5x5cm)',
        'cockpit3d_id' => '202', // This is the Cockpit3D product ID for this size
        'basePrice' => 50
    ],
    'options' => [
        [
            'category' => 'lightBase',
            'optionId' => 'lightbase-rectangle', // Frontend uses this ID
            'cockpit3d_option_id' => null, // May be null if not in product data
            'name' => 'Lightbase Rectangle',
            'value' => 'Lightbase Rectangle',
            'priceModifier' => 25
        ],
        [
            'category' => 'background',
            'optionId' => '2d',
            'cockpit3d_option_id' => '154', // 2D Backdrop option
            'name' => '2D Backdrop',
            'value' => '2D Backdrop',
            'priceModifier' => 8
        ],
        [
            'category' => 'customText',
            'optionId' => 'custom-text',
            'cockpit3d_option_id' => '199', // customer_text option
            'name' => 'Custom Text',
            'value' => 'Custom Text Added',
            'priceModifier' => 9.50,
            'line1' => 'In Loving Memory',
            'line2' => 'Forever in Our Hearts'
        ]
    ],
    'customText' => [
        'text' => "In Loving Memory\nForever in Our Hearts"
    ],
    'maskedImageUrl' => 'https://crystalkeepsakes.com/crystal-data/orders/CK_TEST_001/masked.jpg',
    'rawImageUrl' => 'https://crystalkeepsakes.com/crystal-data/orders/CK_TEST_001/original.jpg'
];

echo "📦 Test Cart Item:\n";
echo json_encode($testCartItem, JSON_PRETTY_PRINT) . "\n\n";

// Build Cockpit3D options array (same logic as PHP backend)
function buildCockpit3DOptions($item, $lightbaseMap) {
    $options = [];
    
    // Size option
    if (!empty($item['sizeDetails']['cockpit3d_id'])) {
        $options[] = [
            'id' => (string) $item['sizeDetails']['cockpit3d_id'],
            'qty' => '1'
        ];
        echo "  ✓ Size: cockpit3d_id = {$item['sizeDetails']['cockpit3d_id']}\n";
    }
    
    // Process options array
    if (!empty($item['options']) && is_array($item['options'])) {
        foreach ($item['options'] as $opt) {
            $category = $opt['category'] ?? '';
            
            // Light base option
            if ($category === 'lightBase') {
                $lbId = $opt['cockpit3d_id'] ?? $opt['cockpit3d_option_id'] ?? null;
                
                // If no cockpit3d ID, try mapping from optionId
                if (empty($lbId) && !empty($opt['optionId'])) {
                    $lbId = $lightbaseMap[$opt['optionId']] ?? null;
                    if ($lbId) {
                        echo "  ✓ LightBase: mapped '{$opt['optionId']}' -> '$lbId'\n";
                    } else {
                        echo "  ⚠ LightBase: no mapping for '{$opt['optionId']}'\n";
                    }
                }
                
                if (!empty($lbId) && $lbId !== 'none') {
                    $options[] = [
                        'id' => (string) $lbId,
                        'qty' => '1'
                    ];
                }
            }
            
            // Background option
            if ($category === 'background' && !empty($opt['cockpit3d_option_id'])) {
                $options[] = [
                    'id' => (string) $opt['cockpit3d_option_id'],
                    'qty' => '1'
                ];
                echo "  ✓ Background: cockpit3d_option_id = {$opt['cockpit3d_option_id']}\n";
            }
            
            // Custom text option
            if ($category === 'customText') {
                $textLines = [];
                if (!empty($opt['line1'])) $textLines[] = $opt['line1'];
                if (!empty($opt['line2'])) $textLines[] = $opt['line2'];
                
                if (!empty($textLines)) {
                    $options[] = [
                        'id' => '199', // customer_text option ID
                        'value' => $textLines
                    ];
                    echo "  ✓ CustomText: lines = " . json_encode($textLines) . "\n";
                }
            }
        }
    }
    
    return $options;
}

echo "🔧 Building Cockpit3D Options:\n";
$cockpit3dOptions = buildCockpit3DOptions($testCartItem, $LIGHTBASE_COCKPIT3D_MAP);
echo "\n";

echo "📤 Cockpit3D Options Array:\n";
echo json_encode($cockpit3dOptions, JSON_PRETTY_PRINT) . "\n\n";

// Build complete Cockpit3D order
$orderNumber = 'CK_TEST_' . date('YmdHis');
$retailerId = getEnvVar('COCKPIT3D_RETAILER_ID') ?: getEnvVar('COCKPIT3D_RETAIL_ID') ?: '256568874';

$cockpit3dOrder = [
    'retailer_id' => (int) $retailerId,
    'address' => [
        'email' => 'test@crystalkeepsakes.com',
        'firstname' => 'Test',
        'lastname' => 'Customer',
        'telephone' => '555-123-4567',
        'street' => '123 Test Street',
        'city' => 'Los Angeles',
        'region' => 'CA',
        'postcode' => '90210',
        'country' => 'US',
        'shipping_method' => 'air',
        'destination' => 'customer_home',
        'order_id' => $orderNumber,
        'staff_user' => 'Web Order'
    ],
    'items' => [
        [
            'sku' => $testCartItem['sku'],
            'qty' => (string) $testCartItem['quantity'],
            'client_item_id' => $orderNumber . '-1',
            'original_photo' => $testCartItem['rawImageUrl'],
            'cropped_photo' => $testCartItem['maskedImageUrl'],
            'options' => $cockpit3dOptions,
            'special_instructions' => 'Custom Text: In Loving Memory / Forever in Our Hearts'
        ]
    ]
];

echo "📦 Complete Cockpit3D Order Payload:\n";
echo json_encode($cockpit3dOrder, JSON_PRETTY_PRINT) . "\n\n";

// Validate the payload
echo "✅ Validation Results:\n";
$errors = [];
$warnings = [];

// Check retailer_id
if (empty($cockpit3dOrder['retailer_id'])) {
    $errors[] = "retailer_id is missing";
} else {
    echo "  ✓ retailer_id: {$cockpit3dOrder['retailer_id']}\n";
}

// Check order_id in address
if (empty($cockpit3dOrder['address']['order_id'])) {
    $errors[] = "address.order_id is missing";
} else {
    echo "  ✓ address.order_id: {$cockpit3dOrder['address']['order_id']}\n";
}

// Check items
if (empty($cockpit3dOrder['items'])) {
    $errors[] = "items array is empty";
} else {
    foreach ($cockpit3dOrder['items'] as $i => $item) {
        // Check SKU
        if (empty($item['sku'])) {
            $errors[] = "Item $i: sku is missing";
        }
        
        // Check options
        if (empty($item['options'])) {
            $warnings[] = "Item $i: options array is empty";
        } else {
            $hasSize = false;
            foreach ($item['options'] as $opt) {
                if ($opt['id'] === '202') $hasSize = true;
            }
            if (!$hasSize) {
                $warnings[] = "Item $i: no size option (cockpit3d_id) found";
            }
        }
        
        // Check images
        if (empty($item['original_photo'])) {
            $warnings[] = "Item $i: original_photo is missing";
        }
        if (empty($item['cropped_photo'])) {
            $warnings[] = "Item $i: cropped_photo is missing";
        }
    }
}

echo "\n";
if (!empty($errors)) {
    echo "❌ ERRORS:\n";
    foreach ($errors as $e) echo "   - $e\n";
}
if (!empty($warnings)) {
    echo "⚠️  WARNINGS:\n";
    foreach ($warnings as $w) echo "   - $w\n";
}
if (empty($errors) && empty($warnings)) {
    echo "✅ All validations passed!\n";
}

echo "\n";
echo "=================================================\n";
echo "To test actual submission, POST this payload to:\n";
echo "  /api/cockpit3d/submit-order.php?testMode=true\n";
echo "=================================================\n";
