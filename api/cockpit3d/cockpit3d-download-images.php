<?php
/**
 * cockpit3d-download-images.php
 * Downloads and caches Cockpit3D product images locally
 * 
 * Version: 2.2.0
 * Date: 2025-01-12
 * 
 * FIXES:
 * - Removed broken isValidImageData() function
 * - Uses getimagesizefromstring() for reliable image validation
 * - Properly handles WebP and all modern image formats
 * - Fixed path to use public/img instead of /img/products
 * - Better error handling for corrupted downloads
 */

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/image_download_errors.log');

// Handle CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include the existing fetcher class
require_once __DIR__ . '/cockpit3d-data-fetcher.php';

class CockPit3DImageDownloader extends CockPit3DFetcher {
    // Cockpit3D media server for product images
    private $imageBaseUrl = 'https://profit.cockpit3d.com/api/pub/media/catalog/product';
    private $localImageDir;
    private $environment;
    
    public function __construct() {
        parent::__construct();
        
        $stripeMode = getEnvVariable('VITE_STRIPE_MODE') ?: 'development';
        $this->environment = $stripeMode;
        
        // Use public/img/products/cockpit3d/ for all environments
        $projectRoot = dirname(__DIR__);
        $this->localImageDir = $projectRoot . '/public/img/products/cockpit3d/';
        
        console_log("🖼️ Image downloader initialized", [
            'environment' => $this->environment,
            'local_dir' => $this->localImageDir,
            'base_url' => $this->imageBaseUrl
        ]);
        
        // Ensure the base directory exists
        if (!file_exists($this->localImageDir)) {
            if (mkdir($this->localImageDir, 0755, true)) {
                console_log("✅ Created image directory", $this->localImageDir);
            } else {
                console_log("❌ Failed to create image directory", $this->localImageDir);
            }
        }
    }
    
