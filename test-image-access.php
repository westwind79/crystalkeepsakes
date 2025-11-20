<?php
/**
 * Test Image URL Access
 * Tests if images are accessible via different URL methods
 */

header('Content-Type: text/html; charset=utf-8');

// Get test order number from URL parameter
$testOrderNumber = $_GET['order'] ?? null;

?>
<!DOCTYPE html>
<html>
<head>
    <title>Image Access Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1000px;
            margin: 20px auto;
            padding: 20px;
        }
        .test-box {
            border: 2px solid #ddd;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .test-box.success {
            border-color: #28a745;
            background: #d4edda;
        }
        .test-box.error {
            border-color: #dc3545;
            background: #f8d7da;
        }
        .test-image {
            max-width: 200px;
            border: 1px solid #ccc;
            margin: 10px 0;
        }
        .url-box {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
            margin: 10px 0;
        }
        h2 {
            color: #333;
        }
        .status {
            font-weight: bold;
            padding: 5px 10px;
            border-radius: 3px;
            display: inline-block;
            margin: 10px 0;
        }
        .status.pass {
            background: #28a745;
            color: white;
        }
        .status.fail {
            background: #dc3545;
            color: white;
        }
    </style>
</head>
<body>
    <h1>🖼️ Image URL Access Test</h1>
    
    <?php if (!$testOrderNumber): ?>
        <div class="test-box error">
            <h2>⚠️ No Test Order Specified</h2>
            <p>Please run <a href="test-godaddy-upload.php">test-godaddy-upload.php</a> first to create a test image.</p>
            <p>Then come back here with: <code>?order=TEST-xxxxx</code></p>
        </div>
    <?php else: ?>
        
        <div class="test-box">
            <h2>Testing Order: <?php echo htmlspecialchars($testOrderNumber); ?></h2>
            <p>Test image filename: <code>test-item-001_raw.png</code></p>
        </div>

        <?php
        // Test different URL patterns
        $testUrls = [
            'Method 1: /uploads/order-images/' => "https://crystalkeepsakes.com/uploads/order-images/{$testOrderNumber}/test-item-001_raw.png",
            'Method 2: PHP Proxy' => "https://crystalkeepsakes.com/serve-image.php?path=" . urlencode("{$testOrderNumber}/test-item-001_raw.png"),
            'Method 3: Direct crystal-data' => "https://crystalkeepsakes.com/../crystal-data/order-images/{$testOrderNumber}/test-item-001_raw.png",
            'Method 4: Relative path' => "/crystal-data/order-images/{$testOrderNumber}/test-item-001_raw.png",
        ];

        foreach ($testUrls as $method => $url):
            // Try to check if URL is accessible
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_NOBODY, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            $isAccessible = ($httpCode == 200);
            $boxClass = $isAccessible ? 'success' : 'error';
            $statusClass = $isAccessible ? 'pass' : 'fail';
            $statusText = $isAccessible ? '✅ ACCESSIBLE' : '❌ NOT ACCESSIBLE';
        ?>
            
            <div class="test-box <?php echo $boxClass; ?>">
                <h3><?php echo htmlspecialchars($method); ?></h3>
                <div class="status <?php echo $statusClass; ?>"><?php echo $statusText; ?></div>
                
                <div class="url-box"><?php echo htmlspecialchars($url); ?></div>
                
                <p><strong>HTTP Status:</strong> <?php echo $httpCode; ?></p>
                
                <?php if ($isAccessible): ?>
                    <p><strong>Preview:</strong></p>
                    <img src="<?php echo htmlspecialchars($url); ?>" 
                         class="test-image" 
                         alt="Test image"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <p style="display:none; color: #dc3545;">❌ Image failed to load despite 200 status</p>
                <?php else: ?>
                    <p style="color: #dc3545;">Cannot load image - URL not accessible</p>
                <?php endif; ?>
                
                <p><a href="<?php echo htmlspecialchars($url); ?>" target="_blank">Open in new tab →</a></p>
            </div>
        
        <?php endforeach; ?>

        <div class="test-box">
            <h2>📋 Next Steps</h2>
            <?php
            $anyAccessible = false;
            foreach ($testUrls as $method => $url) {
                $ch = curl_init($url);
                curl_setopt($ch, CURLOPT_NOBODY, true);
                curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 5);
                curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                if ($httpCode == 200) {
                    $anyAccessible = true;
                    echo "<p>✅ <strong>{$method}</strong> is working!</p>";
                    echo "<p>Use this method for your application.</p>";
                    break;
                }
            }
            
            if (!$anyAccessible):
            ?>
                <p><strong>❌ No methods are working!</strong></p>
                <ol>
                    <li>Upload <code>.htaccess</code> to <code>/public_html/crystalkeepsakes.com/</code></li>
                    <li>If that doesn't work, upload <code>serve-image.php</code></li>
                    <li>Update <code>image-storage.php</code> to use working method</li>
                    <li>See <code>IMAGE_URL_ACCESS_FIX.md</code> for detailed instructions</li>
                </ol>
            <?php endif; ?>
        </div>
        
    <?php endif; ?>

    <div class="test-box">
        <h2>🔧 Quick Tests</h2>
        <ul>
            <li><a href="test-godaddy-upload.php">Run Upload Test</a> - Creates test image</li>
            <li><a href="check-path.php">Check Path Structure</a> - Verify directory setup</li>
            <li><a href="stripe-environment-check.php">Check Stripe Keys</a> - Verify environment</li>
        </ul>
    </div>
</body>
</html>
