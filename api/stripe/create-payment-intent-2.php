<?php
/**
 * Stripe Payment Intent Creator with Shipping
 * @version 2.2.0
 * @date 2025-11-08
 * @description Handles shipping, tax, and verifies frontend calculations
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

/**
 * Calculate shipping server-side (MUST match frontend logic!)
 */
function calculateShipping($subtotal, $shippingMethod) {
    // Free shipping over $100
    if ($subtotal >= 100) {
        return 0;
    }
    
    switch ($shippingMethod) {
        case 'express':
            return 15.00;
        case 'priority':
            return 10.00;
        case 'standard':
        default:
            return 5.00;
    }
}

/**
 * Calculate tax server-side (MUST match frontend logic!)
 */
function calculateTax($subtotal, $shippingCost) {
    $TAX_RATE = 0.085; // 8.5%
    return ($subtotal + $shippingCost) * $TAX_RATE;
}

function saveDatabaseData($data, $mode) {
    try {
        if ($mode === 'development') {
            error_log('Development mode - skipping database');
            return false;
        }
        
        $dbFile = __DIR__ . '/db-connect.php';
        if (!file_exists($dbFile)) {
            error_log('Database files not found - skipping');
            return false;
        }
        
        $pdo = require_once $dbFile;
        
        $orderNumber = $data->orderNumber ?? ('ORD-' . time());
        if ($mode === 'test') {
            $orderNumber = 'TEST_' . $orderNumber;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO orders (
                order_id, order_items, amount, shipping_amount,
                shipping_method, tax_amount, order_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
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
            $data->shippingMethod ?? 'standard',
            $data->taxAmount ?? 0
        ]);
        
        error_log("✓ Order saved: $orderNumber");
        return true;
        
    } catch (Exception $e) {
        error_log('Database save failed: ' . $e->getMessage());
        return false;
    }
}

try {
    error_log("=== NEW PAYMENT REQUEST ===");
    
    $mode = getEnvVariable('NEXT_PUBLIC_ENV_MODE') ?? 'development';
    error_log("Mode: $mode");
    
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
    
    // CALCULATE SUBTOTAL (verify frontend calculation)
    $calculatedSubtotal = 0;
    foreach ($data->cartItems as $item) {
        $price = floatval($item->price ?? 0);
        $qty = intval($item->quantity ?? 1);
        $calculatedSubtotal += ($price * $qty);
        error_log("  - {$item->name}: \${$price} x {$qty}");
    }
    
    // CALCULATE SHIPPING (verify frontend calculation)
    $shippingMethod = $data->shippingMethod ?? 'standard';
    $calculatedShipping = calculateShipping($calculatedSubtotal, $shippingMethod);
    
    // CALCULATE TAX (verify frontend calculation)
    $calculatedTax = calculateTax($calculatedSubtotal, $calculatedShipping);
    
    // CALCULATE TOTAL
    $calculatedTotal = $calculatedSubtotal + $calculatedShipping + $calculatedTax;
    
    error_log("💰 Server Calculations:");
    error_log("  Subtotal: $" . number_format($calculatedSubtotal, 2));
    error_log("  Shipping ($shippingMethod): $" . number_format($calculatedShipping, 2));
    error_log("  Tax: $" . number_format($calculatedTax, 2));
    error_log("  Total: $" . number_format($calculatedTotal, 2));
    
    // VERIFY against frontend values (security check)
    if (isset($data->total)) {
        $frontendTotal = floatval($data->total);
        $difference = abs($calculatedTotal - $frontendTotal);
        
        if ($difference > 0.02) { // Allow 2 cent rounding difference
            error_log("⚠️ WARNING: Total mismatch! Server: $calculatedTotal, Frontend: $frontendTotal");
            throw new Exception('Total amount mismatch. Please refresh and try again.');
        }
    }

    $frontendSub = floatval($data->subtotal ?? 0);
    if (abs($calculatedSubtotal - $frontendSub) > 0.02) {
        throw new Exception('Sub-total mismatch. Refresh and try again.');
    }

    $amountInCents = round($calculatedSubtotal * 100);

    // Use SERVER calculation for Stripe (never trust frontend)
    // $amountInCents = round($calculatedTotal * 100);
    
    // Try to save to database
    $databaseSaved = saveDatabaseData($data, $mode);
    
    // Create order number
    $orderNumber = $data->orderNumber ?? ('ORD-' . time());
    if ($mode === 'test' || $mode === 'development') {
        $orderNumber = 'TEST_' . $orderNumber;
    }

    
    // Create Stripe Payment Intent
    $paymentIntent = \Stripe\PaymentIntent::create([
        'amount' => $amountInCents,
        'currency' => 'usd',
        'automatic_payment_methods' => ['enabled' => true],
        'metadata' => [
            'order_number' => $orderNumber,
            'cockpit_order' => json_encode($data->cockpitOrder ?? []),
            'environment' => $mode,
            'items_count' => count($data->cartItems),
            'subtotal' => $calculatedSubtotal,
            'shipping' => $calculatedShipping,
            'tax' => $calculatedTax,
            'total' => $calculatedTotal,
            'shipping_method' => $shippingMethod
        ]
    ]);
    
    error_log("✓ Payment intent created: " . $paymentIntent->id);
    error_log("=== REQUEST COMPLETE ===");
    
    // Success response
    echo json_encode([
        'success' => true,
        'clientSecret' => $paymentIntent->client_secret,
        'order_number' => $orderNumber,
        'cockpit_order' => json_encode($data->cockpitOrder ?? []),
        'database_saved' => $databaseSaved,
        'environment' => $mode,
        // Return calculated amounts for confirmation
        'amounts' => [
            'subtotal' => round($calculatedSubtotal, 2),
            'shipping' => round($calculatedShipping, 2),
            'tax' => round($calculatedTax, 2),
            'total' => round($calculatedTotal, 2)
        ]
    ]);
    
} catch (Exception $e) {
    error_log('❌ ERROR: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}