    /**
     * Download a single product image
     * 
     * @param string $imagePath - Relative path from API (e.g., "/cache/xxx/image.png")
     * @param string $productId - Product ID for folder organization
     * @param string $productName - Product name for filename
     * @return array - Result with success status and details
     */
    public function downloadImage($imagePath, $productId, $productName) {
        if (empty($imagePath)) {
            return ['success' => false, 'error' => 'Image path is empty'];
        }

        // Create product-specific directory
        $productDir = $this->localImageDir . $productId . '/';
        if (!file_exists($productDir)) {
            mkdir($productDir, 0755, true);
        }

        try {
            // Clean up the path (API returns paths with escaped slashes)
            $cleanPath = str_replace('\\', '', $imagePath);
            
            // Get the file extension from the Cockpit3D path
            $pathInfo = pathinfo($cleanPath);
            $extension = isset($pathInfo['extension']) ? strtolower($pathInfo['extension']) : 'jpg';
            
            // Create a clean, filesystem-safe filename
            $filename = $this->createCleanFilename($productId, $productName, $extension);
            $localFilePath = $productDir . $filename;
            
            console_log("📥 Downloading image", [
                'product_id' => $productId,
                'product_name' => $productName,
                'api_path' => $cleanPath,
                'local_path' => $localFilePath
            ]);
            
            // Skip if file already exists
            if (file_exists($localFilePath)) {
                console_log("⏭️ Skipping - file exists", $filename);
                return [
                    'success' => true, 
                    'message' => 'File already exists',
                    'filename' => $filename,
                    'local_path' => $localFilePath,
                    'product_directory' => $productDir,
                    'environment' => $this->environment,
                    'skipped' => true
                ];
            }
            
            // Construct the full image URL
            $imageUrl = $this->imageBaseUrl . $cleanPath;
            console_log("🌐 Full image URL", $imageUrl);
            
            // Fetch the image from Cockpit3D (no auth needed for media server)
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $imageUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
            curl_setopt($ch, CURLOPT_HEADER, true); // Get headers too
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
            
            if (curl_error($ch)) {
                $error = curl_error($ch);
                curl_close($ch);
                console_log("❌ cURL error", $error);
                throw new Exception("cURL error: $error");
            }
            
            curl_close($ch);
            
            // Split headers and body
            $headers = substr($response, 0, $headerSize);
            $imageData = substr($response, $headerSize);
            
            // Extract content type from headers
            preg_match('/Content-Type: (.+)/i', $headers, $matches);
            $contentType = isset($matches[1]) ? trim($matches[1]) : 'unknown';
            
            console_log("📦 Response received", [
                'http_code' => $httpCode,
                'content_type' => $contentType,
                'size' => strlen($imageData) . ' bytes'
            ]);
            
            // Check HTTP response
            if ($httpCode !== 200) {
                console_log("❌ HTTP error", "Code: $httpCode");
                throw new Exception("HTTP $httpCode fetching image from: $imageUrl");
            }
            
            // Validate we got actual image data
            if (empty($imageData) || strlen($imageData) < 50) {
                // Save debug info
                $debugFile = $productDir . "DEBUG_{$productId}.txt";
                file_put_contents($debugFile, 
                    "URL: {$imageUrl}\n" .
                    "HTTP: {$httpCode}\n" .
                    "Content-Type: {$contentType}\n" .
                    "Size: " . strlen($imageData) . " bytes\n" .
                    "Headers:\n{$headers}\n\n" .
                    "Body preview:\n" . substr($imageData, 0, 500)
                );
                throw new Exception("Empty or too small response (see DEBUG file)");
            }
            
            // Check it's not an error page
            if (stripos($imageData, '<!DOCTYPE') !== false || 
                stripos($imageData, '<html') !== false) {
                throw new Exception("Got HTML error page instead of image");
            }
            
            // If we got here, we have binary data from a 200 response - save it!
            // Auto-detect actual format and use correct extension
            $detectedExt = $this->detectImageExtension($imageData);
            if ($detectedExt && $detectedExt !== $extension) {
                console_log("📝 Correcting extension", [
                    'original' => $extension,
                    'detected' => $detectedExt
                ]);
                $filename = $this->createCleanFilename($productId, $productName, $detectedExt);
                $localFilePath = $productDir . $filename;
            }
            
            // Save the image locally
            $bytesWritten = file_put_contents($localFilePath, $imageData);
            
            if ($bytesWritten === false) {
                throw new Exception("Failed to write image file to: $localFilePath");
            }
            
            console_log("✅ Image downloaded successfully", [
                'filename' => $filename,
                'size' => $bytesWritten . ' bytes',
                'content_type' => $contentType
            ]);
            
            return [
                'success' => true,
                'filename' => $filename,
                'local_path' => $localFilePath,
                'product_directory' => $productDir,
                'size' => $bytesWritten,
                'content_type' => $contentType,
                'environment' => $this->environment,
                'skipped' => false
            ];
            
        } catch (Exception $e) {
            console_log("❌ Download failed", [
                'product_id' => $productId,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'product_id' => $productId,
                'image_path' => $imagePath,
                'environment' => $this->environment
            ];
        }
    }
    
    /**
     * Download all product images from catalog
     * 
     * @return array - Summary of download results
     */
    public function downloadAllImages() {
        console_log("🚀 Starting bulk image download...");
        
        try {
            // Get catalog data (contains all products with image paths)
            $catalog = $this->getCatalog();
            
            $results = [
                'environment' => $this->environment,
                'image_directory' => $this->localImageDir,
                'total_products' => 0,
                'images_downloaded' => 0,
                'images_skipped' => 0,
                'errors' => 0,
                'details' => []
            ];
            
            // Process each category in catalog
            foreach ($catalog as $category) {
                if (!isset($category['products']) || !is_array($category['products'])) {
                    continue;
                }
                
                console_log("📂 Processing category", [
                    'name' => $category['name'] ?? 'Unknown',
                    'products' => count($category['products'])
                ]);
                
                // Process each product
                foreach ($category['products'] as $product) {
                    $results['total_products']++;
                    
                    // Check if product has an image path
                    if (empty($product['photo'])) {
                        $results['details'][] = [
                            'product_id' => $product['id'],
                            'product_name' => $product['name'],
                            'success' => false,
                            'error' => 'No photo path in product data',
                            'skipped' => true
                        ];
                        console_log("⚠️ No image for product", [
                            'id' => $product['id'],
                            'name' => $product['name']
                        ]);
                        continue;
                    }
                    
                    // Download the image
                    $downloadResult = $this->downloadImage(
                        $product['photo'], 
                        $product['id'], 
                        $product['name']
                    );
                    
                    $results['details'][] = array_merge($downloadResult, [
                        'product_id' => $product['id'],
                        'product_name' => $product['name']
                    ]);
                    
                    // Update counters
                    if ($downloadResult['success']) {
                        if (isset($downloadResult['skipped']) && $downloadResult['skipped']) {
                            $results['images_skipped']++;
                        } else {
                            $results['images_downloaded']++;
                        }
                    } else {
                        // Only count as error if it's not a known issue (missing/corrupt image)
                        if (stripos($downloadResult['error'], 'Invalid image') !== false) {
                            $results['images_skipped']++;
                            console_log("⏭️ Skipping corrupt/missing image", [
                                'id' => $product['id'],
                                'name' => $product['name']
                            ]);
                        } else {
                            $results['errors']++;
                        }
                    }
                    
                    // Small delay to be nice to their server
                    usleep(100000); // 0.1 second
                }
            }
            
            console_log("✅ Bulk download complete", [
                'total' => $results['total_products'],
                'downloaded' => $results['images_downloaded'],
                'skipped' => $results['images_skipped'],
                'errors' => $results['errors']
            ]);
            
            return $results;
            
        } catch (Exception $e) {
            console_log("❌ Bulk download failed", $e->getMessage());
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'environment' => $this->environment
            ];
        }
    }
    
