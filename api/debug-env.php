<?php
/**
 * Debug Environment Variables
 * Access: http://localhost:8888/crystalkeepsakes/api/debug-env.php
 */

header('Content-Type: text/html; charset=utf-8');
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/env-loader.php';

?>
<!DOCTYPE html>
<html>
<head>
    <title>Environment Debug</title>
    <style>
        body { font-family: monospace; background: #1e1e1e; color: #d4d4d4; padding: 20px; }
        pre { background: #252526; padding: 15px; border-radius: 4px; border: 1px solid #3e3e42; }
        .success { color: #4ec9b0; }
        .error { color: #f48771; }
        .warning { color: #dcdcaa; }
        h1 { color: #569cd6; }
        h2 { color: #4ec9b0; border-bottom: 2px solid #4ec9b0; padding-bottom: 5px; }
        .key { color: #9cdcfe; }
        .value { color: #ce9178; }
    </style>
</head>
<body>

<h1>🔧 Crystal Keepsakes - Environment Debug</h1>

<?php debugEnvPaths(); ?>

<h2>📋 Loaded Environment Variables</h2>
<pre><?php

// Try to load some key variables - ONLY standardized names
$testKeys = [
    'NEXT_PUBLIC_ENV_MODE',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'COCKPIT3D_USERNAME',
    'COCKPIT3D_RETAIL_ID',
    'NEXT_PUBLIC_PHP_BACKEND_URL'
];

foreach ($testKeys as $key) {
    $value = getEnvVar($key);
    
    if ($value !== null) {
        // Mask sensitive values
        if (strpos($key, 'SECRET') !== false || strpos($key, 'PASSWORD') !== false) {
            $displayValue = substr($value, 0, 10) . '...' . substr($value, -4);
        } else {
            $displayValue = $value;
        }
        
        echo "<span class='success'>✓</span> <span class='key'>$key</span> = <span class='value'>$displayValue</span>\n";
    } else {
        echo "<span class='error'>✗</span> <span class='key'>$key</span> = <span class='error'>NOT SET</span>\n";
    }
}

?>
</pre>

<h2>🌐 Server Information</h2>
<pre><?php
echo "PHP Version: " . phpversion() . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Script Filename: " . $_SERVER['SCRIPT_FILENAME'] . "\n";
echo "Request URI: " . $_SERVER['REQUEST_URI'] . "\n";
echo "\n";
echo "Project Root (calculated): " . dirname(__DIR__) . "\n";
echo "API Directory: " . __DIR__ . "\n";
?>
</pre>

<h2>📦 Composer Dependencies</h2>
<pre><?php
$vendorPath = dirname(__DIR__) . '/vendor/autoload.php';
$stripeLibPath = dirname(__DIR__) . '/vendor/stripe/stripe-php';

echo "Vendor autoload: ";
if (file_exists($vendorPath)) {
    echo "<span class='success'>✓ EXISTS</span>\n";
    echo "  Path: $vendorPath\n";
} else {
    echo "<span class='error'>✗ NOT FOUND</span>\n";
    echo "  Expected at: $vendorPath\n";
    echo "  <span class='warning'>⚠️  Run: composer install</span>\n";
}

echo "\nStripe PHP Library: ";
if (file_exists($stripeLibPath)) {
    echo "<span class='success'>✓ EXISTS</span>\n";
    echo "  Path: $stripeLibPath\n";
} else {
    echo "<span class='error'>✗ NOT FOUND</span>\n";
    echo "  Expected at: $stripeLibPath\n";
    echo "  <span class='warning'>⚠️  Run: composer require stripe/stripe-php</span>\n";
}
?>
</pre>

<h2>🔒 Security Check</h2>
<pre><?php
$mode = getEnvVar('NEXT_PUBLIC_ENV_MODE') ?? 'development';

echo "Current Mode: ";
if ($mode === 'production') {
    echo "<span class='error'>PRODUCTION</span> 🔴\n";
    echo "<span class='warning'>⚠️  Using LIVE Stripe keys!</span>\n";
} else {
    echo "<span class='success'>$mode</span> ✓\n";
    echo "Using TEST Stripe keys (safe for development)\n";
}

$devKey = getEnvVar('STRIPE_DEVELOPMENT_SECRET_KEY');
$liveKey = getEnvVar('STRIPE_SECRET_KEY');

echo "\nStripe Keys Configuration:\n";
if ($mode === 'development' || $mode === 'testing') {
    if ($devKey) {
        echo "  <span class='success'>✓</span> Development key configured\n";
    } else {
        echo "  <span class='error'>✗</span> Development key MISSING\n";
    }
} else {
    if ($liveKey) {
        echo "  <span class='success'>✓</span> Production key configured\n";
    } else {
        echo "  <span class='error'>✗</span> Production key MISSING\n";
    }
}
?>
</pre>

<h2>✅ Next Steps</h2>
<pre><?php
$issues = [];

if (!file_exists(dirname(__DIR__) . '/.env')) {
    $issues[] = "❌ Create .env file in project root";
}

if (!file_exists($vendorPath)) {
    $issues[] = "❌ Run: composer install";
}

if (!getEnvVar('STRIPE_DEVELOPMENT_SECRET_KEY') && $mode !== 'production') {
    $issues[] = "❌ Add STRIPE_DEVELOPMENT_SECRET_KEY to .env";
}

if (empty($issues)) {
    echo "<span class='success'>🎉 Everything looks good!</span>\n";
    echo "\nYou can now test the checkout flow.\n";
} else {
    echo "<span class='warning'>⚠️  Please fix these issues:</span>\n\n";
    foreach ($issues as $issue) {
        echo "$issue\n";
    }
}
?>
</pre>

</body>
</html>
