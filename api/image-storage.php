<?php
// api/image-storage.php - Image handling utilities

class ImageStorage {
    private $uploadDir;
    private $maxFileSize = 5 * 1024 * 1024; // 5MB
    
    public function __construct() {
        // Create uploads directory structure
        $this->uploadDir = dirname(__DIR__) . '/uploads/orders/';
        if (!file_exists($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }
    }
    
    /**
     * Save base64 image data as file
     * @param string $base64Data - Base64 image data
     * @param string $orderNumber - Order number for organization
     * @param string $cartItemId - Cart item ID
     * @param string $imageType - 'raw', 'preview', or 'masked'
     * @return array - Result with file path and metadata
     */
    public function saveImageFromBase64($base64Data, $orderNumber, $cartItemId, $imageType) {
        if (empty($base64Data) || !$this->isValidBase64Image($base64Data)) {
            throw new Exception('Invalid base64 image data');
        }
        
        // Extract image data and type
        $imageInfo = $this->parseBase64Image($base64Data);
        $imageData = base64_decode($imageInfo['data']);
        
        // Check file size
        if (strlen($imageData) > $this->maxFileSize) {
            throw new Exception('Image file too large');
        }
        
        // Create order-specific directory
        $orderDir = $this->uploadDir . $orderNumber . '/';
        if (!file_exists($orderDir)) {
            mkdir($orderDir, 0755, true);
        }
        
        // Generate unique filename
        $extension = $this->getExtensionFromMimeType($imageInfo['mime']);
        $filename = $cartItemId . '_' . $imageType . '_' . time() . '.' . $extension;
        $filePath = $orderDir . $filename;
        
        // Save file
        if (file_put_contents($filePath, $imageData) === false) {
            throw new Exception('Failed to save image file');
        }
        
        // Return file info
        return [
            'file_path' => 'uploads/orders/' . $orderNumber . '/' . $filename,
            'full_path' => $filePath,
            'filename' => $filename,
            'size' => strlen($imageData),
            'mime_type' => $imageInfo['mime'],
            'url' => $this->getImageUrl($orderNumber, $filename)
        ];
    }
    
    /**
     * Save image metadata to database
     */
    public function saveImageToDatabase($pdo, $orderNumber, $cartItemId, $imageType, $fileInfo) {
        $stmt = $pdo->prepare("
            INSERT INTO order_images (
                order_id, cart_item_id, image_type, file_path, 
                original_filename, file_size, mime_type, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        return $stmt->execute([
            $orderNumber,
            $cartItemId,
            $imageType,
            $fileInfo['file_path'],
            $fileInfo['filename'],
            $fileInfo['size'],
            $fileInfo['mime_type']
        ]);
    }
    
    /**
     * Get all images for an order
     */
    public function getOrderImages($pdo, $orderNumber) {
        $stmt = $pdo->prepare("
            SELECT * FROM order_images 
            WHERE order_id = ? 
            ORDER BY cart_item_id, image_type
        ");
        $stmt->execute([$orderNumber]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Generate public URL for image
     */
    public function getImageUrl($orderNumber, $filename) {
        $baseUrl = $_SERVER['HTTP_HOST'] ?? 'crystalkeepsakes.com';
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
        return $protocol . $baseUrl . '/uploads/orders/' . $orderNumber . '/' . $filename;
    }
    
    /**
     * Create email-friendly image attachments (compressed)
     */
    public function createEmailAttachments($pdo, $orderNumber, $maxSizeKB = 500) {
        $images = $this->getOrderImages($pdo, $orderNumber);
        $attachments = [];
        
        foreach ($images as $image) {
            $filePath = dirname(__DIR__) . '/' . $image['file_path'];
            
            if (file_exists($filePath)) {
                // If image is small enough, include as attachment
                if ($image['file_size'] <= ($maxSizeKB * 1024)) {
                    $attachments[] = [
                        'path' => $filePath,
                        'name' => $image['cart_item_id'] . '_' . $image['image_type'] . '.jpg',
                        'type' => $image['mime_type']
                    ];
                } else {
                    // For large images, just include the URL
                    $attachments[] = [
                        'url' => $this->getImageUrl($orderNumber, basename($image['file_path'])),
                        'name' => $image['cart_item_id'] . '_' . $image['image_type'],
                        'type' => 'link'
                    ];
                }
            }
        }
        
        return $attachments;
    }
    
    // Helper methods
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
?>