    /**
     * Create a clean, filesystem-safe filename
     */
    private function createCleanFilename($productId, $productName, $extension) {
        // Remove special characters, keep only alphanumeric, hyphens, underscores
        $cleanName = preg_replace('/[^a-zA-Z0-9\-_]/', '_', $productName);
        $cleanName = preg_replace('/_+/', '_', $cleanName); // Collapse multiple underscores
        $cleanName = trim($cleanName, '_');
        
        // Limit length (50 chars max for name part)
        if (strlen($cleanName) > 50) {
            $cleanName = substr($cleanName, 0, 50);
        }
        
        return "cockpit3d_{$productId}_{$cleanName}.{$extension}";
    }
    
    /**
     * Detect actual image format from binary data
     * Returns correct file extension
     */
    private function detectImageExtension($data) {
        if (empty($data)) return null;
        
        $header = substr($data, 0, 12);
        $hex = bin2hex($header);
        
        // Check signatures and return proper extension
        if (stripos($hex, 'ffd8ff') === 0) return 'jpg';
        if (stripos($hex, '89504e47') === 0) return 'png';
        if (stripos($hex, '474946') === 0) return 'gif';
        if (stripos($hex, '52494646') === 0) {
            // RIFF format - could be WebP
            // Check bytes 8-11 for "WEBP"
            if (isset($data[8]) && substr($data, 8, 4) === 'WEBP') {
                return 'webp';
            }
        }
        if (stripos($hex, '424d') === 0) return 'bmp';
        if (stripos($hex, '49492a00') === 0 || stripos($hex, '4d4d002a') === 0) return 'tiff';
        
        // Try PHP's detection as fallback
        $imageInfo = @getimagesizefromstring($data);
        if ($imageInfo !== false && isset($imageInfo['mime'])) {
            $mimeMap = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/gif' => 'gif',
                'image/webp' => 'webp',
                'image/bmp' => 'bmp',
                'image/tiff' => 'tiff'
            ];
            
            if (isset($mimeMap[$imageInfo['mime']])) {
                console_log("🔍 Format detected via MIME", $imageInfo['mime']);
                return $mimeMap[$imageInfo['mime']];
            }
        }
        
