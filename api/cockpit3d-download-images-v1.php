<?php
/**
 * cockpit3d-download-images.php
 * Downloads and caches Cockpit3D product images locally
 * 
 * Version: 2.1.0
 * Date: 2025-01-12
 * Environment: Development/Testing/Production
 * 
 * FIXES:
 * - Corrected image base URL to profit.cockpit3d.com
 * - Image paths are relative (from API response 'photo' field)
 * - Full URL = base + relative path from API
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
    // FIXED: Correct base URL for Cockpit3D images
    // Images are on profit.cockpit3d.com, not the API server
    private $imageBaseUrl = 'https://profit.cockpit3d.com';
    private $localImageDir;
    private $environment;
    
    public function __construct() {
        parent::__construct();
        
        $stripeMode = getEnvVariable('VITE_STRIPE_MODE') ?: 'development';
        $this->environment = $stripeMode;
        
        $projectRoot = dirname(__DIR__); // e.g., .../htdocs/crystalkeepsakes
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
            // Authenticate with Cockpit3D API
            // Note: Parent class handles authentication via makeRequest()
            // We don't call ensureAuthenticated() directly since it's private
            
            // Clean up the path (API returns paths with escaped slashes)
            $cleanPath = str_replace('\\', '', $imagePath);
            
            // Get the ACTUAL file extension from the Cockpit3D path
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
            
            // FIXED: Construct the full image URL
            // The API gives us a relative path like: /cache/xxx/image.png
            // We need to prepend the Cockpit3D media server URL
            $imageUrl = $this->imageBaseUrl . $cleanPath;
            
            console_log("🌐 Full image URL", $imageUrl);
            
            // Get authentication token (access parent's protected property)
            // $token = $this->getAuthToken();
            
            // Fetch the image from Cockpit3D
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $imageUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            // curl_setopt($ch, CURLOPT_HTTPHEADER, [
            //     'Authorization: Bearer ' . $token
            // ]);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
            
            $imageData = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
            
            if (curl_error($ch)) {
                $error = curl_error($ch);
                curl_close($ch);
                console_log("❌ cURL error", $error);
                throw new Exception("cURL error: $error");
            }
            
            curl_close($ch);
            
            // Check HTTP response
            if ($httpCode !== 200) {
                console_log("❌ HTTP error", "Code: $httpCode");
                throw new Exception("HTTP $httpCode fetching image from: $imageUrl");
            }
            
            // Validate image data
            if (empty($imageData)) {
                throw new Exception("Empty image data received");
            }
            
            if (!$this->isValidImageData($imageData)) {
                throw new Exception("Invalid image data (not a valid image file)");
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
                            'error' => 'No photo path in product data'
                        ];
                        $results['errors']++;
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
                        $results['errors']++;
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
     * 
     * @param string $productId
     * @param string $productName
     * @param string $extension
     * @return string - Clean filename
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
     * Validate that data is actually an image
     * 
     * @param string $data - Binary image data
     * @return bool - True if valid image
     */
    if (empty($imageData) || stripos($headers['content_type'], 'image/') !== 0) {
        $this->logError($productId, $imageUrl, "Invalid or non-image response");
        return false;
    }
    
    private function isValidImageData($data) {
        // Check if it starts with common image file signatures
        $imageSignatures = [
            'ffd8ffe0' => 'jpg',     // JPEG
            'ffd8ffe1' => 'jpg',
            'ffd8ffe8' => 'jpg',
            '89504e47' => 'png',     // PNG
            '47494638' => 'gif',     // GIF
            '52494646……57454250' => 'webp',    // WebP = RIFF....WEBP
            '424d'      => 'bmp',    // BMP = BM
            '00000020'  => 'heic',   // HEIC/HEIF (some Apple images)
            '00000018'  => 'avif'    // AVIF (ISO BMFF container)
        ];
        
        foreach ($imageSignatures as $signature) {
            if (substr($data, 0, strlen($signature)) === $signature) {
                return true;
            }
        }
        
        console_log("⚠️ Data does not match known image signatures");
        return false;
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
            
            // if ($environment === 'live' || $environment === 'production') {
                // $imageDir = dirname(__DIR__) . '/img/products/cockpit3d/';
            // } else {
                $imageDir = dirname(dirname(__DIR__)) . '/public/img/products/cockpit3d/';
            // }
            
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