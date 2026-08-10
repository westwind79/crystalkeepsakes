<?php
/**
 * Cockpit3D Retailer Order Submission API
 * @version 2.0.0
 * @date 2025-12-15
 * @description Builds and submits orders to Cockpit3D Retailer API
 * 
 * API Endpoint: POST https://api.cockpit3d.com/rest/V2/orders
 * Auth: Basic Auth (email:password)
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

// Constants - Cockpit3D Retailer API (dev URL for testing)
define('COCKPIT3D_API_URL', getEnvVar('COCKPIT3D_API_URL') ?: getEnvVar('COCKPIT3D_BASE_URL') ?: 'https://c3d-profit-dev.host.alva.tools');

// Constants - Cockpit3D Retailer API
// Production: https://profit.cockpit3d.com
// Development: https://c3d-profit-dev.host.alva.tools
//define('COCKPIT3D_API_URL', getenv('COCKPIT3D_API_URL') ?: 'https://profit.cockpit3d.com');

define('COCKPIT3D_USERNAME', getEnvVar('COCKPIT3D_USERNAME') ?: '');
define('COCKPIT3D_PASSWORD', getEnvVar('COCKPIT3D_PASSWORD') ?: '');
define('COCKPIT3D_RETAILER_ID', getEnvVar('COCKPIT3D_RETAILER_ID') ?: getEnvVar('COCKPIT3D_RETAIL_ID') ?: '');

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
 * Build options array for a cart item
 * Format: [{ "id": "198", "qty": "1" }, { "id": "199", "value": ["Text Line 1", "Text Line 2"] }]
 */
function buildItemOptions($item) {
    $options = [];
    
    // Size option - use cockpit3d_id from the size
    if (!empty($item['sizeDetails']['cockpit3d_id'])) {
        $options[] = [
            'id' => (string) $item['sizeDetails']['cockpit3d_id'],
            'qty' => '1'
        ];
    } elseif (!empty($item['size']['cockpit3d_id'])) {
        $options[] = [
            'id' => (string) $item['size']['cockpit3d_id'],
            'qty' => '1'
        ];
    }
    
    // Process options array from cart item
    if (!empty($item['options']) && is_array($item['options'])) {
        foreach ($item['options'] as $opt) {
            $category = $opt['category'] ?? '';
            
            // Light base option
            if ($category === 'lightBase' && !empty($opt['cockpit3d_id'])) {
                $options[] = [
                    'id' => (string) $opt['cockpit3d_id'],
                    'qty' => '1'
                ];
            }
            
            // Background option
            if ($category === 'background' && !empty($opt['cockpit3d_option_id'])) {
                $options[] = [
                    'id' => (string) $opt['cockpit3d_option_id'],
                    'qty' => '1'
                ];
            }
            
            // Custom text option - ID 199 for customer_text
            if ($category === 'customText') {
                $textLines = [];
                if (!empty($opt['line1'])) $textLines[] = $opt['line1'];
                if (!empty($opt['line2'])) $textLines[] = $opt['line2'];
                if (!empty($opt['value'])) {
                    $textLines = is_array($opt['value']) ? $opt['value'] : [$opt['value']];
                }
                
                if (!empty($textLines)) {
                    $options[] = [
                        'id' => '199', // customer_text option ID
                        'value' => $textLines
                    ];
                }
            }
        }
    }
    
    // Handle flat options object (legacy format)
    if (!empty($item['options']) && !is_array($item['options'][0] ?? null)) {
        $flatOpts = $item['options'];
        
        // Light base from flat options
        if (!empty($flatOpts['lightBase']) && is_array($flatOpts['lightBase'])) {
            if (!empty($flatOpts['lightBase']['cockpit3d_id'])) {
                $options[] = [
                    'id' => (string) $flatOpts['lightBase']['cockpit3d_id'],
                    'qty' => '1'
                ];
            }
        }
        
        // Background from flat options  
        if (!empty($flatOpts['background']) && is_array($flatOpts['background'])) {
            if (!empty($flatOpts['background']['cockpit3d_option_id'])) {
                $options[] = [
                    'id' => (string) $flatOpts['background']['cockpit3d_option_id'],
                    'qty' => '1'
                ];
            }
        }
        
        // Custom text from flat options
        if (!empty($flatOpts['customText'])) {
            $textLines = [];
            if (is_string($flatOpts['customText'])) {
                $textLines = [$flatOpts['customText']];
            } elseif (is_array($flatOpts['customText'])) {
                if (!empty($flatOpts['customText']['line1'])) $textLines[] = $flatOpts['customText']['line1'];
                if (!empty($flatOpts['customText']['line2'])) $textLines[] = $flatOpts['customText']['line2'];
            }
            
            if (!empty($textLines)) {
                $options[] = [
                    'id' => '199',
                    'value' => $textLines
                ];
            }
        }
    }
    
    return $options;
}

/**
 * Build complete Cockpit3D Retailer Order structure
 * Matches: https://api.cockpit3d.com/rest/V2/orders
 */