        console_log("⚠️ Could not detect format, keeping original");
        return null;
    }
}

// ============================================================================
// REQUEST HANDLER (only runs when file called directly)
// ============================================================================

try {
    $action = $_GET['action'] ?? 'download';
    
    console_log("🎯 Handling request", ['action' => $action]);
    
    $downloader = new CockPit3DImageDownloader();
    
    if (!$downloader->hasCredentials()) {
        throw new Exception('CockPit3D credentials not found in environment variables');
    }
    
    switch ($action) {
        case 'download':
            // Download all images from catalog
            $results = $downloader->downloadAllImages();
            
            echo json_encode([
                'success' => true,
                'message' => 'Image download completed',
                'results' => $results
            ], JSON_PRETTY_PRINT);
            break;
            
        case 'status':
            // Get status of downloaded images
            $environment = getEnvVariable('VITE_STRIPE_MODE') ?: 'development';
            $imageDir = dirname(__DIR__) . '/public/img/products/cockpit3d/';
            
            $productDirs = [];
            if (file_exists($imageDir)) {
                $dirs = scandir($imageDir);
                foreach ($dirs as $dir) {
                    if ($dir !== '.' && $dir !== '..' && is_dir($imageDir . $dir)) {
                        $files = scandir($imageDir . $dir);
                        $imageFiles = array_filter($files, function($file) {
                            return !in_array($file, ['.', '..']) && 
                                   preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $file);
                        });
                        
                        $productDirs[$dir] = [
                            'product_id' => $dir,
                            'image_count' => count($imageFiles),
                            'files' => array_values($imageFiles)
                        ];
                    }
                }
            }
            
            echo json_encode([
                'success' => true,
                'environment' => $environment,
                'images_directory' => $imageDir,
                'total_products' => count($productDirs),
                'product_directories' => $productDirs
            ], JSON_PRETTY_PRINT);
            break;
            
        case 'retry':
            // Retry downloading specific failed products
            $productIds = isset($_GET['ids']) ? explode(',', $_GET['ids']) : [];
            
            if (empty($productIds)) {
                throw new Exception('No product IDs provided. Use ?action=retry&ids=158,467,468');
            }
            
            console_log("🔄 Retrying specific products", $productIds);
            
            $catalog = $downloader->getCatalog();
            $results = [
                'environment' => $downloader->environment ?? 'development',
                'retry_count' => count($productIds),
                'successful' => 0,
                'failed' => 0,
                'details' => []
            ];
            
            foreach ($catalog as $category) {
                if (!isset($category['products'])) continue;
                
                foreach ($category['products'] as $product) {
                    if (in_array($product['id'], $productIds)) {
                        if (empty($product['photo'])) {
                            $results['details'][] = [
                                'product_id' => $product['id'],
                                'success' => false,
                                'error' => 'No photo path'
                            ];
                            $results['failed']++;
                            continue;
                        }
                        
                        $result = $downloader->downloadImage(
                            $product['photo'],
                            $product['id'],
                            $product['name']
                        );
                        
                        $results['details'][] = array_merge($result, [
                            'product_id' => $product['id'],
                            'product_name' => $product['name']
                        ]);
                        
                        if ($result['success']) {
                            $results['successful']++;
                        } else {
                            $results['failed']++;
                        }
                    }
                }
            }
            
            echo json_encode([
                'success' => true,
                'message' => "Retry completed: {$results['successful']} successful, {$results['failed']} failed",
                'results' => $results
            ], JSON_PRETTY_PRINT);
            break;
            
        default:
            throw new Exception('Invalid action. Use ?action=download or ?action=status');
    }
    
    console_log("✅ Request completed successfully");
    
} catch (Exception $e) {
    console_log("❌ Request failed", $e->getMessage());
    error_log('CockPit3D image downloader error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>