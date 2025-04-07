<?php
// api/create-payment-intent-dev.php
// DEVELOPMENT VERSION ONLY - NOT FOR PRODUCTION
header('Content-Type: application/json');

// Only allow from local development
if (!in_array($_SERVER['HTTP_HOST'], ['localhost:5174', 'crystalkeepsakes:8888'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

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

// Parse request data
$jsonStr = file_get_contents('php://input');
$data = json_decode($jsonStr);

// Generate a fake client secret for development
$fakeClientSecret = 'sk_test_51QoDYf2YE48VQlzYD9L6eHJHFbHLZiU6cx8Wj7HmFvRvv3U6XhwRXjXqVfvoHbqhgzYyV4WoYwxet2Pe7YRPN9RM00MAf9Ds2O';

// Sleep to simulate API call
sleep(1);

// Return the fake client secret
echo json_encode([
    'clientSecret' => $fakeClientSecret,
    'success' => true,
    'dev_mode' => true,
    'received_data' => $data
]);
?>