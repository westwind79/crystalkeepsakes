<?php
/**
 * Stripe Webhook Handler - Stripe Checkout + Cockpit3D Integration
 * @version 2.0.0
 * @date 2025-11-10
 * @description Handles Stripe Checkout sessions and sends orders to Cockpit3D
 */

require_once __DIR__ . '/vendor/autoload.php';

// Load environment helper
function getEnvVariable($key) {
    static $envCache = null;
    
    if ($envCache === null) {
        $envCache = [];
        
        $possibleEnvPaths = [
            dirname(dirname(__DIR__)) . '/.env',
            dirname(__DIR__) . '/.env',
            $_SERVER['DOCUMENT_ROOT'] . '/crystalkeepsakes/.env',
            $_SERVER['DOCUMENT_ROOT'] . '/.env'
        ];
        
        foreach ($possibleEnvPaths as $path) {
            if (file_exists($path)) {
                $content = file_get_contents($path);
                $lines = explode("\n", $content);
                
                foreach ($lines as $line) {
                    $line = trim($line);
                    if (empty($line) || strpos($line, '#') === 0) continue;
                    
                    $parts = explode('=', $line, 2);
                    if (count($parts) !== 2) continue;
                    
                    $envKey = trim($parts[0]);
                    $envValue = trim($parts[1], " \t\n\r\0\x0B\"'");
                    $envCache[$envKey] = $envValue;
                }
                break;
            }
        }
    }
    
    return $envCache[$key] ?? null;
}

// Get database connection if available
$conn = null;
if (file_exists(__DIR__ . '/db-connect.php')) {
    try {
        $conn = require_once __DIR__ . '/db-connect.php';
    } catch (Exception $e) {
        error_log('DB connection failed: ' . $e->getMessage());
    }
}

// Get environment variables
$mode = getEnvVariable('NEXT_PUBLIC_ENV_MODE') ?? 'development';

if ($mode === 'production') {
    $stripeSecretKey = getEnvVariable('STRIPE_SECRET_KEY');
    $webhookSecret = getEnvVariable('STRIPE_WEBHOOK_SECRET');
} else {
    $stripeSecretKey = getEnvVariable('STRIPE_DEVELOPMENT_SECRET_KEY');
    $webhookSecret = getEnvVariable('STRIPE_DEVELOPMENT_WEBHOOK_SECRET');
}

\Stripe\Stripe::setApiKey($stripeSecretKey);

// Get webhook payload
$payload = @file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

error_log('=== STRIPE WEBHOOK RECEIVED ===');
error_log('Mode: ' . $mode);

