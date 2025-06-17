<?php
// api/cockpit3d-image-proxy.php
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

// Include the existing fetcher class
require_once __DIR__ . '/cockpit3d-data-fetcher.php';

class CockPit3DImageProxy extends CockPit3DFetcher {
    private $imageBaseUrl = 'https://profit.cockpit3d.com/api/pub/media/catalog/product';
    private $localImagePaths = [];
    
    public function __construct() {
        parent::__construct();
        
        // Set up possible local image paths based on environment
        $stripeMode = getEnvVariable('VITE_STRIPE_MODE') ?: 'development';
        
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
    }
    
    public function serveImage($imagePath) {
        // First try to serve from local cache
        $localImage = $this->findLocalImage($imagePath);
        if ($localImage) {
            return $this->serveLocalImage($localImage);
        }
        
        // If not found locally, fetch from remote
        return $this->fetchImage($imagePath);
    }
    
    private function findLocalImage($imagePath) {
        // Extract filename from path
        $pathInfo = pathinfo(str_replace('\\', '', $imagePath));
        $extension = isset($pathInfo['extension']) ? strtolower($pathInfo['extension']) : 'jpg';
        
        // Check each possible local path
        foreach ($this->localImagePaths as $localDir) {
            if (!is_dir($localDir)) continue;
            
            // Look for files that might match this image
            $files = glob($localDir . "cockpit3d_*." . $extension);
            foreach ($files as $file) {
                if (file_exists($file)) {
                    return $file;
                }
            }
        }
        
        return null;
    }
    
    private function serveLocalImage($filePath) {
        $imageData = file_get_contents($filePath);
        $contentType = mime_content_type($filePath) ?: 'image/jpeg';
        
        return [
            'data' => $imageData,
            'content_type' => $contentType,
            'size' => strlen($imageData),
            'source' => 'local'
        ];
    }
    
    public function fetchImage($imagePath) {
        if (empty($imagePath)) {
            throw new Exception('Image path is required');
        }
        
        $this->ensureAuthenticated();
        
        // Clean up the path (remove escaped slashes)
        $cleanPath = str_replace('\\', '', $imagePath);
        
        // Construct the full image URL
        $imageUrl = $this->imageBaseUrl . $cleanPath;
        
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
            throw new Exception("cURL error fetching image: $error");
        }
        
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new Exception("Failed to fetch image. HTTP code: $httpCode. URL: $imageUrl");
        }
        
        if (empty($imageData)) {
            throw new Exception("Image data is empty");
        }
        
        return [
            'data' => $imageData,
            'content_type' => $contentType ?: 'image/jpeg',
            'size' => strlen($imageData),
            'source' => 'remote'
        ];
    }
}

try {
    // Get the image path and optional product ID from query parameters
    $imagePath = $_GET['path'] ?? '';
    $productId = $_GET['product_id'] ?? null;
    
    if (empty($imagePath)) {
        throw new Exception('Missing path parameter');
    }
    
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
    if (isset($imageResult['source'])) {
        header('X-Image-Source: ' . $imageResult['source']);
    }
    
    // Output the image data
    echo $imageResult['data'];
    
} catch (Exception $e) {
    error_log('CockPit3D image proxy error: ' . $e->getMessage());
    
    // Return a 404 or fallback image
    http_response_code(404);
    header('Content-Type: text/plain');
    echo 'Image not found: ' . $e->getMessage();
}
?>