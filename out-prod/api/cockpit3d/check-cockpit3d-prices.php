<?php
/**
 * CockPit3D Price Diagnostic Tool
 * This script will show you EXACTLY what pricing data is available in the API
 * 
 * Usage: Place in your /api/ folder and access via:
 * http://localhost:8888/api/check-cockpit3d-prices.php
 */

header('Content-Type: text/html; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include your existing fetcher
require_once __DIR__ . '/cockpit3d-data-fetcher2.php';

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CockPit3D Price Diagnostic</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #72B01D 0%, #5c8d17 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .section {
            background: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .success { color: #28a745; font-weight: bold; }
        .error { color: #dc3545; font-weight: bold; }
        .warning { color: #ffc107; font-weight: bold; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #72B01D;
            color: white;
            font-weight: 600;
        }
        tr:hover {
            background: #f8f9fa;
        }
        .price-match { background: #d4edda !important; }
        .price-mismatch { background: #f8d7da !important; }
        .json-container {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 12px;
        }
        .stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .stat-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #72B01D;
        }
        .stat-label {
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #343a40;
            margin-top: 5px;
        }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            background: #72B01D;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-right: 10px;
            margin-top: 10px;
        }
        .btn:hover {
            background: #5c8d17;
        }
        code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 CockPit3D Price Diagnostic Tool</h1>
        <p>Checking what pricing data is available in your API...</p>
    </div>

    <?php
    try {
        echo '<div class="section">';
        echo '<h2>📡 Step 1: Testing API Connection</h2>';
        
        $fetcher = new CockPit3DFetcher();
        
        if (!$fetcher->hasCredentials()) {
            echo '<p class="error">❌ Missing CockPit3D credentials in .env file</p>';
            echo '<p>Required variables: COCKPIT3D_USERNAME, COCKPIT3D_PASSWORD, COCKPIT3D_API_TOKEN</p>';
            exit;
        }
        
        echo '<p class="success">✅ Credentials found</p>';
        echo '</div>';
        
        // Fetch products
        echo '<div class="section">';
        echo '<h2>📦 Step 2: Fetching Products</h2>';
        
        $products = $fetcher->getProducts();
        
        echo '<p class="success">✅ Retrieved ' . count($products) . ' products</p>';
        
        // Statistics
        echo '<div class="stat-grid">';
        
        $productsWithPrice = 0;
        $productsWithOptions = 0;
        $productsWithSizes = 0;
        $totalOptions = 0;
        
        foreach ($products as $product) {
            if (isset($product['price']) && $product['price'] > 0) {
                $productsWithPrice++;
            }
            if (isset($product['options']) && is_array($product['options'])) {
                $productsWithOptions++;
                $totalOptions += count($product['options']);
                
                foreach ($product['options'] as $option) {
                    if ($option['name'] === 'Size') {
                        $productsWithSizes++;
                        break;
                    }
                }
            }
        }
        
        echo '<div class="stat-card">';
        echo '<div class="stat-label">Total Products</div>';
        echo '<div class="stat-value">' . count($products) . '</div>';
        echo '</div>';
        
        echo '<div class="stat-card">';
        echo '<div class="stat-label">With Base Price</div>';
        echo '<div class="stat-value">' . $productsWithPrice . '</div>';
        echo '</div>';
        
        echo '<div class="stat-card">';
        echo '<div class="stat-label">With Options</div>';
        echo '<div class="stat-value">' . $productsWithOptions . '</div>';
        echo '</div>';
        
        echo '<div class="stat-card">';
        echo '<div class="stat-label">With Sizes</div>';
        echo '<div class="stat-value">' . $productsWithSizes . '</div>';
        echo '</div>';
        
        echo '</div>'; // stat-grid
        echo '</div>'; // section
        
        // Detailed product pricing table
        echo '<div class="section">';
        echo '<h2>💰 Step 3: Product Pricing Analysis</h2>';
        echo '<p>This shows the pricing structure for each product</p>';
        
        echo '<table>';
        echo '<thead>';
        echo '<tr>';
        echo '<th>Product Name</th>';
        echo '<th>SKU</th>';
        echo '<th>Base Price</th>';
        echo '<th>Size Options</th>';
        echo '<th>Other Options</th>';
        echo '</tr>';
        echo '</thead>';
        echo '<tbody>';
        
        foreach ($products as $product) {
            echo '<tr>';
            echo '<td><strong>' . htmlspecialchars($product['name']) . '</strong></td>';
            echo '<td>' . htmlspecialchars($product['sku']) . '</td>';
            echo '<td>$' . number_format($product['price'], 2) . '</td>';
            
            // Size options
            echo '<td>';
            $sizeOptions = [];
            if (isset($product['options']) && is_array($product['options'])) {
                foreach ($product['options'] as $option) {
                    if ($option['name'] === 'Size' && isset($option['values'])) {
                        foreach ($option['values'] as $value) {
                            $sizePrice = isset($value['price']) ? $value['price'] : 'N/A';
                            $sizeOptions[] = $value['name'] . ': $' . number_format($sizePrice, 2);
                        }
                    }
                }
            }
            echo !empty($sizeOptions) ? implode('<br>', $sizeOptions) : '<em>No sizes</em>';
            echo '</td>';
            
            // Other options
            echo '<td>';
            $otherOptions = [];
            if (isset($product['options']) && is_array($product['options'])) {
                foreach ($product['options'] as $option) {
                    if ($option['name'] !== 'Size') {
                        $optionPrice = isset($option['price']) ? '$' . number_format($option['price'], 2) : 'N/A';
                        $otherOptions[] = $option['name'] . ': ' . $optionPrice;
                    }
                }
            }
            echo !empty($otherOptions) ? implode('<br>', $otherOptions) : '<em>No options</em>';
            echo '</td>';
            
            echo '</tr>';
        }
        
        echo '</tbody>';
        echo '</table>';
        echo '</div>';
        
        // Fetch catalog
        echo '<div class="section">';
        echo '<h2>📋 Step 4: Fetching Catalog</h2>';
        
        $catalog = $fetcher->getCatalog();
        
        echo '<p class="success">✅ Retrieved ' . count($catalog) . ' categories</p>';
        
        // Show catalog options
        echo '<h3>Catalog-Level Options Found:</h3>';
        echo '<ul>';
        
        $catalogOptions = [];
        foreach ($catalog as $category) {
            if (isset($category['options']) && is_array($category['options'])) {
                foreach ($category['options'] as $option) {
                    $optionName = $option['name'];
                    $optionPrice = isset($option['price']) ? '$' . number_format($option['price'], 2) : 'N/A';
                    
                    if (!isset($catalogOptions[$optionName])) {
                        $catalogOptions[$optionName] = $optionPrice;
                    }
                }
            }
        }
        
        if (!empty($catalogOptions)) {
            foreach ($catalogOptions as $name => $price) {
                echo '<li><strong>' . htmlspecialchars($name) . '</strong>: ' . $price . '</li>';
            }
        } else {
            echo '<li><em>No catalog-level options found</em></li>';
        }
        
        echo '</ul>';
        echo '</div>';
        
        // Sample product JSON
        echo '<div class="section">';
        echo '<h2>🔬 Step 5: Sample Product JSON</h2>';
        echo '<p>Here\'s the raw JSON for the first product to see the exact structure:</p>';
        
        if (!empty($products)) {
            echo '<div class="json-container">';
            echo '<pre>' . json_encode($products[0], JSON_PRETTY_PRINT) . '</pre>';
            echo '</div>';
        }
        
        echo '</div>';
        
        // Comparison with screenshot
        echo '<div class="section">';
        echo '<h2>📸 Step 6: Screenshot vs API Comparison</h2>';
        echo '<p>Based on your screenshot, let\'s check if we can find matching prices...</p>';
        
        // Products from screenshot to check
        $screenshotProducts = [
            'customer_text' => ['name' => 'Customer text', 'price_1pcs' => 20.00],
            'custom_design' => ['name' => 'Custom Design', 'price_1pcs' => 25.00],
            'Face' => ['name' => 'Face', 'price_1pcs' => 9.00],
            '2d_backdrop' => ['name' => '2D Backdrop', 'price_1pcs' => 12.00],
            '3d_backdrop' => ['name' => '3D Backdrop', 'price_1pcs' => 15.00],
        ];
        
        echo '<table>';
        echo '<thead><tr>';
        echo '<th>Screenshot Product</th>';
        echo '<th>Expected Price</th>';
        echo '<th>API Status</th>';
        echo '<th>API Price</th>';
        echo '</tr></thead>';
        echo '<tbody>';
        
        foreach ($screenshotProducts as $sku => $expectedData) {
            $found = false;
            $apiPrice = 'N/A';
            
            foreach ($products as $product) {
                if ($product['sku'] === $sku || stripos($product['name'], $expectedData['name']) !== false) {
                    $found = true;
                    $apiPrice = '$' . number_format($product['price'], 2);
                    break;
                }
            }
            
            $rowClass = $found ? 'price-match' : 'price-mismatch';
            
            echo '<tr class="' . $rowClass . '">';
            echo '<td>' . htmlspecialchars($expectedData['name']) . ' <code>' . $sku . '</code></td>';
            echo '<td>$' . number_format($expectedData['price_1pcs'], 2) . '</td>';
            echo '<td>' . ($found ? '<span class="success">✅ Found</span>' : '<span class="error">❌ Not Found</span>') . '</td>';
            echo '<td>' . $apiPrice . '</td>';
            echo '</tr>';
        }
        
        echo '</tbody>';
        echo '</table>';
        echo '</div>';
        
        // Recommendations
        echo '<div class="section">';
        echo '<h2>💡 Recommendations</h2>';
        
        echo '<h3>✅ What IS Available:</h3>';
        echo '<ul>';
        echo '<li>Base product prices from <code>$product["price"]</code></li>';
        echo '<li>Size-based pricing from <code>$product["options"]</code> where <code>name === "Size"</code></li>';
        echo '<li>Additional options with prices (2D/3D backdrop, custom text, etc.)</li>';
        echo '<li>Product SKUs for matching</li>';
        echo '</ul>';
        
        echo '<h3>🔧 Next Steps:</h3>';
        echo '<ol>';
        echo '<li>Use the <strong>Products API</strong> (<code>/rest/V2/products</code>) for product-specific pricing</li>';
        echo '<li>Use the <strong>Catalog API</strong> (<code>/rest/V2/catalog</code>) for add-on options</li>';
        echo '<li>Map size options from <code>$product["options"]</code> array</li>';
        echo '<li>Store pricing in your static products file or database for faster access</li>';
        echo '</ol>';
        
        echo '<h3>📝 Sample Code for Price Extraction:</h3>';
        echo '<div class="json-container"><pre>';
        echo htmlspecialchars('// Extract size prices
foreach ($product["options"] as $option) {
    if ($option["name"] === "Size") {
        foreach ($option["values"] as $size) {
            $sizePrice = (float)$size["price"];
            $sizeName = $size["name"];
            // Store: $sizes[] = ["name" => $sizeName, "price" => $sizePrice];
        }
    }
}

// Extract catalog options
foreach ($catalog as $category) {
    foreach ($category["options"] as $option) {
        if ($option["name"] === "2D Backdrop") {
            $twoDBackdropPrice = (float)$option["price"];
        }
        if ($option["name"] === "3D Backdrop") {
            $threeDBackdropPrice = (float)$option["price"];
        }
    }
}');
        echo '</pre></div>';
        
        echo '</div>';
        
        // Actions
        echo '<div class="section">';
        echo '<h2>🚀 Quick Actions</h2>';
        echo '<a href="?action=generate" class="btn">Generate Static Products File</a>';
        echo '<a href="?action=raw" class="btn">View Raw API Response</a>';
        echo '<a href="cockpit3d-data-fetcher2.php?action=generate-products" class="btn">Update Live Products</a>';
        echo '</div>';
        
    } catch (Exception $e) {
        echo '<div class="section">';
        echo '<p class="error">❌ Error: ' . htmlspecialchars($e->getMessage()) . '</p>';
        echo '<pre>' . htmlspecialchars($e->getTraceAsString()) . '</pre>';
        echo '</div>';
    }
    ?>
</body>
</html>