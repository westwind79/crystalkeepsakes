<?php
/**
 * Verify Stripe Session + Show Debug Info
 * Returns complete order details + Cockpit3D payload for debugging
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
    
    if ($mode === 'production') {
        $secretKey = getEnvVar('STRIPE_SECRET_KEY');
    } else {
        $secretKey = getEnvVar('STRIPE_DEVELOPMENT_SECRET_KEY');
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
        'expand' => ['line_items', 'payment_intent', 'customer']
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
    if (preg_match('/CK-(\d+)-/', $orderNumber, $matches)) {
        $orderTimestamp = (int)$matches[1];
        $orderDate = date('Y-m-d H:i:s', $orderTimestamp);
    }
    
    // Build Cockpit3D payload (for debugging)
    $cockpit3dPayload = [
        'retailer_id' => getEnvVar('COCKPIT3D_RETAIL_ID') ?? '256568874',
        'order_id' => $orderNumber,
        'address' => [
            'email' => $session->customer_details->email ?? '',
            'firstname' => explode(' ', $session->customer_details->name ?? '')[0] ?? '',
            'lastname' => explode(' ', $session->customer_details->name ?? '', 2)[1] ?? '',
            'telephone' => $session->customer_details->phone ?? '',
            'region' => $session->customer_details->address->state ?? '',
            'country' => $session->customer_details->address->country ?? 'US',
            'street' => $session->customer_details->address->line1 ?? '',
            'city' => $session->customer_details->address->city ?? '',
            'postcode' => $session->customer_details->address->postal_code ?? '',
            'shipping_method' => 'standard',
            'destination' => 'customer_home',
        ],
        'items' => [], // Would be populated from cart data
        'total' => $session->amount_total / 100,
        'subtotal' => $session->amount_subtotal / 100
    ];
    
    // Build response with complete debug info
    $response = [
        'success' => true,
        
        // Basic Order Info
        'order' => [
            'order_number' => $orderNumber,
            'order_timestamp' => $orderTimestamp,
            'order_date' => $orderDate,
            'status' => 'confirmed',
            'payment_status' => $session->payment_status,
        ],
        
        // Stripe Session Info
        'stripe' => [
            'session_id' => $session->id,
            'payment_intent_id' => $paymentIntent ? $paymentIntent->id : null,
            'customer_id' => is_string($session->customer) ? $session->customer : $session->customer->id ?? null,
            'payment_status' => $session->payment_status,
            'amount_total' => $session->amount_total,
            'amount_subtotal' => $session->amount_subtotal,
            'currency' => $session->currency,
            'mode' => $session->mode,
        ],
        
        // Customer Info
        'customer' => [
            'email' => $session->customer_details->email ?? null,
            'name' => $session->customer_details->name ?? null,
            'phone' => $session->customer_details->phone ?? null,
            'address' => [
                'line1' => $session->customer_details->address->line1 ?? null,
                'line2' => $session->customer_details->address->line2 ?? null,
                'city' => $session->customer_details->address->city ?? null,
                'state' => $session->customer_details->address->state ?? null,
                'postal_code' => $session->customer_details->address->postal_code ?? null,
                'country' => $session->customer_details->address->country ?? null,
            ]
        ],
        
        // Line Items
        'line_items' => [],
        
        // Cockpit3D Debug Info
        'cockpit3d_payload' => $cockpit3dPayload,
        'cockpit3d_status' => 'not_submitted', // Would check database
        
        // Debug Info
        'debug' => [
            'environment' => $mode,
            'webhook_fired' => false, // Would check database
            'timestamp' => time(),
            'php_version' => phpversion(),
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
