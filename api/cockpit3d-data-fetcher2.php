<?php
// api/cockpit3d-data-fetcher.php

// Only set headers and handle requests if this file is called directly
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    header('Content-Type: application/json');
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/cockpit3d_errors.log');

    // Handle CORS
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// Function to get .env variables
function getEnvVariable($key) {
    $envFile = dirname(__DIR__) . '/.env';
    if (!file_exists($envFile)) {
        error_log(".env file not found at: $envFile");
        return null;
    }
    
    $content = file_get_contents($envFile);
    if ($content === false) {
        error_log("Failed to read .env file");
        return null;
    }
    
    $lines = explode("\n", $content);
    foreach ($lines as $line) {
        $line = trim($line);
        
        // Skip comments and empty lines
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }
        
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) {
            continue;
        }
        
        $envKey = trim($parts[0]);
        $envValue = trim($parts[1]);
        
        // Remove quotes if present
        if ((strpos($envValue, '"') === 0 && strrpos($envValue, '"') === strlen($envValue) - 1) || 
            (strpos($envValue, "'") === 0 && strrpos($envValue, "'") === strlen($envValue) - 1)) {
            $envValue = substr($envValue, 1, -1);
        }
        
        if ($envKey === $key) {
            return $envValue;
        }
    }
    
    error_log("Key '$key' not found in .env file");
    return null;
}

// CONSOLE LOG FUNCTION FOR DEVELOPMENT/TEST MODE
function console_log($message, $data = null) {
    $currentMode = getEnvVariable('VITE_STRIPE_MODE') ?? 'development';
    if ($currentMode !== 'live') {
        if ($data !== null) {
            error_log("🔧 FETCHER: $message - " . json_encode($data));
        } else {
            error_log("🔧 FETCHER: $message");
        }
    }
}

class CockPit3DFetcher {
    private $baseUrl;
    private $username;
    private $password;
    private $retailerId;
    protected $token = null;
    private $tokenExpiry = null;
    private $cacheDir;
    private $cacheMaxAge;

    /**
    * PRICING CONFIGURATION - Add this to the class properties
    */
    private $pricingConfig = [
        'markup_percentage' => 160,  // 160% markup = 62% profit margin
        'show_original_price' => true,
        'original_price_multiplier' => 2.5,  // For strikethrough pricing
        
        // Size multipliers based on dimensions/complexity
        'size_multipliers' => [
            // Small sizes (under 8cm)
            'small' => 1.0,
            'mini' => 1.0,
            '6x4' => 1.0,
            '5x5' => 1.0,
            
            // Medium sizes (8-12cm)
            'medium' => 1.3,
            '8x5' => 1.3,
            '9x6' => 1.3,
            
            // Large sizes (12-18cm)
            'large' => 1.8,
            'xlarge' => 2.2,
            '12x8' => 2.2,
            '15x10' => 2.8,
            
            // Mantel sizes (18cm+)
            'mantel' => 3.5,
            'presidential' => 4.2,
            '18x12' => 3.5,
            '22x16' => 4.2,
            '27x18' => 5.0
        ]
    ];


    public function __construct() {
        console_log("🚀 Initializing CockPit3DFetcher...");

        $this->baseUrl = getEnvVariable('COCKPIT3D_BASE_URL') ?: 'https://api.cockpit3d.com';
        $this->username = getEnvVariable('COCKPIT3D_USERNAME');
        $this->password = getEnvVariable('COCKPIT3D_PASSWORD');
        $this->retailerId = getEnvVariable('COCKPIT3D_API_TOKEN');
        
        console_log("Base URL", $this->baseUrl);
        console_log("Username", $this->username ? 'SET' : 'MISSING');
        console_log("Password", $this->password ? 'SET' : 'MISSING');
        console_log("Retailer ID", $this->retailerId ? 'SET' : 'MISSING');
        
        // Set up caching in src/data
        $this->cacheDir = dirname(dirname(__DIR__)) . '/src/data/';
        $this->cacheMaxAge = 3600; // 1 hour
        
        console_log("Cache directory", $this->cacheDir);
        console_log("Cache directory exists", file_exists($this->cacheDir) ? 'YES' : 'NO');
        
        // Ensure cache directory exists
        if (!file_exists($this->cacheDir)) {
            if (mkdir($this->cacheDir, 0755, true)) {
                console_log("✅ Created cache directory");
            } else {
                console_log("❌ Failed to create cache directory");
            }
        }
    }

    public function hasCredentials() {
        $hasAll = !empty($this->username) && !empty($this->password) && !empty($this->retailerId);
        console_log("Has all credentials", $hasAll ? 'YES' : 'NO');
        return $hasAll;
    }

