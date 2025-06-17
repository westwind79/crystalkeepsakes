<?php
// api/create-payment-intent.php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/payment_intent_errors.log');

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

// Function to get .env variables
function getEnvVariable($key) {
    $envFile = dirname(__DIR__) . '/.env';
    if (!file_exists($envFile)) {
        error_log(".env file not found at: $envFile");
        return null;
    }
    
    $content = file_get_contents($envFile);
    if ($content === false) {
        error_log("Failed to read .env file");
        return null;
    }
    
    $lines = explode("\n", $content);
    foreach ($lines as $line) {
        $line = trim($line);
        
        // Skip comments and empty lines
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }
        
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) {
            continue;
        }
        
        $envKey = trim($parts[0]);
        $envValue = trim($parts[1]);
        
        // Remove quotes if present
        if ((strpos($envValue, '"') === 0 && strrpos($envValue, '"') === strlen($envValue) - 1) || 
            (strpos($envValue, "'") === 0 && strrpos($envValue, "'") === strlen($envValue) - 1)) {
            $envValue = substr($envValue, 1, -1);
        }
        
        if ($envKey === $key) {
            return $envValue;
        }
    }
    
    error_log("Key '$key' not found in .env file");
    return null;
}

// Function to attempt database operations (fails gracefully in development)
// Function to attempt database operations (fails gracefully in development)
function saveDatabaseData($data, $mode) {
    try {
        // Get the current mode from environment
        $currentMode = getEnvVariable('VITE_STRIPE_MODE') ?? 'test';
        
        // Skip database operations entirely in development mode
        if ($currentMode === 'development') {
            error_log('Development mode detected - skipping database operations');
            return false;
        }
        
        // Create order number with TEST prefix if in test mode
        $baseOrderNumber = $data->orderNumber ?? ('ORD-' . time());
        $orderNumber = $baseOrderNumber;
        if ($currentMode === 'test') {
            $orderNumber = 'TEST_' . $baseOrderNumber;
        }
        
        // Check if database files exist before attempting connection
        $dbConnectPath = __DIR__ . '/db_connect.php';
        $imageStoragePath = __DIR__ . '/image-storage.php';
        
        if (!file_exists($dbConnectPath) || !file_exists($imageStoragePath)) {
            error_log('Database files not found - skipping database operations');
            return false;
        }
        
        $pdo = require_once $dbConnectPath;
        require_once $imageStoragePath;
        
        $imageStorage = new ImageStorage();

        // Save order to database
        $stmt = $pdo->prepare("
            INSERT INTO orders (
                order_id, order_items, amount, shipping_amount, 
                shipping_method, order_status, created_at
            ) VALUES (?, ?, ?, ?, ?, 'payment_pending', NOW())
        ");
        
        // Prepare clean order data for database (without base64 images)
        $cleanOrderData = [
            'order_number' => $orderNumber,
            'cart_items' => $data->cartItems,
            'subtotal' => $data->subtotal ?? 0,
            'shipping_cost' => $data->shippingCost ?? 0,
            'shipping_method' => $data->shippingMethod ?? 'Standard',
            'tax_amount' => $data->taxAmount ?? 0,
            'total' => $data->total ?? 0,
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        $stmt->execute([
            $orderNumber,
            json_encode($cleanOrderData),
            $data->subtotal ?? 0,
            $data->shippingCost ?? 0,
            $data->shippingMethod ?? 'Standard'
        ]);

        // Process and save images from full cart items
        if (isset($data->fullCartItems)) {
            foreach ($data->fullCartItems as $item) {
                $cartItemId = $item->cartId ?? uniqid();
                
                // Save each image type if it exists
                $imageTypes = ['rawImageUrl' => 'raw', 'imageUrl' => 'preview', 'maskedImageUrl' => 'masked'];
                
                foreach ($imageTypes as $optionKey => $imageType) {
                    if (isset($item->options->$optionKey) && !empty($item->options->$optionKey)) {
                        $base64Data = $item->options->$optionKey;
                        
                        // Skip if it's already a reference (not base64)
                        if (!str_starts_with($base64Data, 'data:image/')) {
                            continue;
                        }
                        
                        try {
                            // Save image as file
                            $fileInfo = $imageStorage->saveImageFromBase64(
                                $base64Data, 
                                $orderNumber, 
                                $cartItemId, 
                                $imageType
                            );
                            
                            // Save image metadata to database
                            $imageStorage->saveImageToDatabase(
                                $pdo, 
                                $orderNumber, 
                                $cartItemId, 
                                $imageType, 
                                $fileInfo
                            );
                            
                            error_log("Saved image: $imageType for item $cartItemId in order $orderNumber");
                            
                        } catch (Exception $imageError) {
                            error_log("Failed to save image $imageType for order $orderNumber: " . $imageError->getMessage());
                        }
                    }
                }
            }
        }
        
        error_log("Order and images saved: $orderNumber");
        return true;
        
    } catch (Exception $e) {
        error_log('Database/Image save error (continuing with payment): ' . $e->getMessage());
        return false;
    }
}

try {
    // Get stripe configuration
    $mode = getEnvVariable('VITE_STRIPE_MODE') ?? 'test';
    error_log("Stripe mode: $mode");
    
    // Determine which key to use
    if ($mode === 'test' || $mode === 'development') {
        $keyName = 'VITE_STRIPE_TEST_SECRET_KEY';
    } else {
        $keyName = 'VITE_STRIPE_LIVE_SECRET_KEY';
    }
    
    $secretKey = getEnvVariable($keyName);
    
    if (empty($secretKey)) {
        throw new Exception("Secret key '$keyName' not found in .env file for mode: $mode");
    }

    // Find and load Stripe vendor autoload
    $vendorPath = null;
    $possiblePaths = [
        dirname(__DIR__) . '/vendor/autoload.php',
        dirname(dirname(__DIR__)) . '/vendor/autoload.php',
        $_SERVER['DOCUMENT_ROOT'] . '/vendor/autoload.php',
        $_SERVER['DOCUMENT_ROOT'] . '/../vendor/autoload.php'
    ];
    
    foreach ($possiblePaths as $path) {
        if (file_exists($path)) {
            $vendorPath = $path;
            break;
        }
    }
    
    if (!$vendorPath) {
        throw new Exception('Vendor autoload file not found');
    }
    
    // Load Stripe
    require_once $vendorPath;
    \Stripe\Stripe::setApiKey($secretKey);
    
    // Parse request data
    $jsonStr = file_get_contents('php://input');
    $data = json_decode($jsonStr);
    

        // ADD DEBUG HERE:
    error_log("=== RECEIVED FULL CART ITEMS ===");
    if (isset($data->fullCartItems)) {
        error_log("Has fullCartItems: YES (" . count($data->fullCartItems) . ")");
        foreach ($data->fullCartItems as $index => $item) {
            error_log("Item $index - has rawImageUrl: " . (isset($item->options->rawImageUrl) ? 'YES' : 'NO'));
            error_log("Item $index - has imageUrl: " . (isset($item->options->imageUrl) ? 'YES' : 'NO'));
            error_log("Item $index - has maskedImageUrl: " . (isset($item->options->maskedImageUrl) ? 'YES' : 'NO'));
        }
    } else {
        error_log("Has fullCartItems: NO");
    }

    if (!$data || !isset($data->cartItems) || empty($data->cartItems)) {
        throw new Exception('Invalid or empty cart data');
    }
    
    // Attempt to save to database (fails gracefully in development)
    $databaseSaved = saveDatabaseData($data, $mode);
    if ($databaseSaved) {
        error_log('Order successfully saved to database');
    } else {
        error_log('Database save skipped or failed - continuing with Stripe payment');
    }
    
    // Calculate payment amount using clean cart items (no images)
    $amount = 0;
    foreach ($data->cartItems as $item) {
        $amount += $item->price * ($item->quantity ?? 1);
    }

    $amountInCents = round($amount * 100);

    // Create order number with TEST prefix if in test mode
    $baseOrderNumber = $data->orderNumber ?? ('ORD-' . time());
    $finalOrderNumber = $baseOrderNumber;
    if ($mode === 'test' || $mode === 'development') {
        $finalOrderNumber = 'TEST_' . $baseOrderNumber;
    }

    // Create Stripe payment intent
    $paymentIntentParams = [
        'amount' => $amountInCents,
        'currency' => 'usd',
        'automatic_payment_methods' => [
            'enabled' => true,
        ],
        'metadata' => [
            'order_number' => $finalOrderNumber,
            'items_count' => count($data->cartItems),
            'total_amount' => $data->total ?? 0
        ]
    ];
     
    $paymentIntent = \Stripe\PaymentIntent::create($paymentIntentParams);

    // Return success response
    echo json_encode([
        'clientSecret' => $paymentIntent->client_secret,
        'success' => true,
        'order_number' => $finalOrderNumber,
        'database_saved' => $databaseSaved
    ]);
    
} catch (Exception $e) {
    error_log('Payment intent error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'success' => false
    ]);
}
?>