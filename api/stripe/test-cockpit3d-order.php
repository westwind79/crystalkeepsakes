<?php
/**
 * Cockpit3D Order API Test Script - DUAL ENVIRONMENT
 * @version 2.0.0
 * @date 2025-11-10
 * @description Tests both DEV and PROD Cockpit3D environments
 */

header('Content-Type: text/html; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo '<!DOCTYPE html>
<html>
<head>
    <title>Cockpit3D Dual Environment Test</title>
    <style>
        body { font-family: "Courier New", monospace; background: #1e1e1e; color: #d4d4d4; padding: 20px; max-width: 1200px; margin: 0 auto; }
        .success { color: #4ec9b0; }
        .error { color: #f48771; }
        .info { color: #569cd6; }
        .warning { color: #dcdcaa; }
        pre { background: #252526; padding: 15px; border-radius: 4px; overflow-x: auto; border-left: 3px solid #569cd6; }
        h1 { color: #4ec9b0; border-bottom: 2px solid #4ec9b0; padding-bottom: 10px; }
        h2 { color: #dcdcaa; margin-top: 30px; }
        h3 { color: #569cd6; }
        hr { border: 1px solid #3e3e42; margin: 20px 0; }
        .step { background: #252526; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #4ec9b0; }
        .env-block { background: #1a1a1a; padding: 15px; border-radius: 4px; border-left: 4px solid #dcdcaa; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #3e3e42; }
        th { background: #252526; color: #4ec9b0; }
    </style>
</head>
<body>';

echo "<h1>🧪 Cockpit3D Dual Environment Test</h1>";
echo "<p class='info'>Testing connection to BOTH DEV and PROD Cockpit3D environments</p>";
echo "<hr>";

ob_implicit_flush(true);
ob_end_flush();

function debug($message, $type = 'info') {
    $class = $type;
    echo "<p class='$class'>$message</p>";
    flush();
    if (ob_get_level() > 0) ob_flush();
}

function getEnvVariable($key) {
    $possibleEnvPaths = [
        dirname(dirname(__DIR__)) . '/.env',
        dirname(__DIR__) . '/.env',
        __DIR__ . '/.env',
        $_SERVER['DOCUMENT_ROOT'] . '/.env',
        $_SERVER['DOCUMENT_ROOT'] . '/crystalkeepsakes/.env',
    ];
    
    foreach ($possibleEnvPaths as $path) {
        if (file_exists($path)) {
            $content = file_get_contents($path);
            $lines = explode("\n", $content);
            
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || strpos($line, '#') === 0) continue;
                
                $parts = explode('=', $line, 2);
                if (count($parts) !== 2) continue;
                
                if (trim($parts[0]) === $key) {
                    return trim($parts[1], " \t\n\r\0\x0B\"'");
                }
            }
        }
    }
    
    return null;
}

// Load ALL Cockpit3D configuration
echo "<div class='env-block'>";
echo "<h2>📋 Environment Variables Detected</h2>";

$envVars = [
    'COCKPIT3D_USERNAME' => getEnvVariable('COCKPIT3D_USERNAME'),
    'COCKPIT3D_PASSWORD' => getEnvVariable('COCKPIT3D_PASSWORD'),
    'COCKPIT3D_RETAIL_ID' => getEnvVariable('COCKPIT3D_RETAIL_ID'),
    'COCKPIT3D_API_TOKEN' => getEnvVariable('COCKPIT3D_API_TOKEN'),
    'COCKPIT3D_BASE_URL' => getEnvVariable('COCKPIT3D_BASE_URL'),
    'NEXT_PUBLIC_COCKPIT3D_API_URL' => getEnvVariable('NEXT_PUBLIC_COCKPIT3D_API_URL'),
];

echo "<table>";
echo "<tr><th>Variable</th><th>Status</th><th>Value</th></tr>";
foreach ($envVars as $key => $value) {
    $status = $value ? "<span class='success'>✓ Found</span>" : "<span class='error'>✗ Missing</span>";
    $display = $value ? (strpos($key, 'PASSWORD') !== false || strpos($key, 'TOKEN') !== false ? str_repeat('*', min(strlen($value), 20)) : htmlspecialchars(substr($value, 0, 50))) : 'N/A';
    echo "<tr><td>$key</td><td>$status</td><td>$display</td></tr>";
}
echo "</table>";
echo "</div>";

// Configuration
$username = $envVars['COCKPIT3D_USERNAME'];
$password = $envVars['COCKPIT3D_PASSWORD'];
$retailerId = $envVars['COCKPIT3D_RETAILER_ID'] ?? '256568874';

if (!$username || !$password) {
    echo "<div class='error' style='padding: 20px; background: #3c1518; border-left: 4px solid #f48771;'>";
    echo "<h3>❌ Configuration Error</h3>";
    echo "<p><strong>Missing required credentials!</strong></p>";
    echo "<p>Please add to your .env file:</p>";
    echo "<pre>COCKPIT3D_USERNAME=your_username
COCKPIT3D_PASSWORD=your_password
COCKPIT3D_RETAILER_ID=your_retailer_id</pre>";
    echo "</div>";
    echo "</body></html>";
    die();
}

// Test both environments
$environments = [
    'DEV' => [
        'name' => 'Development',
        'url' => 'https://c3d-profit-dev.host.alva.tools',
        'color' => '#dcdcaa'
    ],
    'PROD' => [
        'name' => 'Production',
        'url' => 'https://api.cockpit3d.com',
        'color' => '#f48771'
    ]
];

function testEnvironment($envName, $envConfig, $username, $password, $retailerId) {
    $baseUrl = $envConfig['url'];
    $color = $envConfig['color'];
    
    echo "<div class='step' style='border-left-color: $color;'>";
    echo "<h2 style='color: $color;'>🌐 Testing {$envConfig['name']} Environment</h2>";
    
    // Step 1: Authenticate
    echo "<h3>🔐 Step 1: Authentication</h3>";
    debug("URL: <strong>$baseUrl/rest/V2/login</strong>", 'info');
    
    $ch = curl_init($baseUrl . '/rest/V2/login');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'username' => $username,
        'password' => $password
    ]));
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    debug("HTTP Response: <strong>$httpCode</strong>", $httpCode === 200 ? 'success' : 'error');
    
    if ($curlError) {
        debug("❌ cURL Error: $curlError", 'error');
        echo "<div class='error' style='padding: 15px; background: #3c1518; border-radius: 4px;'>";
        echo "<p><strong>Network Error</strong></p>";
        echo "<p>$curlError</p>";
        echo "</div>";
        echo "</div>";
        return false;
    }
    
    if ($httpCode !== 200) {
        debug("❌ Authentication Failed", 'error');
        echo "<div class='error' style='padding: 15px; background: #3c1518; border-radius: 4px;'>";
        echo "<p><strong>HTTP $httpCode</strong></p>";
        echo "<pre>" . htmlspecialchars($response) . "</pre>";
        
        if ($httpCode === 401) {
            echo "<p class='warning'><strong>Possible reasons:</strong></p>";
            echo "<ul>";
            echo "<li>Credentials may be for a different environment</li>";
            echo "<li>Account may not have access to this environment</li>";
            echo "<li>Username or password incorrect</li>";
            echo "</ul>";
        }
        echo "</div>";
        echo "</div>";
        return false;
    }
    
    $token = trim($response, '"');
    debug("✅ <strong>Authentication Successful!</strong>", 'success');
    debug("Token: " . substr($token, 0, 20) . "...", 'success');
    
    // Step 2: Create Test Order
    echo "<h3>📦 Step 2: Create Test Order</h3>";
    
    $testOrder = [
	    'retailer_id' => $retailerId,
	    'test_mode' => true, // ADD THIS FLAG
	    'address' => [
	        'firstname' => 'TEST',
	        'lastname' => 'ORDER - DO NOT PROCESS',
	        'street' => '123 Test Street',
	        'city' => 'Test City',
	        'region' => 'CA',
	        'postcode' => '90210',
	        'country' => 'US',
	        'telephone' => '555-TEST',
	        'email' => 'test@testing.local', // Use test email
	    ],
	    'items' => [
	        [
	            'sku' => 'TEST-SKU-001',
	            'name' => 'TEST ORDER - DO NOT PROCESS',
	            'client_item_id' => 'TEST-' . time(),
	            'qty' => 1,
	            'price' => 0.01, // Minimal price
	            'photos' => [
	                'original_photo' => '',
	                'cropped_photo' => '',
	                'photos' => []
	            ],
	            'options' => []
	        ]
	    ]
	];
    
    debug("Sending order to: $baseUrl/rest/V2/orders", 'info');
    
    $ch = curl_init($baseUrl . '/rest/V2/orders');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testOrder));
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    debug("HTTP Response: <strong>$httpCode</strong>", ($httpCode === 200 || $httpCode === 201) ? 'success' : 'error');
    
    if ($httpCode === 201 || $httpCode === 200) {
        debug("✅ <strong>Order Created Successfully!</strong>", 'success');
        
        $responseData = json_decode($response, true);
        if ($responseData && isset($responseData['id'])) {
            debug("Order ID: <strong>{$responseData['id']}</strong>", 'success');
        }
        
        echo "<details>";
        echo "<summary style='cursor: pointer; color: #4ec9b0;'>📄 View Full Response</summary>";
        echo "<pre>" . json_encode($responseData, JSON_PRETTY_PRINT) . "</pre>";
        echo "</details>";
        
        echo "</div>";
        return true;
    } else {
        debug("❌ Order Creation Failed", 'error');
        echo "<div class='error' style='padding: 15px; background: #3c1518; border-radius: 4px;'>";
        echo "<p><strong>HTTP $httpCode</strong></p>";
        echo "<pre>" . htmlspecialchars($response) . "</pre>";
        echo "</div>";
        echo "</div>";
        return false;
    }
}

// Test both environments
$results = [];
foreach ($environments as $envKey => $envConfig) {
    $results[$envKey] = testEnvironment($envKey, $envConfig, $username, $password, $retailerId);
    echo "<hr>";
}

// Final Summary
echo "<div class='step' style='border-left-color: #4ec9b0;'>";
echo "<h2>📊 Test Summary</h2>";

echo "<table>";
echo "<tr><th>Environment</th><th>URL</th><th>Status</th></tr>";
foreach ($environments as $envKey => $envConfig) {
    $status = $results[$envKey] 
        ? "<span class='success'>✅ WORKING</span>" 
        : "<span class='error'>❌ FAILED</span>";
    echo "<tr>";
    echo "<td><strong>{$envConfig['name']}</strong></td>";
    echo "<td>{$envConfig['url']}</td>";
    echo "<td>$status</td>";
    echo "</tr>";
}
echo "</table>";

echo "<hr style='margin: 20px 0;'>";

// Recommendations
$devWorking = $results['DEV'];
$prodWorking = $results['PROD'];

if ($devWorking && $prodWorking) {
    echo "<div class='success' style='padding: 20px; background: #1a3a1a; border-radius: 4px;'>";
    echo "<h3>✅ Both Environments Working!</h3>";
    echo "<p>Your credentials work in both DEV and PROD environments.</p>";
    echo "<p><strong>Recommendations:</strong></p>";
    echo "<ul>";
    echo "<li>Use <strong>DEV</strong> for testing during development</li>";
    echo "<li>Use <strong>PROD</strong> when you go live</li>";
    echo "<li>Update your .env file based on your current needs</li>";
    echo "</ul>";
    echo "</div>";
} elseif ($devWorking) {
    echo "<div class='warning' style='padding: 20px; background: #3a3a1a; border-radius: 4px;'>";
    echo "<h3>⚠️ DEV Working, PROD Failed</h3>";
    echo "<p>Your credentials work in DEV but not PROD.</p>";
    echo "<p><strong>This is FINE for testing!</strong> Use DEV environment:</p>";
    echo "<pre>COCKPIT3D_BASE_URL=https://c3d-profit-dev.host.alva.tools</pre>";
    echo "<p>Contact Cockpit3D to get PROD credentials when ready for production.</p>";
    echo "</div>";
} elseif ($prodWorking) {
    echo "<div class='warning' style='padding: 20px; background: #3a3a1a; border-radius: 4px;'>";
    echo "<h3>⚠️ PROD Working, DEV Failed</h3>";
    echo "<p>Your credentials work in PROD but not DEV.</p>";
    echo "<p><strong>For development testing, use PROD carefully:</strong></p>";
    echo "<pre>COCKPIT3D_BASE_URL=https://api.cockpit3d.com</pre>";
    echo "<p class='warning'>⚠️ Be careful: PROD orders are REAL orders!</p>";
    echo "</div>";
} else {
    echo "<div class='error' style='padding: 20px; background: #3c1518; border-radius: 4px;'>";
    echo "<h3>❌ Both Environments Failed</h3>";
    echo "<p><strong>Please check:</strong></p>";
    echo "<ul>";
    echo "<li>Credentials are correct in .env file</li>";
    echo "<li>Contact Cockpit3D support for assistance</li>";
    echo "<li>Verify retailer ID is correct</li>";
    echo "</ul>";
    echo "</div>";
}

echo "</div>";

echo "<hr>";
echo "<p class='info' style='text-align: center;'>Test completed at " . date('Y-m-d H:i:s') . "</p>";
echo "</body></html>";