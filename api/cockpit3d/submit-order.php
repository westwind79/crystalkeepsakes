<?php
/**
 * Cockpit3D Order Submission API
 * @version 1.0.0
 * @date 2025-12-14
 * @description Builds and submits orders to Cockpit3D API
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/cockpit3d_orders.log');

// Load environment
require_once __DIR__ . '/../env-loader.php';

// Constants
define('COCKPIT3D_API_URL', getenv('COCKPIT3D_API_URL') ?: 'https://api.cockpit3d.com');
define('COCKPIT3D_USERNAME', getenv('COCKPIT3D_USERNAME') ?: '');
define('COCKPIT3D_PASSWORD', getenv('COCKPIT3D_PASSWORD') ?: '');
define('COCKPIT3D_RETAILER_ID', getenv('COCKPIT3D_RETAILER_ID') ?: '');

/**
 * Log helper
 */
function logOrder($message, $data = null) {
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message";
    if ($data) {
        $logMessage .= "\n" . json_encode($data, JSON_PRETTY_PRINT);
    }
    error_log($logMessage);
}

/**
 * Build Cockpit3D order item options
 */
function buildItemOptions($item) {
    $options = [];
    
    // Size option
    if (!empty($item['options']['size'])) {
        $sizeId = mapSizeToCockpit3DId($item['options']['size']);
        if ($sizeId) {
            $options[] = ['id' => $sizeId, 'qty' => 1];
        }
    }
    
    // Light base
    if (!empty($item['options']['lightBase']) && $item['options']['lightBase'] !== 'none') {
        $lightbaseId = mapLightbaseToCockpit3DId($item['options']['lightBase']);
        if ($lightbaseId) {
            $options[] = ['id' => $lightbaseId, 'qty' => 1];
        }
    }
    
    // Background
    if (!empty($item['options']['background'])) {
        $bgId = mapBackgroundToCockpit3DId($item['options']['background']);
        if ($bgId) {
            $options[] = ['id' => $bgId, 'qty' => 1];
        }
    }
    
    // Custom text
    if (!empty($item['options']['customText'])) {
        $text = $item['options']['customText'];
        if (!empty($text['line1']) || !empty($text['line2'])) {
            $options[] = [
                'id' => 'customer_text',
                'qty' => 1,
                'value' => [
                    'line1' => $text['line1'] ?? '',
                    'line2' => $text['line2'] ?? ''
                ]
            ];
        }
    }
    
    // Image URL
    if (!empty($item['options']['imageUrl'])) {
        $options[] = [
            'id' => 'image_url',
            'value' => $item['options']['imageUrl']
        ];
    }
    
    return $options;
}

/**
 * Map size name to Cockpit3D ID
 */
function mapSizeToCockpit3DId($sizeName) {
    $sizeMap = [
        'Rectangle Small (6x4cm)' => 'Rectangle_Small_(6x4cm)',
        'Rectangle Medium (8x5cm)' => 'Rectangle_Medium_(8x5cm)',
        'Rectangle Large (9x6cm)' => 'Rectangle_Large_(9x6cm)',
        'Rectangle XLarge (12x8cm)' => 'Rectangle_XLarge_(12x8cm)',
        'Rectangle Mini Mantel (15x10cm)' => 'Rectangle_Mini_Mantel_(15x10cm)',
        'Rectangle Mantel (18x12cm)' => 'Rectangle_Mantel_(18x12cm)',
        'Rectangle Mini Presidential (22x16cm)' => 'Rectangle_Mini_Presidential_(22x16cm)',
        'Rectangle Presidential (27x18cm)' => 'Rectangle_Presidential_(27x18cm)',
        'Cut Corner Diamond (5x5cm)' => 'Cut_Corner_Diamond_(5x5cm)',
        'Cut Corner Diamond (6x6cm)' => 'Cut_Corner_Diamond_(6x6cm)',
        'Cut Corner Diamond (8x8cm)' => 'Cut_Corner_Diamond_(8x8cm)',
        'Wide Heart Small' => 'Wide_Heart_small_(80x70x40)',
        'Wide Heart Medium' => 'Wide_Heart_Medium_(100x90x50)',
        'Wide Heart Large' => 'Wide_Heart_Large_(125x110x60)',
        'Prestige Small (13x9cm)' => 'Prestige_Small_(13x9cm)',
        'Prestige Medium (16x13cm)' => 'Prestige_Medium_(16x13cm)',
        'Prestige Large (19x15cm)' => 'Prestige_Large_(19x15cm)',
    ];
    
    return $sizeMap[$sizeName] ?? $sizeName;
}

/**
 * Map lightbase name to Cockpit3D ID
 */
