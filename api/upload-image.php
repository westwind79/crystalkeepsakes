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
    // Check if GD library is available
    if (!extension_loaded('gd')) {
        error_log('GD library not available - skipping compression');
        return false;
    }
    
    // Verify file exists and is readable
    if (!file_exists($filepath) || !is_readable($filepath)) {
        error_log("File not readable: $filepath");
        return false;
    }
    
    // Load image based on type
    $image = false;
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
            if (function_exists('imagecreatefromwebp')) {
                $image = @imagecreatefromwebp($filepath);
            }
            break;
        default:
            error_log("Unsupported mime type: $mimeType");
            return false;
    }
    
    if (!$image) {
        error_log("Failed to create image from file: $filepath (mime: $mimeType)");
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
    // Use relative path from api directory
    $uploadDir = __DIR__ . '/../public/img/products/cockpit3d/' . $productId . '/';
    
    // Create directory if it doesn't exist
    if (!file_exists($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            throw new Exception("Failed to create upload directory: $uploadDir (Check write permissions)");
        }
    }
    
    // Verify directory is writable
    if (!is_writable($uploadDir)) {
        throw new Exception("Upload directory is not writable: $uploadDir");
    }
    
    $uploadPath = $uploadDir . $filename;
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
        throw new Exception('Failed to save uploaded file');
    }

    // ✅ FIX PERMISSIONS: Make file readable by everyone (Next.js needs to read it)
    // This is CRITICAL for Next.js dev server to serve the image
    chmod($uploadPath, 0644); // rw-r--r-- (owner can write, everyone can read)
    
    // Also ensure directory is accessible
    chmod($uploadDir, 0755); // rwxr-xr-x (owner can write, everyone can read/execute)

    // Verify file was saved correctly
    if (!file_exists($uploadPath) || filesize($uploadPath) === 0) {
        throw new Exception('File was not saved correctly');
    }

    $originalSize = filesize($uploadPath);
    
    // ⚠️ COMPRESSION DISABLED FOR DEBUGGING
    // Enable this after verifying upload works without compression
    $optimized = false;
    $compressionError = 'Disabled for debugging';
    
    /* COMPRESSION CODE - UNCOMMENT TO ENABLE
    try {
        $optimized = compressAndResizeImage($uploadPath, $mimeType);
        
        // Verify compression didn't corrupt the file
        if ($optimized && file_exists($uploadPath) && filesize($uploadPath) > 0) {
            $optimized = true;
        } else {
            // Compression failed - restore original or re-upload
            if (filesize($uploadPath) === 0) {
                throw new Exception('Compression corrupted the file');
            }
        }
    } catch (Exception $e) {
        $compressionError = $e->getMessage();
        error_log("Image compression failed for $filename: " . $compressionError);
        // Keep original file
        $optimized = false;
    }
    */

    // Return success with file URL
    // Return RELATIVE path (frontend will add backend URL with assetPath)
    $fileUrl = '/img/products/cockpit3d/' . $productId . '/' . $filename;
    $finalSize = filesize($uploadPath);
    
    // ✅ PHP ENVIRONMENT INFO FOR DEBUGGING
    $phpInfo = [
        'version' => phpversion(),
        'gdAvailable' => extension_loaded('gd'),
        'gdVersion' => extension_loaded('gd') ? gd_info()['GD Version'] : 'N/A',
        'maxUploadSize' => ini_get('upload_max_filesize'),
        'maxPostSize' => ini_get('post_max_size'),
        'memoryLimit' => ini_get('memory_limit'),
        'tempDir' => sys_get_temp_dir(),
        'loadedExtensions' => implode(', ', array_filter(get_loaded_extensions(), function($ext) {
            return in_array(strtolower($ext), ['gd', 'imagick', 'fileinfo', 'mbstring']);
        }))
    ];
    
    echo json_encode([
        'success' => true,
        'filename' => $filename,
        'url' => $fileUrl,
        'size' => $finalSize,
        'originalSize' => $originalSize,
        'mimeType' => $mimeType,
        'compressed' => $optimized,
        'compressionError' => $compressionError,
        'productId' => $productId,
        'phpInfo' => $phpInfo,
        'debug' => [
            'projectRoot' => dirname(__DIR__),
            'uploadDir' => $uploadDir,
            'uploadPath' => $uploadPath,
            'fileExists' => file_exists($uploadPath),
            'fileSize' => $finalSize,
            'isReadable' => is_readable($uploadPath),
            'isDirWritable' => is_writable($uploadDir),
            'filePermissions' => substr(sprintf('%o', fileperms($uploadPath)), -4), // e.g., "0644"
            'dirPermissions' => substr(sprintf('%o', fileperms($uploadDir)), -4), // e.g., "0755"
            'fileOwner' => function_exists('posix_getpwuid') ? posix_getpwuid(fileowner($uploadPath))['name'] : 'N/A',
            'processUser' => function_exists('posix_getpwuid') ? posix_getpwuid(posix_geteuid())['name'] : 'N/A'
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
