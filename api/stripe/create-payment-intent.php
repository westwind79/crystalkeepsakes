<?php
/**
 * Stripe Payment Intent Creator - SIMPLIFIED
 * @version 3.0.0
 * @date 2025-11-10
 * @description Stripe handles shipping/tax via Dashboard settings
 */

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/payment_intent_errors.log');

// CORS Headers
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
header('Access-Control-Allow-Headers: Content-Type, Authorization');
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
        
        $envFile = null;
        foreach ($possibleEnvPaths as $path) {
            if (file_exists($path)) {
                $envFile = $path;
                error_log("✓ Found .env at: $path");
                break;
            }
        }
        
        if (!$envFile) {
            error_log("❌ .env not found");
            return null;
        }
        
        $content = file_get_contents($envFile);
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
    }
    
    return $envCache[$key] ?? null;
}

try {
    error_log("=== NEW PAYMENT REQUEST ===");
    
    $mode = getEnvVariable('NEXT_PUBLIC_ENV_MODE') ?? 'development';
    error_log("Mode: $mode");
    
    // Get correct Stripe key
    if ($mode === 'production') {
        $secretKey = getEnvVariable('STRIPE_SECRET_KEY');
    } else {
        $secretKey = getEnvVariable('STRIPE_DEVELOPMENT_SECRET_KEY');
    }
    
    if (!$secretKey) {
        throw new Exception("Stripe secret key not found");
    }
    
    // Load Stripe library
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
            error_log("✓ Loaded Stripe from: $path");
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
    
    // Calculate subtotal only (Stripe handles shipping/tax)
    $subtotal = 0;
    foreach ($data->cartItems as $item) {
        $price = floatval($item->price ?? 0);
        $qty = intval($item->quantity ?? 1);
        $subtotal += ($price * $qty);
        error_log("  - {$item->name}: \${$price} x {$qty}");
    }
    
    error_log("💰 Subtotal: $" . number_format($subtotal, 2));
    
    // Convert to cents
    $amountInCents = round($subtotal * 100);
    
    // Generate order number
    $orderNumber = $data->orderNumber ?? ('ORD-' . time());
    if ($mode === 'test' || $mode === 'development') {
        $orderNumber = 'TEST_' . $orderNumber;
    }
    
    // Create Stripe Payment Intent
    // Stripe will handle shipping rates and tax via Dashboard settings
    $paymentIntent = \Stripe\PaymentIntent::create([
        'amount' => $amountInCents,
        'currency' => 'usd',
        'automatic_payment_methods' => [
            'enabled' => true,
        ],
        'metadata' => [
            'order_number' => $orderNumber,
            'environment' => $mode,
            'items_count' => count($data->cartItems),
            'subtotal' => $subtotal,
            'cart_details' => json_encode($data->cartItems)
        ]
    ]);
    
    error_log("✓ Payment intent created: " . $paymentIntent->id);
    error_log("=== REQUEST COMPLETE ===");
    
    // Success response
    echo json_encode([
        'success' => true,
        'clientSecret' => $paymentIntent->client_secret,
        'order_number' => $orderNumber,
        'environment' => $mode,
        'amount' => $subtotal
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