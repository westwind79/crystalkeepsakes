<?php
/**
 * Cockpit3D & Stripe Integration Debug Panel
 * 
 * Features:
 * - Shows all configured API keys (masked for security)
 * - Tests Cockpit3D API connection
 * - Simulates webhook payloads
 * - Views recent order data
 * - Validates order payload format
 * 
 * Usage: /api/debug/integration-panel.php
 * Add ?action=xxx for specific tests
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Load environment
require_once dirname(__DIR__) . '/env-loader.php';

/**
 * Mask sensitive values for display
 */
function maskValue($value, $showChars = 4) {
    if (!$value) return 'NOT SET';
    $len = strlen($value);
    if ($len <= $showChars * 2) {
        return str_repeat('*', $len);
    }
    return substr($value, 0, $showChars) . str_repeat('*', $len - $showChars * 2) . substr($value, -$showChars);
}

/**
 * Check if a key looks valid (basic format check)
 */
function validateKeyFormat($key, $type) {
    if (!$key) return ['valid' => false, 'reason' => 'Not set'];
    
    switch ($type) {
        case 'stripe_secret':
            if (strpos($key, 'sk_live_') === 0) return ['valid' => true, 'mode' => 'LIVE'];
            if (strpos($key, 'sk_test_') === 0) return ['valid' => true, 'mode' => 'TEST'];
            return ['valid' => false, 'reason' => 'Should start with sk_live_ or sk_test_'];
            
        case 'stripe_publishable':
            if (strpos($key, 'pk_live_') === 0) return ['valid' => true, 'mode' => 'LIVE'];
            if (strpos($key, 'pk_test_') === 0) return ['valid' => true, 'mode' => 'TEST'];
            return ['valid' => false, 'reason' => 'Should start with pk_live_ or pk_test_'];
            
        case 'stripe_webhook':
            if (strpos($key, 'whsec_') === 0) return ['valid' => true, 'mode' => 'OK'];
            return ['valid' => false, 'reason' => 'Should start with whsec_'];
            
        case 'email':
            return ['valid' => filter_var($key, FILTER_VALIDATE_EMAIL) !== false, 'mode' => 'EMAIL'];
            
        case 'retailer_id':
            return ['valid' => is_numeric($key), 'mode' => strlen($key) . ' digits'];
            
        default:
            return ['valid' => strlen($key) > 5, 'mode' => strlen($key) . ' chars'];
    }
}

// Get action
$action = $_GET['action'] ?? 'status';

// Gather all configuration
$mode = getEnvVar('NEXT_PUBLIC_ENV_MODE') ?? 'unknown';

