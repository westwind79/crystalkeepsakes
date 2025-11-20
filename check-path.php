<?php
/**
 * Path Structure Checker
 * Shows your actual directory structure to determine correct paths
 */

header('Content-Type: text/plain; charset=utf-8');

echo "=== Directory Structure Analysis ===\n\n";

echo "Current File Location:\n";
echo "  __FILE__: " . __FILE__ . "\n";
echo "  __DIR__:  " . __DIR__ . "\n\n";

echo "Directory Hierarchy:\n";
$currentDir = __DIR__;
for ($i = 0; $i < 6; $i++) {
    echo "  Level $i: $currentDir\n";
    $currentDir = dirname($currentDir);
    if ($currentDir === '/' || $currentDir === dirname($currentDir)) {
        break;
    }
}

echo "\n";
echo "Detected Structure:\n";

// Try to detect structure
$apiDir = __DIR__;
$level1 = dirname($apiDir);
$level2 = dirname($level1);
$level3 = dirname($level2);
$level4 = dirname($level3);

echo "  Current (api/stripe/): $apiDir\n";
echo "  Parent 1 (api/):       $level1\n";
echo "  Parent 2 (project):    $level2\n";
echo "  Parent 3:              $level3\n";
echo "  Parent 4:              $level4\n";

echo "\n";
echo "Recommended Paths:\n";

// Check if we're in a nested structure (crystalkeepsakes inside another domain)
$projectFolder = basename($level2);
$parentFolder = basename($level3);

if (strpos($parentFolder, '.com') !== false || strpos($parentFolder, 'public_html') !== false) {
    // We're likely in: /exposethegrove.com/crystalkeepsakes.com/ structure
    echo "  Detected: Addon domain structure\n";
    echo "  Project folder: $projectFolder\n";
    echo "  Parent folder: $parentFolder\n\n";
    
    echo "  RECOMMENDED crystal-data location:\n";
    echo "    $level3/crystal-data/order-images/\n\n";
    
    echo "  For .env.production use:\n";
    echo "    CUSTOMER_IMAGE_PATH=$level3/crystal-data/order-images\n\n";
    
} else {
    // Standard structure
    echo "  Detected: Standard structure\n";
    echo "  RECOMMENDED crystal-data location:\n";
    echo "    $level2/crystal-data/order-images/\n\n";
    
    echo "  For .env.production use:\n";
    echo "    CUSTOMER_IMAGE_PATH=$level2/crystal-data/order-images\n\n";
}

echo "\n";
echo "Environment Check:\n";

// Check if .env files exist
$envFiles = [
    __DIR__ . '/.env.production',
    __DIR__ . '/.env',
    $level1 . '/.env.production',
    $level1 . '/.env',
    $level2 . '/.env.production',
    $level2 . '/.env'
];

foreach ($envFiles as $envFile) {
    if (file_exists($envFile)) {
        echo "  ✓ Found: $envFile\n";
        
        // Try to read CUSTOMER_IMAGE_PATH
        $content = file_get_contents($envFile);
        if (preg_match('/CUSTOMER_IMAGE_PATH=(.+)/', $content, $matches)) {
            echo "    -> CUSTOMER_IMAGE_PATH=" . trim($matches[1]) . "\n";
        }
    }
}

echo "\n";
echo "Directory Permissions:\n";

$dirsToCheck = [$level2, $level3, $level4];
foreach ($dirsToCheck as $dir) {
    if (is_dir($dir)) {
        $perms = substr(sprintf('%o', fileperms($dir)), -4);
        $writable = is_writable($dir) ? '✓ writable' : '✗ not writable';
        echo "  $dir\n";
        echo "    Permissions: $perms ($writable)\n";
    }
}

echo "\n";
echo "Web Server Info:\n";
echo "  Document Root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'not set') . "\n";
echo "  Server Software: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'not set') . "\n";
echo "  Current URL: " . ($_SERVER['HTTP_HOST'] ?? 'not set') . ($_SERVER['REQUEST_URI'] ?? '') . "\n";

echo "\n";
echo "=== Next Steps ===\n\n";
echo "1. Note the RECOMMENDED path above\n";
echo "2. Create that directory via cPanel File Manager\n";
echo "3. Update .env.production with the CUSTOMER_IMAGE_PATH\n";
echo "4. Run: php test-godaddy-upload.php\n";
echo "5. Verify images are in the correct location\n";

echo "\n";
echo "=== Quick Commands ===\n\n";
echo "Create directory (SSH):\n";
echo "  mkdir -p $level3/crystal-data/order-images\n";
echo "  chmod 755 $level3/crystal-data/order-images\n";

?>
