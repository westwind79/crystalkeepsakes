<?php
/**
 * cockpit3d-image-proxy.php
 * Proxies Cockpit3D images with local caching
 * 
 * Version: 2.1.0
 * Date: 2025-01-12
 * 
 * FIXES:
 * - Corrected image base URL to profit.cockpit3d.com
 * - Proper handling of relative image paths from API
 * - Serves local cached images when available
 * - Falls back to remote fetch if not cached
 * 
 * Usage:
 * GET /api/cockpit3d-image-proxy.php?path=/cache/xxx/image.png&product_id=123
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/cockpit3d_image_errors.log');

// Handle CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo 'Method not allowed';
    exit;
}

// Function to get .env variables
function getEnvVariable($key) {
    $envFile = dirname(__DIR__) . '/.env';
    if (!file_exists($envFile)) {
        return null;
    }
    
    $content = file_get_contents($envFile);
    if ($content === false) {
        return null;
    }
    
    $lines = explode("\n", $content);
    foreach ($lines as $line) {
        $line = trim($line);
        
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }
        
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) {
            continue;
        }
        
        $envKey = trim($parts[0]);
        $envValue = trim($parts[1]);
        
        if ((strpos($envValue, '"') === 0 && strrpos($envValue, '"') === strlen($envValue) - 1) || 
            (strpos($envValue, "'") === 0 && strrpos($envValue, "'") === strlen($envValue) - 1)) {
            $envValue = substr($envValue, 1, -1);
        }
        
        if ($envKey === $key) {
            return $envValue;
        }
    }
    
    return null;
}

// CONSOLE LOG FUNCTION FOR DEVELOPMENT/TEST MODE
function console_log($message, $data = null) {
    $currentMode = getEnvVariable('NEXT_PUBLIC_ENV_MODE') ?? 'development';
    if ($currentMode !== 'live') {
        if ($data !== null) {
            error_log("🖼️ PROXY: $message - " . json_encode($data));
        } else {
            error_log("🖼️ PROXY: $message");
        }
    }
}

// Include the existing fetcher class
require_once __DIR__ . '/cockpit3d-data-fetcher.php';

class CockPit3DImageProxy extends CockPit3DFetcher {
    // FIXED: Correct base URL for Cockpit3D images
    private $imageBaseUrl = 'https://profit.cockpit3d.com';
    private $localImagePaths = [];
    
    public function __construct() {
        parent::__construct();
        
        // Set up possible local image paths based on environment
        $stripeMode = getEnvVariable('VITE_STRIPE_MODE') ?: 'development';
        
        console_log("🎯 Initializing image proxy", ['environment' => $stripeMode]);
        
        if ($stripeMode === 'live') {
            // Production: check img folder
            $this->localImagePaths = [
                dirname(__DIR__) . '/img/products/cockpit3d/',
            ];
        } else {
            // Development: check both dist and public folders
            $this->localImagePaths = [
                dirname(__DIR__) . '/dist/img/products/cockpit3d/',
                dirname(__DIR__) . '/public/img/products/cockpit3d/',
            ];
        }
        
        console_log("📂 Local image paths configured", $this->localImagePaths);
    }
    
    /**
     * Serve image - tries local first, then fetches from remote
     * 
     * @param string $imagePath - Relative path from API
     * @param string|null $productId - Optional product ID for targeted search
     * @return array - Image data and metadata
     */
    public function serveImage($imagePath, $productId = null) {
        console_log("📥 Serving image request", [
            'path' => $imagePath,
            'product_id' => $productId
        ]);
        
        // First try to serve from local cache
        $localImage = $this->findLocalImage($imagePath, $productId);
        if ($localImage) {
            console_log("✅ Serving from local cache", $localImage);
            return $this->serveLocalImage($localImage);
        }
        
        console_log("🌐 Local not found, fetching from remote...");
        
        // If not found locally, fetch from remote
        return $this->fetchImage($imagePath);
    }
    
    /**
     * Find local cached image
     * 
     * @param string $imagePath - Relative path from API
     * @param string|null $productId - Optional product ID
     * @return string|null - Local file path if found
     */
    private function findLocalImage($imagePath, $productId = null) {
        // Extract filename info from path
        $pathInfo = pathinfo(str_replace('\\', '', $imagePath));
        $extension = isset($pathInfo['extension']) ? strtolower($pathInfo['extension']) : 'jpg';
        
        console_log("🔍 Searching for local image", [
            'extension' => $extension,
            'product_id' => $productId
        ]);
        
        // Check each possible local path
        foreach ($this->localImagePaths as $localDir) {
            if (!is_dir($localDir)) {
                console_log("⏭️ Directory doesn't exist", $localDir);
                continue;
            }
            
            // If we have a product ID, check that specific folder first
            if ($productId) {
                $productDir = $localDir . $productId . '/';
                if (is_dir($productDir)) {
                    $files = glob($productDir . "cockpit3d_{$productId}_*." . $extension);
                    if (!empty($files) && file_exists($files[0])) {
                        console_log("✅ Found in product folder", $files[0]);
                        return $files[0];
                    }
                }
            }
            
            // Search all product folders for matching extension
            $subdirs = glob($localDir . '*', GLOB_ONLYDIR);
            foreach ($subdirs as $subdir) {
                $files = glob($subdir . "/cockpit3d_*." . $extension);
                if (!empty($files) && file_exists($files[0])) {
                    console_log("✅ Found in subfolder", $files[0]);
                    return $files[0];
                }
            }
        }
        
        console_log("❌ Local image not found");
        return null;
    }
    
    /**
     * Serve a local cached image
     * 
     * @param string $filePath - Full local file path
     * @return array - Image data and metadata
     */
    private function serveLocalImage($filePath) {
        $imageData = file_get_contents($filePath);
        $contentType = mime_content_type($filePath) ?: 'image/jpeg';
        
        return [
            'data' => $imageData,
            'content_type' => $contentType,
            'size' => strlen($imageData),
            'source' => 'local',
            'cache_path' => $filePath
        ];
    }
    
    /**
     * Fetch image from Cockpit3D remote server
     * 
     * @param string $imagePath - Relative path from API
     * @return array - Image data and metadata
     * @throws Exception
     */
    public function fetchImage($imagePath) {
        if (empty($imagePath)) {
            throw new Exception('Image path is required');
        }
        
        // Ensure we're authenticated (parent class method)
        $this->ensureAuthenticated();
        
        // Clean up the path (API returns escaped slashes)
        $cleanPath = str_replace('\\', '', $imagePath);
        
        // FIXED: Construct the full image URL
        // profit.cockpit3d.com is the media server
        $imageUrl = $this->imageBaseUrl . $cleanPath;
        
        console_log("🌐 Fetching from remote", $imageUrl);
        
        // Fetch image via cURL
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $imageUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->token
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        
        $imageData = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        
        if (curl_error($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            console_log("❌ cURL error", $error);
            throw new Exception("cURL error fetching image: $error");
        }
        
        curl_close($ch);
        
        // Check HTTP response
        if ($httpCode !== 200) {
            console_log("❌ HTTP error", "Code: $httpCode, URL: $imageUrl");
            throw new Exception("Failed to fetch image. HTTP code: $httpCode. URL: $imageUrl");
        }
        
        // Validate data
        if (empty($imageData)) {
            throw new Exception("Image data is empty");
        }
        
        console_log("✅ Remote fetch successful", [
            'size' => strlen($imageData) . ' bytes',
            'content_type' => $contentType
        ]);
        
        return [
            'data' => $imageData,
            'content_type' => $contentType ?: 'image/jpeg',
            'size' => strlen($imageData),
            'source' => 'remote',
            'url' => $imageUrl
        ];
    }
}

