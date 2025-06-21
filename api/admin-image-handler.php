<?php
// api/admin-image-handler.php - Handle product image uploads for admin panel
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Include your existing image storage class
require_once 'image-storage.php';

class AdminImageHandler extends ImageStorage {
    private $productUploadsDir;
    
    public function __construct() {
        parent::__construct();
        
        // Create product uploads directory
        $this->productUploadsDir = dirname(__DIR__) . '/uploads/products/';
        if (!file_exists($this->productUploadsDir)) {
            mkdir($this->productUploadsDir, 0755, true);
        }
    }
    
    /**
     * Handle product image upload
     */
    public function handleUpload() {
        try {
            $action = $_POST['action'] ?? '';
            
            switch ($action) {
                case 'upload_product_image':
                    return $this->uploadProductImage();
                    
                case 'remove_product_image':
                    $data = json_decode(file_get_contents('php://input'), true);
                    return $this->removeProductImage($data);
                    
                default:
                    throw new Exception('Invalid action');
            }
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Upload product image
     */
    private function uploadProductImage() {
        $productId = $_POST['product_id'] ?? '';
        $imageData = $_POST['image_data'] ?? '';
        $originalFilename = $_POST['original_filename'] ?? '';
        
        if (empty($productId) || empty($imageData)) {
            throw new Exception('Missing required parameters');
        }
        
        // Validate base64 image
        if (!$this->isValidBase64Image($imageData)) {
            throw new Exception('Invalid image data');
        }
        
        // Parse image data
        $imageInfo = $this->parseBase64Image($imageData);
        $imageBytes = base64_decode($imageInfo['data']);
        
        // Check file size (5MB max)
        if (strlen($imageBytes) > 5 * 1024 * 1024) {
            throw new Exception('Image file too large (max 5MB)');
        }
        
        // Create product directory
        $productDir = $this->productUploadsDir . $productId . '/';
        if (!file_exists($productDir)) {
            mkdir($productDir, 0755, true);
        }
        
        // Remove existing images for this product
        $this->removeExistingImages($productId);
        
        // Generate filename
        $extension = $this->getExtensionFromMimeType($imageInfo['mime']);
        $filename = 'product_' . $productId . '_' . time() . '.' . $extension;
        $filePath = $productDir . $filename;
        
        // Save file
        if (file_put_contents($filePath, $imageBytes) === false) {
            throw new Exception('Failed to save image file');
        }
        
        // Generate web-accessible URL
        $webUrl = '/uploads/products/' . $productId . '/' . $filename;
        
        // Save to database (optional - for tracking)
        $this->saveProductImageToDatabase($productId, $filename, $imageInfo['mime'], strlen($imageBytes));
        
        return [
            'success' => true,
            'data' => [
                'url' => $webUrl,
                'filename' => $filename,
                'size' => strlen($imageBytes),
                'mime_type' => $imageInfo['mime']
            ]
        ];
    }
    
    /**
     * Remove product image
     */
    private function removeProductImage($data) {
        $productId = $data['product_id'] ?? '';
        
        if (empty($productId)) {
            throw new Exception('Missing product ID');
        }
        
        // Remove files
        $this->removeExistingImages($productId);
        
        // Remove from database
        $this->removeProductImageFromDatabase($productId);
        
        return [
            'success' => true,
            'message' => 'Image removed successfully'
        ];
    }
    
    /**
     * Remove existing images for a product
     */
    private function removeExistingImages($productId) {
        $productDir = $this->productUploadsDir . $productId . '/';
        
        if (is_dir($productDir)) {
            $files = glob($productDir . '*');
            foreach ($files as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
            
            // Remove directory if empty
            if (count(glob($productDir . '*')) === 0) {
                rmdir($productDir);
            }
        }
    }
    
    /**
     * Save product image metadata to database (create table if needed)
     */
    private function saveProductImageToDatabase($productId, $filename, $mimeType, $fileSize) {
        try {
            // Create database connection (adjust credentials as needed)
            $pdo = new PDO(
                "mysql:host=localhost;dbname=crystalkeepsakes", 
                "root", 
                "",
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
            
            // Create table if it doesn't exist
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS product_images (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    product_id VARCHAR(50) NOT NULL,
                    filename VARCHAR(255) NOT NULL,
                    mime_type VARCHAR(100) NOT NULL,
                    file_size INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_product (product_id)
                )
            ");
            
            // Insert or update image record
            $stmt = $pdo->prepare("
                INSERT INTO product_images (product_id, filename, mime_type, file_size) 
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                filename = VALUES(filename),
                mime_type = VALUES(mime_type),
                file_size = VALUES(file_size),
                created_at = CURRENT_TIMESTAMP
            ");
            
            $stmt->execute([$productId, $filename, $mimeType, $fileSize]);
            
        } catch (PDOException $e) {
            // Log error but don't fail the upload
            error_log("Database error in saveProductImageToDatabase: " . $e->getMessage());
        }
    }
    
    /**
     * Remove product image from database
     */
    private function removeProductImageFromDatabase($productId) {
        try {
            $pdo = new PDO(
                "mysql:host=localhost;dbname=crystalkeepsakes", 
                "root", 
                "",
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
            
            $stmt = $pdo->prepare("DELETE FROM product_images WHERE product_id = ?");
            $stmt->execute([$productId]);
            
        } catch (PDOException $e) {
            error_log("Database error in removeProductImageFromDatabase: " . $e->getMessage());
        }
    }
    
    /**
     * Get product image URL
     */
    public function getProductImageUrl($productId) {
        try {
            $pdo = new PDO(
                "mysql:host=localhost;dbname=crystalkeepsakes", 
                "root", 
                "",
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
            
            $stmt = $pdo->prepare("SELECT filename FROM product_images WHERE product_id = ?");
            $stmt->execute([$productId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                return '/uploads/products/' . $productId . '/' . $result['filename'];
            }
            
        } catch (PDOException $e) {
            error_log("Database error in getProductImageUrl: " . $e->getMessage());
        }
        
        return null;
    }
    
    // Helper methods (inherited from parent ImageStorage class)
    private function isValidBase64Image($base64) {
        return preg_match('/^data:image\/(jpeg|jpg|png|gif);base64,/', $base64);
    }
    
    private function parseBase64Image($base64) {
        preg_match('/^data:image\/([a-zA-Z]+);base64,(.+)$/', $base64, $matches);
        return [
            'mime' => 'image/' . $matches[1],
            'data' => $matches[2]
        ];
    }
    
    private function getExtensionFromMimeType($mimeType) {
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif'
        ];
        return $extensions[$mimeType] ?? 'jpg';
    }
}

// Handle the request
$handler = new AdminImageHandler();
$result = $handler->handleUpload();

echo json_encode($result);
?>