<?php
/**
 * Process Order - Main Order Processing Endpoint
 * @version 1.0.0
 * 
 * This endpoint is called after successful payment to:
 * 1. Submit order to Cockpit3D (if configured)
 * 2. Send email notification to orders@crystalkeepsakes.com
 * 3. Log order details
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/process_order.log');

require_once __DIR__ . '/../env-loader.php';

/**
 * Submit order to Cockpit3D
 */
function submitToCockpit3D($orderData) {
    $apiUrl = getEnvVar('COCKPIT3D_API_URL');
    $username = getEnvVar('COCKPIT3D_USERNAME');
    $password = getEnvVar('COCKPIT3D_PASSWORD');
    $retailerId = getEnvVar('COCKPIT3D_RETAILER_ID');
    
    if (!$apiUrl || !$username || !$password || !$retailerId) {
        return [
            'success' => false,
            'submitted' => false,
            'error' => 'Cockpit3D not configured',
            'configured' => false
        ];
    }
    
    try {
        // Build Cockpit3D order structure
        $cockpitOrder = buildCockpit3DPayload($orderData, $retailerId);
        $submissionOrder = stripInternalFields($cockpitOrder);
        
        // Submit to Cockpit3D API
        $ch = curl_init($apiUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($submissionOrder),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json'
            ],
            CURLOPT_USERPWD => "$username:$password",
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
                'error' => "CURL error: $error",
                'configured' => true
            ];
        }
        
        $responseData = json_decode($response, true);
        
        return [
            'success' => $httpCode >= 200 && $httpCode < 300,
            'submitted' => true,
            'httpCode' => $httpCode,
            'response' => $responseData,
            'configured' => true
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'submitted' => false,
            'error' => $e->getMessage(),
            'configured' => true
        ];
    }
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
 * Build Cockpit3D order payload
 */
function buildCockpit3DPayload($orderData, $retailerId) {
    $orderNumber = $orderData['orderNumber'] ?? $orderData['orderId'] ?? 'ORD-' . time();
    $customer = $orderData['customer'] ?? $orderData['shippingInfo'] ?? [];
    $cartItems = $orderData['cartItems'] ?? [];
    
    // Build shipping address
    $shipping = $orderData['shippingInfo'] ?? $customer['shippingAddress'] ?? $customer;
    $address = $shipping['address'] ?? $shipping;
    
    $cockpitOrder = [
        'retailer_id' => (int)$retailerId,
        'address' => [
            'email' => $orderData['receipt_email'] ?? $customer['email'] ?? '',
            'firstname' => $customer['firstName'] ?? $customer['firstname'] ?? '',
            'lastname' => $customer['lastName'] ?? $customer['lastname'] ?? '',
            'telephone' => $customer['phone'] ?? $customer['telephone'] ?? '',
            'region' => $address['state'] ?? $address['region'] ?? '',
            'country' => $address['country'] ?? 'US',
            'street' => $address['street'] ?? $address['street1'] ?? $address['line1'] ?? '',
            'city' => $address['city'] ?? '',
            'postcode' => $address['zipCode'] ?? $address['postcode'] ?? $address['postal_code'] ?? '',
            'shipping_method' => 'standard',
            'destination' => 'customer_home',
            'staff_user' => 'Web Order',
            'order_id' => $orderNumber
        ],
        'items' => []
    ];
    
    // Build items
    foreach ($cartItems as $item) {
        $cockpitItem = [
            'sku' => $item['sku'] ?? $item['cockpit3d_id'] ?? '',
            'qty' => (string)($item['quantity'] ?? 1),
            'client_item_id' => $item['productId'] ?? $item['id'] ?? '',
            'options' => [],
            'price' => round((float)($item['price'] ?? $item['unitPrice'] ?? 0), 2)
        ];
        
        // Add options
        if (!empty($item['options'])) {
            foreach ($item['options'] as $opt) {
                if (is_array($opt) && !empty($opt['cockpit3d_id'])) {
                    $cockpitItem['options'][] = [
                        'id' => $opt['cockpit3d_id'],
                        'qty' => '1',
                        'value' => $opt['value'] ?? $opt['name'] ?? ''
                    ];
                }
            }
        }
        
        // Add image URLs
        if (!empty($item['maskedImageUrl']) || !empty($item['customImage']['serverUrl'])) {
            $cockpitItem['cropped_photo'] = $item['maskedImageUrl'] ?? $item['customImage']['serverUrl'];
        }
        if (!empty($item['rawImageUrl']) || !empty($item['customImage']['originalServerUrl'])) {
            $cockpitItem['original_photo'] = $item['rawImageUrl'] ?? $item['customImage']['originalServerUrl'];
        }
        
        // Add custom text
        if (!empty($item['customText'])) {
            $text = is_array($item['customText']) 
                ? trim(($item['customText']['line1'] ?? '') . "\n" . ($item['customText']['line2'] ?? ''))
                : $item['customText'];
            if ($text) {
                $cockpitItem['special_instructions'] = "Custom Text: $text";
            }
        }

        $quantity = (int)($item['quantity'] ?? $item['qty'] ?? 1);
        $unitPrice = (float)($item['price'] ?? $item['unitPrice'] ?? 0);
        $cockpitItem['_pricing'] = [
            'source' => $item['pricingSource'] ?? 'crystalkeepsakes_checkout',
            'unit_price' => round($unitPrice, 2),
            'quantity' => $quantity,
            'line_subtotal' => round((float)($item['lineSubtotal'] ?? ($unitPrice * $quantity)), 2),
            'base_price' => isset($item['basePrice']) ? round((float)$item['basePrice'], 2) : null,
            'options_price' => isset($item['optionsPrice']) ? round((float)$item['optionsPrice'], 2) : null,
            'total_price' => isset($item['totalPrice']) ? round((float)$item['totalPrice'], 2) : round($unitPrice * $quantity, 2),
            'note' => 'Local site/Stripe pricing; Profit API pricing is not authoritative for this account.'
        ];
        
        $cockpitOrder['items'][] = $cockpitItem;
    }
    
    return $cockpitOrder;
}

