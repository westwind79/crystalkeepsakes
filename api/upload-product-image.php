<?php
// api/upload-product-image.php - Product image upload endpoint

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/product_image_errors.log');

// Handle CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

class ProductImageUploader {
    private $uploadDir;
    private $maxFileSize = 5 * 1024 * 1024; // 5MB
    private $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    public function __construct() {
        // Create uploads directory structure for products
        $this->uploadDir = dirname(__DIR__) . '/uploads/products/';
        if (!file_exists($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }
    }
    
    /**
     * Upload and process product image
     */
    public function uploadProductImage($file, $productId, $imageIndex = null) {
        try {
            // Validate file
            $this->validateFile($file);
            
            // Create product-specific directory
            $productDir = $this->uploadDir . $productId . '/';
            if (!file_exists($productDir)) {
                mkdir($productDir, 0755, true);
            }
            
            // Generate filename
            $filename = $this->generateFilename($file, $productId, $imageIndex);
            $filePath = $productDir . $filename;
            
            // Process and save image
            $this->processAndSaveImage($file['tmp_name'], $filePath, $file['type']);
            
            // Return success response
            return [
                'success' => true,
                'imagePath' => '/uploads/products/' . $productId . '/' . $filename,
                'filename' => $filename,
                'size' => filesize($filePath),
                'url' => $this->getImageUrl($productId, $filename)
            ];
            
        } catch (Exception $e) {
            error_log('Product image upload error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Validate uploaded file
     */
    private function validateFile($file) {
        if (!isset($file['tmp_name']) || empty($file['tmp_name'])) {
            throw new Exception('No file uploaded');
        }
        
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('Upload error: ' . $this->getUploadErrorMessage($file['error']));
        }
        
        if ($file['size'] > $this->maxFileSize) {
            throw new Exception('File too large. Maximum size: ' . ($this->maxFileSize / 1024 / 1024) . 'MB');
        }
        
        if (!in_array($file['type'], $this->allowedTypes)) {
            throw new Exception('Invalid file type. Allowed: JPG, PNG, WebP');
        }
        
        // Verify it's actually an image
        $imageInfo = getimagesize($file['tmp_name']);
        if ($imageInfo === false) {
            throw new Exception('Invalid image file');
        }
    }
    
    /**
     * Generate unique filename
     */
    private function generateFilename($file, $productId, $imageIndex) {
        $extension = $this->getExtensionFromMimeType($file['type']);
        $baseName = pathinfo($file['name'], PATHINFO_FILENAME);
        $baseName = preg_replace('/[^a-zA-Z0-9\-_]/', '_', $baseName);
        
        // Include index if provided
        $indexSuffix = $imageIndex !== null ? '_' . $imageIndex : '';
        
        // Create unique filename
        $filename = $productId . '_' . $baseName . $indexSuffix . '_' . time() . '.' . $extension;
        
        return $filename;
    }
    
    /**
     * Process and save image with optimization
     */
    private function processAndSaveImage($tmpPath, $outputPath, $mimeType) {
        // Load image based on type
        switch ($mimeType) {
            case 'image/jpeg':
            case 'image/jpg':
                $image = imagecreatefromjpeg($tmpPath);
                break;
            case 'image/png':
                $image = imagecreatefrompng($tmpPath);
                break;
            case 'image/webp':
                $image = imagecreatefromwebp($tmpPath);
                break;
            default:
                throw new Exception('Unsupported image type');
        }
        
        if ($image === false) {
            throw new Exception('Failed to process image');
        }
        
        // Get current dimensions
        $width = imagesx($image);
        $height = imagesy($image);
        
        // Resize if too large (max 1200px width)
        $maxWidth = 1200;
        if ($width > $maxWidth) {
            $newWidth = $maxWidth;
            $newHeight = ($height * $maxWidth) / $width;
            
            $resizedImage = imagecreatetruecolor($newWidth, $newHeight);
            
            // Preserve transparency for PNG
            if ($mimeType === 'image/png') {
                imagealphablending($resizedImage, false);
                imagesavealpha($resizedImage, true);
            }
            
            imagecopyresampled($resizedImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            imagedestroy($image);
            $image = $resizedImage;
        }
        
        // Save optimized image
        $success = false;
        switch ($mimeType) {
            case 'image/jpeg':
            case 'image/jpg':
                $success = imagejpeg($image, $outputPath, 85); // 85% quality
                break;
            case 'image/png':
                $success = imagepng($image, $outputPath, 6); // Compression level 6
                break;
            case 'image/webp':
                $success = imagewebp($image, $outputPath, 85); // 85% quality
                break;
        }
        
        imagedestroy($image);
        
        if (!$success) {
            throw new Exception('Failed to save processed image');
        }
    }
    
    /**
     * Generate public URL for image
     */
    private function getImageUrl($productId, $filename) {
        $baseUrl = $_SERVER['HTTP_HOST'] ?? 'crystalkeepsakes.com';
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
        return $protocol . $baseUrl . '/uploads/products/' . $productId . '/' . $filename;
    }
    
    /**
     * Get file extension from MIME type
     */
    private function getExtensionFromMimeType($mimeType) {
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/jpg' => 'jpg', 
            'image/png' => 'png',
            'image/webp' => 'webp'
        ];
        return $extensions[$mimeType] ?? 'jpg';
    }
    
    /**
     * Get upload error message
     */
    private function getUploadErrorMessage($error) {
        $messages = [
            UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'Upload stopped by extension'
        ];
        return $messages[$error] ?? 'Unknown upload error';
    }
}

try {
    // Validate required parameters
    if (!isset($_POST['productId']) || empty($_POST['productId'])) {
        throw new Exception('Product ID is required');
    }
    
    if (!isset($_FILES['image']) || empty($_FILES['image'])) {
        throw new Exception('No image file provided');
    }
    
    $productId = $_POST['productId'];
    $imageIndex = $_POST['imageIndex'] ?? null;
    $file = $_FILES['image'];
    
    // Process upload
    $uploader = new ProductImageUploader();
    $result = $uploader->uploadProductImage($file, $productId, $imageIndex);
    
    // Return result
    echo json_encode($result);
    
} catch (Exception $e) {
    error_log('Product image upload endpoint error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>