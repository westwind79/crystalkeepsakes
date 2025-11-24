<?php
// api/upload-image.php
// Handles customer image uploads for product customization

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
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

/**
 * Compress and resize image for web optimization
 * Creates a high-quality web-ready version
 * 
 * @param string $filepath Path to the uploaded image
 * @param string $mimeType MIME type of the image
 * @return bool Success status
 */
function compressAndResizeImage($filepath, $mimeType) {
    // Load image based on type
    switch ($mimeType) {
        case 'image/jpeg':
        case 'image/jpg':
            $image = @imagecreatefromjpeg($filepath);
            break;
        case 'image/png':
            $image = @imagecreatefrompng($filepath);
            break;
        case 'image/gif':
            $image = @imagecreatefromgif($filepath);
            break;
        case 'image/webp':
            $image = @imagecreatefromwebp($filepath);
            break;
        default:
            return false;
    }
    
    if (!$image) {
        return false;
    }
    
    $originalWidth = imagesx($image);
    $originalHeight = imagesy($image);
    
    // Calculate new dimensions - maintain aspect ratio
    // Max width: 1920px (good for product images)
    $maxWidth = 1920;
    $maxHeight = 1920;
    
    $ratio = min($maxWidth / $originalWidth, $maxHeight / $originalHeight);
    
    // Only resize if image is larger than max dimensions
    if ($ratio < 1) {
        $newWidth = (int)($originalWidth * $ratio);
        $newHeight = (int)($originalHeight * $ratio);
        
        // Create new image with better quality
        $resized = imagecreatetruecolor($newWidth, $newHeight);
        
        // Preserve transparency for PNG/GIF
        if ($mimeType === 'image/png' || $mimeType === 'image/gif') {
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            $transparent = imagecolorallocatealpha($resized, 255, 255, 255, 127);
            imagefilledrectangle($resized, 0, 0, $newWidth, $newHeight, $transparent);
        }
        
        // High-quality resampling
        imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $originalWidth, $originalHeight);
        imagedestroy($image);
        $image = $resized;
    }
    
    // Save compressed image back to same file
    $success = false;
    switch ($mimeType) {
        case 'image/jpeg':
        case 'image/jpg':
            // JPEG: Quality 85 (good balance of quality vs size)
            $success = imagejpeg($image, $filepath, 85);
            break;
        case 'image/png':
            // PNG: Compression level 6 (0-9, 6 is good balance)
            $success = imagepng($image, $filepath, 6);
            break;
        case 'image/gif':
            $success = imagegif($image, $filepath);
            break;
        case 'image/webp':
            // WebP: Quality 85
            $success = imagewebp($image, $filepath, 85);
            break;
    }
    
    imagedestroy($image);
    return $success;
}

try {
    // Check if file was uploaded
    if (!isset($_FILES['image'])) {
        throw new Exception('No image file provided');
    }

    // Get productId from form data
    if (!isset($_POST['productId'])) {
        throw new Exception('Product ID not provided');
    }
    
    $productId = $_POST['productId'];
    $file = $_FILES['image'];
    
    // Validate file
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Upload failed with error code: ' . $file['error']);
    }

    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $allowedTypes)) {
        throw new Exception('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.');
    }

    // Validate file size (max 10MB - we'll compress it)
    $maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if ($file['size'] > $maxSize) {
        throw new Exception('File too large. Maximum size is 10MB.');
    }

    // Generate unique filename with product ID
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $timestamp = round(microtime(true) * 1000); // Milliseconds timestamp
    $filename = 'product_' . $productId . '_' . $timestamp . '.' . $extension;
    
    // Define upload directory - product-specific folder
    $uploadDir = __DIR__ . '/../public/img/products/cockpit3d/' . $productId . '/';
    
    // Create directory if it doesn't exist
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    $uploadPath = $uploadDir . $filename;
    
    // Move uploaded file temporarily
    if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
        throw new Exception('Failed to save uploaded file');
    }

    // ✅ COMPRESS & OPTIMIZE IMAGE FOR WEB
    // Create optimized versions at different sizes
    $optimized = compressAndResizeImage($uploadPath, $mimeType);
    
    if (!$optimized) {
        // If compression fails, keep original
        error_log("Warning: Image compression failed for $filename");
    }

    // Return success with file URL
    $fileUrl = '/img/products/cockpit3d/' . $productId . '/' . $filename;
    
    echo json_encode([
        'success' => true,
        'filename' => $filename,
        'url' => $fileUrl,
        'size' => filesize($uploadPath),  // Return actual compressed size
        'originalSize' => $file['size'],
        'mimeType' => $mimeType,
        'compressed' => $optimized,
        'productId' => $productId
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
