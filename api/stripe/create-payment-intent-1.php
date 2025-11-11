<?php
/**
 * Stripe Payment Intent Creator
 * @version 1.0.1
 * @date 2025-11-08
 * @description Creates Stripe payment intents for Crystal Keepsakes orders
 * @changelog Fixed CORS headers for localhost:3000 development
 */

// ⚠️ CORS Headers MUST be first - before any other output
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/payment_intent_errors.log');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only POST allowed for actual requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

/**
 * Get environment variable from .env file
 */
function getEnv($key) {
    static $envCache = null;
    
    if ($envCache === null) {
        $envCache = [];
        $envFile = dirname(__DIR__) . '/.env';
        
        if (!file_exists($envFile)) {
            error_log(".env not found at: $envFile");
            return null;
        }
        
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || strpos($line, '#') === 0) continue;
            
            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $envKey = trim($parts[0]);
                $envValue = trim($parts[1], " \t\n\r\0\x0B\"'");
                $envCache[$envKey] = $envValue;
            }
        }
    }
    
    return $envCache[$key] ?? null;
}

/**
 * Save order to database (gracefully fails in dev mode)
 */
function saveOrderData($data, $mode) {
    try {
        // Skip DB in development
        if ($mode === 'development') {
            error_log('Dev mode - skipping database');
            return false;
        }
        
        $dbFile = __DIR__ . '/db-connect.php';
        if (!file_exists($dbFile)) {
            error_log('db_connect.php not found');
            return false;
        }
        
        $pdo = require_once $dbFile;
        
        // Create order number with TEST prefix in testing
        $orderNumber = $data->orderNumber ?? ('ORD-' . time());
        if ($mode === 'testing') {
            $orderNumber = 'TEST_' . $orderNumber;
        }
        
        // Insert order
        $stmt = $pdo->prepare("
            INSERT INTO orders (
                order_id, order_items, amount, shipping_amount,
                shipping_method, order_status, created_at
            ) VALUES (?, ?, ?, ?, ?, 'pending', NOW())
        ");
        
        $orderData = [
            'order_number' => $orderNumber,
            'cart_items' => $data->cartItems,
            'subtotal' => $data->subtotal ?? 0,
            'shipping_cost' => $data->shippingCost ?? 0,
            'tax_amount' => $data->taxAmount ?? 0,
            'total' => $data->total ?? 0
        ];
        
        $stmt->execute([
            $orderNumber,
            json_encode($orderData),
            $data->subtotal ?? 0,
            $data->shippingCost ?? 0,
            $data->shippingMethod ?? 'Standard'
        ]);
        
        error_log("Order saved: $orderNumber");
        
        // Save images if present
        if (isset($data->fullCartItems) && file_exists(__DIR__ . '/image-storage.php')) {
            require_once __DIR__ . '/image-storage.php';
            $imageStorage = new ImageStorage();
            
            foreach ($data->fullCartItems as $item) {
                $cartItemId = $item->cartId ?? uniqid();
                
                // Save raw, preview, masked images
                $imageTypes = [
                    'rawImageUrl' => 'raw',
                    'imageUrl' => 'preview',
                    'maskedImageUrl' => 'masked'
                ];
                
                foreach ($imageTypes as $optionKey => $imageType) {
                    if (isset($item->options->$optionKey) && str_starts_with($item->options->$optionKey, 'data:image/')) {
                        try {
                            $fileInfo = $imageStorage->saveImageFromBase64(
                                $item->options->$optionKey,
                                $orderNumber,
                                $cartItemId,
                                $imageType
                            );
                            
                            $imageStorage->saveImageToDatabase(
                                $pdo,
                                $orderNumber,
                                $cartItemId,
                                $imageType,
                                $fileInfo
                            );
                            
                            error_log("Saved $imageType for $cartItemId");
                        } catch (Exception $e) {
                            error_log("Image save failed: " . $e->getMessage());
                        }
                    }
                }
            }
        }
        
        return true;
        
    } catch (Exception $e) {
        error_log('DB save error (continuing): ' . $e->getMessage());
        return false;
    }
}

try {
    // Get environment mode
    $mode = getEnv('NEXT_PUBLIC_ENV_MODE') ?? 'development';
    error_log("Environment: $mode");
    
    // Determine Stripe key
    $secretKey = ($mode === 'production')
        ? getEnv('STRIPE_SECRET_KEY')
        : getEnv('STRIPE_DEVELOPMENT_SECRET_KEY');
    
    if (!$secretKey) {
        throw new Exception("Stripe key not found for mode: $mode");
    }
    
    // Load Stripe library
    $vendorPaths = [
        dirname(__DIR__) . '/vendor/autoload.php',
        dirname(dirname(__DIR__)) . '/vendor/autoload.php',
        $_SERVER['DOCUMENT_ROOT'] . '/vendor/autoload.php',
        $_SERVER['DOCUMENT_ROOT'] . '/../vendor/autoload.php'
    ];
    
    $vendorLoaded = false;
    foreach ($vendorPaths as $path) {
        if (file_exists($path)) {
            require_once $path;
            $vendorLoaded = true;
            error_log("Loaded Stripe from: $path");
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
    
    error_log("Received cart with " . count($data->cartItems) . " items");
    
    // Calculate amount
    $amount = 0;
    foreach ($data->cartItems as $item) {
        $price = floatval($item->price ?? 0);
        $qty = intval($item->quantity ?? 1);
        $amount += ($price * $qty);
        
        error_log("Item: {$item->name} | Price: $price | Qty: $qty");
    }
    
    $amountInCents = round($amount * 100);
    error_log("Total amount: $amount USD ($amountInCents cents)");
    
    // Create order number
    $orderNumber = $data->orderNumber ?? ('ORD-' . time());
    if ($mode === 'testing') {
        $orderNumber = 'TEST_' . $orderNumber;
    }
    
    // Save to database (gracefully fails in dev)
    $dbSaved = saveOrderData($data, $mode);
    
    // Create Stripe Payment Intent
    $paymentIntent = \Stripe\PaymentIntent::create([
        'amount' => $amountInCents,
        'currency' => 'usd',
        'automatic_payment_methods' => ['enabled' => true],
        'metadata' => [
            'order_number' => $orderNumber,
            'items_count' => count($data->cartItems),
            'total_amount' => $data->total ?? $amount,
            'environment' => $mode
        ]
    ]);
    
    error_log("Payment intent created: " . $paymentIntent->id);
    
    // Success response
    echo json_encode([
        'success' => true,
        'clientSecret' => $paymentIntent->client_secret,
        'order_number' => $orderNumber,
        'database_saved' => $dbSaved,
        'environment' => $mode,
        'amount' => $amount
    ]);
    
} catch (Exception $e) {
    error_log('Payment intent error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}