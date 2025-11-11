<?php
/**
 * Create Stripe Checkout Session
 * @version 2.0.0
 * @date 2025-11-10
 * @description Creates Stripe Checkout - Stripe handles address, shipping, tax
 */

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/checkout_session_errors.log');

// CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8888',
    'https://crystalkeepsakes.com',
    'https://www.crystalkeepsakes.com'
];

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Use existing environment loader
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

try {
    error_log("=== CHECKOUT SESSION REQUEST ===");
    
    $mode = getEnvVariable('NEXT_PUBLIC_ENV_MODE') ?? 'development';
    error_log("Mode: $mode");
    
    // Get Stripe key
    if ($mode === 'production') {
        $secretKey = getEnvVariable('STRIPE_SECRET_KEY');
    } else {
        $secretKey = getEnvVariable('STRIPE_DEVELOPMENT_SECRET_KEY');
    }
    
    if (!$secretKey) {
        throw new Exception("Stripe secret key not found");
    }
    
    // Load Stripe
    $possibleVendorPaths = [
        dirname(dirname(__DIR__)) . '/vendor/autoload.php',
        dirname(__DIR__) . '/vendor/autoload.php',
        dirname(dirname(dirname(__DIR__))) . '/vendor/autoload.php',
        $_SERVER['DOCUMENT_ROOT'] . '/crystalkeepsakes/vendor/autoload.php',
    ];
    
    $vendorLoaded = false;
    foreach ($possibleVendorPaths as $path) {
        if (file_exists($path)) {
            require_once $path;
            $vendorLoaded = true;
            error_log("✓ Stripe loaded from: $path");
            break;
        }
    }
    
    if (!$vendorLoaded) {
        throw new Exception('Stripe library not found');
    }
    
    \Stripe\Stripe::setApiKey($secretKey);
    
    // Parse request
    $input = file_get_contents('php://input');
    $data = json_decode($input);
    
    if (!$data || !isset($data->cartItems) || empty($data->cartItems)) {
        throw new Exception('Invalid cart data');
    }
    
    error_log("✓ Cart items: " . count($data->cartItems));
    
    // Build line items
    $lineItems = [];
    
    foreach ($data->cartItems as $item) {
        $name = $item->name ?? 'Product';
        $price = floatval($item->price ?? 0);
        $qty = intval($item->quantity ?? 1);
        $sku = $item->sku ?? 'UNKNOWN';
        
        $priceInCents = round($price * 100);
        
        error_log("  - {$name} (SKU: $sku): \${$price} x {$qty}");
        
        $lineItems[] = [
            'price_data' => [
                'currency' => 'usd',
                'unit_amount' => $priceInCents,
                'product_data' => [
                    'name' => $name,
                    'description' => "SKU: $sku",
                ],
            ],
            'quantity' => $qty,
        ];
    }
    
    // Generate order number
    $orderNumber = $data->orderNumber ?? ('ORD-' . time());
    if ($mode === 'test' || $mode === 'development') {
        $orderNumber = 'TEST_' . $orderNumber;
    }
    
    // Determine URLs
    $baseUrl = ($mode === 'production') 
        ? 'https://crystalkeepsakes.com'
        : 'http://localhost:3000';
    
    $successUrl = $baseUrl . '/order-confirmation?session_id={CHECKOUT_SESSION_ID}';
    $cancelUrl = $baseUrl . '/cart';
    
    // Store cart for webhook (limited to 500 chars per metadata field)
    $cartSummary = [];
    foreach ($data->cartItems as $item) {
        $cartSummary[] = [
            'sku' => $item->sku ?? 'UNKNOWN',
            'name' => $item->name ?? 'Product',
            'qty' => $item->quantity ?? 1
        ];
    }
    
    $metadata = [
        'order_number' => $orderNumber,
        'environment' => $mode,
        'items_count' => count($data->cartItems),
        'cart_items' => substr(json_encode($cartSummary), 0, 500),
    ];
    
    // Create Stripe Checkout Session
    $sessionParams = [
        'line_items' => $lineItems,
        'mode' => 'payment',
        'success_url' => $successUrl,
        'cancel_url' => $cancelUrl,
        'metadata' => $metadata,
        
        // Collect shipping address
        'shipping_address_collection' => [
            'allowed_countries' => ['US', 'CA'],
        ],
        
        // Shipping options
        'shipping_options' => [
            [
                'shipping_rate_data' => [
                    'type' => 'fixed_amount',
                    'fixed_amount' => ['amount' => 500, 'currency' => 'usd'],
                    'display_name' => 'Standard Shipping (5-7 business days)',
                    'delivery_estimate' => [
                        'minimum' => ['unit' => 'business_day', 'value' => 5],
                        'maximum' => ['unit' => 'business_day', 'value' => 7],
                    ],
                ],
            ],
            [
                'shipping_rate_data' => [
                    'type' => 'fixed_amount',
                    'fixed_amount' => ['amount' => 1500, 'currency' => 'usd'],
                    'display_name' => 'Express Shipping (1-3 business days)',
                    'delivery_estimate' => [
                        'minimum' => ['unit' => 'business_day', 'value' => 1],
                        'maximum' => ['unit' => 'business_day', 'value' => 3],
                    ],
                ],
            ],
        ],
        
        // Customer email
        'customer_email' => $data->customerEmail ?? null,
        
        // Allow promo codes
        'allow_promotion_codes' => true,
    ];
    
    // Enable tax if configured in Stripe Dashboard
    $sessionParams['automatic_tax'] = ['enabled' => true];
    
    $checkoutSession = \Stripe\Checkout\Session::create($sessionParams);
    
    error_log("✓ Checkout session created: " . $checkoutSession->id);
    error_log("=== REQUEST COMPLETE ===");
    
    echo json_encode([
        'success' => true,
        'sessionId' => $checkoutSession->id,
        'url' => $checkoutSession->url,
        'order_number' => $orderNumber,
    ]);
    
} catch (Exception $e) {
    error_log('❌ ERROR: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}