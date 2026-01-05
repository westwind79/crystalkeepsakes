<?php
/**
 * Customer Image Upload API
 * Handles customer-uploaded images for product customization
 * 
 * CRITICAL PATH STRUCTURE:
 *   ALL images go to: /public_html/crystalkeepsakes.com/crystal-data/
 *   - Production: /crystal-data/orders/{ORDER_ID}/
 *   - Test/Dev:   /crystal-data/orders-test/{ORDER_ID}/
 * 
 * URL Structure (always from domain root):
 *   - https://crystalkeepsakes.com/crystal-data/orders/CK_0000001/file.png
 *   - https://crystalkeepsakes.com/crystal-data/orders-test/CK_0000001/file.png
 * 
 * LOG FILE: /crystal-data/logs/upload-log.txt
 *   Tracks all upload attempts with diagnostics including:
 *   - File size, type, and format
 *   - Server limits (post_max_size, upload_max_filesize, memory_limit)
 *   - Directory permissions and disk space
 *   - User agent and IP address
 *   - Success/failure status with detailed error info
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

// Load environment loader and upload logger
require_once __DIR__ . '/env-loader.php';
require_once __DIR__ . '/upload-logger.php';

// Initialize logger (will be configured with proper path later)
$logger = null;

try {
    // Get JSON payload (images are sent as base64)
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['imageData'])) {
        error_log("❌ No image data in request. Raw input length: " . strlen($input));
        error_log("❌ Decoded data keys: " . (is_array($data) ? implode(', ', array_keys($data)) : 'not an array'));
        
        // Try to initialize logger for error logging even without proper path
        $logger = new UploadLogger();
        $logger->logUploadStart('unknown', 'unknown', null, strlen($input));
        $logger->logUploadFailure('No image data provided', 'NO_IMAGE_DATA', [
            'raw_input_length' => strlen($input),
            'decoded_data_keys' => is_array($data) ? array_keys($data) : 'not an array',
            'json_last_error' => json_last_error_msg(),
        ]);
        $logger->writeLog();
        
        throw new Exception('No image data provided');
    }
    
    $imageData = $data['imageData'];
    $productId = $data['productId'] ?? 'unknown';
    $imageType = $data['imageType'] ?? 'masked'; // 'masked' or 'raw'
    $orderNumber = $data['orderNumber'] ?? null; // Order ID for folder structure
    
    // Debug: Log image data info
    $imageDataLength = strlen($imageData);
    $imageDataStart = substr($imageData, 0, 50);
    error_log("📥 ====== IMAGE UPLOAD REQUEST ======");
    error_log("📥 Type: $imageType");
    error_log("📥 Product: $productId");
    error_log("📥 Order: $orderNumber");
    error_log("📥 Image data length: $imageDataLength chars");
    error_log("📥 Image data starts with: $imageDataStart");
    
    // Parse base64 image
    if (!preg_match('/^data:image\/(\w+);base64,/', $imageData, $matches)) {
        error_log("❌ Invalid format. Expected: data:image/TYPE;base64,...");
        error_log("❌ Actual start: " . substr($imageData, 0, 100));
        
        // Log the failure
        $logger = new UploadLogger();
        $logger->logUploadStart($imageType, $productId, $orderNumber, strlen($input));
        $logger->logUploadFailure('Invalid base64 image format', 'INVALID_FORMAT', [
            'image_data_start' => substr($imageData, 0, 100),
            'expected_format' => 'data:image/TYPE;base64,...',
        ]);
        $logger->writeLog();
        
        throw new Exception('Invalid base64 image format');
    }
    
    $imageExtension = $matches[1];
    $base64Image = substr($imageData, strpos($imageData, ',') + 1);
    $binaryImage = base64_decode($base64Image, true);
    
    if ($binaryImage === false) {
        $logger = new UploadLogger();
        $logger->logUploadStart($imageType, $productId, $orderNumber, strlen($input));
        $logger->logUploadFailure('Failed to decode base64 image', 'DECODE_FAILED', [
            'base64_length' => strlen($base64Image),
        ]);
        $logger->writeLog();
        
        throw new Exception('Failed to decode base64 image');
    }
    
    // Validate it's actually an image
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $detectedMime = $finfo->buffer($binaryImage);
    
    if (!str_starts_with($detectedMime, 'image/')) {
        $logger = new UploadLogger();
        $logger->logUploadStart($imageType, $productId, $orderNumber, strlen($input));
        $logger->logUploadFailure("Invalid image data. Detected type: $detectedMime", 'INVALID_MIME', [
            'detected_mime' => $detectedMime,
            'expected' => 'image/*',
        ]);
        $logger->writeLog();
        
        throw new Exception("Invalid image data. Detected type: $detectedMime");
    }
    
    // Validate image size (max 10MB)
    $imageSize = strlen($binaryImage);
    if ($imageSize > 10 * 1024 * 1024) {
        $logger = new UploadLogger();
        $logger->logUploadStart($imageType, $productId, $orderNumber, strlen($input));
        $logger->logUploadFailure('Image too large', 'SIZE_EXCEEDED', [
            'image_size_bytes' => $imageSize,
            'image_size_mb' => round($imageSize / 1024 / 1024, 2),
            'max_allowed_mb' => 10,
        ]);
        $logger->writeLog();
        
        throw new Exception('Image too large. Maximum size is 10MB.');
    }
    
    error_log("✓ Image validated: $imageSize bytes, type: $detectedMime");
    
    // Get environment mode
    $mode = getEnvVar('NEXT_PUBLIC_ENV_MODE') ?? 'development';
    $basePath = getEnvVar('NEXT_PUBLIC_BASE_PATH') ?? '';
    $basePath = trim($basePath, '/');
    
    error_log("🖼️  Image Upload - Mode: $mode, BasePath: $basePath");
    
    // ============================================================
    // CRITICAL: Calculate the MAIN site root (crystalkeepsakes.com)
    // ============================================================
    // Script location: /crystalkeepsakes.com/api/ (prod) or /crystalkeepsakes.com/test/api/ (test)
    // We need to get to: /crystalkeepsakes.com/crystal-data/
    
    $scriptDir = str_replace('\\', '/', __DIR__);
    $scriptDir = rtrim($scriptDir, '/');
    
    // Go up from /api/ to site folder
    $siteFolder = dirname($scriptDir);  // e.g., /crystalkeepsakes.com/test or /crystalkeepsakes.com
    
    // If we're in /test/api, go up one more level to main site
    if ($basePath === 'test') {
        $mainSiteRoot = dirname($siteFolder);  // /crystalkeepsakes.com
    } else {
        $mainSiteRoot = $siteFolder;  // Already at /crystalkeepsakes.com
    }
    
    error_log("📁 Script dir: $scriptDir");
    error_log("📁 Site folder: $siteFolder");
    error_log("📁 Main site root: $mainSiteRoot");
    
    // ============================================================
    // Initialize the upload logger with correct path
    // ============================================================
    $logger = new UploadLogger($mainSiteRoot);
    $logger->logUploadStart($imageType, $productId, $orderNumber, strlen($input));
    $logger->logImageValidation($imageDataLength, $imageSize, $detectedMime, $imageExtension);
    
    // ============================================================
    // Set upload directory inside main site: /crystalkeepsakes.com/crystal-data/
    // ============================================================
    if ($mode === 'development' || $mode === 'testing') {
        $uploadDir = $mainSiteRoot . '/crystal-data/orders-test/';
    } else {
        $uploadDir = $mainSiteRoot . '/crystal-data/orders/';
    }
    
    // Create ORDER-BASED subfolder
    if ($orderNumber) {
        $fullUploadDir = $uploadDir . $orderNumber . '/';
    } else {
        // Fallback: use timestamp-based temp folder
        $fullUploadDir = $uploadDir . 'temp-' . date('Ymd-His') . '/';
    }
    
    error_log("📁 Full upload dir: $fullUploadDir");
    
    // Log directory check
    $logger->logDirectoryCheck($fullUploadDir);
    
    // Create directory if doesn't exist
    if (!file_exists($fullUploadDir)) {
        if (!mkdir($fullUploadDir, 0755, true)) {
            error_log("❌ Failed to create directory: $fullUploadDir");
            $logger->logUploadFailure("Failed to create upload directory", 'MKDIR_FAILED', [
                'directory' => $fullUploadDir,
                'parent_exists' => file_exists(dirname($fullUploadDir)),
                'parent_writable' => is_writable(dirname($fullUploadDir)),
            ]);
            $logger->writeLog();
            
            throw new Exception("Failed to create upload directory. Please ensure crystal-data folder exists at site root with write permissions.");
        }
        error_log("✓ Directory created: $fullUploadDir");
        $logger->log('INFO', 'DIRECTORY_CREATED', ['path' => $fullUploadDir]);
    }
    
    // Verify writable
    if (!is_writable($fullUploadDir)) {
        $logger->logUploadFailure("Upload directory not writable", 'NOT_WRITABLE', [
            'directory' => $fullUploadDir,
            'permissions' => substr(sprintf('%o', fileperms($fullUploadDir)), -4),
        ]);
        $logger->writeLog();
        
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
    // URL is ALWAYS relative to domain root: /crystal-data/orders[-test]/...
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
            'siteFolder' => $siteFolder,
            'mainSiteRoot' => $mainSiteRoot,
            'uploadDir' => $uploadDir,
            'fullUploadDir' => $fullUploadDir,
            'filePath' => $filePath,
            'fileExists' => file_exists($filePath),
            'generatedUrl' => $fileUrl
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