function buildCockpit3DOrder($orderId, $cartItems, $customer, $shippingInfo, $billingInfo = null) {
    $retailerId = COCKPIT3D_RETAILER_ID;
    
    // Build address object (includes order_id per their API)
    $address = [
        'email' => $customer['email'] ?? '',
        'firstname' => $customer['firstName'] ?? $customer['firstname'] ?? '',
        'lastname' => $customer['lastName'] ?? $customer['lastname'] ?? '',
        'telephone' => $customer['phone'] ?? $customer['telephone'] ?? '',
        'region' => $shippingInfo['state'] ?? $shippingInfo['region'] ?? '',
        'country' => $shippingInfo['country'] ?? 'US',
        'street' => $shippingInfo['address'] ?? $shippingInfo['street'] ?? '',
        'city' => $shippingInfo['city'] ?? '',
        'postcode' => $shippingInfo['zipCode'] ?? $shippingInfo['postcode'] ?? '',
        'shipping_method' => $shippingInfo['shippingMethod'] ?? 'air',
        'destination' => $shippingInfo['destination'] ?? 'customer_home',
        'order_id' => $orderId,
        'staff_user' => 'Web Order'
    ];
    
    // Build items array
    $items = [];
    foreach ($cartItems as $index => $item) {
        $lineItem = [
            'sku' => $item['sku'] ?? $item['cockpit3d_id'] ?? 'unknown',
            'qty' => (string) ($item['quantity'] ?? 1),
            'client_item_id' => ($item['productId'] ?? $item['id'] ?? 'item') . '-' . ($index + 1),
            'options' => buildItemOptions($item),
            'price' => round((float)($item['price'] ?? $item['unitPrice'] ?? 0), 2)
        ];
        
        // Add photo URLs if available
        if (!empty($item['originalPhotoUrl']) || !empty($item['rawImageUrl']) || !empty($item['customImage']['originalServerUrl'])) {
            $lineItem['original_photo'] = $item['originalPhotoUrl'] ?? $item['rawImageUrl'] ?? $item['customImage']['originalServerUrl'];
        }
        if (!empty($item['croppedPhotoUrl']) || !empty($item['maskedImageUrl']) || !empty($item['customImage']['serverUrl'])) {
            $lineItem['cropped_photo'] = $item['croppedPhotoUrl'] ?? $item['maskedImageUrl'] ?? $item['customImage']['serverUrl'];
        }
        
        // Special instructions
        $instructions = [];
        if (!empty($item['specialInstructions'])) {
            $instructions[] = $item['specialInstructions'];
        }
        if (!empty($item['customImageId'])) {
            $instructions[] = "Custom image ID: " . $item['customImageId'];
        }
        if (!empty($instructions)) {
            $lineItem['special_instructions'] = implode('. ', $instructions);
        }

        $quantity = (int)($item['quantity'] ?? $item['qty'] ?? 1);
        $unitPrice = (float)($item['price'] ?? $item['unitPrice'] ?? 0);
        $lineItem['_pricing'] = [
            'source' => $item['pricingSource'] ?? 'crystalkeepsakes_checkout',
            'unit_price' => round($unitPrice, 2),
            'quantity' => $quantity,
            'line_subtotal' => round((float)($item['lineSubtotal'] ?? ($unitPrice * $quantity)), 2),
            'base_price' => isset($item['basePrice']) ? round((float)$item['basePrice'], 2) : null,
            'options_price' => isset($item['optionsPrice']) ? round((float)$item['optionsPrice'], 2) : null,
            'total_price' => isset($item['totalPrice']) ? round((float)$item['totalPrice'], 2) : round($unitPrice * $quantity, 2),
            'note' => 'Local site/Stripe pricing; Profit API pricing is not authoritative for this account.'
        ];
        
        $items[] = $lineItem;
    }
    
    // Build final order structure
    $order = [
        'retailer_id' => (int) $retailerId,
        'address' => $address,
        'items' => $items
    ];
    
    // Add billing address if different
    if ($billingInfo && $billingInfo !== $shippingInfo) {
        $order['billing_address'] = [
            'email' => $customer['email'] ?? '',
            'firstname' => $customer['firstName'] ?? '',
            'lastname' => $customer['lastName'] ?? '',
            'telephone' => $customer['phone'] ?? '',
            'region' => $billingInfo['state'] ?? '',
            'country' => $billingInfo['country'] ?? 'US',
            'street' => $billingInfo['address'] ?? '',
            'city' => $billingInfo['city'] ?? '',
            'postcode' => $billingInfo['zipCode'] ?? ''
        ];
    }
    
    return $order;
}

/**
 * Submit order to Cockpit3D Retailer API
 * POST https://api.cockpit3d.com/rest/V2/orders
 */
