<?php
// stripe-webhook.php
// Version: 1.0.0 | Date: 2025-11-09
// Handles Stripe webhook events (payment success/failure)

require_once __DIR__ . '/vendor/autoload.php';
$conn = require_once __DIR__ . '/db-connect.php';

// Get environment variables
$stripeSecretKey = $_ENV['STRIPE_SECRET_KEY'] ?? getenv('STRIPE_SECRET_KEY');
$webhookSecret = $_ENV['STRIPE_WEBHOOK_SECRET'] ?? getenv('STRIPE_WEBHOOK_SECRET');
$cockpit3dApiUrl = $_ENV['COCKPIT3D_API_URL'] ?? getenv('COCKPIT3D_API_URL');
$cockpit3dApiKey = $_ENV['COCKPIT3D_API_KEY'] ?? getenv('COCKPIT3D_API_KEY');

\Stripe\Stripe::setApiKey($stripeSecretKey);

// Get webhook payload
$payload = @file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

// Log webhook received
error_log('Webhook received: ' . substr($payload, 0, 200));

try {
    // Verify webhook signature
    $event = \Stripe\Webhook::constructEvent(
        $payload,
        $sigHeader,
        $webhookSecret
    );
    
    // Log event type
    error_log('Webhook event type: ' . $event->type);
    
    // Handle different event types
    switch ($event->type) {
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
    
    // Return 200 OK
    http_response_code(200);
    echo json_encode(['success' => true]);
    
} catch (\Stripe\Exception\SignatureVerificationException $e) {
    error_log('Webhook signature verification failed: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode(['error' => 'Invalid signature']);
} catch (Exception $e) {
    error_log('Webhook error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Handle successful payment
 */
function handlePaymentSuccess($paymentIntent) {
    global $conn;
    
    $orderNumber = $paymentIntent->metadata->order_number ?? null;
    $cockpit3dOrderId = $paymentIntent->metadata->cockpit3d_order_id ?? null;
    $localOrderId = $paymentIntent->metadata->local_order_id ?? null;
    
    error_log("Payment succeeded for order: $orderNumber");
    
    try {
        // 1. Update local database
        updateOrderStatus($localOrderId, [
            'status' => 'paid',
            'stripe_payment_intent_id' => $paymentIntent->id,
            'payment_method' => $paymentIntent->payment_method ?? null,
            'amount_paid' => $paymentIntent->amount / 100,
            'paid_at' => date('Y-m-d H:i:s')
        ]);
        
        // 2. Confirm Cockpit3D order (change from draft to active)
        if ($cockpit3dOrderId) {
            confirmCockpit3DOrder($cockpit3dOrderId);
            error_log("Cockpit3D order confirmed: $cockpit3dOrderId");
        }
        
        // 3. Get full order details
        $order = getOrderDetails($localOrderId);
        
        // 4. Send confirmation email
        sendOrderConfirmationEmail($order);
        error_log("Confirmation email sent for order: $orderNumber");
        
        // 5. Log success
        logEvent('payment_success', [
            'order_number' => $orderNumber,
            'amount' => $paymentIntent->amount / 100,
            'payment_intent_id' => $paymentIntent->id
        ]);
        
    } catch (Exception $e) {
        error_log('Error processing successful payment: ' . $e->getMessage());
        // Don't throw - we want to return 200 to Stripe
        // Log the error for manual review
        logEvent('payment_success_error', [
            'order_number' => $orderNumber,
            'error' => $e->getMessage()
        ]);
    }
}

/**
 * Handle failed payment
 */
function handlePaymentFailure($paymentIntent) {
    $orderNumber = $paymentIntent->metadata->order_number ?? null;
    $localOrderId = $paymentIntent->metadata->local_order_id ?? null;
    
    error_log("Payment failed for order: $orderNumber");
    
    try {
        // Update order status
        updateOrderStatus($localOrderId, [
            'status' => 'payment_failed',
            'failure_reason' => $paymentIntent->last_payment_error->message ?? 'Unknown error',
            'failed_at' => date('Y-m-d H:i:s')
        ]);
        
        // Log failure
        logEvent('payment_failed', [
            'order_number' => $orderNumber,
            'reason' => $paymentIntent->last_payment_error->message ?? 'Unknown'
        ]);
        
    } catch (Exception $e) {
        error_log('Error processing failed payment: ' . $e->getMessage());
    }
}

/**
 * Handle canceled payment
 */
function handlePaymentCanceled($paymentIntent) {
    $orderNumber = $paymentIntent->metadata->order_number ?? null;
    $localOrderId = $paymentIntent->metadata->local_order_id ?? null;
    
    error_log("Payment canceled for order: $orderNumber");
    
    try {
        updateOrderStatus($localOrderId, [
            'status' => 'canceled',
            'canceled_at' => date('Y-m-d H:i:s')
        ]);
        
        logEvent('payment_canceled', [
            'order_number' => $orderNumber
        ]);
        
    } catch (Exception $e) {
        error_log('Error processing canceled payment: ' . $e->getMessage());
    }
}

/**
 * Update order status in database
 */
function updateOrderStatus($orderId, $updates) {
    global $conn;
    
    if (!$orderId) {
        throw new Exception('Order ID is required');
    }
    
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
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to update order: " . $stmt->error);
    }
    
    $stmt->close();
}

/**
 * Confirm Cockpit3D order (change from draft to active)
 */
function confirmCockpit3DOrder($cockpit3dOrderId) {
    global $cockpit3dApiUrl, $cockpit3dApiKey;
    
    $ch = curl_init($cockpit3dApiUrl . '/orders/' . $cockpit3dOrderId);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => 'PATCH',
        CURLOPT_POSTFIELDS => json_encode(['status' => 'active']),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $cockpit3dApiKey
        ],
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("Failed to confirm Cockpit3D order: $error");
    }
    
    if ($httpCode !== 200) {
        error_log("Cockpit3D confirm failed (HTTP $httpCode): $response");
        throw new Exception("Cockpit3D order confirmation failed (HTTP $httpCode)");
    }
    
    return true;
}

/**
 * Get full order details
 */
function getOrderDetails($orderId) {
    global $conn;
    
    $stmt = $conn->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->bind_param('i', $orderId);
    $stmt->execute();
    $result = $stmt->get_result();
    $order = $result->fetch_assoc();
    $stmt->close();
    
    if (!$order) {
        throw new Exception("Order not found: $orderId");
    }
    
    // Decode JSON fields
    $order['items'] = json_decode($order['items'], true);
    $order['totals'] = json_decode($order['totals'], true);
    
    return $order;
}

/**
 * Send order confirmation email
 */
function sendOrderConfirmationEmail($order) {
    // Basic email implementation
    // You can enhance this with a proper email template
    
    $to = $order['customer_email'] ?? null;
    
    if (!$to) {
        error_log('No customer email found for order: ' . $order['order_number']);
        return false;
    }
    
    $subject = "Order Confirmation - {$order['order_number']}";
    
    $message = "
        <html>
        <head>
            <title>Order Confirmation</title>
        </head>
        <body>
            <h1>Thank you for your order!</h1>
            <p>Order Number: <strong>{$order['order_number']}</strong></p>
            <p>Order Total: \${$order['totals']['total']}</p>
            <p>We'll send you another email when your order ships.</p>
            <hr>
            <p>Crystal Keepsakes<br>
            <a href='https://crystalkeepsakes.com'>crystalkeepsakes.com</a></p>
        </body>
        </html>
    ";
    
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=utf-8',
        'From: Crystal Keepsakes <orders@crystalkeepsakes.com>',
        'Reply-To: orders@crystalkeepsakes.com'
    ];
    
    return mail($to, $subject, $message, implode("\r\n", $headers));
}

/**
 * Log event
 */
function logEvent($eventType, $data) {
    global $conn;
    
    $stmt = $conn->prepare("
        INSERT INTO event_logs (event_type, event_data, created_at)
        VALUES (?, ?, NOW())
    ");
    
    $jsonData = json_encode($data);
    $stmt->bind_param('ss', $eventType, $jsonData);
    $stmt->execute();
    $stmt->close();
}