<?php
/**
 * GoDaddy Image Upload Test
 * Tests that customer images are saved to persistent location on shared hosting
 */

// Load environment variables
function loadEnv($envFile) {
    if (!file_exists($envFile)) {
        echo "⚠️  Warning: .env file not found: $envFile\n";
        return false;
    }
    
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) continue;
        
        $name = trim($parts[0]);
        $value = trim($parts[1], " \t\n\r\0\x0B\"'");
        putenv("$name=$value");
    }
    return true;
}

echo "=== GoDaddy Image Upload Test ===\n\n";

// Load production environment
$envLoaded = loadEnv(__DIR__ . '/.env.production');
if (!$envLoaded) {
    echo "Trying .env instead...\n";
    $envLoaded = loadEnv(__DIR__ . '/.env');
}

echo "Environment Mode: " . (getenv('NEXT_PUBLIC_ENV_MODE') ?: 'not set') . "\n";
echo "Image Path: " . (getenv('CUSTOMER_IMAGE_PATH') ?: 'not set - will auto-detect') . "\n\n";

// Load image storage class
require_once __DIR__ . '/api/stripe/image-storage.php';

try {
    echo "Initializing ImageStorage class...\n";
    $storage = new ImageStorage();
    echo "✅ ImageStorage initialized\n\n";
    
    // Test base64 image (1x1 red pixel PNG)
    $testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    
    $orderNumber = 'TEST-GODADDY-' . time();
    $cartItemId = 'test-item-001';
    
    echo "Test Order Details:\n";
    echo "  Order Number: $orderNumber\n";
    echo "  Cart Item ID: $cartItemId\n\n";
    
    echo "Uploading test image...\n";
    
    $result = $storage->saveImageFromBase64(
        $testImage,
        $orderNumber,
        $cartItemId,
        'raw'
    );
    
    echo "\n✅ UPLOAD SUCCESSFUL!\n\n";
    
    echo "Upload Details:\n";
    echo "  Filename: {$result['filename']}\n";
    echo "  Filepath: {$result['filepath']}\n";
    echo "  Size: {$result['size']} bytes\n";
    echo "  Extension: {$result['extension']}\n";
    echo "  Type: {$result['type']}\n\n";
    
    // Verify file exists
    if (file_exists($result['filepath'])) {
        echo "✅ File verified on filesystem\n";
    } else {
        echo "❌ File NOT found on filesystem!\n";
    }
    
    // Check if it's in persistent storage
    if (strpos($result['filepath'], 'crystal-data') !== false) {
        echo "✅ File is in PERSISTENT storage (crystal-data)\n";
        echo "   Images will survive builds and deployments!\n";
    } elseif (strpos($result['filepath'], 'crystalkeepsakes.com') !== false || 
              strpos($result['filepath'], 'out') !== false) {
        echo "⚠️  WARNING: File is INSIDE project directory!\n";
        echo "   This location will be deleted on builds!\n";
        echo "   Please create: /public_html/crystal-data/order-images/\n";
        echo "   And set CUSTOMER_IMAGE_PATH in .env.production\n";
    } else {
        echo "ℹ️  File location: {$result['filepath']}\n";
    }
    
    echo "\n";
    
    // Show expected public URLs
    $domain = getenv('NEXT_PUBLIC_PHP_BACKEND_URL') ?: 'https://crystalkeepsakes.com';
    $domain = rtrim($domain, '/');
    
    echo "Expected Public URLs:\n";
    echo "  Direct: {$domain}/crystal-data/order-images/$orderNumber/{$result['filename']}\n";
    echo "  Alias:  {$domain}/uploads/order-images/$orderNumber/{$result['filename']}\n";
    echo "\n";
    echo "Test these URLs in your browser to verify images are accessible.\n";
    
    echo "\n";
    echo "Directory Structure Check:\n";
    $orderDir = dirname($result['filepath']);
    echo "  Order Directory: $orderDir\n";
    
    if (is_dir($orderDir)) {
        $files = scandir($orderDir);
        echo "  Files in directory: " . (count($files) - 2) . "\n";  // -2 for . and ..
    }
    
    echo "\n";
    echo "Cleanup:\n";
    echo "  To keep test file: Do nothing\n";
    echo "  To delete test file: rm {$result['filepath']}\n";
    echo "  To delete test folder: rm -rf $orderDir\n";
    
} catch (Exception $e) {
    echo "\n❌ ERROR: {$e->getMessage()}\n\n";
    echo "Troubleshooting:\n";
    echo "1. Create directory: /public_html/crystal-data/order-images/\n";
    echo "2. Set permissions: chmod 755 crystal-data/\n";
    echo "3. Set permissions: chmod 755 crystal-data/order-images/\n";
    echo "4. Update .env.production with CUSTOMER_IMAGE_PATH\n";
    echo "5. Check PHP error logs in cPanel\n";
    echo "\n";
    echo "Current directory: " . __DIR__ . "\n";
    echo "Looking for: \$uploadDir\n";
    exit(1);
}

echo "\n=== Test Complete ===\n";
echo "\nNext Steps:\n";
echo "1. ✓ Test upload works\n";
echo "2. Check image URL in browser\n";
echo "3. Import schema.sql to MySQL (cPanel → phpMyAdmin)\n";
echo "4. Update .env.production with database credentials\n";
echo "5. Test real order with Stripe sandbox\n";
?>
