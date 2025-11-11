<?php
/**
 * Test Cockpit3D API for Pricing Endpoints
 * Version: 1.0.0 | Date: 2025-10-23
 * 
 * Usage: php test-cockpit3d-pricing.php
 * Or upload to server and visit in browser
 */

// Load environment variables
function loadEnv($filePath = '.env') {
    if (!file_exists($filePath)) {
        $filePath = '../.env';
    }
    if (!file_exists($filePath)) {
        $filePath = '../../.env';
    }
    if (!file_exists($filePath)) {
        return;
    }
    
    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        $value = trim($value, '"\'');
        
        if (!array_key_exists($name, $_ENV)) {
            putenv("$name=$value");
            $_ENV[$name] = $value;
        }
    }
}

loadEnv();

$COCKPIT3D_BASE_URL = getenv('COCKPIT3D_BASE_URL') ?: 'https://api.cockpit3d.com';
$COCKPIT3D_USERNAME = getenv('COCKPIT3D_USERNAME');
$COCKPIT3D_PASSWORD = getenv('COCKPIT3D_PASSWORD');

$authToken = null;
$results = [];

// Authenticate
function authenticate() {
    global $COCKPIT3D_BASE_URL, $COCKPIT3D_USERNAME, $COCKPIT3D_PASSWORD, $authToken;
    
    echo "🔐 Authenticating...\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $COCKPIT3D_BASE_URL . '/rest/V2/login');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'username' => $COCKPIT3D_USERNAME,
        'password' => $COCKPIT3D_PASSWORD
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        die("❌ Authentication failed: HTTP $httpCode\n");
    }
    
    $authToken = str_replace('"', '', $response);
    echo "✅ Authenticated! Token: " . substr($authToken, 0, 20) . "...\n\n";
}

// Test an endpoint
function testEndpoint($method, $endpoint, $description) {
    global $COCKPIT3D_BASE_URL, $authToken, $results;
    
    echo str_repeat('=', 80) . "\n";
    echo "🧪 Testing: $description\n";
    echo "   Method: $method\n";
    echo "   URL: $COCKPIT3D_BASE_URL$endpoint\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $COCKPIT3D_BASE_URL . $endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $authToken,
        'Content-Type: application/json'
    ]);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, 1);
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "   Status: $httpCode\n";
    
    $result = [
        'endpoint' => $endpoint,
        'description' => $description,
        'status' => $httpCode,
        'success' => false
    ];
    
    if ($httpCode === 200 || $httpCode === 201) {
        $data = json_decode($response, true);
        echo "✅ SUCCESS! Found data:\n";
        
        if (is_array($data)) {
            if (isset($data[0])) {
                echo "   Array with " . count($data) . " items\n";
                echo "   First item preview:\n";
                echo substr(json_encode($data[0], JSON_PRETTY_PRINT), 0, 500) . "\n";
            } else {
                echo substr(json_encode($data, JSON_PRETTY_PRINT), 0, 1000) . "\n";
            }
        }
        
        $result['success'] = true;
        $result['data'] = $data;
    } elseif ($httpCode === 404) {
        echo "⚠️  Endpoint not found (404)\n";
    } elseif ($httpCode === 401 || $httpCode === 403) {
        echo "🔒 Unauthorized/Forbidden\n";
    } else {
        echo "❌ Failed with status $httpCode\n";
        echo "   Response: " . substr($response, 0, 200) . "\n";
    }
    
    echo "\n";
    $results[] = $result;
    return $result;
}

