<?php
// Strict error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/square_errors.log');

// Required headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verify request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    // Load dependencies
    require_once __DIR__ . '/../vendor/autoload.php';
    $config = require_once __DIR__ . '/../config/config.php';

    // Initialize Square client
    $client = new \Square\SquareClient([
        'accessToken' => $config['square']['access_token'],
        'environment' => $config['square']['environment']
    ]);

    // Get request body
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    if (!isset($input['cartItems']) || empty($input['cartItems'])) {
        throw new Exception('Invalid cart data');
    }

    // Format items for Square
    $lineItems = array_map(function($item) {
        // Validate item structure
        if (!isset($item['name']) || !isset($item['price'])) {
            throw new Exception('Invalid item structure');
        }

        // Format price (convert to cents)
        $amount = round($item['price'] * 100);

        return [
            'name' => $item['name'],
            'quantity' => '1',
            'base_price_money' => [
                'amount' => $amount,
                'currency' => 'USD'
            ]
        ];
    }, $input['cartItems']);

    // Create payment link request
    $request = [
        'checkout_options' => [
            'allow_tipping' => false,
            'redirect_url' => 'https://crystalkeepsakes.com/order-confirmation',
            'ask_for_shipping_address' => true
        ],
        'order' => [
            'line_items' => $lineItems
        ]
    ];

    // Log request data
    error_log("Square API Request: " . json_encode($request));

    // Create payment link
    $response = $client->getCheckoutApi()->createPaymentLink($request);

    // Log response
    error_log("Square API Response: " . json_encode($response->getResult()));

    if ($response->isSuccess()) {
        $result = $response->getResult();
        $paymentLink = $result->getPaymentLink();

        echo json_encode([
            'success' => true,
            'payment_link' => [
                'url' => $paymentLink->getUrl(),
                'id' => $paymentLink->getId()
            ]
        ]);
    } else {
        $errors = $response->getErrors();
        throw new Exception($errors[0]->getDetail());
    }

} catch (Exception $e) {
    // Log error
    error_log("Payment Error: " . $e->getMessage());
    
    // Send error response
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>