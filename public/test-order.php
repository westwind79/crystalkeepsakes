<?php
// simple-test.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/api/cockpit3d-data-fetcher.php';
require_once __DIR__ . '/api/cockpit3d-order-processor.php';

echo "🚀 Simple CockPit3D Order Test\n\n";

try {
    // 1. Create working fetcher
    echo "1. Creating fetcher...\n";
    $fetcher = new CockPit3DFetcher();
    
    // 2. Test authentication by calling a method that triggers it
    echo "2. Authenticating (via getCatalog)...\n";
    $fetcher->getCatalog(); // This will trigger ensureAuthenticated internally
    echo "✅ Auth successful\n";
    
    // 3. Create processor and copy credentials
    echo "3. Setting up processor...\n";
    $processor = new CockPit3DOrderProcessor();
    
    // 4. Create test order
    echo "4. Creating test order...\n";
    $testOrder = [
        'orderNumber' => 'TEST_' . date('YmdHis'),
        'cartItems' => [['productId' => '105', 'name' => 'Lightbase Rectangle', 'price' => 25, 'quantity' => 1, 'options' => ['lightBase' => 'rectangle']]],
        'customerInfo' => ['firstName' => 'Noah', 'lastName' => 'Test', 'email' => 'noah@crystalkeepsakes.com', 'phone' => '555-123-4567'],
        'shippingAddress' => ['firstName' => 'Noah', 'lastName' => 'Test', 'address' => '123 Test St', 'city' => 'Test City', 'state' => 'NY', 'country' => 'US', 'postalCode' => '12345']
    ];
    
    // 5. Send to CockPit3D
    echo "5. Sending to CockPit3D...\n";
    
    // Simple order format (EXACT copy from PDF)
    $cockpitOrder = [
        'retailer_id' => 256568874,
        'address' => [
            'email' => 'test_billing@mail.test',
            'firstname' => 'Firstname',
            'lastname' => 'Lastname',
            'telephone' => '1111111',
            'region' => 'QC',
            'country' => 'CA',
            'staff_user' => 'Staff User',
            'order_id' => 'Unique order id',
            'voyage_code' => 'Voyage code',
            'street' => '3193 Beaver Creek',
            'city' => 'Thornhill',
            'postcode' => 'L4J 1W2',
            'shipping_method' => 'air',
            'destination' => 'vendor_store'
        ],
        'items' => [[
            'sku' => 'Cut_Corner_Diamond',
            'qty' => '1',
            'client_item_id' => '123456-1',
            'original_photo' => 'https://c3d-api-dev.host.alva.tools/media/catalog/product/C/u/Cut_Corner.jpg',
            'cropped_photo' => 'https://c3d-api-dev.host.alva.tools/media/catalog/product/3/d/3d_crystal_tribute_square_copy.jpg',
            '3d_file' => 'https://c3d-api-dev.host.alva.tools/pub/media/order_item/1/1/2/2/3d_file.zip',
            'special_instructions' => 'Special Instruction text',
            '2d' => true,
            'options' => [
                [
                    'id' => '198',
                    'qty' => '1'
                ],
                [
                    'id' => '151',
                    'qty' => '1',
                    'value' => '549'
                ],
                [
                    'id' => '399',
                    'qty' => '1',
                    'value' => '719'
                ],
                [
                    'id' => '199',
                    'value' => [
                        'Customer Text',
                        'Customer Text 2',
                        'Customer Text 3'
                    ]
                ],
                [
                    'id' => '381',
                    'value' => 'Laser Engraved Text'
                ],
                [
                    'name' => 'Custom Option',
                    'value' => '120'
                ]
            ]
        ]]
    ];
    
    // Send API request - use getEnvVariable instead of private properties
    $url = getEnvVariable('COCKPIT3D_BASE_URL') . '/rest/V2/orders';
    
    // Get token via reflection (hack to access private property)
    $reflection = new ReflectionClass($fetcher);
    $tokenProperty = $reflection->getProperty('token');
    $tokenProperty->setAccessible(true);
    $token = $tokenProperty->getValue($fetcher);
    
    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token,
        'Accept: application/json'
    ];
    
    echo "URL: $url\n";
    echo "Order: " . json_encode($cockpitOrder, JSON_PRETTY_PRINT) . "\n";
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($cockpitOrder),
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Response ($httpCode): $response\n";
    
    if ($httpCode === 201) {
        echo "✅ SUCCESS! Order sent to CockPit3D\n";
    } else {
        echo "❌ ERROR: HTTP $httpCode\n";
    }
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}
?>