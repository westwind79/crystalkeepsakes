<?php
/**
 * Test Image Upload Script
 * Tests that customer images are saved to persistent location
 */

require_once __DIR__ . '/api/stripe/image-storage.php';

echo "=== Image Upload Test ===\n\n";

try {
    $storage = new ImageStorage();
    
    // Test base64 image (1x1 red pixel PNG)
    $testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    
    $orderNumber = 'TEST-' . time();
    $cartItemId = 'test-item-001';
    
    echo "Testing upload...\n";
    echo "Order Number: $orderNumber\n";
    echo "Cart Item ID: $cartItemId\n\n";
    
    $result = $storage->saveImageFromBase64(
        $testImage,
        $orderNumber,
        $cartItemId,
        'raw'
    );
    
    echo "✅ SUCCESS!\n\n";
    echo "Upload Details:\n";
    echo "  Filename: {$result['filename']}\n";
    echo "  Filepath: {$result['filepath']}\n";
    echo "  Size: {$result['size']} bytes\n";
    echo "  Extension: {$result['extension']}\n";
    echo "  Type: {$result['type']}\n\n";
    
    // Verify file exists
    if (file_exists($result['filepath'])) {
        echo "✅ File verified on filesystem\n";
        
        // Check if it's outside project directory
        $projectRoot = __DIR__;
        if (strpos($result['filepath'], $projectRoot) === false) {
            echo "✅ File is OUTSIDE project directory (GOOD!)\n";
            echo "   This means images will survive builds/deployments.\n";
        } else {
            echo "⚠️  WARNING: File is INSIDE project directory!\n";
            echo "   Images may be deleted during builds.\n";
            echo "   Please run: ./scripts/setup-image-storage.sh\n";
        }
    } else {
        echo "❌ File NOT found on filesystem!\n";
    }
    
    echo "\n";
    echo "Expected public URL:\n";
    echo "  https://crystalkeepsakes.com/uploads/order-images/$orderNumber/{$result['filename']}\n";
    echo "\n";
    
    // Cleanup test file
    $cleanup = readline("Delete test file? (y/n): ");
    if (strtolower($cleanup) === 'y') {
        unlink($result['filepath']);
        // Try to remove order directory if empty
        $orderDir = dirname($result['filepath']);
        if (is_dir($orderDir) && count(scandir($orderDir)) === 2) {
            rmdir($orderDir);
        }
        echo "✅ Test file deleted\n";
    }
    
} catch (Exception $e) {
    echo "❌ ERROR: {$e->getMessage()}\n\n";
    echo "Troubleshooting:\n";
    echo "1. Check that upload directory exists and is writable\n";
    echo "2. Run: ./scripts/setup-image-storage.sh\n";
    echo "3. Check web server error logs\n";
    exit(1);
}

echo "\n=== Test Complete ===\n";
