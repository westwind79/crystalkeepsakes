<?php
/**
 * Test Stripe Session Creation
 * Attempts to create an actual test session and shows detailed errors
 */

header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Load environment
require_once dirname(__DIR__) . '/env-loader.php';
require_once dirname(dirname(__DIR__)) . '/vendor/autoload.php';

$results = [
    'timestamp' => date('Y-m-d H:i:s'),
    'test' => 'Stripe Checkout Session Creation',
    'status' => null,
    'error' => null,
    'details' => []
];

try {
    // Get Stripe key
    $mode = getEnvVar('NEXT_PUBLIC_ENV_MODE') ?? 'development';
    
    if ($mode === 'production') {
        $secretKey = getEnvVar('STRIPE_SECRET_KEY');
    } else {
        $secretKey = getEnvVar('STRIPE_DEVELOPMENT_SECRET_KEY');
    }
    
    $results['details']['mode'] = $mode;
    $results['details']['key_type'] = $mode === 'production' ? 'LIVE' : 'TEST';
    $results['details']['key_starts_with'] = substr($secretKey, 0, 7);
    
    // Set API key
    \Stripe\Stripe::setApiKey($secretKey);
    $results['details']['api_key_set'] = true;
    
    // Prepare test line items
    $lineItems = [
        [
            'price_data' => [
                'currency' => 'usd',
                'unit_amount' => 4999, // $49.99 in cents
                'product_data' => [
                    'name' => 'Test Crystal Heart 3x3',
                    'description' => 'SKU: CH-3X3-TEST',
                ],
            ],
            'quantity' => 1,
        ]
    ];
    
    $results['details']['line_items'] = $lineItems;
    
    // Determine URLs
    $baseUrl = 'http://localhost:8888/crystalkeepsakes';
    $successUrl = $baseUrl . '/order-confirmation?session_id={CHECKOUT_SESSION_ID}';
    $cancelUrl = $baseUrl . '/cart';
    
    $results['details']['success_url'] = $successUrl;
    $results['details']['cancel_url'] = $cancelUrl;
    
    // Prepare session params
    $sessionParams = [
        'line_items' => $lineItems,
        'mode' => 'payment',
        'success_url' => $successUrl,
        'cancel_url' => $cancelUrl,
        'metadata' => [
            'order_number' => 'TEST-' . time(),
            'environment' => $mode,
            'test_mode' => 'true'
        ],
    ];
    
    $results['details']['session_params'] = $sessionParams;
    
    // Attempt to create session
    $results['details']['attempting_creation'] = true;
    
    $checkoutSession = \Stripe\Checkout\Session::create($sessionParams);
    
    $results['status'] = 'SUCCESS';
    $results['session'] = [
        'id' => $checkoutSession->id,
        'url' => $checkoutSession->url,
        'payment_status' => $checkoutSession->payment_status,
        'amount_total' => $checkoutSession->amount_total,
        'currency' => $checkoutSession->currency
    ];
    
} catch (\Stripe\Exception\ApiErrorException $e) {
    $results['status'] = 'STRIPE_API_ERROR';
    $results['error'] = [
        'type' => get_class($e),
        'message' => $e->getMessage(),
        'code' => $e->getStripeCode(),
        'http_status' => $e->getHttpStatus(),
    ];
    
    // Common Stripe API errors
    if ($e->getStripeCode() === 'testmode_charges_only') {
        $results['solution'] = 'Your Stripe account is in test mode but you are using live keys. Use test keys (sk_test_...) instead.';
    } elseif ($e->getStripeCode() === 'api_key_expired') {
        $results['solution'] = 'Your Stripe API key has expired. Generate a new one from Stripe Dashboard.';
    } elseif ($e->getStripeCode() === 'invalid_request_error') {
        $results['solution'] = 'Check the session parameters. Possible issues: invalid currency, amount, or URLs.';
    }
    
} catch (Exception $e) {
    $results['status'] = 'PHP_ERROR';
    $results['error'] = [
        'type' => get_class($e),
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => array_slice($e->getTrace(), 0, 3) // First 3 trace items
    ];
}

echo json_encode($results, JSON_PRETTY_PRINT);
