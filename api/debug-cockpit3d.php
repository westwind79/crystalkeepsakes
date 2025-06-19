<?php
// api/test-endpoint.php - Simple test to isolate the 500 error

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/test_errors.log');

try {
    $action = $_GET['action'] ?? 'test';
    
    switch ($action) {
        case 'test':
            echo json_encode([
                'success' => true,
                'message' => 'Test endpoint working',
                'timestamp' => date('Y-m-d H:i:s'),
                'server_info' => [
                    'php_version' => PHP_VERSION,
                    'working_directory' => getcwd(),
                    'script_path' => __FILE__
                ]
            ]);
            break;
            
        case 'check-env':
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
                    
                    if ($envKey === $key) {
                        return $envValue;
                    }
                }
                
                return null;
            }
            
            $envStatus = [
                'env_file_exists' => file_exists(dirname(__DIR__) . '/.env'),
                'env_path' => dirname(__DIR__) . '/.env',
                'cockpit3d_base_url' => getEnvVariable('COCKPIT3D_BASE_URL') ? 'SET' : 'NOT SET',
                'cockpit3d_username' => getEnvVariable('COCKPIT3D_USERNAME') ? 'SET' : 'NOT SET',
                'cockpit3d_password' => getEnvVariable('COCKPIT3D_PASSWORD') ? 'SET' : 'NOT SET',
                'cockpit3d_api_token' => getEnvVariable('COCKPIT3D_API_TOKEN') ? 'SET' : 'NOT SET'
            ];
            
            echo json_encode([
                'success' => true,
                'env_status' => $envStatus
            ]);
            break;
            
        case 'create-test-products':
            // Create a simple test products file
            $testProducts = [
                [
                    'id' => '999',
                    'name' => 'Test Static Product',
                    'slug' => 'test-static-product',
                    'sku' => 'test_001',
                    'basePrice' => 99.99,
                    'description' => 'Test product for debugging',
                    'longDescription' => 'This is a test product created by the debug endpoint',
                    'requiresImage' => false,
                    'images' => [
                        [
                            'src' => '/img/products/test.jpg',
                            'isMain' => true
                        ]
                    ]
                ]
            ];
            
            $jsContent = "// Test combined products file - " . date('Y-m-d H:i:s') . "\n\n";
            $jsContent .= "export const cockpit3dProducts = " . json_encode($testProducts, JSON_PRETTY_PRINT) . ";\n\n";
            $jsContent .= "export const generatedAt = \"" . date('c') . "\";\n\n";
            $jsContent .= "export const isRealTimeData = false;\n\n";
            $jsContent .= "export const sourceInfo = {\n";
            $jsContent .= "  static_products: 1,\n";
            $jsContent .= "  cockpit3d_products: 0,\n";
            $jsContent .= "  total: 1\n";
            $jsContent .= "};\n";
            
            // Fix the path - go up from dist/api to the project root, then into src/data
            $dataDir = dirname(dirname(__DIR__)) . '/src/data';
            if (!is_dir($dataDir)) {
                mkdir($dataDir, 0755, true);
            }
            
            $filePath = $dataDir . '/cockpit3d-products.js';
            $result = file_put_contents($filePath, $jsContent);
            
            echo json_encode([
                'success' => $result !== false,
                'file_path' => $filePath,
                'file_size' => $result,
                'products_count' => count($testProducts)
            ]);
            break;
            
        default:
            throw new Exception('Invalid action. Use ?action=test, ?action=check-env, or ?action=create-test-products');
    }
    
} catch (Exception $e) {
    error_log('Test endpoint error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>