function submitToCockpit3D($order) {
    if (empty(COCKPIT3D_USERNAME) || empty(COCKPIT3D_PASSWORD)) {
        return [
            'success' => false,
            'submitted' => false,
            'error' => 'Cockpit3D credentials not configured (COCKPIT3D_USERNAME, COCKPIT3D_PASSWORD)'
        ];
    }
    
    if (empty(COCKPIT3D_RETAILER_ID)) {
        return [
            'success' => false,
            'submitted' => false,
            'error' => 'COCKPIT3D_RETAILER_ID not configured'
        ];
    }
    
    $url = COCKPIT3D_API_URL . '/rest/V2/orders';
    $submissionOrder = stripInternalFields($order);
    $auth = base64_encode(COCKPIT3D_USERNAME . ':' . COCKPIT3D_PASSWORD);
    
    logOrder('📤 Submitting to Cockpit3D', [
        'url' => $url,
        'retailer_id' => $order['retailer_id'],
        'items_count' => count($order['items'])
    ]);
    
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Basic ' . $auth
        ],
        CURLOPT_POSTFIELDS => json_encode($submissionOrder),
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
    
    logOrder('📥 Cockpit3D Response', [
        'http_code' => $httpCode,
        'response' => $result
    ]);
    
    return [
        'success' => $httpCode >= 200 && $httpCode < 300,
        'submitted' => true,
        'http_code' => $httpCode,
        'response' => $result
    ];
}

function stripInternalFields($value) {
    if (!is_array($value)) {
        return $value;
    }

    $clean = [];
    foreach ($value as $key => $item) {
        if (is_string($key) && strpos($key, '_') === 0) {
            continue;
        }
        $clean[$key] = stripInternalFields($item);
    }

    return $clean;
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
                'retailer_id' => COCKPIT3D_RETAILER_ID ?: 'NOT SET',
                'api_url' => COCKPIT3D_API_URL
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
    $orderId = $data['orderNumber'] ?? $data['orderId'] ?? ('ORD-' . time());
    $cartItems = $data['cartItems'] ?? $data['items'] ?? [];
    $customer = $data['customer'] ?? [];
    $shippingInfo = $data['shippingInfo'] ?? $data['shipping'] ?? [];
    $billingInfo = $data['billingInfo'] ?? $data['billing'] ?? null;
    $testMode = $data['testMode'] ?? false;
    
    if (empty($cartItems)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No cart items provided']);
        exit;
    }
    
    // Build Cockpit3D order
    $cockpit3DOrder = buildCockpit3DOrder($orderId, $cartItems, $customer, $shippingInfo, $billingInfo);
    logOrder('📋 Built Cockpit3D order', $cockpit3DOrder);
    
    // In test mode, skip actual submission but optionally send email
    if ($testMode) {
        logOrder('🧪 TEST MODE - Order built but NOT submitted to Cockpit3D');
        
        // ✅ NEW: Send test email notification if requested
        $emailResult = null;
        $sendTestEmail = $data['sendTestEmail'] ?? false;
        
        if ($sendTestEmail) {
            logOrder('📧 Sending TEST order notification email');
            
            // Build email data from test order
            $emailData = [
                'orderId' => $orderId,
                'orderNumber' => $orderId,
                'testMode' => true,
                'cartItems' => $cartItems,
                'customer' => $customer,
                'shippingInfo' => $shippingInfo,
                'cockpit3dOrder' => $cockpit3DOrder
            ];
            
            // Include notification script and send
            require_once __DIR__ . '/send-order-notification.php';
            $emailResult = sendOrderNotification($emailData);
            logOrder('📧 Test email result', $emailResult);
        }
        
        $response = [
            'success' => true,
            'testMode' => true,
            'orderNumber' => $orderId,
            'message' => 'Test order processed successfully (not submitted to Cockpit3D)',
            'cockpit3d' => [
                'order' => $cockpit3DOrder,
                'submission' => [
                    'success' => true,
                    'submitted' => false,
                    'testMode' => true,
                    'message' => 'Order structure validated - ready for production submission'
                ]
            ],
            'email' => $emailResult ? [
                'sent' => $emailResult['success'] ?? false,
                'to' => $emailResult['to'] ?? 'orders@crystalkeepsakes.com',
                'message' => $emailResult['message'] ?? 'Email not sent'
            ] : [
                'sent' => false,
                'message' => 'Email not requested (set sendTestEmail: true to send)'
            ],
            'config' => [
                'cockpit3d_configured' => !empty(COCKPIT3D_USERNAME) && !empty(COCKPIT3D_PASSWORD),
                'retailer_id' => COCKPIT3D_RETAILER_ID ?: 'NOT SET',
                'api_endpoint' => COCKPIT3D_API_URL . '/rest/V2/orders'
            ]
        ];
        
        echo json_encode($response, JSON_PRETTY_PRINT);
        exit;
    }
    
    // Submit to Cockpit3D (production mode)
    $submitResult = submitToCockpit3D($cockpit3DOrder);
    logOrder('📤 Cockpit3D submission result', $submitResult);
    
    // Prepare response
    $response = [
        'success' => $submitResult['success'],
        'orderNumber' => $orderId,
        'cockpit3d' => [
            'order' => $cockpit3DOrder,
            'submission' => $submitResult
        ]
    ];
    
    if (!$submitResult['success']) {
        http_response_code(502); // Bad Gateway - upstream error
    }
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    logOrder('❌ Error processing order', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
