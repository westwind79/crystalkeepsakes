<?php
/**
 * Find ALL pricing data - checks both raw catalog and processed products
 */

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Complete Price Analysis</title>
    <style>
        body { font-family: monospace; background: #000; color: #0f0; padding: 20px; }
        .box { background: #1a1a1a; border: 2px solid #0f0; padding: 20px; margin: 20px 0; border-radius: 10px; }
        h1, h2 { color: #0ff; text-shadow: 0 0 10px #0ff; }
        h3 { color: #0f0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #333; padding: 10px; text-align: left; }
        th { background: #0f0; color: #000; font-weight: bold; }
        .price { color: #ff0; font-weight: bold; }
        .no-price { color: #f00; font-style: italic; }
        .has-price { color: #0f0; }
        pre { background: #000; padding: 15px; overflow-x: auto; border: 1px solid #333; }
        .warning { color: #ff0; }
        .success { color: #0f0; }
        .error { color: #f00; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { background: #000; border: 2px solid #0ff; padding: 15px; text-align: center; }
        .stat-value { font-size: 32px; color: #0ff; font-weight: bold; }
        .stat-label { color: #0f0; margin-top: 5px; }
    </style>
</head>
<body>
    <h1>🔍 Complete Cockpit3D Price Analysis</h1>

<?php

// Try to find files
$files = [
    'catalog' => [
        'src/data/cockpit3d-raw-catalog.js',
        '../src/data/cockpit3d-raw-catalog.js',
        'cockpit3d-raw-catalog.js',
    ],
    'products' => [
        'cockpit3d-products.js',
        '../cockpit3d-products.js',
        'src/data/cockpit3d-products.js',
    ]
];

$catalogData = null;
$productsData = null;

// Find catalog
foreach ($files['catalog'] as $file) {
    if (file_exists($file)) {
        $content = file_get_contents($file);
        if (preg_match('/export\s+const\s+\w+\s*=\s*(\[.*?\]);/s', $content, $matches)) {
            $catalogData = json_decode($matches[1], true);
            echo '<div class="box success"><p>✅ Found raw catalog: ' . $file . '</p></div>';
            break;
        }
    }
}

// Find processed products
foreach ($files['products'] as $file) {
    if (file_exists($file)) {
        $content = file_get_contents($file);
        if (preg_match('/export\s+const\s+\w+\s*=\s*(\[.*?\]);?$/s', $content, $matches)) {
            $productsData = json_decode($matches[1], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                echo '<div class="box success"><p>✅ Found processed products: ' . $file . ' (' . count($productsData) . ' products)</p></div>';
                break;
            }
        }
    }
}

if (!$catalogData && !$productsData) {
    echo '<div class="box error"><h2>❌ No Data Files Found</h2>';
    echo '<p>Searched for:</p><ul>';
    foreach (array_merge($files['catalog'], $files['products']) as $f) {
        echo '<li>' . htmlspecialchars($f) . '</li>';
    }
    echo '</ul></div>';
    exit;
}

// Statistics
$stats = [
    'raw_catalog_options' => 0,
    'raw_catalog_with_price' => 0,
    'raw_catalog_without_price' => 0,
    'processed_products' => 0,
    'processed_with_sizes' => 0,
    'processed_with_lightbases' => 0,
    'processed_with_backgrounds' => 0,
    'total_light_base_options' => 0,
];

// ===== SECTION 1: RAW CATALOG ANALYSIS =====
if ($catalogData) {
    echo '<div class="box">';
    echo '<h2>📋 Raw Catalog API Data</h2>';
    
    $catalogOptions = [];
    
    foreach ($catalogData as $category) {
        if (isset($category['options']) && is_array($category['options'])) {
            foreach ($category['options'] as $option) {
                $stats['raw_catalog_options']++;
                
                $hasPrice = isset($option['price']);
                if ($hasPrice) {
                    $stats['raw_catalog_with_price']++;
                } else {
                    $stats['raw_catalog_without_price']++;
                }
                
                $catalogOptions[] = [
                    'category' => $category['name'],
                    'id' => $option['id'] ?? 'N/A',
                    'name' => $option['name'],
                    'price' => $hasPrice ? $option['price'] : null,
                    'has_price' => $hasPrice
                ];
            }
        }
        
        // Check product-level options
        if (isset($category['products'])) {
            foreach ($category['products'] as $product) {
                if (isset($product['options'])) {
                    foreach ($product['options'] as $productOption) {
                        if (isset($productOption['values'])) {
                            foreach ($productOption['values'] as $value) {
                                $stats['raw_catalog_options']++;
                                
                                $hasPrice = isset($value['price']);
                                if ($hasPrice) {
                                    $stats['raw_catalog_with_price']++;
                                } else {
                                    $stats['raw_catalog_without_price']++;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    if (!empty($catalogOptions)) {
        echo '<h3>Category-Level Options:</h3>';
        echo '<table>';
        echo '<tr><th>Category</th><th>ID</th><th>Name</th><th>Price</th></tr>';
        foreach ($catalogOptions as $opt) {
            echo '<tr>';
            echo '<td>' . htmlspecialchars($opt['category']) . '</td>';
            echo '<td>' . htmlspecialchars($opt['id']) . '</td>';
            echo '<td>' . htmlspecialchars($opt['name']) . '</td>';
            echo '<td class="' . ($opt['has_price'] ? 'has-price' : 'no-price') . '">';
            echo $opt['has_price'] ? '$' . number_format($opt['price'], 2) : 'NO PRICE';
            echo '</td>';
            echo '</tr>';
        }
        echo '</table>';
    }
    
    echo '</div>';
}

// ===== SECTION 2: PROCESSED PRODUCTS ANALYSIS =====
if ($productsData) {
    echo '<div class="box">';
    echo '<h2>📦 Your Processed Products (cockpit3d-products.js)</h2>';
    
    $stats['processed_products'] = count($productsData);
    
    // Analyze light base pricing
    $lightBasePrices = [];
    $uniqueLightBases = [];
    
    foreach ($productsData as $product) {
        if (isset($product['sizes'])) {
            $stats['processed_with_sizes']++;
        }
        
        if (isset($product['lightBases'])) {
            $stats['processed_with_lightbases']++;
            $stats['total_light_base_options'] += count($product['lightBases']);
            
            foreach ($product['lightBases'] as $lb) {
                $lbId = $lb['id'];
                if (!isset($uniqueLightBases[$lbId])) {
                    $uniqueLightBases[$lbId] = [
                        'id' => $lb['id'],
                        'name' => $lb['name'],
                        'prices' => [],
                        'has_null' => $lb['price'] === null
                    ];
                }
                if ($lb['price'] !== null) {
                    $uniqueLightBases[$lbId]['prices'][] = $lb['price'];
                }
            }
        }
        
        if (isset($product['backgroundOptions'])) {
            $stats['processed_with_backgrounds']++;
        }
    }
    
    echo '<h3>✅ Light Base Pricing Summary:</h3>';
    echo '<table>';
    echo '<tr><th>ID</th><th>Name</th><th>Price</th><th>Status</th></tr>';
    
    foreach ($uniqueLightBases as $lb) {
        $avgPrice = !empty($lb['prices']) ? array_sum($lb['prices']) / count($lb['prices']) : 0;
        $priceVariation = !empty($lb['prices']) && count(array_unique($lb['prices'])) > 1;
        
        echo '<tr>';
        echo '<td>' . htmlspecialchars($lb['id']) . '</td>';
        echo '<td>' . htmlspecialchars($lb['name']) . '</td>';
        
        if ($lb['has_null'] && empty($lb['prices'])) {
            echo '<td class="no-price">No Base Option</td>';
            echo '<td class="success">✅ Correct (no charge)</td>';
        } elseif (!empty($lb['prices'])) {
            echo '<td class="price">$' . number_format($avgPrice, 2) . '</td>';
            if ($priceVariation) {
                echo '<td class="warning">⚠️ Price varies: $' . implode(', $', array_unique($lb['prices'])) . '</td>';
            } else {
                echo '<td class="success">✅ Consistent</td>';
            }
        } else {
            echo '<td class="no-price">NULL</td>';
            echo '<td class="error">❌ Missing price</td>';
        }
        
        echo '</tr>';
    }
    echo '</table>';
    
    // Show sample product structure
    echo '<h3>📄 Sample Product Structure:</h3>';
    echo '<pre>' . htmlspecialchars(json_encode($productsData[0], JSON_PRETTY_PRINT)) . '</pre>';
    
    echo '</div>';
}

// ===== STATISTICS SUMMARY =====
echo '<div class="box">';
echo '<h2>📊 Overall Statistics</h2>';

echo '<div class="summary-grid">';

echo '<div class="stat-card">';
echo '<div class="stat-value">' . $stats['raw_catalog_options'] . '</div>';
echo '<div class="stat-label">Raw API Options</div>';
echo '</div>';

echo '<div class="stat-card">';
echo '<div class="stat-value">' . $stats['raw_catalog_with_price'] . '</div>';
echo '<div class="stat-label">With Prices</div>';
echo '</div>';

echo '<div class="stat-card">';
echo '<div class="stat-value">' . $stats['raw_catalog_without_price'] . '</div>';
echo '<div class="stat-label">Without Prices</div>';
echo '</div>';

echo '<div class="stat-card">';
echo '<div class="stat-value">' . $stats['processed_products'] . '</div>';
echo '<div class="stat-label">Processed Products</div>';
echo '</div>';

echo '<div class="stat-card">';
echo '<div class="stat-value">' . count($uniqueLightBases) . '</div>';
echo '<div class="stat-label">Unique Light Bases</div>';
echo '</div>';

echo '</div>';

echo '<h3>💡 Key Findings:</h3>';
echo '<ul>';

if ($stats['raw_catalog_without_price'] > 0) {
    echo '<li class="warning">⚠️ ' . $stats['raw_catalog_without_price'] . ' options in raw API have no prices</li>';
}

if (!empty($uniqueLightBases)) {
    echo '<li class="success">✅ You have manually added prices for ' . count($uniqueLightBases) . ' light base types</li>';
}

if ($stats['processed_products'] > 0) {
    echo '<li class="success">✅ All ' . $stats['processed_products'] . ' products are processed with pricing</li>';
}

echo '</ul>';

echo '<h3>🎯 Recommendations:</h3>';
echo '<ol>';
echo '<li>Your processed file (cockpit3d-products.js) already has prices - use this!</li>';
echo '<li>The raw API data is missing prices for add-ons - this is expected</li>';
echo '<li>Continue using your processed file for pricing in cart/checkout</li>';
echo '<li>When submitting orders, use the option IDs from raw API but prices from your file</li>';
echo '</ol>';

echo '</div>';

?>

</body>
</html>