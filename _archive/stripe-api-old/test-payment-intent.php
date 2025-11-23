<?php
/**
 * Test Script - Debug Payment Intent Issues
 * Run this directly: http://localhost:8888/crystalkeepsakes/api/stripe/test-payment-intent.php
 */

header('Content-Type: text/html; charset=utf-8');
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h1>Payment Intent Diagnostic Test</h1>";
echo "<hr>";

// Test 1: Check .env file
echo "<h2>Test 1: .env File Location</h2>";
$possibleEnvPaths = [
    dirname(dirname(__DIR__)) . '/.env',
    dirname(__DIR__) . '/.env',
    $_SERVER['DOCUMENT_ROOT'] . '/crystalkeepsakes/.env',
    $_SERVER['DOCUMENT_ROOT'] . '/.env'
];

$envFound = false;
foreach ($possibleEnvPaths as $path) {
    echo "<p>Checking: <code>$path</code> ... ";
    if (file_exists($path)) {
        echo "<span style='color:green;'>✓ FOUND</span></p>";
        $envFound = true;
        $envFilePath = $path;
        break;
    } else {
        echo "<span style='color:red;'>✗ Not found</span></p>";
    }
}

if (!$envFound) {
    echo "<p style='color:red;'><strong>ERROR: .env file not found!</strong></p>";
    echo "<p>Please create .env file at one of the above locations.</p>";
    exit;
}

// Test 2: Read Stripe keys from .env
echo "<h2>Test 2: Stripe API Keys</h2>";

function readEnv($filePath) {
    $env = [];
    $content = file_get_contents($filePath);
    $lines = explode("\n", $content);
    
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) continue;
        
        $key = trim($parts[0]);
        $value = trim($parts[1], " \t\n\r\x0B\"'");
        $env[$key] = $value;
    }
    
    return $env;
}

$env = readEnv($envFilePath);

echo "<table border='1' cellpadding='10'>";
echo "<tr><th>Variable</th><th>Status</th><th>Value</th></tr>";

$requiredKeys = [
    'NEXT_PUBLIC_ENV_MODE',
    'STRIPE_SECRET_KEY',
    'STRIPE_DEVELOPMENT_SECRET_KEY',
    'STRIPE_DEVELOPMENT_PUBLISHABLE_KEY'
];

foreach ($requiredKeys as $key) {
    echo "<tr>";
    echo "<td><code>$key</code></td>";
    
    if (isset($env[$key]) && !empty($env[$key])) {
        echo "<td style='color:green;'>✓ Found</td>";
        
        // Mask the value for security
        if (strpos($key, 'SECRET') !== false) {
            echo "<td>" . substr($env[$key], 0, 10) . "..." . substr($env[$key], -4) . "</td>";
        } else {
            echo "<td>{$env[$key]}</td>";
        }
    } else {
        echo "<td style='color:red;'>✗ Missing</td>";
        echo "<td>-</td>";
    }
    echo "</tr>";
}

echo "</table>";

// Test 3: Check Stripe library
echo "<h2>Test 3: Stripe PHP Library</h2>";

$possibleVendorPaths = [
    dirname(dirname(__DIR__)) . '/vendor/autoload.php',
    dirname(__DIR__) . '/vendor/autoload.php',
    $_SERVER['DOCUMENT_ROOT'] . '/crystalkeepsakes/vendor/autoload.php',
    __DIR__ . '/../../vendor/autoload.php'
];

$vendorFound = false;
foreach ($possibleVendorPaths as $path) {
    echo "<p>Checking: <code>$path</code> ... ";
    if (file_exists($path)) {
        echo "<span style='color:green;'>✓ FOUND</span></p>";
        $vendorFound = true;
        require_once $path;
        break;
    } else {
        echo "<span style='color:red;'>✗ Not found</span></p>";
    }
}

if (!$vendorFound) {
    echo "<p style='color:red;'><strong>ERROR: Stripe library not found!</strong></p>";
    echo "<p>Run: <code>composer install</code> in your project root</p>";
    exit;
}

// Test 4: Initialize Stripe
echo "<h2>Test 4: Initialize Stripe</h2>";

$mode = $env['NEXT_PUBLIC_ENV_MODE'] ?? 'development';
echo "<p>Mode: <strong>$mode</strong></p>";

if ($mode === 'production') {
    $secretKey = $env['STRIPE_SECRET_KEY'] ?? null;
} else {
    $secretKey = $env['STRIPE_DEVELOPMENT_SECRET_KEY'] ?? null;
}

if (!$secretKey) {
    echo "<p style='color:red;'>ERROR: Stripe secret key not found for mode: $mode</p>";
    exit;
}

try {
    \Stripe\Stripe::setApiKey($secretKey);
    echo "<p style='color:green;'>✓ Stripe initialized successfully</p>";
} catch (Exception $e) {
    echo "<p style='color:red;'>ERROR: " . $e->getMessage() . "</p>";
    exit;
}

// Test 5: Create test payment intent
echo "<h2>Test 5: Create Test Payment Intent</h2>";

try {
    $testIntent = \Stripe\PaymentIntent::create([
        'amount' => 100, // $1.00 in cents
        'currency' => 'usd',
        'automatic_payment_methods' => [
            'enabled' => true,
        ],
        'metadata' => [
            'test' => 'true',
            'order_number' => 'TEST-' . time()
        ]
    ]);
    
    echo "<p style='color:green;'>✓ Test payment intent created successfully!</p>";
    echo "<p>Payment Intent ID: <code>{$testIntent->id}</code></p>";
    echo "<p>Client Secret: <code>" . substr($testIntent->client_secret, 0, 20) . "...</code></p>";
    echo "<p style='color:green;'><strong>✅ ALL TESTS PASSED!</strong></p>";
    echo "<p>Your Stripe integration is working correctly.</p>";
    
} catch (\Stripe\Exception\ApiErrorException $e) {
    echo "<p style='color:red;'>ERROR: Stripe API Error</p>";
    echo "<p>Message: {$e->getMessage()}</p>";
    echo "<p>Type: " . get_class($e) . "</p>";
    
} catch (Exception $e) {
    echo "<p style='color:red;'>ERROR: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<h2>Next Steps</h2>";
echo "<ul>";
echo "<li>If all tests passed: Your PHP backend is working!</li>";
echo "<li>If tests failed: Check the errors above</li>";
echo "<li>Check browser console for frontend errors</li>";
echo "</ul>";
?>
