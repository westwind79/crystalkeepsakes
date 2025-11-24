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

try {
    // Check if file was uploaded
    if (!isset($_FILES['image'])) {
        throw new Exception('No image file provided');
    }

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

    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'customer_' . uniqid() . '_' . time() . '.' . $extension;
    
    // Define upload directory
    $uploadDir = __DIR__ . '/../public/uploads/';
    
    // Create directory if it doesn't exist
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    $uploadPath = $uploadDir . $filename;
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
        throw new Exception('Failed to save uploaded file');
    }

    // Return success with file URL
    $fileUrl = '/uploads/' . $filename;
    
    echo json_encode([
        'success' => true,
        'filename' => $filename,
        'url' => $fileUrl,
        'size' => $file['size'],
        'mimeType' => $mimeType
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
