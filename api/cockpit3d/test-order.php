<?php
/**
 * Test Cockpit3D Order Submission
 * Use this to test the API connection and order format without Stripe
 * 
 * Usage:
 * 1. Set your credentials in .env
 * 2. Access this endpoint in browser or via curl
 * 3. Check the response and logs
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Load environment
require_once __DIR__ . '/../env-loader.php';

// Get configuration
$apiUrl = getEnvVar('COCKPIT3D_API_URL') ?: 'https://profit.cockpit3d.com';
$username = getEnvVar('COCKPIT3D_USERNAME');
$password = getEnvVar('COCKPIT3D_PASSWORD');
$retailerId = getEnvVar('COCKPIT3D_RETAILER_ID') ?: getEnvVar('COCKPIT3D_RETAIL_ID');

// Check configuration
$config = [
    'api_url' => $apiUrl,
    'username' => $username ? 'SET (' . strlen($username) . ' chars)' : 'NOT SET',
    'password' => $password ? 'SET (' . strlen($password) . ' chars)' : 'NOT SET',
    'retailer_id' => $retailerId ?: 'NOT SET',
];

// If GET request, show config status
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $testMode = isset($_GET['test']);
    
    if (!$testMode) {
        echo json_encode([
            'status' => 'ready',
            'message' => 'Cockpit3D Test Endpoint',
            'config' => $config,
            'endpoints' => [
                'submit' => $apiUrl . '/rest/V2/orders',
            ],
            'usage' => [
                'view_config' => 'GET /api/cockpit3d/test-order.php',
                'test_submit' => 'GET /api/cockpit3d/test-order.php?test=1',
                'real_submit' => 'POST /api/cockpit3d/test-order.php with order JSON'
            ]
        ], JSON_PRETTY_PRINT);
        exit;
    }
    
    // Test submission with dummy data
    if (!$username || !$password || !$retailerId) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Missing credentials. Please set COCKPIT3D_USERNAME, COCKPIT3D_PASSWORD, and COCKPIT3D_RETAILER_ID in .env',
            'config' => $config
        ], JSON_PRETTY_PRINT);
        exit;
    }
    
    // Build test order
    $testOrderId = 'TEST-' . time();
    $testOrder = [
        'retailer_id' => (int) $retailerId,
        'address' => [
            'email' => 'test@example.com',
            'firstname' => 'Test',
            'lastname' => 'Order',
            'telephone' => '555-0100',
            'region' => 'CA',
            'country' => 'US',
            'street' => '123 Test Street',
            'city' => 'Los Angeles',
            'postcode' => '90001',
            'shipping_method' => 'air',
            'destination' => 'customer_home',
            'order_id' => $testOrderId,
            'staff_user' => 'API Test'
        ],
        'items' => [
            [
                'sku' => 'Cut_Corner_Diamond', // Use a valid SKU from your catalog
                'qty' => '1',
                'client_item_id' => $testOrderId . '-1',
                // 'original_photo' => 'https://example.com/test-image.jpg',
                // 'cropped_photo' => 'https://example.com/test-cropped.jpg',
                'options' => []
            ]
        ]
    ];
    
    echo json_encode([
        'test_mode' => true,
        'message' => 'This is what would be sent to Cockpit3D (not actually sent)',
        'api_endpoint' => $apiUrl . '/rest/V2/orders',
        'order_payload' => $testOrder,
        'note' => 'To actually send this test order, POST this payload to /api/cockpit3d/submit-order.php'
    ], JSON_PRETTY_PRINT);
    exit;
}

// POST request - submit actual order
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$username || !$password || !$retailerId) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Missing credentials',
            'config' => $config
        ]);
        exit;
    }
    
    $input = file_get_contents('php://input');
    $orderData = json_decode($input, true);
    
    if (!$orderData) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
        exit;
    }
    
    // Ensure retailer_id is set
    if (empty($orderData['retailer_id'])) {
        $orderData['retailer_id'] = (int) $retailerId;
    }
    
    // Submit to Cockpit3D
    $url = rtrim($apiUrl, '/') . '/rest/V2/orders';
    $auth = base64_encode($username . ':' . $password);
    
    error_log("=== TEST ORDER SUBMISSION ===");
    error_log("URL: $url");
    error_log("Payload: " . json_encode($orderData, JSON_PRETTY_PRINT));
    
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Basic ' . $auth
        ],
        CURLOPT_POSTFIELDS => json_encode($orderData),
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    error_log("Response ($httpCode): $response");
    
    if ($curlError) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => "CURL error: $curlError"
        ]);
        exit;
    }
    
    $result = json_decode($response, true);
    $isSuccess = $httpCode >= 200 && $httpCode < 300;
    
    http_response_code($isSuccess ? 200 : $httpCode);
    echo json_encode([
        'success' => $isSuccess,
        'http_code' => $httpCode,
        'cockpit3d_response' => $result,
        'order_sent' => $orderData
    ], JSON_PRETTY_PRINT);
}