$config = [
    'environment' => [
        'mode' => $mode,
        'base_path' => getEnvVar('NEXT_PUBLIC_BASE_PATH') ?: '/',
        'php_backend_url' => getEnvVar('NEXT_PUBLIC_PHP_BACKEND_URL'),
    ],
    'stripe' => [
        // ONLY these 3 variables are used now
        'secret_key' => [
            'value' => maskValue(getEnvVar('STRIPE_SECRET_KEY')),
            'status' => validateKeyFormat(getEnvVar('STRIPE_SECRET_KEY'), 'stripe_secret'),
            'key_type' => strpos(getEnvVar('STRIPE_SECRET_KEY') ?: '', 'sk_live_') === 0 ? 'LIVE' : 'TEST',
        ],
        'publishable_key' => [
            'value' => maskValue(getEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')),
            'status' => validateKeyFormat(getEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'), 'stripe_publishable'),
            'key_type' => strpos(getEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY') ?: '', 'pk_live_') === 0 ? 'LIVE' : 'TEST',
        ],
        'webhook_secret' => [
            'value' => maskValue(getEnvVar('STRIPE_WEBHOOK_SECRET')),
            'status' => validateKeyFormat(getEnvVar('STRIPE_WEBHOOK_SECRET'), 'stripe_webhook'),
        ],
    ],
    'cockpit3d' => [
        'api_url' => getEnvVar('COCKPIT3D_API_URL') ?: 'https://profit.cockpit3d.com',
        'username' => [
            'value' => maskValue(getEnvVar('COCKPIT3D_USERNAME')),
            'status' => validateKeyFormat(getEnvVar('COCKPIT3D_USERNAME'), 'email'),
        ],
        'password' => [
            'value' => maskValue(getEnvVar('COCKPIT3D_PASSWORD')),
            'status' => validateKeyFormat(getEnvVar('COCKPIT3D_PASSWORD'), 'password'),
        ],
        'retailer_id' => [
            'value' => getEnvVar('COCKPIT3D_RETAILER_ID') ?: getEnvVar('COCKPIT3D_RETAIL_ID'),
            'status' => validateKeyFormat(getEnvVar('COCKPIT3D_RETAILER_ID') ?: getEnvVar('COCKPIT3D_RETAIL_ID'), 'retailer_id'),
        ],
    ],
];

// Check which keys would be used
$activeStripeKey = $mode === 'production' 
    ? getEnvVar('STRIPE_SECRET_KEY') 
    : getEnvVar('STRIPE_DEVELOPMENT_SECRET_KEY');
$config['stripe']['will_use'] = $activeStripeKey ? maskValue($activeStripeKey) : 'NONE - WILL FAIL';

switch ($action) {
    case 'status':
        // Default: Show configuration status
        $response = [
            'status' => 'ok',
            'timestamp' => date('c'),
            'server' => [
                'php_version' => PHP_VERSION,
                'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
                'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'unknown',
                'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            ],
            'configuration' => $config,
            'available_actions' => [
                'status' => 'Show this configuration (default)',
                'test-cockpit' => 'Test Cockpit3D API connection',
                'list-orders' => 'List recent order data files',
                'view-order' => 'View specific order: ?action=view-order&order=ORDER_NUMBER',
                'simulate-webhook' => 'Simulate a webhook payload (POST)',
                'build-payload' => 'Build a Cockpit3D payload from cart data (POST)',
                'validate-payload' => 'Validate a Cockpit3D order payload (POST)',
            ],
        ];
        break;
        
    case 'test-cockpit':
        // Test Cockpit3D API connection (without submitting order)
        $apiUrl = getEnvVar('COCKPIT3D_API_URL') ?: 'https://profit.cockpit3d.com';
        $username = getEnvVar('COCKPIT3D_USERNAME');
        $password = getEnvVar('COCKPIT3D_PASSWORD');
        
        if (!$username || !$password) {
            $response = [
                'success' => false,
                'error' => 'Missing COCKPIT3D_USERNAME or COCKPIT3D_PASSWORD',
                'config' => $config['cockpit3d'],
            ];
            break;
        }
        
        // Try to authenticate (GET request to check auth)
        $testUrl = rtrim($apiUrl, '/') . '/rest/V2/orders'; // We'll just check if we can connect
        $auth = base64_encode($username . ':' . $password);
        
        $ch = curl_init($testUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Basic ' . $auth
            ],
            CURLOPT_TIMEOUT => 10,
            CURLOPT_NOBODY => false, // We want to see the response
            CURLOPT_CUSTOMREQUEST => 'GET', // GET to check endpoint exists
        ]);
        
        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        $curlInfo = curl_getinfo($ch);
        curl_close($ch);
        
        $response = [
            'success' => !$curlError && $httpCode < 500,
            'test_url' => $testUrl,
            'http_code' => $httpCode,
            'curl_error' => $curlError ?: null,
            'response_preview' => substr($result, 0, 500),
            'interpretation' => $httpCode === 401 ? 'Auth failed - check username/password' 
                : ($httpCode === 404 ? 'Endpoint not found - check API URL'
                : ($httpCode === 200 ? 'Connection OK!'
                : ($httpCode === 405 ? 'Endpoint exists (Method Not Allowed is expected for GET)'
                : "HTTP $httpCode"))),
            'config_used' => [
                'api_url' => $apiUrl,
                'username' => maskValue($username),
                'retailer_id' => getEnvVar('COCKPIT3D_RETAILER_ID'),
            ],
        ];
        break;
        
    case 'list-orders':
        // List recent order data files
        $orderDataDir = dirname(__DIR__) . '/order-data/';
        $orders = [];
        
        if (is_dir($orderDataDir)) {
            $files = glob($orderDataDir . '*.json');
            rsort($files); // Newest first
            
            foreach (array_slice($files, 0, 20) as $file) {
                $data = json_decode(file_get_contents($file), true);
                $orders[] = [
                    'filename' => basename($file),
                    'order_number' => $data['orderNumber'] ?? 'unknown',
                    'items_count' => count($data['items'] ?? []),
                    'created_at' => $data['created_at'] ?? filemtime($file),
                    'has_images' => !empty($data['items'][0]['maskedImageUrl'] ?? null),
                ];
            }
        }
        
        $response = [
            'success' => true,
            'order_data_dir' => $orderDataDir,
            'dir_exists' => is_dir($orderDataDir),
            'orders' => $orders,
            'total_found' => count($orders),
        ];
        break;
        
    case 'view-order':
        // View specific order data
        $orderNumber = $_GET['order'] ?? '';
        if (!$orderNumber) {
            $response = ['success' => false, 'error' => 'Missing order parameter'];
            break;
        }
        
        // Sanitize order number
        $orderNumber = preg_replace('/[^a-zA-Z0-9_-]/', '', $orderNumber);
        $orderFile = dirname(__DIR__) . '/order-data/' . $orderNumber . '.json';
        
        if (!file_exists($orderFile)) {
            $response = ['success' => false, 'error' => "Order file not found: $orderNumber"];
            break;
        }
        
        $orderData = json_decode(file_get_contents($orderFile), true);
        
        // Build what the Cockpit3D payload WOULD look like
        $retailerId = getEnvVar('COCKPIT3D_RETAILER_ID') ?: getEnvVar('COCKPIT3D_RETAIL_ID');
        $cockpit3dPayload = [
            'retailer_id' => (int) $retailerId,
            'address' => [
                'email' => '[FROM STRIPE]',
                'firstname' => '[FROM STRIPE]',
                'lastname' => '[FROM STRIPE]',
                'telephone' => '[FROM STRIPE]',
                'street' => '[FROM STRIPE]',
                'city' => '[FROM STRIPE]',
                'region' => '[FROM STRIPE]',
                'postcode' => '[FROM STRIPE]',
                'country' => '[FROM STRIPE]',
                'shipping_method' => 'air',
                'destination' => 'customer_home',
                'order_id' => $orderNumber,
                'staff_user' => 'Web Order'
            ],
            'items' => []
        ];
        
        foreach ($orderData['items'] ?? [] as $idx => $item) {
            $cockpit3dItem = [
                'sku' => $item['sku'] ?? 'UNKNOWN',
                'qty' => (string) ($item['qty'] ?? 1),
                'client_item_id' => $orderNumber . '-' . ($idx + 1),
            ];
            
            if (!empty($item['rawImageUrl'])) {
                $cockpit3dItem['original_photo'] = $item['rawImageUrl'];
            }
            if (!empty($item['maskedImageUrl'])) {
                $cockpit3dItem['cropped_photo'] = $item['maskedImageUrl'];
            }
            
            $cockpit3dItem['options'] = [];
            $cockpit3dPayload['items'][] = $cockpit3dItem;
        }
        
        $response = [
            'success' => true,
            'order_number' => $orderNumber,
            'stored_data' => $orderData,
            'cockpit3d_payload_preview' => $cockpit3dPayload,
            'notes' => [
                'Address fields will be filled from Stripe customer_details and shipping_details',
                'This preview shows what will be sent to Cockpit3D when webhook fires',
            ],
        ];
        break;
        
    case 'simulate-webhook':
        // Simulate a Stripe webhook (for testing without real payment)
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $response = [
                'success' => false,
                'error' => 'POST required',
                'usage' => 'POST JSON with: { "order_number": "TEST-123", "simulate_stripe_data": { "email": "...", "name": "...", ... } }',
            ];
            break;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $orderNumber = $input['order_number'] ?? 'SIMULATED-' . time();
        $simulatedData = $input['simulate_stripe_data'] ?? [];
        
        // Check if we have stored order data for this order
        $orderFile = dirname(__DIR__) . '/order-data/' . $orderNumber . '.json';
        $hasStoredData = file_exists($orderFile);
        
        $response = [
            'success' => true,
            'simulation_mode' => true,
            'order_number' => $orderNumber,
            'has_stored_cart_data' => $hasStoredData,
            'message' => 'Webhook simulation completed',
            'what_would_happen' => [
                '1. Stripe webhook received checkout.session.completed',
                '2. Load cart data from /api/order-data/' . $orderNumber . '.json',
                '3. Build Cockpit3D payload with customer address from Stripe',
                '4. Submit to ' . (getEnvVar('COCKPIT3D_API_URL') ?: 'https://profit.cockpit3d.com') . '/rest/V2/orders',
            ],
            'tip' => 'Use ?action=view-order&order=' . $orderNumber . ' to see the payload that would be sent',
        ];
        break;
        
    case 'validate-payload':
        // Validate a Cockpit3D payload
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $response = ['success' => false, 'error' => 'POST required with Cockpit3D payload JSON'];
            break;
        }
        
        $payload = json_decode(file_get_contents('php://input'), true);
        $errors = [];
        $warnings = [];
        
        // Required fields
        if (empty($payload['retailer_id'])) $errors[] = 'Missing retailer_id';
        if (empty($payload['address'])) $errors[] = 'Missing address object';
        if (empty($payload['items']) || !is_array($payload['items'])) $errors[] = 'Missing or invalid items array';
        
        // Address validation
        if (!empty($payload['address'])) {
            $addr = $payload['address'];
            if (empty($addr['email'])) $errors[] = 'address.email is required';
            if (empty($addr['firstname'])) $warnings[] = 'address.firstname is empty';
            if (empty($addr['lastname'])) $warnings[] = 'address.lastname is empty';
            if (empty($addr['order_id'])) $errors[] = 'address.order_id is required';
        }
        
        // Items validation
        foreach ($payload['items'] ?? [] as $idx => $item) {
            if (empty($item['sku'])) $errors[] = "items[$idx].sku is required";
            if (empty($item['qty'])) $errors[] = "items[$idx].qty is required";
            if (empty($item['original_photo']) && empty($item['cropped_photo'])) {
                $warnings[] = "items[$idx] has no photos - is this intentional?";
            }
        }
        
        $response = [
            'valid' => count($errors) === 0,
            'errors' => $errors,
            'warnings' => $warnings,
            'payload_received' => $payload,
        ];
        break;
        
    default:
        $response = [
            'success' => false,
            'error' => "Unknown action: $action",
            'available_actions' => ['status', 'test-cockpit', 'list-orders', 'view-order', 'simulate-webhook', 'validate-payload'],
        ];
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
