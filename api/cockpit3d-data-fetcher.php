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
     * Generate compiled-products.js from static + raw products + raw catalog
     * This is the base structure that admin panel will customize
     */
    public function generateCompiledProducts($refresh = false) {
        console_log("🔧 Step 2: Generating compiled-products.js...");
        
        try {
            // Ensure raw files exist
            $rawResult = $this->generateRawFiles($refresh);
            if (!$rawResult['success']) {
                throw new Exception("Failed to generate raw files");
            }
            
            // Load static products
            $staticProducts = $this->loadStaticProducts();
            
            // Load and match APIs
            $cockpitProducts = $this->processApiProducts();
            
            // Combine and save
            $allProducts = array_merge($staticProducts, $cockpitProducts);
            $this->saveCompiledProductsFile($allProducts, $staticProducts, $cockpitProducts);
            
            return [
                'success' => true,
                'file' => 'compiled-products.js',
                'total_products' => count($allProducts),
                'static_count' => count($staticProducts),
                'cockpit3d_count' => count($cockpitProducts)
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Process API products with SKU/name matching
     */
    private function processApiProducts() {
        $rawProductsFile = $this->cacheDir . 'cockpit3d-raw-products.js';
        $rawCatalogFile = $this->cacheDir . 'cockpit3d-raw-catalog.js';
        
        if (!file_exists($rawProductsFile) || !file_exists($rawCatalogFile)) {
            console_log("⚠️ Raw files missing, returning empty array");
            return [];
        }
        
        // Parse raw data
        $rawProducts = $this->parseJsFile($rawProductsFile, 'cockpit3dRawProducts');
        $rawCatalog = $this->parseJsFile($rawCatalogFile, 'cockpit3dRawCatalog');
        
        $processedProducts = [];
        foreach ($rawProducts as $rawProduct) {
            $catalogMatch = $this->findCatalogMatch($rawProduct, $rawCatalog);
            $transformed = $this->buildProductStructure($rawProduct, $catalogMatch);
            if ($transformed) {
                $processedProducts[] = $transformed;
            }
        }
        
        return $processedProducts;
    }

    /**
     * Build complete product structure for admin panel
     */
    private function buildProductStructure($rawProduct, $catalogMatch) {
        return [
            // Core fields that match your order system
            'id' => $rawProduct['id'],
            'name' => $rawProduct['name'],
            'slug' => $this->createSlug($rawProduct['name']),
            'sku' => $rawProduct['sku'] ?? 'sku_' . $rawProduct['id'],
            'basePrice' => (float)($rawProduct['price'] ?? 0),
            'description' => $rawProduct['name'],
            'longDescription' => '',
            'requiresImage' => !$this->isLightbaseProduct($rawProduct['name']),
            'featured' => false,
            
            // Images for product pages
            'images' => $this->buildProductImages($rawProduct),
            
            // Auto-mapped Cockpit3D options
            'cockpit3dOptions' => $this->buildCockpit3dOptions($catalogMatch),
            
            // Product options that match your current system
            'sizes' => $this->buildSizesWithValueIds($catalogMatch),
            'lightBases' => $this->buildStandardLightbaseOptions(),
            'backgroundOptions' => $this->buildStandardBackgroundOptions(),
            'textOptions' => $this->buildStandardTextOptions(),
            
            // Source tracking
            'source' => 'cockpit3d',
            'catalogMatched' => $catalogMatch ? true : false
        ];
    }

    /**
     * Build the JavaScript content for compiled-products.js
     */
    private function buildCompiledProductsContent($allProducts, $staticProducts, $cockpitProducts) {
        $timestamp = date('Y-m-d H:i:s');
        $isoTimestamp = date('c');
        
        $jsContent = "// compiled-products.js - Base Structure for Admin Customization\n";
        $jsContent .= "// Generated: {$timestamp}\n";
        $jsContent .= "// Sources: static-products.js + cockpit3d-raw-products.js + cockpit3d-raw-catalog.js\n";
        $jsContent .= "// This file contains auto-mapped Cockpit3D options and is the base for admin panel\n";
        $jsContent .= "// Admin panel will customize this and output final-product-list.js\n\n";
        
        $jsContent .= "export const compiledProducts = " . json_encode($allProducts, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . ";\n\n";
        
        $jsContent .= "export const compilationInfo = {\n";
        $jsContent .= "  generated_at: \"{$isoTimestamp}\",\n";
        $jsContent .= "  total_products: " . count($allProducts) . ",\n";
        $jsContent .= "  static_products: " . count($staticProducts) . ",\n";
        $jsContent .= "  cockpit3d_products: " . count($cockpitProducts) . ",\n";
        $jsContent .= "  auto_mapped: true,\n";
        $jsContent .= "  ready_for_admin: true\n";
        $jsContent .= "};\n\n";
        
        $jsContent .= "// Structure info for admin panel\n";
        $jsContent .= "export const productStructure = {\n";
        $jsContent .= "  base_fields: ['id', 'name', 'slug', 'sku', 'basePrice', 'description', 'longDescription'],\n";
        $jsContent .= "  cockpit3d_fields: ['cockpit3dOptions', 'sizes', 'lightBases', 'backgroundOptions', 'textOptions'],\n";
        $jsContent .= "  customizable_fields: ['name', 'description', 'longDescription', 'basePrice', 'featured', 'images'],\n";
        $jsContent .= "  pricing_fields: ['sizes', 'lightBases', 'backgroundOptions', 'textOptions']\n";
        $jsContent .= "};\n\n";
        
        $jsContent .= "export default compiledProducts;\n";
        
        return $jsContent;
    }

    /**
     * Enhanced transform with complete structure for admin customization
     */
    private function transformCockpit3dProduct($rawProduct, $catalog = []) {
        console_log("🔄 Transforming product with complete structure", [
            'product_id' => $rawProduct['id'],
            'product_name' => $rawProduct['name'],
            'product_sku' => $rawProduct['sku'] ?? 'NO_SKU',      
            'is_lightbase' => $isLightbase ? 'YES' : 'NO'
        ]);
        
        // Find matching catalog entry
        $catalogMatch = $this->findCatalogMatch($rawProduct, $catalog);
        
        // Build complete product structure
        $transformed = [
            // Basic product info
            'id' => $rawProduct['id'],
            'name' => $rawProduct['name'],
            'slug' => $this->createSlug($rawProduct['name']),
            'sku' => $rawProduct['sku'] ?? 'sku_' . $rawProduct['id'],
            'basePrice' => (float)($rawProduct['price'] ?? 0),
            'description' => $rawProduct['name'],
            'longDescription' => '',
            'requiresImage' => !$this->isLightbaseProduct($rawProduct['name']),
            'featured' => false,
            
            // Images
            'images' => $this->buildProductImages($rawProduct),
            
            // Cockpit3D mappings (auto-generated)
            'cockpit3dOptions' => $this->buildCockpit3dOptions($catalogMatch),
            
            // Product options with Cockpit3D value IDs
            'sizes' => $this->buildSizesWithValueIds($catalogMatch),
            'lightBases' => $this->buildLightbaseOptions($catalog),
            'backgroundOptions' => $this->buildBackgroundOptions($catalog),
            'textOptions' => $this->buildTextOptions($catalog),
            
            // Metadata for admin panel
            'source' => 'cockpit3d',
            'catalogMatched' => $catalogMatch ? true : false,
            'autoMapped' => true
        ];
        
        console_log("✅ Product transformed with complete structure", [
            'name' => $transformed['name'],
            'catalog_matched' => $catalogMatch ? 'YES' : 'NO',
            'option_ids_count' => count($transformed['cockpit3dOptions']),
            'sizes_count' => count($transformed['sizes']),
            'lightbases_count' => count($transformed['lightBases']),
            'requires_image' => $transformed['requiresImage'] ? 'YES' : 'NO'
        ]);
        
        return $transformed;
    }
    /**
     * Find matching catalog entry by SKU/name
     */
    private function findCatalogMatch($product, $catalog) {
        console_log("🔍 Finding catalog match for", [
            'sku' => $product['sku'],
            'name' => $product['name']
        ]);
        
        foreach ($catalog as $category) {
            if (!isset($category['products']) || !is_array($category['products'])) {
                continue;
            }
            
            foreach ($category['products'] as $catalogProduct) {
                // Try exact SKU match first
                if (isset($catalogProduct['sku']) && $catalogProduct['sku'] === $product['sku']) {
                    console_log("✅ Found SKU match", $catalogProduct['sku']);
                    return $catalogProduct;
                }
                
                // Try name match (normalized)
                $productName = $this->normalizeName($product['name']);
                $catalogName = $this->normalizeName($catalogProduct['name']);
                
                if ($productName === $catalogName) {
                    console_log("✅ Found name match", $catalogProduct['name']);
                    return $catalogProduct;
                }
                
                // Try partial name match (80% similarity)
                $similarity = 0;
                similar_text($productName, $catalogName, $similarity);
                if ($similarity > 80) {
                    console_log("✅ Found similar name match", [
                        'product' => $product['name'],
                        'catalog' => $catalogProduct['name'],
                        'similarity' => $similarity
                    ]);
                    return $catalogProduct;
                }
            }
        }
        
        console_log("❌ No catalog match found for", $product['name']);
        return null;
    }

    /**
     * Normalize product names for matching
     */
    private function normalizeName($name) {
        $normalized = strtolower(trim($name));
        $normalized = preg_replace('/[^a-z0-9\s]/', '', $normalized);
        $normalized = preg_replace('/\s+/', ' ', $normalized);
        return $normalized;
    }

    /**
     * Build Cockpit3D option mappings from catalog match
     */
    private function buildCockpit3dOptions($catalogMatch) {
        $options = [];
        
        if (!$catalogMatch || !isset($catalogMatch['options'])) {
            console_log("⚠️ No catalog match or options found");
            return $options;
        }
        
        foreach ($catalogMatch['options'] as $option) {
            switch (strtolower($option['name'])) {
                case 'size':
                    $options['sizeOptionId'] = $option['id'];
                    console_log("📏 Found size option ID", $option['id']);
                    break;
                    
                case 'face':
                    $options['faceOptionId'] = $option['id'];
                    console_log("🖼️ Found face option ID", $option['id']);
                    break;
                    
                case 'light base':
                case 'lightbase':
                    $options['lightBaseOptionId'] = $option['id'];
                    console_log("💡 Found light base option ID", $option['id']);
                    break;
                    
                case 'service_queue':
                    $options['serviceQueueOptionId'] = $option['id'];
                    console_log("⚡ Found service queue option ID", $option['id']);
                    break;
                    
                case 'customer text':
                    $options['customerTextOptionId'] = $option['id'];
                    console_log("✏️ Found customer text option ID", $option['id']);
                    break;
                    
                case '2d backdrop':
                    $options['twoDBackdropOptionId'] = $option['id'];
                    console_log("🎨 Found 2D backdrop option ID", $option['id']);
                    break;
                    
                case '3d backdrop':
                    $options['threeDBackdropOptionId'] = $option['id'];
                    console_log("🎨 Found 3D backdrop option ID", $option['id']);
                    break;
            }
        }
        
        console_log("✅ Built Cockpit3D options", $options);
        return $options;
    }

    /**
     * Build sizes array with Cockpit3D value IDs
     */
    private function buildSizesWithValueIds($catalogMatch) {
        $sizes = [];
        
        if (!$catalogMatch || !isset($catalogMatch['options'])) {
            return $sizes;
        }
        
        // Find the Size option
        foreach ($catalogMatch['options'] as $option) {
            if (strtolower($option['name']) === 'size' && isset($option['values'])) {
                foreach ($option['values'] as $sizeValue) {
                    $sizes[] = [
                        'id' => (string)$sizeValue['id'],
                        'name' => $sizeValue['name'],
                        'price' => isset($sizeValue['price']) ? (float)$sizeValue['price'] : 0,
                        'cockpit3dValueId' => (string)$sizeValue['id'] // Auto-mapped!
                    ];
                }
                
                console_log("📏 Built sizes with value IDs", count($sizes) . " sizes");
                break;
            }
        }
        
        return $sizes;
    }

    /**
     * Build product images array
     */
    private function buildProductImages($rawProduct) {
        $images = [];
        
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
            
            $images[] = [
                'src' => $localImagePath,
                'isMain' => true
            ];
        } else {
            $images[] = [
                'src' => "https://placehold.co/600x400?text=Missing+Image",
                'isMain' => true
            ];
        }
        
        return $images;
    }

    /**
     * Build lightbase options from catalog
     */
    private function buildLightbaseOptions($catalog) {
        $options = [
            [
                'id' => 'none',
                'name' => 'No Base',
                'price' => 0,
                'cockpit3dValueId' => null
            ]
        ];
        
        // Find lightbase products in catalog
        foreach ($catalog as $category) {
            if (isset($category['products']) && is_array($category['products'])) {
                foreach ($category['products'] as $product) {
                    if ($this->isLightbaseProduct($product['name'])) {
                        $options[] = [
                            'id' => $this->createSlug($product['name']),
                            'name' => $product['name'],
                            'price' => isset($product['price']) ? (float)$product['price'] : 0,
                            'cockpit3dValueId' => $product['id'] // Link to catalog product ID
                        ];
                    }
                }
            }
        }
        
        return $options;
    }

    /**
     * Build background options
     */
    private function buildBackgroundOptions($catalog) {
        return [
            [
                'id' => 'rm',
                'name' => 'Remove Backdrop',
                'price' => 0,
                'cockpit3dValueId' => null
            ],
            [
                'id' => '2d',
                'name' => '2D Backdrop',
                'price' => 12.0,
                'cockpit3dValueId' => null // Will be filled by admin or auto-detected
            ],
            [
                'id' => '3d',
                'name' => '3D Backdrop',
                'price' => 15.0,
                'cockpit3dValueId' => null // Will be filled by admin or auto-detected
            ]
        ];
    }

    /**
     * Build text options
     */
    private function buildTextOptions($catalog) {
        return [
            [
                'id' => 'none',
                'name' => 'No Text',
                'price' => 0,
                'cockpit3dValueId' => null
            ],
            [
                'id' => 'customText',
                'name' => 'Custom Text',
                'price' => 9.5,
                'cockpit3dValueId' => null // Will be filled by admin
            ]
        ];
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
     * Extract lightbase options with prices
     */
    private function extractLightbaseOptions($catalog) {
        $options = [
            [
                'id' => 'none',
                'name' => 'No Base',
                'price' => 0
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
                            'price' => isset($product['price']) ? (float)$product['price'] : 0
                        ];
                    }
                }
            }
        }
        
        // FIXED: Validate prices in the options we just created
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

    // /**
    //  * Extract background options with prices
    //  */
    // private function extractBackgroundOptions($catalog) {
    //     $options = [
    //         [
    //             'id' => 'rm',
    //             'name' => 'Remove Backdrop',
    //             'price' => 0
    //         ]
    //     ];
        
    //     // Find backdrop prices in catalog options
    //     $twoDPrice = 12; // Fallback
    //     $threeDPrice = 15; // Fallback
        
    //     foreach ($catalog as $category) {
    //         if (isset($category['options'])) {
    //             foreach ($category['options'] as $option) {
    //                 if ($option['name'] === '2D Backdrop' && isset($option['price'])) {
    //                     $twoDPrice = (float)$option['price'];
    //                 }
    //                 if ($option['name'] === '3D Backdrop' && isset($option['price'])) {
    //                     $threeDPrice = (float)$option['price'];
    //                 }
    //             }
    //         }
    //     }
        
    //     $options[] = [
    //         'id' => '2d',
    //         'name' => '2D Backdrop',
    //         'price' => $twoDPrice
    //     ];
        
    //     $options[] = [
    //         'id' => '3d',
    //         'name' => '3D Backdrop',
    //         'price' => $threeDPrice
    //     ];
        
    //     return $options;
    // }

    // /**
    //  * Extract text options with prices
    //  */
    // private function extractTextOptions($catalog) {
    //     $options = [
    //         [
    //             'id' => 'none',
    //             'name' => 'No Text',
    //             'price' => 0
    //         ]
    //     ];
        
    //     // Find text option prices in catalog
    //     $customTextPrice = 9.5; // Fallback
        
    //     foreach ($catalog as $category) {
    //         if (isset($category['options'])) {
    //             foreach ($category['options'] as $option) {
    //                 if (($option['name'] === 'Custom Text' || $option['name'] === 'Custom Option') 
    //                     && isset($option['price'])) {
    //                     $customTextPrice = (float)$option['price'];
    //                     break;
    //                 }
    //             }
    //         }
    //     }
        
    //     $options[] = [
    //         'id' => 'customText',
    //         'name' => 'Custom Text',
    //         'price' => $customTextPrice
    //     ];
        
    //     return $options;
    // }

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

    /**
     * Generate compiled-products.js from static + raw APIs
     */
    public function generateCompiledProductsFile($refresh = false) {
        console_log("🔧 Generating compiled-products.js (static + mapped Cockpit3D)...");
        
        try {
            // Ensure raw data exists
            $rawResult = $this->generateRawFiles($refresh);
            if (!$rawResult['success']) {
                throw new Exception("Failed to generate raw files: " . ($rawResult['error'] ?? 'Unknown error'));
            }
            
            // Load static products
            $staticProducts = $this->loadStaticProducts();
            console_log("📁 Static products loaded", count($staticProducts));
            
            // Load and parse raw data
            $rawProductsFile = $this->cacheDir . 'cockpit3d-raw-products.js';
            $rawCatalogFile = $this->cacheDir . 'cockpit3d-raw-catalog.js';
            
            $cockpitProducts = [];
            
            if (file_exists($rawProductsFile) && file_exists($rawCatalogFile)) {
                // Parse products
                $rawProductsContent = file_get_contents($rawProductsFile);
                if (preg_match('/export\s+const\s+cockpit3dRawProducts\s*=\s*(\[.*?\]);/s', $rawProductsContent, $matches)) {
                    $rawProducts = json_decode($matches[1], true);
                    
                    // Parse catalog
                    $rawCatalogContent = file_get_contents($rawCatalogFile);
                    if (preg_match('/export\s+const\s+cockpit3dRawCatalog\s*=\s*(\[.*?\]);/s', $rawCatalogContent, $matches)) {
                        $rawCatalog = json_decode($matches[1], true);
                        
                        console_log("📊 Processing APIs into compiled structure", [
                            'products_count' => count($rawProducts),
                            'catalog_items' => count($rawCatalog)
                        ]);
                        
                        // Transform with enhanced matching
                        foreach ($rawProducts as $rawProduct) {
                            $transformed = $this->transformCockpit3dProduct($rawProduct, $rawCatalog);
                            if ($transformed) {
                                $cockpitProducts[] = $transformed;
                            }
                        }
                    }
                }
            }
            
            // Combine all products
            $compiledProducts = array_merge($staticProducts, $cockpitProducts);
            
            // Generate compiled-products.js
            $compiledProductsFile = $this->cacheDir . 'compiled-products.js';
            $jsContent = "// Compiled Products (Static + Auto-Mapped Cockpit3D APIs) - " . date('Y-m-d H:i:s') . "\n";
            $jsContent .= "// Base structure for admin panel customization\n";
            $jsContent .= "// Admin panel will generate final-product-list.js from this\n\n";
            
            $jsContent .= "export const compiledProducts = " . json_encode($compiledProducts, JSON_PRETTY_PRINT) . ";\n\n";
            
            $jsContent .= "export const compilationInfo = {\n";
            $jsContent .= "  generated_at: \"" . date('c') . "\",\n";
            $jsContent .= "  static_products: " . count($staticProducts) . ",\n";
            $jsContent .= "  cockpit3d_products: " . count($cockpitProducts) . ",\n";
            $jsContent .= "  total_products: " . count($compiledProducts) . ",\n";
            $jsContent .= "  auto_mapped_options: true,\n";
            $jsContent .= "  ready_for_admin: true\n";
            $jsContent .= "};\n\n";
            
            $jsContent .= "// Default export for compatibility\n";
            $jsContent .= "export default compiledProducts;\n";
            
            $result = file_put_contents($compiledProductsFile, $jsContent);
            
            if ($result === false) {
                throw new Exception("Failed to write compiled-products.js file");
            }
            
            console_log("✅ compiled-products.js generated successfully", [
                'file' => $compiledProductsFile,
                'total_products' => count($compiledProducts),
                'static_count' => count($staticProducts),
                'cockpit3d_count' => count($cockpitProducts),
                'file_size' => $result . ' bytes'
            ]);
            
            // Log sample structure for debugging
            if (count($compiledProducts) > 0) {
                console_log("📋 Sample compiled product structure", [
                    'keys' => array_keys($compiledProducts[0]),
                    'has_cockpit3d_options' => isset($compiledProducts[0]['cockpit3dOptions']),
                    'has_sizes' => isset($compiledProducts[0]['sizes']),
                    'has_images' => isset($compiledProducts[0]['images'])
                ]);
            }
            
            return [
                'success' => true,
                'file' => 'compiled-products.js',
                'products_count' => count($compiledProducts),
                'static_count' => count($staticProducts),
                'cockpit3d_count' => count($cockpitProducts),
                'file_size' => $result,
                'ready_for_admin' => true
            ];
            
        } catch (Exception $e) {
            console_log("❌ Error generating compiled-products.js", $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
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

            case 'generate-raw':
                console_log("🔧 Handling generate-raw action...");
                $result = $fetcher->generateRawFiles($refresh);
                echo json_encode($result);
                break;


            case 'generate-compiled':
                console_log("🔧 Handling generate-compiled action...");
                $result = $fetcher->generateCompiledProductsFile($refresh);
                echo json_encode($result);
                break;

            default:
                throw new Exception('Invalid action. Use ?action=generate-compiled, ?action=generate-raw');
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