    private function ensureAuthenticated() {
        console_log("🔐 Checking authentication...");
        
        if ($this->token && $this->tokenExpiry && time() < $this->tokenExpiry) {
            console_log("✅ Using existing valid token");
            return;
        }

        console_log("🔄 Authenticating with CockPit3D API...");
        $this->authenticate();
    }

    private function authenticate() {
        console_log("🔑 Starting authentication process...");
        
        $loginData = [
            'username' => $this->username,
            'password' => $this->password,
            'retailer_id' => $this->retailerId
        ];
        
        console_log("Login data prepared", array_keys($loginData));

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->baseUrl . '/rest/V2/login');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        console_log("Auth HTTP Code", $httpCode);
        console_log("Auth Response", substr($response, 0, 200));
        
        if (curl_error($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            console_log("❌ cURL error during authentication", $error);
            throw new Exception("Authentication cURL error: $error");
        }
        
        curl_close($ch);

        if ($httpCode !== 200) {
            console_log("❌ Authentication failed", "HTTP $httpCode");
            throw new Exception("Authentication failed with HTTP code: $httpCode. Response: $response");
        }

        $this->token = trim(json_decode($response), '"');
        $this->tokenExpiry = time() + 3600; // Token valid for 1 hour

        if (empty($this->token)) {
            console_log("❌ Empty token received");
            throw new Exception("Authentication failed: Empty token received");
        }
        
        console_log("✅ Authentication successful", "Token: " . substr($this->token, 0, 20) . "...");
    }

    private function makeRequest($endpoint) {
        console_log("📡 Making API request", $endpoint);
        
        $this->ensureAuthenticated();
        
        $url = (strpos($endpoint, 'http') === 0) ? $endpoint : $this->baseUrl . $endpoint;
        console_log("Full URL", $url);
        
        // ADD THIS - ALWAYS OUTPUT THE URL SO YOU CAN SEE IT:
        echo "🌐 ACTUAL API URL BEING USED: " . $url . "\n";
        error_log("🌐 ACTUAL API URL BEING USED: " . $url);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->token
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        console_log("API Response HTTP Code", $httpCode);
        console_log("API Response Size", strlen($response) . " bytes");
        
        if (curl_error($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            console_log("❌ cURL error in API request", $error);
            throw new Exception("cURL error: $error");
        }
        
        curl_close($ch);

        if ($httpCode !== 200) {
            console_log("❌ API request failed", "HTTP $httpCode");
            throw new Exception("API request failed with HTTP code: $httpCode. Response: $response");
        }

        $data = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            console_log("❌ JSON decode error", json_last_error_msg());
            throw new Exception("Failed to decode JSON response: " . json_last_error_msg());
        }

        console_log("✅ API request successful", "Data items: " . (is_array($data) ? count($data) : 'N/A'));
        return $data;
    }

    public function getProducts() {
        console_log("📦 Fetching products from API...");
        return $this->makeRequest('/rest/V2/products');
    }

    public function getCatalog() {
        console_log("📋 Fetching catalog from API...");
        return $this->makeRequest('/rest/V2/catalog');
    }

    // Load static products from JavaScript file
    private function loadStaticProducts() {
        console_log("📁 Loading static products...");
        
        // Try multiple possible paths for static-products.js
        $possiblePaths = [
            $this->cacheDir . 'static-products.js',
            dirname($this->cacheDir) . '/data/static-products.js',
            dirname(dirname($this->cacheDir)) . '/src/data/static-products.js',
            dirname(dirname(dirname($this->cacheDir))) . '/src/data/static-products.js'
        ];
        
        console_log("Checking static products paths", $possiblePaths);
        
        $staticProductsFile = null;
        foreach ($possiblePaths as $path) {
            console_log("Checking path", "$path - " . (file_exists($path) ? 'EXISTS' : 'NOT FOUND'));
            if (file_exists($path)) {
                $staticProductsFile = $path;
                break;
            }
        }
        
        if (!$staticProductsFile) {
            console_log("❌ Static products file not found in any location");
            return [];
        }
        
        console_log("✅ Found static products file", $staticProductsFile);
        
        $content = file_get_contents($staticProductsFile);
        if ($content === false) {
            console_log("❌ Failed to read static products file");
            return [];
        }
        
        console_log("File content preview", substr($content, 0, 200) . "...");
        
        // Extract JSON from JavaScript export
        if (preg_match('/export\s+const\s+products\s*=\s*(\[.*?\]);/s', $content, $matches)) {
            $jsonString = $matches[1];
            console_log("Extracted JSON string preview", substr($jsonString, 0, 100) . "...");
            
            $products = json_decode($jsonString, true);
            
            if (json_last_error() === JSON_ERROR_NONE && is_array($products)) {
                console_log("✅ Successfully parsed static products", count($products) . " products");
                if (count($products) > 0) {
                    console_log("First static product", $products[0]);
                }
                return $products;
            } else {
                console_log("❌ JSON decode error", json_last_error_msg());
                return [];
            }
        } else {
            console_log("❌ Could not find export pattern in file");
            return [];
        }
    }

