<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    // Read the generated products file
    $productsFile = dirname(__DIR__) . '/src/data/cockpit3d-products.js';
    
    if (!file_exists($productsFile)) {
        throw new Exception('Products file not found');
    }
    
    $content = file_get_contents($productsFile);
    
    // Extract the JSON array from the JS export
    if (preg_match('/export\s+const\s+cockpit3dProducts\s*=\s*(\[.*?\]);/s', $content, $matches)) {
        $products = json_decode($matches[1], true);
        
        if (json_last_error() === JSON_ERROR_NONE) {
            echo json_encode([
                'success' => true,
                'products' => $products,
                'count' => count($products)
            ]);
        } else {
            throw new Exception('Failed to parse products JSON');
        }
    } else {
        throw new Exception('Could not extract products from file');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>