/**
 * Send email notification
 */
function sendOrderEmail($orderData) {
    // Get the send-order-notification.php path
    $notificationScript = dirname(__DIR__) . '/cockpit3d/send-order-notification.php';
    
    if (!file_exists($notificationScript)) {
        return [
            'success' => false,
            'sent' => false,
            'error' => 'Email notification script not found'
        ];
    }
    
    try {
        // Prepare email data
        $emailData = [
            'orderId' => $orderData['orderNumber'] ?? $orderData['orderId'] ?? 'UNKNOWN',
            'orderNumber' => $orderData['orderNumber'] ?? $orderData['orderId'] ?? 'UNKNOWN',
            'stripeSessionId' => $orderData['stripeSessionId'] ?? null,
            'paymentIntentId' => $orderData['paymentIntentId'] ?? null,
            'receipt_email' => $orderData['receipt_email'] ?? null,
            'customer' => $orderData['customer'] ?? null,
            'shippingInfo' => $orderData['shippingInfo'] ?? null,
            'cartItems' => $orderData['cartItems'] ?? [],
            'items' => $orderData['cartItems'] ?? [],
            'cockpit3dOrder' => $orderData['cockpit3dOrder'] ?? null
        ];
        
        // Include and call the email function
        // Use curl to call the endpoint instead (cleaner)
        $phpBackendUrl = getEnvVar('NEXT_PUBLIC_PHP_BACKEND_URL') ?? '';
        $emailEndpoint = $phpBackendUrl . '/api/cockpit3d/send-order-notification.php';
        
        $ch = curl_init($emailEndpoint);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($emailData),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json'
            ],
            CURLOPT_TIMEOUT => 15
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            // Fallback: try direct PHP mail()
            return sendDirectEmail($emailData);
        }
        
        $result = json_decode($response, true);
        return $result ?? [
            'success' => false,
            'sent' => false,
            'error' => 'Invalid response from email endpoint'
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'sent' => false,
            'error' => $e->getMessage()
        ];
    }
}

/**
 * Direct email fallback
 */
function sendDirectEmail($orderData) {
    $orderId = $orderData['orderId'] ?? 'UNKNOWN';
    $to = 'orders@crystalkeepsakes.com';
    $subject = "New Order: $orderId";
    
    // Simple HTML email
    $html = "<h1>New Order: $orderId</h1>";
    $html .= "<p>Date: " . date('Y-m-d H:i:s') . "</p>";
    $html .= "<pre>" . htmlspecialchars(json_encode($orderData, JSON_PRETTY_PRINT)) . "</pre>";
    
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        'From: Crystal Keepsakes <noreply@crystalkeepsakes.com>'
    ];
    
    $sent = mail($to, $subject, $html, implode("\r\n", $headers));
    
    return [
        'success' => $sent,
        'sent' => $sent,
        'method' => 'direct'
    ];
}

/**
 * Log order to file
 */
function logOrder($orderData, $results) {
    $logFile = __DIR__ . '/orders.log';
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'orderId' => $orderData['orderNumber'] ?? $orderData['orderId'] ?? 'UNKNOWN',
        'stripeSession' => $orderData['stripeSessionId'] ?? null,
        'email' => $orderData['receipt_email'] ?? null,
        'cockpit3d_result' => $results['cockpit3d']['submitted'] ?? false,
        'email_result' => $results['email']['sent'] ?? false
    ];
    
    file_put_contents($logFile, json_encode($logEntry) . "\n", FILE_APPEND);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode([
            'status' => 'ready',
            'endpoint' => 'Process Order',
            'description' => 'Submits to Cockpit3D and sends email notification',
            'usage' => 'POST order data JSON'
        ]);
        exit;
    }
    
    $input = file_get_contents('php://input');
    $orderData = json_decode($input, true);
    
    if (!$orderData) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid JSON input'
        ]);
        exit;
    }
    
    $orderId = $orderData['orderNumber'] ?? $orderData['orderId'] ?? 'UNKNOWN';
    error_log("📦 Processing order: $orderId");
    
    // Initialize results
    $results = [
        'success' => true,
        'orderId' => $orderId,
        'timestamp' => date('Y-m-d H:i:s'),
        'cockpit3d' => null,
        'email' => null
    ];
    
    // 1. Submit to Cockpit3D
    error_log("🏭 Submitting to Cockpit3D...");
    $results['cockpit3d'] = submitToCockpit3D($orderData);
    if (!$results['cockpit3d']['success'] && $results['cockpit3d']['configured']) {
        $results['success'] = false;
        error_log("❌ Cockpit3D submission failed: " . ($results['cockpit3d']['error'] ?? 'Unknown error'));
    } else {
        error_log("✅ Cockpit3D result: " . json_encode($results['cockpit3d']));
    }
    
    // 2. Send email notification
    error_log("📧 Sending email notification...");
    $results['email'] = sendOrderEmail($orderData);
    if (!$results['email']['success']) {
        error_log("⚠️ Email notification failed: " . ($results['email']['error'] ?? 'Unknown error'));
        // Don't fail the whole order just because email failed
    } else {
        error_log("✅ Email sent");
    }
    
    // 3. Log order
    logOrder($orderData, $results);
    
    // Return results
    echo json_encode($results, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    error_log('Order processing error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