    /**
     * Calculate customer price from cost with profit margin
     */
    private function calculateCustomerPrice($costPrice, $sizeMultiplier = 1.0) {
        $baseCost = (float)$costPrice;
        $adjustedCost = $baseCost * $sizeMultiplier;
        
        // Apply markup percentage
        $customerPrice = $adjustedCost * (1 + ($this->pricingConfig['markup_percentage'] / 100));
        
        // Round to nearest .99 or .00 for psychological pricing
        $rounded = round($customerPrice);
        if ($rounded > $customerPrice) {
            $finalPrice = $rounded - 0.01; // Make it $XX.99
        } else {
            $finalPrice = $rounded;
        }
        
        console_log("💰 Price calculation", [
            'cost' => $baseCost,
            'size_multiplier' => $sizeMultiplier,
            'adjusted_cost' => $adjustedCost,
            'markup_percent' => $this->pricingConfig['markup_percentage'],
            'calculated_price' => $customerPrice,
            'final_price' => $finalPrice
        ]);
        
        return $finalPrice;
    }

    /**
     * Get size multiplier based on size name
     */
    private function getSizeMultiplier($sizeName) {
        $name = strtolower($sizeName);
        $multipliers = $this->pricingConfig['size_multipliers'];
        
        // Check for exact keyword matches first
        foreach ($multipliers as $keyword => $multiplier) {
            if (strpos($name, $keyword) !== false) {
                console_log("🔍 Size multiplier found", ['size' => $sizeName, 'keyword' => $keyword, 'multiplier' => $multiplier]);
                return $multiplier;
            }
        }
        
        // Fallback: analyze dimensions if present
        if (preg_match('/(\d+)x(\d+)cm/', $name, $matches)) {
            $width = (int)$matches[1];
            $height = (int)$matches[2];
            $area = $width * $height;
            
            if ($area < 50) return 1.0;      // Small
            if ($area < 100) return 1.3;    // Medium  
            if ($area < 200) return 1.8;    // Large
            if ($area < 300) return 2.8;    // XLarge
            return 4.2;                     // Presidential
        }
        
        console_log("⚠️ No size multiplier found, using default", ['size' => $sizeName]);
        return 1.0; // Default multiplier
    }
    /**
     * Calculate original price for strikethrough display
     */
    private function calculateOriginalPrice($customerPrice) {
        return round($customerPrice * $this->pricingConfig['original_price_multiplier']);
    }

        
    /**
     * ENHANCED transformCockpit3dProduct with proper size pricing
     */
    private function transformCockpit3dProduct($rawProduct, $catalog = []) {
        console_log("🔄 Transforming CockPit3D product", $rawProduct['id']);
        
        // Check if this is a lightbase product by name
        $isLightbaseProduct = $this->isLightbaseProduct($rawProduct['name']);
        
        $transformed = [
            'id' => $rawProduct['id'],
            'name' => $rawProduct['name'],
            'slug' => $this->createSlug($rawProduct['name']),
            'sku' => $rawProduct['sku'],
            'basePrice' => (float)$rawProduct['price'],
            'description' => $rawProduct['name'],
            'longDescription' => '',
            'images' => [],
            'options' => []
        ];

        // Set product-type specific fields
        if ($isLightbaseProduct) {
            $transformed['requiresImage'] = false;
        } else {
            $transformed['requiresImage'] = true;
        }

        // Handle images
        if (isset($rawProduct['photo']) && !empty($rawProduct['photo'])) {
            $cleanName = preg_replace('/[^a-zA-Z0-9\-_]/', '_', $rawProduct['name']);
            $cleanName = preg_replace('/_+/', '_', $cleanName);
            $cleanName = trim($cleanName, '_');
            
            if (strlen($cleanName) > 50) {
                $cleanName = substr($cleanName, 0, 50);
            }
            
            $cleanPath = str_replace('\\', '', $rawProduct['photo']);
            $pathInfo = pathinfo($cleanPath);
            $actualExtension = isset($pathInfo['extension']) ? strtolower($pathInfo['extension']) : 'jpg';
            
            $localImagePath = "/img/products/cockpit3d/{$rawProduct['id']}/cockpit3d_{$rawProduct['id']}_{$cleanName}.{$actualExtension}";
            
            $transformed['images'][] = [
                'src' => $localImagePath,
                'isMain' => true
            ];
        } else {
            $transformed['images'][] = [
                'src' => "https://placehold.co/600x400",
                'isMain' => true
            ];
        }

        // ONLY ADD PRODUCT OPTIONS IF IT'S NOT A LIGHTBASE
        if (!$isLightbaseProduct) {
            // Handle size options - USE PRICING FILE INSTEAD OF CALCULATIONS
            if (isset($rawProduct['options']) && is_array($rawProduct['options'])) {
                foreach ($rawProduct['options'] as $option) {
                    if ($option['name'] === 'Size' && isset($option['values'])) {
                        $transformed['sizes'] = array_map(function($value) {
                            // Get pricing from the separate pricing file (to be loaded by frontend)
                            return [
                                'id' => (string)$value['id'],
                                'name' => $value['name'],
                                'price' => 0, // Frontend will load from pricing file
                                'usePricingFile' => true // Flag for frontend to use pricing file
                            ];
                        }, $option['values']);
                    }
                }
            }

            // Add standard lightbase options for crystal products
            $transformed['lightBases'] = $this->extractLightbaseOptionsFixed($catalog);
            
            // Add background options with prices from catalog
            $transformed['backgroundOptions'] = $this->extractBackgroundOptions($catalog);
            
            // Add text options with prices from catalog
            $transformed['textOptions'] = $this->extractTextOptions($catalog);
        }
        
        console_log("✅ Transformed product", [
            'name' => $transformed['name'],
            'basePrice' => $transformed['basePrice'],
            'isLightbase' => $isLightbaseProduct,
            'requiresImage' => $transformed['requiresImage'] ?? false,
            'hasSizes' => isset($transformed['sizes']) ? count($transformed['sizes']) : 0
        ]);
        
        return $transformed;
    }
        
