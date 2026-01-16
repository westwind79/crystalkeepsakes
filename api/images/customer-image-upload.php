<?php
/**
 * Customer Image Upload API
 * @version 1.4.0
 * @date 2025-01-08
 * 
 * SCRIPT LOCATION: /api/images/customer-image-upload.php
 * 
 * FILE STRUCTURE:
 *   Production:  /public_html/crystalkeepsakes.com/api/images/customer-image-upload.php
 *   Testing:     /public_html/crystalkeepsakes.com/test/api/images/customer-image-upload.php
 * 
 * UPLOAD TARGET: /public_html/crystalkeepsakes.com/crystal-data/
 *   - Production: /crystal-data/orders/{ORDER_ID}/
 *   - Test/Dev:   /crystal-data/orders-test/{ORDER_ID}/
 * 
 * URL Structure:
 *   - Production: https://crystalkeepsakes.com/crystal-data/orders/CK_0000001/file.png
 *   - Testing:    https://crystalkeepsakes.com/crystal-data/orders-test/CK_0000001/file.png
 *   - Dev MAMP:   http://localhost:8888/crystalkeepsakes/crystal-data/orders-test/temp-123/file.png
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Load environment loader (should be at /api/env-loader.php)
$envLoaderPath = dirname(__DIR__) . '/env-loader.php';
if (!file_exists($envLoaderPath)) {
    error_log("❌ env-loader.php not found at: $envLoaderPath");
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Configuration file missing']);
    exit();
}
require_once $envLoaderPath;

try {
    // Get JSON payload (images are sent as base64)
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['imageData'])) {
        error_log("❌ No image data in request");
        throw new Exception('No image data provided');
    }
    
    $imageData = $data['imageData'];
    $productId = $data['productId'] ?? 'unknown';
    $imageType = $data['imageType'] ?? 'masked';
    $orderNumber = $data['orderNumber'] ?? null;
    
    error_log("📥 ====== IMAGE UPLOAD REQUEST ======");
    error_log("📥 Type: $imageType, Product: $productId, Order: $orderNumber");
    
    // Parse base64 image
    if (!preg_match('/^data:image\/(\w+);base64,/', $imageData, $matches)) {
        error_log("❌ Invalid format");
        throw new Exception('Invalid base64 image format');
    }
    
    $imageExtension = $matches[1];
    $base64Image = substr($imageData, strpos($imageData, ',') + 1);
    $binaryImage = base64_decode($base64Image, true);
    
    if ($binaryImage === false) {
        throw new Exception('Failed to decode base64 image');
    }
    
    // Validate it's actually an image
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $detectedMime = $finfo->buffer($binaryImage);
    
    if (!str_starts_with($detectedMime, 'image/')) {
        throw new Exception("Invalid image data. Detected type: $detectedMime");
    }
    
    // Validate image size (max 10MB)
    $imageSize = strlen($binaryImage);
    if ($imageSize > 10 * 1024 * 1024) {
        throw new Exception('Image too large. Maximum size is 10MB.');
    }
    
    error_log("✓ Image validated: $imageSize bytes, type: $detectedMime");
    
    // Get environment mode
    $mode = getEnvVar('NEXT_PUBLIC_ENV_MODE') ?? 'development';
    $basePath = getEnvVar('NEXT_PUBLIC_BASE_PATH') ?? '';
    $basePath = trim($basePath, '/');
    
    error_log("🖼️ Mode: $mode, BasePath: '$basePath'");
    
    // ============================================================
    // PATH RESOLUTION
    // Script is at: /api/images/customer-image-upload.php
    // Need to reach: /crystal-data/
    // ============================================================
    
    $scriptDir = str_replace('\\', '/', __DIR__);
    $scriptDir = rtrim($scriptDir, '/');
    
    error_log("📁 Script dir: $scriptDir");
    
    // Determine how many levels up to go
    // Production:  /crystalkeepsakes.com/api/images/ → go up 2 levels
    // Testing:     /crystalkeepsakes.com/test/api/images/ → go up 3 levels
    
    if ($basePath === 'test') {
        // Testing environment: up 3 levels
        $siteRoot = dirname(dirname(dirname($scriptDir)));
        error_log("📁 Testing mode: going up 3 levels from /test/api/images/");
    } else {
        // Production environment: up 2 levels
        $siteRoot = dirname(dirname($scriptDir));
        error_log("📁 Production mode: going up 2 levels from /api/images/");
    }
    
    error_log("📁 Site root: $siteRoot");
    
    // Verify we're at crystalkeepsakes.com root
    if (strpos($siteRoot, 'crystalkeepsakes') === false) {
        error_log("⚠️ Warning: Site root doesn't contain 'crystalkeepsakes': $siteRoot");
    }
    
    // ============================================================
    // Set upload directory: /crystal-data/ at site root
    // ============================================================
    if ($mode === 'development' || $mode === 'testing') {
        $uploadDir = $siteRoot . '/crystal-data/orders-test/';
    } else {
        $uploadDir = $siteRoot . '/crystal-data/orders/';
    }
    
    // Create ORDER-BASED subfolder
    if ($orderNumber) {
        $fullUploadDir = $uploadDir . $orderNumber . '/';
    } else {
        // Fallback: use timestamp-based temp folder
        $fullUploadDir = $uploadDir . 'temp-' . date('Ymd-His') . '/';
    }
    
    error_log("📁 Full upload directory: $fullUploadDir");
    
    // Create directory if doesn't exist
    if (!file_exists($fullUploadDir)) {
        if (!mkdir($fullUploadDir, 0755, true)) {
            error_log("❌ Failed to create directory: $fullUploadDir");
            throw new Exception("Failed to create upload directory");
        }
        error_log("✓ Directory created: $fullUploadDir");
    }
    
    // Verify writable
    if (!is_writable($fullUploadDir)) {
        throw new Exception("Upload directory not writable: $fullUploadDir");
    }
    
    // Generate unique filename
    $timestamp = round(microtime(true) * 1000);
    $uniqueId = uniqid();
    $filename = "customer_{$productId}_{$imageType}_{$timestamp}_{$uniqueId}.{$imageExtension}";
    $filePath = $fullUploadDir . $filename;
    
    // Save file
    if (file_put_contents($filePath, $binaryImage) === false) {
        throw new Exception('Failed to save image file');
    }
    
    chmod($filePath, 0644);
    error_log("✓ Image saved: $filePath (" . filesize($filePath) . " bytes)");
    
    // ============================================================
    // Generate web-accessible URL
    // ============================================================
    if ($mode === 'development') {
        // Local MAMP
        $backendUrl = getEnvVar('NEXT_PUBLIC_PHP_BACKEND_URL') ?? 'http://localhost:8888/crystalkeepsakes';
        $backendUrl = rtrim($backendUrl, '/');
        $subFolder = 'orders-test';
        $fileUrl = $backendUrl . '/crystal-data/' . $subFolder . '/' . ($orderNumber ? $orderNumber . '/' : '') . $filename;
    } else {
        // Production/Testing - URL from domain root
        $subFolder = ($mode === 'testing') ? 'orders-test' : 'orders';
        $fileUrl = '/crystal-data/' . $subFolder . '/' . ($orderNumber ? $orderNumber . '/' : '') . $filename;
    }
    
    error_log("✅ Final image URL: $fileUrl");
    
    // Return success
    echo json_encode([
        'success' => true,
        'filename' => $filename,
        'url' => $fileUrl,
        'size' => $imageSize,
        'type' => $imageType,
        'environment' => $mode,
        'orderNumber' => $orderNumber,
        'debug' => [
            'scriptDir' => $scriptDir,
            'siteRoot' => $siteRoot,
            'uploadDir' => $uploadDir,
            'fullUploadDir' => $fullUploadDir,
            'filePath' => $filePath,
            'fileExists' => file_exists($filePath),
            'generatedUrl' => $fileUrl,
            'basePath' => $basePath,
            'levelsUp' => ($basePath === 'test') ? 3 : 2
        ]
    ]);
    
} catch (Exception $e) {
    error_log("❌ Upload error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>