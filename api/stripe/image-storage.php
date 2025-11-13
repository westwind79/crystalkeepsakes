<?php
/**
 * Image Storage Handler
 * @version 1.0.0
 * @date 2025-11-07
 * @description Manages customer uploaded images for orders
 */

class ImageStorage {
    private $uploadDir;
    private $maxFileSize;
    
    public function __construct($uploadDir = null, $maxFileSizeMB = 5) {
        $this->uploadDir = $uploadDir ?? dirname(__DIR__) . '/uploads/order-images';
        $this->maxFileSize = $maxFileSizeMB * 1024 * 1024; // Convert to bytes
        
        // Create directory if it doesn't exist
        if (!file_exists($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }
    }
    
    /**
     * Save base64 image to file system
     * @param string $base64Data Base64 encoded image
     * @param string $orderNumber Order number
     * @param string $cartItemId Cart item ID
     * @param string $imageType Type (raw, preview, masked)
     * @return array File info
     */
    public function saveImageFromBase64($base64Data, $orderNumber, $cartItemId, $imageType) {
        // Parse base64 data
        if (!preg_match('/^data:image\/(\w+);base64,/', $base64Data, $matches)) {
            throw new Exception('Invalid base64 image format');
        }
        
        $extension = $matches[1];
        $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
        $imageData = base64_decode($base64Data);
        
        if ($imageData === false) {
            throw new Exception('Failed to decode base64 image');
        }
        
        // Check file size
        if (strlen($imageData) > $this->maxFileSize) {
            throw new Exception('Image exceeds maximum file size');
        }
        
        // Create order subdirectory
        $orderDir = $this->uploadDir . '/' . $orderNumber;
        if (!file_exists($orderDir)) {
            mkdir($orderDir, 0755, true);
        }
        
        // Generate filename
        $filename = "{$cartItemId}_{$imageType}." . $extension;
        $filepath = $orderDir . '/' . $filename;
        
        // Save file
        if (file_put_contents($filepath, $imageData) === false) {
            throw new Exception('Failed to save image file');
        }
        
        return [
            'filename' => $filename,
            'filepath' => $filepath,
            'size' => strlen($imageData),
            'extension' => $extension,
            'type' => $imageType
        ];
    }
    
    /**
     * Save image metadata to database
     * @param PDO $pdo Database connection
     * @param string $orderNumber Order number
     * @param string $cartItemId Cart item ID
     * @param string $imageType Image type
     * @param array $fileInfo File information
     * @return bool Success
     */
    public function saveImageToDatabase($pdo, $orderNumber, $cartItemId, $imageType, $fileInfo) {
        $stmt = $pdo->prepare("
            INSERT INTO order_images (
                order_id, cart_item_id, image_type,
                filename, filepath, file_size, file_extension,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        return $stmt->execute([
            $orderNumber,
            $cartItemId,
            $imageType,
            $fileInfo['filename'],
            $fileInfo['filepath'],
            $fileInfo['size'],
            $fileInfo['extension']
        ]);
    }
    
    /**
     * Get images for an order
     * @param PDO $pdo Database connection
     * @param string $orderNumber Order number
     * @return array Images
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
     * Create email attachments array
     * @param PDO $pdo Database connection
     * @param string $orderNumber Order number
     * @param int $maxSizeKB Max size per file in KB (default 500KB)
     * @return array Attachments
     */
    public function createEmailAttachments($pdo, $orderNumber, $maxSizeKB = 500) {
        $images = $this->getOrderImages($pdo, $orderNumber);
        $attachments = [];
        $maxBytes = $maxSizeKB * 1024;
        
        foreach ($images as $image) {
            $filepath = $image['filepath'];
            
            if (!file_exists($filepath)) {
                continue;
            }
            
            $filesize = filesize($filepath);
            $attachment = [
                'name' => $image['filename'],
                'path' => $filepath,
                'size' => $filesize
            ];
            
            // If file is too large, provide download link instead
            if ($filesize > $maxBytes) {
                $attachment['type'] = 'link';
                $attachment['url'] = $this->getImageUrl($orderNumber, $image['filename']);
            } else {
                // Determine MIME type
                $extension = strtolower($image['file_extension']);
                $mimeTypes = [
                    'jpg' => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'png' => 'image/png',
                    'gif' => 'image/gif',
                    'webp' => 'image/webp'
                ];
                
                $attachment['type'] = $mimeTypes[$extension] ?? 'application/octet-stream';
            }
            
            $attachments[] = $attachment;
        }
        
        return $attachments;
    }
    
    /**
     * Get public URL for an image
     * @param string $orderNumber Order number
     * @param string $filename Filename
     * @return string URL
     */
    private function getImageUrl($orderNumber, $filename) {
        $baseUrl = 'https://crystalkeepsakes.com/uploads/order-images';
        return "$baseUrl/$orderNumber/$filename";
    }
    
    /**
     * Delete order images
     * @param PDO $pdo Database connection
     * @param string $orderNumber Order number
     * @return bool Success
     */
    public function deleteOrderImages($pdo, $orderNumber) {
        // Get images
        $images = $this->getOrderImages($pdo, $orderNumber);
        
        // Delete files
        foreach ($images as $image) {
            if (file_exists($image['filepath'])) {
                unlink($image['filepath']);
            }
        }
        
        // Delete directory if empty
        $orderDir = $this->uploadDir . '/' . $orderNumber;
        if (file_exists($orderDir) && count(scandir($orderDir)) == 2) {
            rmdir($orderDir);
        }
        
        // Delete from database
        $stmt = $pdo->prepare("DELETE FROM order_images WHERE order_id = ?");
        return $stmt->execute([$orderNumber]);
    }
}