    /**
    * FIXED extractLightbaseOptions - removes the bug
    */
    private function extractLightbaseOptionsFixed($catalog) {
        $options = [
            [
                'id' => 'none',
                'name' => 'No Base',
                'price' => 0
            ]
        ];
        
        // Add standard lightbase options with known prices
        $standardLightbases = [
            ['id' => 'lightbase-rectangle', 'name' => 'Lightbase Rectangle', 'price' => 25],
            ['id' => 'lightbase-square', 'name' => 'Lightbase Square', 'price' => 25],
            ['id' => 'lightbase-wood-small', 'name' => 'Lightbase Wood Small', 'price' => 60],
            ['id' => 'lightbase-wood-medium', 'name' => 'Lightbase Wood Medium', 'price' => 60],
            ['id' => 'lightbase-wood-long', 'name' => 'Lightbase Wood Long', 'price' => 60],
            ['id' => 'rotating-led-lightbase', 'name' => 'Rotating LED Lightbase', 'price' => 35],
            ['id' => 'wooden-premium-base-mini', 'name' => 'Wooden Premium Base Mini', 'price' => 60],
            ['id' => 'concave-lightbase', 'name' => 'Concave Lightbase', 'price' => 39],
            ['id' => 'ornament-stand', 'name' => 'Ornament Stand', 'price' => 25]
        ];
        
        foreach ($standardLightbases as $base) {
            $options[] = $base;
        }

        return $options;
    }
    
    /**
     * Find individual product by size ID
     * Size IDs in catalog options should match product IDs in raw products
     */
    private function findProductBySizeId($sizeId, $allRawProducts) {
        foreach ($allRawProducts as $product) {
            if ($product['id'] === $sizeId) {
                return $product;
            }
        }
        return null;
    }

    /**
    * Get base cost from admin panel or estimate
    * This is where you'd integrate with the actual cost data
    */
    private function getBaseCostForProduct($productId, $productName) {
        // TODO: Replace this with actual admin panel cost lookup
        // For now, using estimated base costs
        
        $estimatedCosts = [
            'rectangle' => 24.75,
            'heart' => 28.50,
            'cube' => 32.00,
            'cylinder' => 29.75,
            'dome' => 45.00
        ];
        
        $name = strtolower($productName);
        foreach ($estimatedCosts as $type => $cost) {
            if (strpos($name, $type) !== false) {
                return $cost;
            }
        }
        
        return 24.75; // Default base cost
    }

    /**
    * Check if a product is a lightbase/stand product
    */
    private function isLightbaseProduct($productName) {
        $name = strtolower($productName);
        $lightbaseKeywords = [
            'lightbase',
            'light_base', 
            'light base',
            'stand',
            'base',
            'ornament stand',
            'rotating led',
            'wooden premium'
        ];
        
        foreach ($lightbaseKeywords as $keyword) {
            if (strpos($name, $keyword) !== false) {
                console_log("🔍 Detected lightbase product", $productName);
                return true;
            }
        }
        
        console_log("🔍 Detected crystal product", $productName);
        return false;
    }

