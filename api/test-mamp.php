<?php
/**
 * MAMP Test Script - Check if PHP is working
 * Access: http://localhost:8888/crystalkeepsakes/api/test-mamp.php
 */

header('Content-Type: text/plain');
echo "=== MAMP PHP Test ===\n\n";

echo "✅ PHP is working!\n\n";

echo "PHP Version: " . phpversion() . "\n";
echo "Current file: " . __FILE__ . "\n";
echo "Current directory: " . __DIR__ . "\n";
echo "Document root: " . $_SERVER['DOCUMENT_ROOT'] . "\n\n";

// Check for .env file
$possibleEnvPaths = [
    dirname(dirname(__DIR__)) . '/.env',
    dirname(__DIR__) . '/.env',
    $_SERVER['DOCUMENT_ROOT'] . '/crystalkeepsakes/.env',
    $_SERVER['DOCUMENT_ROOT'] . '/.env',
    'C:/MAMP/htdocs/crystalkeepsakes/.env'
];

echo "=== Checking for .env file ===\n";
foreach ($possibleEnvPaths as $path) {
    $exists = file_exists($path) ? '✅ EXISTS' : '❌ NOT FOUND';
    echo "$exists: $path\n";
}

// Check for vendor/autoload.php
echo "\n=== Checking for Stripe vendor ===\n";
$possibleVendorPaths = [
    dirname(dirname(__DIR__)) . '/vendor/autoload.php',
    dirname(__DIR__) . '/vendor/autoload.php',
    dirname(dirname(dirname(__DIR__))) . '/vendor/autoload.php',
    'C:/MAMP/htdocs/crystalkeepsakes/vendor/autoload.php'
];

foreach ($possibleVendorPaths as $path) {
    $exists = file_exists($path) ? '✅ EXISTS' : '❌ NOT FOUND';
    echo "$exists: $path\n";
}

// Check if Stripe PHP file exists
echo "\n=== Checking Stripe PHP file ===\n";
$stripeFile = __DIR__ . '/stripe/create-checkout-session.php';
$exists = file_exists($stripeFile) ? '✅ EXISTS' : '❌ NOT FOUND';
echo "$exists: $stripeFile\n";

echo "\n=== Server Info ===\n";
echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "\n";
echo "HTTP Host: " . $_SERVER['HTTP_HOST'] . "\n";
echo "Request URI: " . $_SERVER['REQUEST_URI'] . "\n";

echo "\n=== All Done! ===\n";
echo "If you see this, MAMP PHP is working correctly.\n";
?>
