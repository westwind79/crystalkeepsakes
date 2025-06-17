<?php
// api/test-cockpit3d-order.php
// Send a simple test order to CockPit3D API
echo "API file loaded successfully!<br>";
echo "Request method: " . $_SERVER['REQUEST_METHOD'] . "<br>";
echo "Query params: " . print_r($_GET, true) . "<br>";

// Then your existing code...
require_once __DIR__ . '/cockpit3d-order-processor.php';

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Function to get .env variables (copied from create-payment-intent.php)
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

try {
    // Check if this is a test request
    $testMode = $_GET['test'] ?? 'true';
    
    if ($testMode !== 'true') {
        throw new Exception('This script only runs in test mode. Add ?test=true to URL');
    }
    
    echo "🚀 Starting CockPit3D Test Order...\n\n";
    
    // Create a simple test order with a lightbase
    $testOrderData = [
        'orderNumber' => 'TEST_' . date('YmdHis'),
        'cartItems' => [
            [
                'productId' => '105',
                'name' => 'Lightbase Rectangle',
                'price' => 25.00,
                'quantity' => 1,
                'options' => [
                    'size' => 'standard',
                    'lightBase' => 'lightbase-rectangle'
                ]
            ]
        ],
        'customerInfo' => [
            'firstName' => 'Noah',
            'lastName' => 'Test',
            'email' => 'noah@crystalkeepsakes.com',
            'phone' => '555-123-4567'
        ],
        'shippingAddress' => [
            'firstName' => 'Noah',
            'lastName' => 'Test', 
            'address' => '123 Test Street',
            'city' => 'Test City',
            'state' => 'NY',
            'country' => 'US',
            'postalCode' => '12345'
        ],
        'billingAddress' => [
            'firstName' => 'Noah',
            'lastName' => 'Test',
            'address' => '123 Test Street', 
            'city' => 'Test City',
            'state' => 'NY',
            'country' => 'US',
            'postalCode' => '12345'
        ],
        'subtotal' => 25.00,
        'shippingCost' => 10.00,
        'total' => 35.00
    ];
    
    echo "📦 Test Order Data:\n";
    echo json_encode($testOrderData, JSON_PRETTY_PRINT) . "\n\n";
    
    // Initialize the CockPit3D processor
    $processor = new CockPit3DOrderProcessor();
    
    echo "🔧 Checking CockPit3D API configuration...\n";
    
    // Check if we have API credentials
    $apiUrl = getEnvVariable('COCKPIT3D_API_URL');
    $bearerToken = getEnvVariable('COCKPIT3D_BEARER_TOKEN');
    
    echo "API URL: " . ($apiUrl ? '✅ SET' : '❌ MISSING') . "\n";
    echo "Bearer Token: " . ($bearerToken ? '✅ SET' : '❌ MISSING') . "\n\n";
    
    if (!$apiUrl || !$bearerToken) {
        echo "⚠️  CockPit3D credentials missing. Order will be logged but not sent.\n\n";
        
        // Just log what would be sent
        echo "📝 What would be sent to CockPit3D:\n";
        echo "URL: " . ($apiUrl ?: '[MISSING]') . "/order\n";
        echo "Headers: Authorization: Bearer [TOKEN]\n";
        echo "Method: POST\n\n";
        
        echo "✅ Test completed - credentials needed to actually send.\n";
        
        // Return response
        echo json_encode([
            'success' => true,
            'message' => 'Test order prepared but not sent (missing credentials)',
            'test_mode' => true,
            'order_data' => $testOrderData
        ]);
        
        exit;
    }
    
    echo "🚀 Sending test order to CockPit3D...\n\n";
    
    // Process the order
    $result = $processor->processOrder($testOrderData);
    
    echo "📥 CockPit3D Response:\n";
    echo json_encode($result, JSON_PRETTY_PRINT) . "\n\n";
    
    if ($result['success']) {
        echo "✅ SUCCESS! Test order sent to CockPit3D successfully.\n";
        echo "Order ID: " . ($result['cockpit3d_order_id'] ?? 'N/A') . "\n";
    } else {
        echo "❌ ERROR: " . $result['message'] . "\n";
    }
    
    // Return JSON response for AJAX calls
    echo json_encode([
        'success' => $result['success'],
        'message' => $result['message'],
        'test_mode' => true,
        'cockpit3d_response' => $result
    ]);
    
} catch (Exception $e) {
    error_log('Test order error: ' . $e->getMessage());
    
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'test_mode' => true
    ]);
}
?>