    /**
    * Extract lightbase options with prices - FIXED VERSION
    * Replace the existing extractLightbaseOptions() method in your fetcher
    */
    private function extractLightbaseOptions($catalog) {
        $options = [
            [
                'id' => 'none',
                'name' => 'No Base',
                'price' => null
            ]
        ];
        
        // Find lightbase products in catalog to add as options
        foreach ($catalog as $category) {
            if (isset($category['products']) && is_array($category['products'])) {
                foreach ($category['products'] as $product) {
                    if ($this->isLightbaseProduct($product['name'])) {
                        $options[] = [
                            'id' => $this->createSlug($product['name']),
                            'name' => $product['name'],
                            'price' => isset($product['price']) ? (float)$product['price'] : null
                        ];
                    }
                }
            }
        }
        
        // FIXED: Use $options instead of undefined $lightbaseOptions
        foreach ($options as &$base) {
            if (!isset($base['price']) || $base['price'] === true || $base['price'] === false) {
                console_log("🛑 Invalid lightbase price, forcing to 0", $base);
                $base['price'] = 0;
            } else {
                $base['price'] = (float)$base['price'];
            }

            $base['id'] = (string)($base['id'] ?? strtolower(str_replace(' ', '_', $base['name'])));
        }

        return $options;
    }

    /**
     * Extract background options with prices
     */
    private function extractBackgroundOptions($catalog) {
        $options = [
            [
                'id' => 'rm',
                'name' => 'Remove Backdrop',
                'price' => 0
            ]
        ];
        
        // Find backdrop prices in catalog options
        $twoDPrice = 12; // Fallback
        $threeDPrice = 15; // Fallback
        
        foreach ($catalog as $category) {
            if (isset($category['options'])) {
                foreach ($category['options'] as $option) {
                    if ($option['name'] === '2D Backdrop' && isset($option['price'])) {
                        $twoDPrice = (float)$option['price'];
                    }
                    if ($option['name'] === '3D Backdrop' && isset($option['price'])) {
                        $threeDPrice = (float)$option['price'];
                    }
                }
            }
        }
        
        $options[] = [
            'id' => '2d',
            'name' => '2D Backdrop',
            'price' => $twoDPrice
        ];
        
        $options[] = [
            'id' => '3d',
            'name' => '3D Backdrop',
            'price' => $threeDPrice
        ];
        
        return $options;
    }

    /**
     * Extract text options with prices
     */
    private function extractTextOptions($catalog) {
        $options = [
            [
                'id' => 'none',
                'name' => 'No Text',
                'price' => 0
            ]
        ];
        
        // Find text option prices in catalog
        $customTextPrice = 9.5; // Fallback
        
        foreach ($catalog as $category) {
            if (isset($category['options'])) {
                foreach ($category['options'] as $option) {
                    if (($option['name'] === 'Custom Text' || $option['name'] === 'Custom Option') 
                        && isset($option['price'])) {
                        $customTextPrice = (float)$option['price'];
                        break;
                    }
                }
            }
        }
        
        $options[] = [
            'id' => 'customText',
            'name' => 'Custom Text',
            'price' => $customTextPrice
        ];
        
        return $options;
    }

