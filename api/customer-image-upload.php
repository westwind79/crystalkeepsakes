<?php
/**
 * Customer Image Upload API
 * Handles customer-uploaded images for product customization
 * Works in both development (local) and production environments
 * 
 * These are TEMPORARY images for cart items, NOT product gallery images
 * They persist until order completion or cleanup (7 days)
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

// Load environment loader
require_once __DIR__ . '/env-loader.php';

try {
    // Get JSON payload (images are sent as base64)
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['imageData'])) {
        throw new Exception('No image data provided');
    }
    
    $imageData = $data['imageData'];
    $productId = $data['productId'] ?? 'unknown';
    $imageType = $data['imageType'] ?? 'masked'; // 'masked' or 'raw'
    
    // Debug: Log image data info
    error_log("📥 Received image data - Type: $imageType, Product: $productId");
    error_log("📏 Data length: " . strlen($imageData) . " chars");
    error_log("🔍 Data starts with: " . substr($imageData, 0, 50) . "...");
    
    // Parse base64 image
    if (!preg_match('/^data:image\/(\w+);base64,/', $imageData, $matches)) {
        error_log("❌ Invalid format. Expected: data:image/TYPE;base64,...");
        throw new Exception('Invalid base64 image format');
    }
    
    $imageExtension = $matches[1];
    error_log("📸 Image type detected: $imageExtension");
    
    $base64Image = substr($imageData, strpos($imageData, ',') + 1);
    error_log("📏 Base64 string length: " . strlen($base64Image) . " chars");
    
    $binaryImage = base64_decode($base64Image, true); // Strict mode
    
    if ($binaryImage === false) {
        error_log("❌ Base64 decode failed!");
        throw new Exception('Failed to decode base64 image');
    }
    
    error_log("✓ Decoded to binary: " . strlen($binaryImage) . " bytes");
    
    // Validate it's actually an image by checking magic bytes
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $detectedMime = $finfo->buffer($binaryImage);
    error_log("🔍 Detected MIME type: $detectedMime");
    
    if (!str_starts_with($detectedMime, 'image/')) {
        error_log("❌ Not a valid image! MIME: $detectedMime");
        throw new Exception("Invalid image data. Detected type: $detectedMime");
    }
    
    // Validate image size (max 10MB for customer uploads)
    $imageSize = strlen($binaryImage);
    $maxSize = 10 * 1024 * 1024; // 10MB
    if ($imageSize > $maxSize) {
        throw new Exception('Image too large. Maximum size is 10MB.');
    }
    
    error_log("✓ Image validated: $imageSize bytes, type: $detectedMime");
    
    // Determine upload directory based on environment
    $mode = getEnvVar('NEXT_PUBLIC_ENV_MODE') ?? 'development';
    $projectRoot = dirname(__DIR__);
    $backendUrl = getEnvVar('NEXT_PUBLIC_PHP_BACKEND_URL') ?? 'http://localhost:8888/crystalkeepsakes';
    
    error_log("🖼️  Image Upload - Mode: $mode");
    
    // Get custom image path from environment or use defaults
    $customPath = getEnvVar('CUSTOMER_IMAGE_PATH');
    
    if ($customPath) {
        // Use path from .env
        $uploadDir = $customPath;
        error_log("Using CUSTOMER_IMAGE_PATH from .env: $uploadDir");
    } else {
        // Fallback: Detect based on mode
        if ($mode === 'development') {
            // Local dev: Use crystal-data outside project
            $uploadDir = dirname($projectRoot) . '/crystal-data/order-images-test/';
        } else {
            // Production: Use crystal-data outside public_html
            $uploadDir = '/home/uydbo2r007mb/crystal-data/order-images/';
        }
        error_log("Using default path for $mode: $uploadDir");
    }
    
    // Ensure directory has trailing slash
    $uploadDir = rtrim($uploadDir, '/') . '/';
    
    // Create subfolder structure: YYYY-MM/DD/
    $datePath = date('Y-m') . '/' . date('d') . '/';
    $fullUploadDir = $uploadDir . $datePath;
    
    error_log("Creating date-based subfolder: $fullUploadDir");
    
    // Create directory if doesn't exist
    if (!file_exists($fullUploadDir)) {
        error_log("Creating directory: $fullUploadDir");
        if (!mkdir($fullUploadDir, 0755, true)) {
            throw new Exception("Failed to create upload directory: $fullUploadDir");
        }
        error_log("✓ Directory created successfully");
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
    
    error_log("Saving image to: $filePath");
    
    // Save file
    if (file_put_contents($filePath, $binaryImage) === false) {
        throw new Exception('Failed to save image file');
    }
    
    // Set proper permissions (readable by web server)
    chmod($filePath, 0644);
    
    error_log("✓ Image saved successfully: " . filesize($filePath) . " bytes");
    
    // Generate web-accessible URL
    // Figure out the path relative to MAMP htdocs
    $htdocsPath = $_SERVER['DOCUMENT_ROOT']; // e.g., C:/MAMP/htdocs
    error_log("Document root: $htdocsPath");
    
    // Get path relative to htdocs
    $relativePath = str_replace($htdocsPath, '', $uploadDir);
    $relativePath = str_replace('\\', '/', $relativePath); // Windows to Unix paths
    $relativePath = ltrim($relativePath, '/');
    
    error_log("Relative path from htdocs: $relativePath");
    
    if ($mode === 'development') {
        // Local: MAMP serves from htdocs root on port 8888
        // URL: http://localhost:8888/crystal-data/order-images-test/file.jpg
        $fileUrl = 'http://localhost:8888/' . $relativePath . $filename;
    } else {
        // Production: Relative path (same domain)
        $fileUrl = '/' . $relativePath . $filename;
    }
    
    error_log("✅ Final image URL: $fileUrl");
    
    // Return success with file info
    echo json_encode([
        'success' => true,
        'filename' => $filename,
        'url' => $fileUrl,
        'size' => $imageSize,
        'type' => $imageType,
        'environment' => $isDev ? 'development' : 'production',
        'debug' => [
            'uploadDir' => $uploadDir,
            'filePath' => $filePath,
            'fileExists' => file_exists($filePath),
            'fileSize' => filesize($filePath),
            'isReadable' => is_readable($filePath)
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
