<?php
header("Content-Type: application/json");

// Debugging: Log request start
error_log("==== New Request to create-payment.php ====");

// Read request body
$rawData = file_get_contents("php://input");
$requestData = json_decode($rawData, true);

// Debugging: Log received cart data
error_log("Received Cart Data: " . json_encode($requestData, JSON_PRETTY_PRINT));

// Ensure cart data exists
if (!isset($requestData['cartItems']) || empty($requestData['cartItems'])) {
    error_log("Error: No cart items provided.");
    echo json_encode(["error" => "No cart items provided"]);
    exit;
}

// ✅ Square API Credentials (Make sure these are correct)
$accessToken = "EAAAl7t4u29Qkr1jCgqNwDqBFL-WHjbjz_sPXRpz5vjln7sfCQ12DnWZb6ZkCzGC";  // Replace with your actual API key
$locationId = "LSVZHFQ2F7DBF";  // Replace with your correct location ID

// ✅ Determine API URL based on environment (sandbox or production)
$isSandbox = strpos($accessToken, "sandbox") !== false;
$api_url = $isSandbox
    ? "https://connect.squareupsandbox.com/v2/online-checkout/payment-links"
    : "https://connect.squareup.com/v2/online-checkout/payment-links";

// ✅ Create order payload
$order_payload = [
    "idempotency_key" => uniqid(),
    "order" => [
        "location_id" => $locationId,
        "line_items" => array_map(function($item) {
            return [
                "name" => $item["name"],
                "quantity" => strval($item["quantity"]),  // Square requires quantity as a string
                "base_price_money" => [
                    "amount" => intval($item["price"] * 100), // Convert price to cents
                    "currency" => "USD"
                ]
            ];
        }, $requestData['cartItems'])
    ],
    "checkout_options" => [
        "allow_tipping" => false,
        "redirect_url" => "https://crystalkeepsakes.com/order-confirmation",
        "ask_for_shipping_address" => true,
        "enable_coupon" => false,
        "enable_loyalty" => false,
        "merchant_support_email" => "square@crystalkeepsakes.com"
    ],
    "payment_note" => "Crystal Keepsakes Order"
];

// Debugging: Log the Square API request payload
error_log("Square API Request: " . json_encode($order_payload, JSON_PRETTY_PRINT));

// ✅ Send request to Square API
$ch = curl_init($api_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer " . $accessToken
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($order_payload));

$response = curl_exec($ch);
$httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Debugging: Log the response from Square
error_log("Square API Response ($httpStatus): " . $response);

$result = json_decode($response, true);

// ✅ Check for errors
if (!$result || !isset($result['payment_link']['url'])) {
    error_log("Payment Error: " . json_encode($result));
    echo json_encode(["success" => false, "error" => "Invalid payment link response", "details" => $result]);
    exit;
}

// ✅ Return correct JSON response
echo json_encode(["success" => true, "payment_link" => ["url" => $result['payment_link']['url']]]);
exit;
?>