    // Create URL-friendly slug
    private function createSlug($string) {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $string)));
        return trim($slug, '-');
    }

    // Save raw products file
    private function saveRawProductsFile($products) {
        console_log("💾 Saving raw products file...");
        
        $rawProductsFile = $this->cacheDir . 'cockpit3d-raw-products.js';
        $jsContent = "// Raw Cockpit3D Products API data - " . date('Y-m-d H:i:s') . "\n\n";
        $jsContent .= "export const cockpit3dRawProducts = " . json_encode($products, JSON_PRETTY_PRINT) . ";\n";
        
        $result = file_put_contents($rawProductsFile, $jsContent);
        if ($result === false) {
            console_log("❌ Failed to write raw products file", $rawProductsFile);
            return false;
        }
        
        console_log("✅ Raw products file saved", "$rawProductsFile ($result bytes)");
        return true;
    }

    // Save raw catalog file
    private function saveRawCatalogFile($catalog) {
        console_log("💾 Saving raw catalog file...");
        
        $rawCatalogFile = $this->cacheDir . 'cockpit3d-raw-catalog.js';
        $jsContent = "// Raw Cockpit3D Catalog API data - " . date('Y-m-d H:i:s') . "\n\n";
        $jsContent .= "export const cockpit3dRawCatalog = " . json_encode($catalog, JSON_PRETTY_PRINT) . ";\n";
        
        $result = file_put_contents($rawCatalogFile, $jsContent);
        if ($result === false) {
            console_log("❌ Failed to write raw catalog file", $rawCatalogFile);
            return false;
        }
        
        console_log("✅ Raw catalog file saved", "$rawCatalogFile ($result bytes)");
        return true;
    }

    // Generate raw files
    public function generateRawFiles($refresh = false) {
        console_log("🔄 Generating raw API data files...");
        
        try {
            // Get raw data from APIs
            $productsData = $this->getProducts();
            $catalogData = $this->getCatalog();
            
            console_log("Raw data fetched", [
                'products' => is_array($productsData) ? count($productsData) : 0,
                'catalog' => is_array($catalogData) ? count($catalogData) : 0
            ]);
            
            // Save raw files
            $productsSaved = $this->saveRawProductsFile($productsData);
            $catalogSaved = $this->saveRawCatalogFile($catalogData);
            
            return [
                'success' => $productsSaved && $catalogSaved,
                'products_saved' => $productsSaved,
                'catalog_saved' => $catalogSaved,
                'products_count' => is_array($productsData) ? count($productsData) : 0,
                'catalog_count' => is_array($catalogData) ? count($catalogData) : 0
            ];
            
        } catch (Exception $e) {
            console_log("❌ Error generating raw files", $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    // NEW: Generate the combined products file (static + CockPit3D)
    public function generateProcessedProductsFile($refresh = false) {
        console_log("🔧 Generating processed products file with Name/SKU matching...");
            
        try {
            // First, ensure we have raw data
            console_log("📡 Ensuring raw data is available...");
            $rawResult = $this->generateRawFiles($refresh);
            if (!$rawResult['success']) {
                throw new Exception("Failed to generate raw files: " . ($rawResult['error'] ?? 'Unknown error'));
            }
            
            console_log("✅ Raw data generation completed", $rawResult);
            
            // Load static products
            console_log("📁 Loading static products...");
            $staticProducts = $this->loadStaticProducts();
            console_log("Static products loaded", count($staticProducts) . " products");
            
            // Load and transform raw CockPit3D data
            console_log("📦 Loading raw CockPit3D data...");
            $cockpitProducts = [];
            $rawProductsFile = $this->cacheDir . 'cockpit3d-raw-products.js';
            $rawCatalogFile = $this->cacheDir . 'cockpit3d-raw-catalog.js';
            
            if (file_exists($rawProductsFile) && file_exists($rawCatalogFile)) {
                // Parse raw data
                $rawProductsContent = file_get_contents($rawProductsFile);
                $rawCatalogContent = file_get_contents($rawCatalogFile);
                
                if (preg_match('/export\s+const\s+cockpit3dRawProducts\s*=\s*(\[.*?\]);/s', $rawProductsContent, $matches)) {
                    $rawProducts = json_decode($matches[1], true);
                    
                    if (preg_match('/export\s+const\s+cockpit3dRawCatalog\s*=\s*(\[.*?\]);/s', $rawCatalogContent, $matches)) {
                        $rawCatalog = json_decode($matches[1], true);
                        
                        // Transform CockPit3D products - PASS ALL RAW PRODUCTS FOR SIZE LOOKUP
                        if (is_array($rawProducts)) {
                            foreach ($rawProducts as $rawProduct) {
                                $cockpitProducts[] = $this->transformCockpit3dProduct($rawProduct, $rawCatalog, $rawProducts);
                            }
                        }
                    }
                }
            }
            
            console_log("Raw data loaded", [
                'static_products' => count($staticProducts),
                'cockpit3d_products' => count($cockpitProducts)
            ]);
            
            // INTELLIGENT MATCHING AND CONCATENATION
            $finalProducts = $this->intelligentProductMerge($staticProducts, $cockpitProducts);
            
            console_log("🔗 Intelligent merge completed", [
                'static' => count($staticProducts),
                'cockpit3d' => count($cockpitProducts),
                'final_total' => count($finalProducts),
                'merged_products' => count($finalProducts) - count($cockpitProducts)
            ]);
            
            // Generate the processed products file
            $processedProductsFile = $this->cacheDir . 'cockpit3d-products.js';
            $jsContent = "// Intelligently merged products (static + CockPit3D) - " . date('Y-m-d H:i:s') . "\n\n";
            $jsContent .= "export const cockpit3dProducts = " . json_encode($finalProducts, JSON_PRETTY_PRINT) . ";\n\n";
            $jsContent .= "export const generatedAt = \"" . date('c') . "\";\n\n";
            $jsContent .= "export const isRealTimeData = true;\n\n";
            $jsContent .= "export const sourceInfo = {\n";
            $jsContent .= "  static_products: " . count($staticProducts) . ",\n";
            $jsContent .= "  cockpit3d_products: " . count($cockpitProducts) . ",\n";
            $jsContent .= "  final_total: " . count($finalProducts) . ",\n";
            $jsContent .= "  matching_algorithm: \"name_sku_fuzzy\"\n";
            $jsContent .= "};\n\n";
            $jsContent .= "export default cockpit3dProducts;\n";
            
            $success = file_put_contents($processedProductsFile, $jsContent) !== false;
            
            console_log($success ? "✅ Processed products file generated successfully" : "❌ Failed to generate processed products file");
            
            return [
                'success' => $success,
                'file' => $processedProductsFile,
                'total_products' => count($finalProducts),
                'static_count' => count($staticProducts),
                'cockpit3d_count' => count($cockpitProducts),
                'merged_count' => count($finalProducts)
            ];
            
        } catch (Exception $e) {
            console_log("❌ Error generating processed products file", $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Intelligent product merge using Name/SKU matching
     */
    private function intelligentProductMerge($staticProducts, $cockpitProducts) {
        $finalProducts = [];
        $matchedCockpitIds = [];
        
        console_log("🔍 Starting intelligent product matching...");
        
        // Step 1: Try to match each static product with CockPit3D products
        foreach ($staticProducts as $staticProduct) {
            $matchedCockpitProduct = $this->findMatchingCockpitProduct($staticProduct, $cockpitProducts);
            
            if ($matchedCockpitProduct) {
                // Found a match - merge the products
                console_log("✅ MATCH FOUND", [
                    'static' => $staticProduct['name'],
                    'cockpit3d' => $matchedCockpitProduct['name'],
                    'match_score' => $this->calculateMatchScore($staticProduct, $matchedCockpitProduct)
                ]);
                
                $mergedProduct = $this->mergeProducts($staticProduct, $matchedCockpitProduct);
                $finalProducts[] = $mergedProduct;
                $matchedCockpitIds[] = $matchedCockpitProduct['id'];
                
            } else {
                // No match found - keep static product as-is
                console_log("➕ STATIC ONLY", ['name' => $staticProduct['name']]);
                $finalProducts[] = $staticProduct;
            }
        }
        
        // Step 2: Add unmatched CockPit3D products
        foreach ($cockpitProducts as $cockpitProduct) {
            if (!in_array($cockpitProduct['id'], $matchedCockpitIds)) {
                console_log("➕ COCKPIT3D ONLY", ['name' => $cockpitProduct['name']]);
                $finalProducts[] = $cockpitProduct;
            }
        }
        
        console_log("🎯 Matching summary", [
            'static_products' => count($staticProducts),
            'cockpit3d_products' => count($cockpitProducts),
            'matched_pairs' => count($matchedCockpitIds),
            'final_total' => count($finalProducts)
        ]);
        
        return $finalProducts;
    }

    /**
     * Find matching CockPit3D product for a static product
     */
    private function findMatchingCockpitProduct($staticProduct, $cockpitProducts) {
        $bestMatch = null;
        $bestScore = 0;
        $minimumScore = 0.6; // 60% similarity threshold
        
        foreach ($cockpitProducts as $cockpitProduct) {
            $score = $this->calculateMatchScore($staticProduct, $cockpitProduct);
            
            if ($score > $bestScore && $score >= $minimumScore) {
                $bestScore = $score;
                $bestMatch = $cockpitProduct;
            }
        }
        
        return $bestMatch;
    }

    /**
     * Calculate match score between two products using Name and SKU
     */
    private function calculateMatchScore($staticProduct, $cockpitProduct) {
        $score = 0;
        
        // Name matching (70% weight)
        $nameScore = $this->calculateNameSimilarity($staticProduct['name'], $cockpitProduct['name']);
        $score += $nameScore * 0.7;
        
        // SKU matching (30% weight) - if both have SKUs
        if (isset($staticProduct['sku']) && isset($cockpitProduct['sku']) && 
            !empty($staticProduct['sku']) && !empty($cockpitProduct['sku'])) {
            $skuScore = $this->calculateSkuSimilarity($staticProduct['sku'], $cockpitProduct['sku']);
            $score += $skuScore * 0.3;
        }
        
        return $score;
    }

    /**
     * Calculate name similarity using fuzzy matching
     */
    private function calculateNameSimilarity($name1, $name2) {
        // Normalize names for comparison
        $name1 = $this->normalizeProductName($name1);
        $name2 = $this->normalizeProductName($name2);
        
        // Exact match
        if ($name1 === $name2) {
            return 1.0;
        }
        
        // Check if one contains the other
        if (strpos($name1, $name2) !== false || strpos($name2, $name1) !== false) {
            return 0.8;
        }
        
        // Calculate similarity percentage using similar_text
        $similarity = 0;
        similar_text($name1, $name2, $similarity);
        
        return $similarity / 100.0;
    }

    /**
     * Calculate SKU similarity
     */
    private function calculateSkuSimilarity($sku1, $sku2) {
        $sku1 = strtolower(trim($sku1));
        $sku2 = strtolower(trim($sku2));
        
        if ($sku1 === $sku2) {
            return 1.0;
        }
        
        // Check for partial matches
        if (strpos($sku1, $sku2) !== false || strpos($sku2, $sku1) !== false) {
            return 0.7;
        }
        
        return 0;
    }

    /**
     * Normalize product name for better matching
     */
    private function normalizeProductName($name) {
        $name = strtolower($name);
        // Remove common words that don't help with matching
        $removeWords = ['3d', 'crystal', 'static', 'custom', 'laser', 'engraving'];
        foreach ($removeWords as $word) {
            $name = str_replace($word, '', $name);
        }
        // Remove extra spaces and special characters
        $name = preg_replace('/[^a-z0-9\s]/', '', $name);
        $name = preg_replace('/\s+/', ' ', $name);
        return trim($name);
    }

    /**
     * Merge static product with CockPit3D product data
     */
    private function mergeProducts($staticProduct, $cockpitProduct) {
        console_log("🔗 Merging products", [
            'static_id' => $staticProduct['id'],
            'cockpit3d_id' => $cockpitProduct['id']
        ]);
        
        // Start with static product as base
        $merged = $staticProduct;
        
        // Enhance with CockPit3D data (only if static data is missing/empty)
        
        // Use CockPit3D ID for backend compatibility
        $merged['cockpit3d_id'] = $cockpitProduct['id'];
        $merged['sku'] = $cockpitProduct['sku'] ?? $staticProduct['sku'];
        
        // Pricing - prefer CockPit3D pricing
        if (isset($cockpitProduct['basePrice']) && $cockpitProduct['basePrice'] > 0) {
            $merged['basePrice'] = $cockpitProduct['basePrice'];
        }
        
        // Images - prefer CockPit3D images if available
        if (isset($cockpitProduct['images']) && !empty($cockpitProduct['images'])) {
            $merged['images'] = $cockpitProduct['images'];
        }
        
        // Product options - merge from CockPit3D
        if (isset($cockpitProduct['sizes']) && !empty($cockpitProduct['sizes'])) {
            $merged['sizes'] = $cockpitProduct['sizes'];
        }
        
        if (isset($cockpitProduct['lightBases']) && !empty($cockpitProduct['lightBases'])) {
            $merged['lightBases'] = $cockpitProduct['lightBases'];
        }
        
        if (isset($cockpitProduct['backgroundOptions']) && !empty($cockpitProduct['backgroundOptions'])) {
            $merged['backgroundOptions'] = $cockpitProduct['backgroundOptions'];
        }
        
        if (isset($cockpitProduct['textOptions']) && !empty($cockpitProduct['textOptions'])) {
            $merged['textOptions'] = $cockpitProduct['textOptions'];
        }
        
        // Requirements
        if (isset($cockpitProduct['requiresImage'])) {
            $merged['requiresImage'] = $cockpitProduct['requiresImage'];
        }
        
        console_log("✅ Products merged successfully", [
            'final_name' => $merged['name'],
            'final_id' => $merged['id'],
            'cockpit3d_id' => $merged['cockpit3d_id'],
            'has_sizes' => isset($merged['sizes']) ? count($merged['sizes']) : 0
        ]);
        
        return $merged;
    }


}

// Only execute the action handling if this file is called directly
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    try {
        console_log("🚀 Starting CockPit3D Fetcher request handler...");
        
        $action = $_GET['action'] ?? 'catalog';
        $refresh = isset($_GET['refresh']) && $_GET['refresh'] === 'true';
        
        console_log("Request details", [
            'action' => $action,
            'refresh' => $refresh ? 'true' : 'false'
        ]);

        $fetcher = new CockPit3DFetcher();

        if (!$fetcher->hasCredentials()) {
            throw new Exception('CockPit3D credentials not found in environment variables');
        }

        switch ($action) {
            case 'products':
                console_log("📦 Handling products action...");
                $data = $fetcher->getProducts();
                echo json_encode([
                    'success' => true,
                    'data' => $data,
                    'count' => is_array($data) ? count($data) : 0
                ]);
                break;

            case 'catalog':
                console_log("📋 Handling catalog action...");
                $data = $fetcher->getCatalog();
                echo json_encode([
                    'success' => true,
                    'data' => $data,
                    'count' => is_array($data) ? count($data) : 0
                ]);
                break;

            case 'generate-raw':
                console_log("🔧 Handling generate-raw action...");
                $result = $fetcher->generateRawFiles($refresh);
                echo json_encode($result);
                break;

            case 'generate-products':
                console_log("🔧 Handling generate-products action...");
                $result = $fetcher->generateProcessedProductsFile($refresh);
                echo json_encode($result);
                break;

            default:
                throw new Exception('Invalid action. Use ?action=catalog, ?action=products, ?action=generate-raw, or ?action=generate-products');
        }

        console_log("✅ Request completed successfully");

    } catch (Exception $e) {
        console_log("❌ Request failed", $e->getMessage());
        
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}
?>