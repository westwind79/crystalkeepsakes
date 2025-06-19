<?php
// Add this at the very top
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "API file loaded successfully!<br>";
echo "Request method: " . $_SERVER['REQUEST_METHOD'] . "\n\n";
echo "Query params: " . print_r($_GET, true) . "<br> \n\n";

echo "=== STEP 1: Checking file dependencies ===<br>";

// Check if required files exist
$processorFile = __DIR__ . '/cockpit3d-order-processor.php';
$fetcherFile = __DIR__ . '/cockpit3d-data-fetcher.php';

echo " \n\n Processor file exists: " . (file_exists($processorFile) ? 'YES' : 'NO') . " - $processorFile<br>";
echo " \n\n Fetcher file exists: " . (file_exists($fetcherFile) ? 'YES' : 'NO') . " - $fetcherFile<br>";

echo "=== STEP 2: Loading dependencies ===<br>";

try {
    require_once $processorFile;
    echo "✅ Processor file loaded \n\n";
} catch (Exception $e) {
    echo "❌ Error loading processor: " . $e->getMessage() . " \n\n";
    exit;
} catch (Error $e) {
    echo "❌ Fatal error loading processor: " . $e->getMessage() . " \n\n";
    exit;
}

echo "=== STEP 3: Checking test parameter ===<br>";

$testMode = $_GET['test'] ?? 'false';
echo "Test mode value: '$testMode'<br>";

if ($testMode !== 'true') {
    echo "❌ Test mode not 'true', exiting<br>";
    exit;
}

echo "✅ Test mode confirmed<br>";

echo "=== STEP 4: Creating test data ===<br>";

// Simple test without complex dependencies
$testOrderData = [
    'orderNumber' => 'TEST_' . date('YmdHis'),
    'message' => 'Basic test data created'
];

echo "Test order data: " . json_encode($testOrderData, JSON_PRETTY_PRINT) . "<br>";

echo "=== STEP 5: All steps completed! ===<br>";
// Then your existing code...
require_once __DIR__ . '/cockpit3d-order-processor.php';

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

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
 

    // Now create processor (which extends fetcher)
    $processor = new CockPit3DOrderProcessor();
    // Continue with your existing test code...
    echo "🔧 Checking CockPit3D API configuration...\n";
    
    // Check if we have API credentials from the processor
    $apiUrl = $processor->apiBaseUrl ?? 'MISSING';
    $bearerToken = $processor->bearerToken ?? 'MISSING';

    // Or get directly from env with correct names
    $apiUrlFromEnv = getEnvVariable('COCKPIT3D_BASE_URL');
    $bearerTokenFromEnv = getEnvVariable('COCKPIT3D_API_TOKEN'); // or whatever your token var is named

    echo "Direct from env - URL: " . ($apiUrlFromEnv ? '✅ SET' : '❌ MISSING') . "\n";
    echo "Direct from env - Token: " . ($bearerTokenFromEnv ? '✅ SET' : '❌ MISSING') . "\n";
    
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
     
    // Process the order
        echo "🚀 Sending test order to CockPit3D...\n\n";

    // Add this logging:
    echo "DEBUG: About to call processOrder\n";
    error_log("DEBUG: About to call processOrder");

    // Process the order
    $result = $processor->processOrder($testOrderData);

    // Add this logging:
    echo "DEBUG: processOrder returned\n"; 
    error_log("DEBUG: processOrder returned");
    
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