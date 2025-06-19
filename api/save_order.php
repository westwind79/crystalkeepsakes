<?php
// api/save_order.php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/order_errors.log');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // Connect to database
    $pdo = require_once __DIR__ . '/db_connect.php';
    
    // Parse request data
    $jsonStr = file_get_contents('php://input');
    $data = json_decode($jsonStr);
    
    if (!$data || !isset($data->orderId)) {
        throw new Exception('Invalid or missing order data');
    }
    
    // Extract order details
    $orderId = $data->orderId;
    $paymentId = $data->paymentId ?? null;
    $paymentStatus = $data->status ?? 'pending';
    
    // Extract customer information
    $customerName = $data->shippingInfo->name ?? null;
    $customerEmail = $data->receipt_email ?? null;
    $customerPhone = $data->shippingInfo->phone ?? null;
    
    // Extract shipping information
    $shippingMethod = $data->shippingMethod ?? 'standard';
    $shippingAmount = $data->shippingCost ?? 0;
    
    // Format shipping address
    $shippingAddress = '';
    if (isset($data->shippingInfo->address)) {
        $address = $data->shippingInfo->address;
        $shippingAddress = json_encode($address);
    }
    
    // Extract payment information
    $amount = $data->subtotal ?? 0;
    
    // Format order items
    $orderItems = isset($data->cartItems) ? json_encode($data->cartItems) : '[]';
    
    // Begin transaction
    $pdo->beginTransaction();
    
    // Check if order already exists
    $stmt = $pdo->prepare("SELECT id FROM orders WHERE order_id = ?");
    $stmt->execute([$orderId]);
    $existingOrder = $stmt->fetch();
    
    if ($existingOrder) {
        // Update existing order
        $stmt = $pdo->prepare("
            UPDATE orders 
            SET 
                payment_id = ?,
                payment_status = ?,
                amount = ?,
                shipping_amount = ?,
                shipping_method = ?,
                order_status = ?
            WHERE order_id = ?
        ");
        
        $stmt->execute([
            $paymentId,
            $paymentStatus,
            $amount,
            $shippingAmount,
            $shippingMethod,
            $paymentStatus === 'succeeded' ? 'paid' : 'pending',
            $orderId
        ]);
        
        $orderId = $orderId;
    } else {
        // Insert new order
        $stmt = $pdo->prepare("
            INSERT INTO orders (
                order_id, customer_name, customer_email, customer_phone,
                payment_id, payment_status, amount, shipping_amount,
                shipping_method, shipping_address, order_items, order_status
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        ");
        
        $stmt->execute([
            $orderId,
            $customerName,
            $customerEmail,
            $customerPhone,
            $paymentId,
            $paymentStatus,
            $amount,
            $shippingAmount,
            $shippingMethod,
            $shippingAddress,
            $orderItems,
            $paymentStatus === 'succeeded' ? 'paid' : 'pending'
        ]);
        
        $orderId = $orderId;
    }
    
    // Record status history
    $stmt = $pdo->prepare("
        INSERT INTO order_status_history (
            order_id, status, notes
        ) VALUES (?, ?, ?)
    ");
    
    $stmt->execute([
        $orderId,
        $paymentStatus === 'succeeded' ? 'paid' : 'pending',
        'Order ' . ($existingOrder ? 'updated' : 'created') . ' via API'
    ]);
    
    // Commit transaction
    $pdo->commit();
    
    // Return success
    echo json_encode([
        'success' => true,
        'message' => 'Order ' . ($existingOrder ? 'updated' : 'created') . ' successfully',
        'orderId' => $orderId
    ]);
    
} catch (Exception $e) {
    // Rollback transaction if active
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    error_log('Order save error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>