// ============================================================================
// REQUEST HANDLER
// ============================================================================

try {
    // Get the image path and optional product ID from query parameters
    $imagePath = $_GET['path'] ?? '';
    $productId = $_GET['product_id'] ?? null;
    
    if (empty($imagePath)) {
        throw new Exception('Missing path parameter. Usage: ?path=/cache/xxx/image.png&product_id=123');
    }
    
    console_log("🚀 Image proxy request", [
        'path' => $imagePath,
        'product_id' => $productId
    ]);
    
    $imageProxy = new CockPit3DImageProxy();
    
    if (!$imageProxy->hasCredentials()) {
        throw new Exception('CockPit3D credentials not found in environment variables');
    }
    
    // Serve the image (local first, then remote)
    $imageResult = $imageProxy->serveImage($imagePath, $productId);
    
    // Set appropriate headers
    header('Content-Type: ' . $imageResult['content_type']);
    header('Content-Length: ' . $imageResult['size']);
    header('Cache-Control: public, max-age=3600'); // Cache for 1 hour
    header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + 3600));
    
    // Add source header for debugging
    header('X-Image-Source: ' . $imageResult['source']);
    
    if (isset($imageResult['cache_path'])) {
        header('X-Cache-Path: ' . basename($imageResult['cache_path']));
    }
    
    console_log("✅ Image served successfully", [
        'source' => $imageResult['source'],
        'size' => $imageResult['size']
    ]);
    
    // Output the image data
    echo $imageResult['data'];
    
} catch (Exception $e) {
    console_log("❌ Image proxy error", $e->getMessage());
    error_log('CockPit3D image proxy error: ' . $e->getMessage());
    
    // Return a 404 or fallback image
    http_response_code(404);
    header('Content-Type: text/plain');
    echo 'Image not found: ' . $e->getMessage();
}
?>