function mapLightbaseToCockpit3DId($lightbaseName) {
    $lightbaseMap = [
        'Lightbase Rectangle' => 'Lightbase_Rectangle',
        'Lightbase Square' => 'Lightbase_Square',
        'Lightbase Wood Small' => 'Lightbase_Wood_Small',
        'Lightbase Wood Medium' => 'Lightbase_Wood_Medium',
        'Lightbase Wood Long' => 'Lightbase_Wood_Long',
        'Rotating LED Lightbase' => 'Rotating_LED_Lightbase',
        'Concave Lightbase' => 'concave_lightbase',
    ];
    
    return $lightbaseMap[$lightbaseName] ?? $lightbaseName;
}

/**
 * Map background to Cockpit3D ID
 */
function mapBackgroundToCockpit3DId($bgName) {
    $bgMap = [
        '2D Backdrop' => '2d_backdrop',
        '3D Backdrop' => '3d_backdrop',
        'Remove Background' => 'rm',
    ];
    
    return $bgMap[$bgName] ?? $bgName;
}

/**
 * Build complete Cockpit3D order structure
 */
function buildCockpit3DOrder($orderNumber, $cartItems, $customer, $shippingInfo) {
    $order = [
        'retailer_id' => COCKPIT3D_RETAILER_ID,
        'order_id' => $orderNumber,
        'address' => [
            'firstname' => $customer['firstName'] ?? 'Customer',
            'lastname' => $customer['lastName'] ?? '',
            'email' => $customer['email'] ?? '',
            'telephone' => $customer['phone'] ?? '',
            'street' => $shippingInfo['address'] ?? '',
            'city' => $shippingInfo['city'] ?? '',
            'region' => $shippingInfo['state'] ?? '',
            'postcode' => $shippingInfo['zipCode'] ?? '',
            'country' => $shippingInfo['country'] ?? 'US',
        ],
        'items' => [],
        'total' => 0
    ];
    
    $total = 0;
    
    foreach ($cartItems as $index => $item) {
        $itemPrice = floatval($item['price'] ?? 0);
        $itemQty = intval($item['quantity'] ?? 1);
        
        $lineItem = [
            'sku' => $item['sku'] ?? $item['cockpit3d_id'] ?? 'unknown',
            'client_item_id' => ($item['productId'] ?? $item['id'] ?? 'item') . '-' . ($index + 1),
            'qty' => $itemQty,
            'price' => $itemPrice,
            'options' => buildItemOptions($item),
            'special_instructions' => $item['specialInstructions'] ?? ''
        ];
        
        $order['items'][] = $lineItem;
        $total += $itemPrice * $itemQty;
    }
    
    $order['total'] = $total;
    
    return $order;
}

/**
 * Submit order to Cockpit3D API
 */
function submitToCockpit3D($order) {
    if (empty(COCKPIT3D_USERNAME) || empty(COCKPIT3D_PASSWORD)) {
        return [
            'success' => false,
            'submitted' => false,
            'error' => 'Cockpit3D credentials not configured'
        ];
    }
    
    $url = COCKPIT3D_API_URL . '/orders';
    $auth = base64_encode(COCKPIT3D_USERNAME . ':' . COCKPIT3D_PASSWORD);
    
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Basic ' . $auth
        ],
        CURLOPT_POSTFIELDS => json_encode($order),
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return [
            'success' => false,
            'submitted' => false,
            'error' => "CURL error: $error"
        ];
    }
    
    $result = json_decode($response, true);
    
    return [
        'success' => $httpCode >= 200 && $httpCode < 300,
        'submitted' => true,
        'http_code' => $httpCode,
        'response' => $result
    ];
}

/**
 * Main handler
 */
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed. Use POST.',
            'config' => [
                'cockpit3d_configured' => !empty(COCKPIT3D_USERNAME) && !empty(COCKPIT3D_PASSWORD),
                'retailer_id' => COCKPIT3D_RETAILER_ID ?: 'NOT SET'
            ]
        ]);
        exit;
    }
    
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    logOrder('📦 Received order request', $data);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
        exit;
    }
    
    // Extract data
    $orderNumber = $data['orderNumber'] ?? ('ORD-' . time());
    $cartItems = $data['cartItems'] ?? [];
    $customer = $data['customer'] ?? [];
    $shippingInfo = $data['shippingInfo'] ?? [];
    
    if (empty($cartItems)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No cart items provided']);
        exit;
    }
    
    // Build Cockpit3D order
    $cockpit3DOrder = buildCockpit3DOrder($orderNumber, $cartItems, $customer, $shippingInfo);
    logOrder('📋 Built Cockpit3D order', $cockpit3DOrder);
    
    // Submit to Cockpit3D
    $submitResult = submitToCockpit3D($cockpit3DOrder);
    logOrder('📤 Cockpit3D submission result', $submitResult);
    
    // Prepare response
    $response = [
        'success' => true,
        'orderNumber' => $orderNumber,
        'cockpit3d' => [
            'order' => $cockpit3DOrder,
            'submission' => $submitResult
        ]
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    logOrder('❌ Error processing order', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
