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
    
    // Parse base64 image
    if (!preg_match('/^data:image\/(\w+);base64,/', $imageData, $matches)) {
        throw new Exception('Invalid base64 image format');
    }
    
    $imageExtension = $matches[1];
    $base64Image = substr($imageData, strpos($imageData, ',') + 1);
    $binaryImage = base64_decode($base64Image);
    
    if ($binaryImage === false) {
        throw new Exception('Failed to decode base64 image');
    }
    
    // Validate image size (max 10MB for customer uploads)
    $imageSize = strlen($binaryImage);
    $maxSize = 10 * 1024 * 1024; // 10MB
    if ($imageSize > $maxSize) {
        throw new Exception('Image too large. Maximum size is 10MB.');
    }
    
    // Determine upload directory based on environment
    $mode = getEnvVar('NEXT_PUBLIC_ENV_MODE') ?? 'development';
    $projectRoot = dirname(__DIR__);
    
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
            // Local dev: Use public/img/customer-uploads (web-accessible)
            $uploadDir = $projectRoot . '/public/img/customer-uploads/';
        } else {
            // Production: Use crystal-data outside public_html
            $uploadDir = '/home/uydbo2r007mb/crystal-data/order-images/';
        }
        error_log("Using default path for $mode: $uploadDir");
    }
    
    // Ensure directory has trailing slash
    $uploadDir = rtrim($uploadDir, '/') . '/';
    
    // Create directory if doesn't exist
    if (!file_exists($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            throw new Exception("Failed to create upload directory: $uploadDir");
        }
    }
    
    // Verify writable
    if (!is_writable($uploadDir)) {
        throw new Exception("Upload directory not writable: $uploadDir");
    }
    
    // Generate unique filename
    $timestamp = round(microtime(true) * 1000);
    $uniqueId = uniqid();
    $filename = "customer_{$productId}_{$imageType}_{$timestamp}_{$uniqueId}.{$imageExtension}";
    $filePath = $uploadDir . $filename;
    
    // Save file
    if (file_put_contents($filePath, $binaryImage) === false) {
        throw new Exception('Failed to save image file');
    }
    
    // Set proper permissions (readable by web server)
    chmod($filePath, 0644);
    
    // Generate web-accessible URL
    $fileUrl = $webPath . $filename;
    
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