try {
    // Verify webhook signature
    if ($webhookSecret) {
        $event = \Stripe\Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
    } else {
        error_log('⚠️  No webhook secret - using unverified payload (DEVELOPMENT ONLY)');
        $event = json_decode($payload, false);
    }
    
    error_log('Event type: ' . $event->type);
    
    // Handle different event types
    switch ($event->type) {
        case 'checkout.session.completed':
            handleCheckoutCompleted($event->data->object);
            break;
            
        case 'payment_intent.succeeded':
            handlePaymentSuccess($event->data->object);
            break;
            
        case 'payment_intent.payment_failed':
            handlePaymentFailure($event->data->object);
            break;
            
        case 'payment_intent.canceled':
            handlePaymentCanceled($event->data->object);
            break;
            
        default:
            error_log('Unhandled event type: ' . $event->type);
    }
    
    http_response_code(200);
    echo json_encode(['success' => true]);
    
} catch (\Stripe\Exception\SignatureVerificationException $e) {
    error_log('❌ Webhook signature verification failed: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode(['error' => 'Invalid signature']);
} catch (Exception $e) {
    error_log('❌ Webhook error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Handle Stripe Checkout Session Completed
 * This is where we send the order to Cockpit3D
 */
function handleCheckoutCompleted($session) {
    global $conn;
    
    error_log('🛒 Processing checkout session: ' . $session->id);
    
    // Only process if payment succeeded
    if ($session->payment_status !== 'paid') {
        error_log('⚠️  Payment not completed yet, skipping');
        return;
    }
    
    try {
        // Retrieve full session details
        $fullSession = \Stripe\Checkout\Session::retrieve([
            'id' => $session->id,
            'expand' => ['line_items', 'customer_details', 'shipping_details', 'total_details']
        ]);
        
        $orderNumber = $session->metadata->order_number ?? ('ORD-' . time());
        $customerDetails = $fullSession->customer_details;
        $shippingDetails = $fullSession->shipping_details ?? $fullSession->shipping;
        $totalDetails = $fullSession->total_details;
        
        error_log('📋 Order: ' . $orderNumber);
        error_log('👤 Customer: ' . $customerDetails->email);
        
        // Build Cockpit3D order payload
        $cockpit3dOrder = buildCockpit3DOrder($fullSession, $orderNumber);
        
        // Send to Cockpit3D
        $cockpit3dResult = sendToCockpit3D($cockpit3dOrder);
        
        if ($cockpit3dResult['success']) {
            error_log('✅ Order sent to Cockpit3D successfully');
            
            $cockpit3dOrderId = $cockpit3dResult['data']['id'] ?? null;
            
            // Save to local database if available
            if ($conn) {
                saveOrderToDatabase($conn, $orderNumber, $fullSession, $cockpit3dOrderId);
            }
            
            // Send order notification email
            if (file_exists(__DIR__ . '/send-order-notification.php')) {
                sendOrderNotification($orderNumber, $fullSession);
            }
            
        } else {
            error_log('❌ Failed to send to Cockpit3D: ' . ($cockpit3dResult['error'] ?? 'Unknown error'));
        }
        
    } catch (Exception $e) {
        error_log('❌ Error processing checkout: ' . $e->getMessage());
        error_log('Stack trace: ' . $e->getTraceAsString());
    }
}

/**
 * Build Cockpit3D order payload from Stripe session
 */
function buildCockpit3DOrder($session, $orderNumber) {
    $customerDetails = $session->customer_details;
    $shippingDetails = $session->shipping_details ?? $session->shipping;
    
    // Parse name
    $fullName = $shippingDetails->name ?? $customerDetails->name ?? '';
    $nameParts = explode(' ', $fullName, 2);
    $firstName = $nameParts[0] ?? '';
    $lastName = $nameParts[1] ?? '';
    
    $retailerId = getEnvVariable('COCKPIT3D_RETAIL_ID') ?? '256568874';
    
    $order = [
        'retailer_id' => $retailerId,
        'address' => [
            'firstname' => $firstName,
            'lastname' => $lastName,
            'street' => $shippingDetails->address->line1 ?? '',
            'city' => $shippingDetails->address->city ?? '',
            'region' => $shippingDetails->address->state ?? '',
            'postcode' => $shippingDetails->address->postal_code ?? '',
            'country' => $shippingDetails->address->country ?? 'US',
            'telephone' => $customerDetails->phone ?? '',
            'email' => $customerDetails->email ?? '',
        ],
        'items' => []
    ];
    
    // Add line items
    foreach ($session->line_items->data as $lineItem) {
        // Extract SKU from description or use product metadata
        $sku = 'PRODUCT-' . $lineItem->price->product;
        
        // Check metadata for cart details
        if (isset($session->metadata->cart_items)) {
            $cartItems = json_decode($session->metadata->cart_items, true);
            if ($cartItems && isset($cartItems[0]['sku'])) {
                $sku = $cartItems[0]['sku'];
            }
        }
        
        $order['items'][] = [
            'sku' => $sku,
            'name' => $lineItem->description,
            'qty' => $lineItem->quantity,
            'price' => $lineItem->amount_total / 100, // Convert from cents
        ];
    }
    
    error_log('📦 Cockpit3D order payload: ' . json_encode($order, JSON_PRETTY_PRINT));
    
    return $order;
}

/**
 * Send order to Cockpit3D API
 */
function sendToCockpit3D($orderData) {
    $mode = getEnvVariable('NEXT_PUBLIC_ENV_MODE') ?? 'development';
    
    // Use DEV URL for testing
    if ($mode === 'development' || $mode === 'test') {
        $baseUrl = 'https://c3d-profit-dev.host.alva.tools';
    } else {
        $baseUrl = getEnvVariable('COCKPIT3D_BASE_URL') ?? 'https://api.cockpit3d.com';
    }
    
    $username = getEnvVariable('COCKPIT3D_USERNAME');
    $password = getEnvVariable('COCKPIT3D_PASSWORD');
    
    if (!$username || !$password) {
        return ['success' => false, 'error' => 'Missing Cockpit3D credentials'];
    }
    
    // Step 1: Authenticate
    error_log('🔐 Authenticating with Cockpit3D...');
    
    $ch = curl_init($baseUrl . '/rest/V2/login');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'username' => $username,
        'password' => $password
    ]));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        error_log('❌ Authentication failed: ' . $response);
        return ['success' => false, 'error' => 'Authentication failed'];
    }
    
    $token = trim($response, '"');
    error_log('✓ Authenticated');
    
    // Step 2: Create Order
    error_log('📦 Creating order...');
    
    $ch = curl_init($baseUrl . '/rest/V2/orders');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 201 || $httpCode === 200) {
        error_log('✅ Order created in Cockpit3D');
        $responseData = json_decode($response, true);
        return ['success' => true, 'data' => $responseData];
    } else {
        error_log('❌ Order creation failed (HTTP ' . $httpCode . '): ' . $response);
        return ['success' => false, 'error' => 'Order creation failed', 'response' => $response];
    }
}

