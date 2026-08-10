<?php
/**
 * Verify Stripe Session + Show Safe Order Info
 * Returns non-PII order details for the confirmation page.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../env-loader.php';
require_once dirname(__DIR__, 2) . '/vendor/autoload.php';

try {
    $mode = getEnvVar('NEXT_PUBLIC_ENV_MODE') ?? 'development';
    
    // ONLY uses STRIPE_SECRET_KEY
    $secretKey = getEnvVar('STRIPE_SECRET_KEY');
    if (!$secretKey) {
        throw new Exception('STRIPE_SECRET_KEY not found in .env');
    }
    
    \Stripe\Stripe::setApiKey($secretKey);
    
    $data = json_decode(file_get_contents('php://input'), true);
    $sessionId = $data['session_id'] ?? null;
    
    if (!$sessionId) {
        throw new Exception('Session ID required');
    }
    
    // Retrieve session from Stripe
    $session = \Stripe\Checkout\Session::retrieve([
        'id' => $sessionId,
        'expand' => ['line_items', 'payment_intent']
    ]);
    
    // Get payment intent details
    $paymentIntent = null;
    if ($session->payment_intent) {
        if (is_string($session->payment_intent)) {
            $paymentIntent = \Stripe\PaymentIntent::retrieve($session->payment_intent);
        } else {
            $paymentIntent = $session->payment_intent;
        }
    }
    
    // Extract order number from metadata
    $orderNumber = $session->metadata->order_number ?? 'Unknown';
    
    // Parse timestamp from order number
    $orderTimestamp = null;
    $orderDate = null;
    if (preg_match('/CK_\d+_(\d+)/', $orderNumber, $matches)) {
        $orderTimestamp = (int) floor(((int) $matches[1]) / 1000);
        $orderDate = date('Y-m-d H:i:s', $orderTimestamp);
    } elseif (preg_match('/CK-(\d+)-/', $orderNumber, $matches)) {
        $orderTimestamp = (int)$matches[1];
        $orderDate = date('Y-m-d H:i:s', $orderTimestamp);
    }
    
    $orderDataFile = dirname(__DIR__) . '/order-data/' . preg_replace('/[^a-zA-Z0-9_-]/', '', $orderNumber) . '.json';
    $orderDataExists = file_exists($orderDataFile);
    $orderDataCreatedAt = $orderDataExists ? date('c', filemtime($orderDataFile)) : null;
    
    // Build response with no customer PII.
    $response = [
        'success' => true,
        
        // Basic Order Info
        'order' => [
            'order_number' => $orderNumber,
            'order_timestamp' => $orderTimestamp,
            'order_date' => $orderDate,
            'status' => 'confirmed',
            'payment_status' => $session->payment_status,
            'created_at' => $orderDataCreatedAt,
        ],
        
        // Stripe Session Info
        'stripe' => [
            'session_id' => $session->id,
            'payment_intent_id' => $paymentIntent ? $paymentIntent->id : null,
            'payment_status' => $session->payment_status,
            'amount_total' => $session->amount_total,
            'amount_subtotal' => $session->amount_subtotal,
            'amount_shipping' => $session->total_details->amount_shipping ?? null,
            'amount_tax' => $session->total_details->amount_tax ?? null,
            'amount_discount' => $session->total_details->amount_discount ?? null,
            'currency' => $session->currency,
            'mode' => $session->mode,
        ],
        
        // Line Items
        'line_items' => [],
        
        // Fulfillment status
        'fulfillment' => [
            'order_data_saved' => $orderDataExists,
            'order_data_created_at' => $orderDataCreatedAt,
            'webhook_expected' => true,
            'external_order_status' => 'pending_webhook_or_review'
        ],
        
        // Debug Info
        'debug' => [
            'environment' => $mode,
            'timestamp' => time(),
            'php_version' => phpversion(),
            'privacy' => 'Customer name, email, phone, and address are intentionally omitted.'
        ]
    ];
    
    // Add line items
    if ($session->line_items && $session->line_items->data) {
        foreach ($session->line_items->data as $item) {
            $response['line_items'][] = [
                'description' => $item->description,
                'quantity' => $item->quantity,
                'amount_total' => $item->amount_total,
                'amount_subtotal' => $item->amount_subtotal,
            ];
        }
    }
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