// CLI or Browser output
$isCli = (php_sapi_name() === 'cli');
if (!$isCli) {
    header('Content-Type: text/html; charset=utf-8');
    echo '<html><head><title>Cockpit3D Pricing Test</title>';
    echo '<style>
        body { font-family: monospace; background: #000; color: #0f0; padding: 20px; }
        pre { background: #1a1a1a; padding: 15px; border: 1px solid #0f0; }
        .success { color: #0f0; }
        .error { color: #f00; }
        .warning { color: #ff0; }
        h1 { color: #0ff; text-shadow: 0 0 10px #0ff; }
        h2 { color: #0f0; border-bottom: 2px solid #0f0; padding-bottom: 5px; }
    </style></head><body>';
    echo '<h1>🔍 Cockpit3D Pricing Endpoint Discovery</h1>';
    echo '<pre>';
}

// Check credentials
if (!$COCKPIT3D_USERNAME || !$COCKPIT3D_PASSWORD) {
    die("❌ Missing credentials! Set COCKPIT3D_USERNAME and COCKPIT3D_PASSWORD in .env\n");
}

echo str_repeat('*', 80) . "\n";
echo "🔍 COCKPIT3D PRICING ENDPOINT DISCOVERY\n";
echo str_repeat('*', 80) . "\n\n";

// Authenticate
authenticate();

// Run tests
echo "━━━ BASELINE TESTS (Known Working) ━━━\n\n";
testEndpoint('GET', '/rest/V2/catalog', 'Catalog (baseline)');
testEndpoint('GET', '/rest/V2/products', 'Products (baseline)');

echo "\n━━━ PRICING ENDPOINT TESTS ━━━\n\n";
testEndpoint('GET', '/rest/V2/prices', 'Prices endpoint');
testEndpoint('GET', '/rest/V2/pricing', 'Pricing endpoint');
testEndpoint('GET', '/rest/V2/price', 'Price endpoint (singular)');
testEndpoint('GET', '/rest/V2/product-prices', 'Product prices');
testEndpoint('GET', '/rest/V2/options/prices', 'Options prices');
testEndpoint('GET', '/rest/V2/catalog/prices', 'Catalog prices');

echo "\n━━━ PRODUCT-SPECIFIC TESTS ━━━\n\n";
$testProductId = '104';
testEndpoint('GET', "/rest/V2/products/$testProductId", 'Single product details');
testEndpoint('GET', "/rest/V2/products/$testProductId/prices", 'Product prices by ID');
testEndpoint('GET', "/rest/V2/products/$testProductId/options", 'Product options by ID');

echo "\n━━━ OPTION-SPECIFIC TESTS ━━━\n\n";
$testOptionId = '151';
testEndpoint('GET', "/rest/V2/options/$testOptionId", 'Option details');
testEndpoint('GET', "/rest/V2/options/$testOptionId/prices", 'Option prices');
testEndpoint('GET', "/rest/V2/options/$testOptionId/values", 'Option values');

echo "\n━━━ ALTERNATIVE PATHS ━━━\n\n";
testEndpoint('GET', '/rest/V2/configuration/prices', 'Configuration prices');
testEndpoint('GET', '/rest/V2/quote', 'Quote endpoint');
testEndpoint('GET', '/rest/V2/calculate', 'Calculate endpoint');
testEndpoint('GET', '/rest/V2/cost', 'Cost endpoint');

echo "\n━━━ V1 ENDPOINTS (Legacy) ━━━\n\n";
testEndpoint('GET', '/rest/V1/prices', 'V1 Prices');
testEndpoint('GET', '/rest/V1/catalog', 'V1 Catalog');

// Summary
echo str_repeat('=', 80) . "\n";
echo "📊 TEST SUMMARY\n";
echo str_repeat('=', 80) . "\n\n";

$successful = array_filter($results, function($r) { return $r['success']; });
$failed = array_filter($results, function($r) { return !$r['success']; });

echo "✅ Successful: " . count($successful) . "\n";
foreach ($successful as $r) {
    echo "   - " . $r['description'] . " (Status: " . $r['status'] . ")\n";
}

echo "\n❌ Failed: " . count($failed) . "\n";
$notFound = array_filter($failed, function($r) { return $r['status'] === 404; });
$authErrors = array_filter($failed, function($r) { return $r['status'] === 401 || $r['status'] === 403; });

echo "   404 Not Found: " . count($notFound) . "\n";
echo "   Auth Errors: " . count($authErrors) . "\n";

echo "\n💡 RECOMMENDATIONS:\n\n";

if (count($successful) <= 2) {
    echo "⚠️  Only baseline endpoints work (catalog & products)\n";
    echo "📧 Contact Cockpit3D support: m.shanta@alvacommerce.com\n";
    echo "❓ Ask: 'How do we get pricing for option values?'\n";
    echo "🔧 Use temporary pricing map in the meantime\n";
} else {
    echo "✅ Found " . (count($successful) - 2) . " additional endpoint(s)!\n";
    echo "📝 Check the successful endpoints above for pricing data\n";
    echo "🎯 Implement the working endpoint in your code\n";
}

echo "\n" . str_repeat('*', 80) . "\n";

if (!$isCli) {
    echo '</pre></body></html>';
}
?>