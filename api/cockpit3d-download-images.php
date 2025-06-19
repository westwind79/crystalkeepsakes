<?php
// api/download-cockpit3d-images.php
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
    private $imageBaseUrl = 'https://profit.cockpit3d.com/api/pub/media/catalog/product';
    private $localImageDir;
    private $environment;
    
    public function __construct() {
        parent::__construct();
        
        $stripeMode = getEnvVariable('VITE_STRIPE_MODE') ?: 'development';
        $this->environment = $stripeMode;
        
        if ($stripeMode === 'live') {
            // Production: save to img folder
            $this->localImageDir = dirname(__DIR__) . '/img/products/cockpit3d/';
        } else {
            // Development: When script runs from dist/api/, go up two levels to reach project root
            // then into public folder (where Vite serves static assets)
            $this->localImageDir = dirname(dirname(__DIR__)) . '/public/img/products/cockpit3d/';
        }
        
        // Ensure the base directory exists
        if (!file_exists($this->localImageDir)) {
            mkdir($this->localImageDir, 0755, true);
        }
    }
    
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
            $this->ensureAuthenticated();
            
            // Clean up the path (remove escaped slashes)
            $cleanPath = str_replace('\\', '', $imagePath);
            
            // FIXED: Get the ACTUAL file extension from the cockpit3d path
            $pathInfo = pathinfo($cleanPath);
            $extension = isset($pathInfo['extension']) ? strtolower($pathInfo['extension']) : 'jpg';
            
            // Create a clean filename using the ACTUAL extension
            $filename = $this->createCleanFilename($productId, $productName, $extension);
            $localFilePath = $productDir . $filename;
            
            // Skip if file already exists
            if (file_exists($localFilePath)) {
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
            
            // ... (rest of download logic remains the same) ...
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'product_id' => $productId,
                'image_path' => $imagePath,
                'environment' => $this->environment
            ];
        }
    }
    
    public function downloadAllImages() {
        try {
            // Get catalog data
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
            
            foreach ($catalog as $category) {
                if (!isset($category['products']) || !is_array($category['products'])) {
                    continue;
                }
                
                foreach ($category['products'] as $product) {
                    $results['total_products']++;
                    
                    if (empty($product['photo'])) {
                        $results['details'][] = [
                            'product_id' => $product['id'],
                            'product_name' => $product['name'],
                            'success' => false,
                            'error' => 'No photo path in product data'
                        ];
                        $results['errors']++;
                        continue;
                    }
                    
                    $downloadResult = $this->downloadImage(
                        $product['photo'], 
                        $product['id'], 
                        $product['name']
                    );
                    
                    $results['details'][] = array_merge($downloadResult, [
                        'product_id' => $product['id'],
                        'product_name' => $product['name']
                    ]);
                    
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
            
            return $results;
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'environment' => $this->environment
            ];
        }
    }
    
    private function createCleanFilename($productId, $productName, $extension) {
         // Create a clean filename from product name
        $cleanName = preg_replace('/[^a-zA-Z0-9\-_]/', '_', $productName);
        $cleanName = preg_replace('/_+/', '_', $cleanName); // Replace multiple underscores
        $cleanName = trim($cleanName, '_');
        
        // Limit length
        if (strlen($cleanName) > 50) {
            $cleanName = substr($cleanName, 0, 50);
        }
        
        return "cockpit3d_{$productId}_{$cleanName}.{$extension}";
    }
    
    private function isValidImageData($data) {
        // Check if it starts with common image file signatures
        $imageSignatures = [
            "\xFF\xD8\xFF", // JPEG
            "\x89PNG\r\n\x1a\n", // PNG
            "GIF87a", // GIF87a
            "GIF89a", // GIF89a
            "\x00\x00\x01\x00", // ICO
            "BM", // BMP
        ];
        
        foreach ($imageSignatures as $signature) {
            if (substr($data, 0, strlen($signature)) === $signature) {
                return true;
            }
        }
        
        return false;
    }
}

try {
    $action = $_GET['action'] ?? 'download';
    
    $downloader = new CockPit3DImageDownloader();
    
    if (!$downloader->hasCredentials()) {
        throw new Exception('CockPit3D credentials not found in environment variables');
    }
    
    switch ($action) {
        case 'download':
            echo json_encode([
                'message' => 'Starting image download...',
                'results' => $downloader->downloadAllImages()
            ]);
            break;
            
        case 'status':
            // Get the same environment-based path
            $environment = getEnvVariable('VITE_STRIPE_MODE') ?: 'development';
            
            if ($environment === 'live' || $environment === 'production') {
                $imageDir = dirname(__DIR__) . '/img/products/cockpit3d/';
            } else {
                // Development: When script runs from dist/api/, go up two levels to reach project root
                $imageDir = dirname(dirname(__DIR__)) . '/public/img/products/cockpit3d/';
            }
            
            // Get all product directories
            $productDirs = [];
            if (file_exists($imageDir)) {
                $dirs = scandir($imageDir);
                foreach ($dirs as $dir) {
                    if ($dir !== '.' && $dir !== '..' && is_dir($imageDir . $dir)) {
                        $files = scandir($imageDir . $dir);
                        $imageFiles = array_filter($files, function($file) {
                            return !in_array($file, ['.', '..']) && preg_match('/\.(jpg|jpeg|png|gif)$/i', $file);
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
                'environment' => $environment,
                'images_directory' => $imageDir,
                'total_products' => count($productDirs),
                'product_directories' => $productDirs
            ]);
            break;
            
        default:
            throw new Exception('Invalid action. Use ?action=download or ?action=status');
    }
    
} catch (Exception $e) {
    error_log('CockPit3D image downloader error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>