/**
 * Save order to local database
 */
function saveOrderToDatabase($conn, $orderNumber, $session, $cockpit3dOrderId) {
    try {
        $stmt = $conn->prepare("
            INSERT INTO orders (
                order_number, stripe_session_id, cockpit3d_order_id,
                customer_email, customer_name, amount_total,
                currency, payment_status, created_at, order_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        ");
        
        $customerEmail = $session->customer_details->email ?? null;
        $customerName = ($session->shipping_details->name ?? $session->customer_details->name) ?? null;
        $amountTotal = $session->amount_total / 100;
        $currency = $session->currency;
        $paymentStatus = $session->payment_status;
        $orderData = json_encode($session);
        
        $stmt->bind_param(
            'sssssdss',
            $orderNumber,
            $session->id,
            $cockpit3dOrderId,
            $customerEmail,
            $customerName,
            $amountTotal,
            $currency,
            $paymentStatus,
            $orderData
        );
        
        $stmt->execute();
        $stmt->close();
        
        error_log('✅ Order saved to database');
        
    } catch (Exception $e) {
        error_log('❌ Failed to save to database: ' . $e->getMessage());
    }
}

/**
 * Send order notification
 */
function sendOrderNotification($orderNumber, $session) {
    try {
        $orderData = [
            'orderId' => $orderNumber,
            'receipt_email' => $session->customer_details->email ?? null,
            'shippingInfo' => [
                'name' => $session->shipping_details->name ?? $session->customer_details->name,
                'email' => $session->customer_details->email,
                'phone' => $session->customer_details->phone ?? null,
                'address' => $session->shipping_details->address ?? null
            ],
            'cartItems' => []
        ];
        
        // Add cart items
        foreach ($session->line_items->data as $item) {
            $orderData['cartItems'][] = [
                'name' => $item->description,
                'quantity' => $item->quantity,
                'price' => $item->amount_total / 100
            ];
        }
        
        $ch = curl_init('http://localhost/crystalkeepsakes/api/send-order-notification.php');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
        
        curl_exec($ch);
        curl_close($ch);
        
        error_log('✅ Notification sent');
        
    } catch (Exception $e) {
        error_log('❌ Notification failed: ' . $e->getMessage());
    }
}

/**
 * Handle successful payment (existing functionality)
 */
function handlePaymentSuccess($paymentIntent) {
    global $conn;
    
    $orderNumber = $paymentIntent->metadata->order_number ?? null;
    $cockpit3dOrderId = $paymentIntent->metadata->cockpit3d_order_id ?? null;
    $localOrderId = $paymentIntent->metadata->local_order_id ?? null;
    
    error_log("💳 Payment succeeded for order: $orderNumber");
    error_log("💰 Amount: $" . ($paymentIntent->amount / 100));
    
    try {
        // Extract Cockpit3D order data from metadata
        $cockpitOrderJson = $paymentIntent->metadata->cockpit3d_order ?? null;
        
        if ($cockpitOrderJson) {
            error_log("📦 Processing Cockpit3D order from metadata");
            
            $cockpitOrderData = json_decode($cockpitOrderJson, true);
            $shippingAddress = json_decode($paymentIntent->metadata->shipping_address ?? '{}', true);
            
            // Build Cockpit3D order
            $retailerId = getEnvVariable('COCKPIT3D_RETAIL_ID') ?? '256568874';
            
            $nameParts = explode(' ', $cockpitOrderData['customer_name'] ?? '', 2);
            $firstName = $nameParts[0] ?? '';
            $lastName = $nameParts[1] ?? '';
            
            $cockpit3dOrder = [
                'retailer_id' => $retailerId,
                'address' => [
                    'firstname' => $firstName,
                    'lastname' => $lastName,
                    'street' => $shippingAddress['line1'] ?? '',
                    'city' => $shippingAddress['city'] ?? '',
                    'region' => $shippingAddress['state'] ?? '',
                    'postcode' => $shippingAddress['postal_code'] ?? '',
                    'country' => $shippingAddress['country'] ?? 'US',
                    'telephone' => $shippingAddress['phone'] ?? '',
                    'email' => $cockpitOrderData['customer_email'] ?? '',
                ],
                'items' => []
            ];
            
            // Add items with options
            if (isset($cockpitOrderData['items']) && is_array($cockpitOrderData['items'])) {
                foreach ($cockpitOrderData['items'] as $item) {
                    $orderItem = [
                        'product_id' => $item['product_id'],
                        'qty' => $item['quantity'],
                        'options' => []
                    ];
                    
                    // Add options
                    if (isset($item['options']) && is_array($item['options'])) {
                        foreach ($item['options'] as $option) {
                            $orderItem['options'][] = [
                                'id' => $option['option_id'],
                                'value' => $option['value_id'] ?? $option['value']
                            ];
                        }
                    }
                    
                    // Note: Custom images from IndexedDB need to be handled separately
                    // They can't be accessed from server-side webhook
                    if (isset($item['custom_image'])) {
                        error_log("⚠️  Custom image detected but not retrievable from IndexedDB");
                        error_log("   Image ID: " . $item['custom_image']['image_id']);
                        // TODO: Implement image upload before payment or email link after
                    }
                    
                    $cockpit3dOrder['items'][] = $orderItem;
                }
            }
            
            error_log("📤 Sending to Cockpit3D: " . json_encode($cockpit3dOrder));
            
            // Send to Cockpit3D
            $result = sendToCockpit3D($cockpit3dOrder);
            
            if ($result['success']) {
                error_log("✅ Order sent to Cockpit3D successfully");
                error_log("   Cockpit3D Order ID: " . ($result['data']['id'] ?? 'N/A'));
            } else {
                error_log("❌ Failed to send to Cockpit3D: " . ($result['error'] ?? 'Unknown'));
            }
        } else {
            error_log("⚠️  No Cockpit3D order data in metadata");
        }
        
        // Update local database if available
        if ($conn && $localOrderId) {
            updateOrderStatus($localOrderId, [
                'status' => 'paid',
                'stripe_payment_intent_id' => $paymentIntent->id,
                'amount_paid' => $paymentIntent->amount / 100,
                'paid_at' => date('Y-m-d H:i:s')
            ]);
            
            error_log("✅ Local order status updated");
        }
        
    } catch (Exception $e) {
        error_log('❌ Error processing payment success: ' . $e->getMessage());
        error_log('Stack trace: ' . $e->getTraceAsString());
    }
}

/**
 * Handle failed payment
 */
function handlePaymentFailure($paymentIntent) {
    error_log("❌ Payment failed: " . ($paymentIntent->metadata->order_number ?? 'Unknown'));
}

/**
 * Handle canceled payment
 */
function handlePaymentCanceled($paymentIntent) {
    error_log("🚫 Payment canceled: " . ($paymentIntent->metadata->order_number ?? 'Unknown'));
}

/**
 * Update order status
 */
function updateOrderStatus($orderId, $updates) {
    global $conn;
    
    if (!$conn || !$orderId) return;
    
    $setParts = [];
    $params = [];
    $types = '';
    
    foreach ($updates as $key => $value) {
        $setParts[] = "$key = ?";
        $params[] = $value;
        $types .= is_numeric($value) ? 'd' : 's';
    }
    
    $params[] = $orderId;
    $types .= 'i';
    
    $sql = "UPDATE orders SET " . implode(', ', $setParts) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $stmt->close();
}