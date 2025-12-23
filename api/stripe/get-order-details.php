<?php
/**
 * Get Order Details by Session ID
 * Prevents duplicate webhook processing
 */
header('Content-Type: application/json');
require_once __DIR__ . '/../../env-loader.php';

$sessionId = $_GET['session_id'] ?? null;

if (!$sessionId) {
    echo json_encode(['success' => false, 'error' => 'No session ID']);
    exit;
}

// Load order data from saved file
$orderDataDir = dirname(__DIR__, 2) . '/order-data/';
$files = glob($orderDataDir . '*.json');

foreach ($files as $file) {
    $data = json_decode(file_get_contents($file), true);
    
    // Match by session (you'll need to save session_id in create-checkout-session.php)
    if (isset($data['session_id']) && $data['session_id'] === $sessionId) {
        echo json_encode([
            'success' => true,
            'orderNumber' => $data['orderNumber'],
            'email' => $data['customerEmail'],
            'items' => $data['items']
        ]);
        exit;
    }
}

echo json_encode(['success' => false, 'error' => 'Order not found']);