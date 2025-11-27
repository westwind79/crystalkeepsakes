<?php
/**
 * Stripe Checkout Session Creator - V2.0
 * Creates a hosted checkout page on stripe.com with shipping & coupons
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

// Load centralized environment loader
require_once dirname(__DIR__) . '/env-loader.php';

try {
    error_log("=== CHECKOUT SESSION REQUEST ===");
    
    // Detect environment mode
    // Priority: 1) ENV variable 2) URL-based detection
    $mode = getEnvVar('NEXT_PUBLIC_ENV_MODE') ?? 'development';
    
    // Override: If accessing via /test subdirectory, force test mode
    $requestUri = $_SERVER['REQUEST_URI'] ?? '';
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (
        strpos($requestUri, '/test/') !== false || 
        strpos($referer, '/test/') !== false ||
        strpos($origin, '/test') !== false
    ) {
        $mode = 'test';
        error_log("⚠️  Detected /test subdirectory - forcing TEST mode");
    }
    
    error_log("Mode: $mode");
    
    // Get Stripe key
    if ($mode === 'production') {
        $secretKey = getEnvVar('STRIPE_SECRET_KEY');
    } else {
        $secretKey = getEnvVar('STRIPE_DEVELOPMENT_SECRET_KEY');
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
    
    // ✅ FIX: Dynamic URL detection based on request origin
    // Supports localhost, /test subdirectory, and production
    $baseUrl = '';
    
    // Check for origin header first (most reliable)
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        $baseUrl = $_SERVER['HTTP_ORIGIN'];
        error_log("Using HTTP_ORIGIN: $baseUrl");
    } 
    // Fallback to HTTP_REFERER
    elseif (isset($_SERVER['HTTP_REFERER'])) {
        $referer = $_SERVER['HTTP_REFERER'];
        $parsedUrl = parse_url($referer);
        $baseUrl = $parsedUrl['scheme'] . '://' . $parsedUrl['host'];
        
        // Handle subdirectory paths (e.g., /test, /crystalkeepsakes)
        if (isset($parsedUrl['path'])) {
            $pathParts = explode('/', trim($parsedUrl['path'], '/'));
            // If path starts with known subdirectory, include it
            if (!empty($pathParts[0]) && in_array($pathParts[0], ['test', 'crystalkeepsakes', 'staging'])) {
                $baseUrl .= '/' . $pathParts[0];
            }
        }
        error_log("Using HTTP_REFERER: $baseUrl");
    }
    // Fallback to environment-based detection
    else {
        if ($mode === 'production') {
            $baseUrl = 'https://crystalkeepsakes.com';
        } else {
            // Check if running in MAMP subdirectory
            $docRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
            if (strpos($docRoot, 'MAMP') !== false || strpos($docRoot, 'htdocs') !== false) {
                $baseUrl = 'http://localhost:8888/crystalkeepsakes';
            } else {
                $baseUrl = 'http://localhost:3000';
            }
        }
        error_log("Using fallback URL: $baseUrl");
    }
    
    $successUrl = $baseUrl . '/order-confirmation?session_id={CHECKOUT_SESSION_ID}';
    $cancelUrl = $baseUrl . '/cart';
    
    error_log("Final URLs - Success: $successUrl | Cancel: $cancelUrl");
    
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
        // Customer email
        'customer_email' => $data->customerEmail ?? null,
        
        // Allow promo codes
        'allow_promotion_codes' => true,
    ];
    
    // Add shipping for TRUE production only (requires Stripe Dashboard configuration)
    // DO NOT enable shipping for test/development modes - requires live shipping rates
    if ($mode === 'production') {
        // Only add shipping if we're in REAL production (not /test subdirectory)
        $sessionParams['shipping_address_collection'] = [
            'allowed_countries' => ['US', 'CA'],
        ];
        
        // Shipping options - Use your LIVE Stripe Dashboard shipping rates
        // NOTE: These shipping_rate IDs only work in LIVE mode
        $sessionParams['shipping_options'] = [
            ['shipping_rate' => 'shr_1RRRX82YE48VQlzYpcQsdaSE'], // 3-5 Business Days
            ['shipping_rate' => 'shr_1RRRZF2YE48VQlzY3XrqHEPm'], // 5-7 Ground Ship
            ['shipping_rate' => 'shr_1RRRZp2YE48VQlzYYqNzpUQj'], // 7-10 Ground Ship
            ['shipping_rate' => 'shr_1RRRaI2YE48VQlzYUG3v8RPf'], // 10-14 Ground Ship
            ['shipping_rate' => 'shr_1RRRbE2YE48VQlzYypBEVG4V'], // 3-4 Weeks Postal
        ];
        
        // Enable tax if configured in Stripe Dashboard
        $sessionParams['automatic_tax'] = ['enabled' => true];
        
        error_log('✅ Production mode: Shipping and tax ENABLED');
    } else {
        // Test/Development mode: NO shipping, NO tax
        // This prevents "No such shipping rate" errors in test environments
        error_log('⚠️  Test/Development mode: Shipping and tax DISABLED for testing');
        error_log('    To enable shipping in test: Create test shipping rates in Stripe Dashboard');
    }
    
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