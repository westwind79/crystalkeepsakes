<?php
// api/check-image-system.php
// Diagnostic script to verify image upload system is working

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Image Upload System Diagnostics</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
        .section { margin: 20px 0; padding: 15px; background: #2d2d2d; border-left: 4px solid #007acc; }
        .success { color: #4ec9b0; }
        .error { color: #f48771; }
        .warning { color: #ce9178; }
        .info { color: #9cdcfe; }
        h2 { color: #569cd6; margin-top: 0; }
        pre { background: #1e1e1e; padding: 10px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; }
        td { padding: 8px; border-bottom: 1px solid #3e3e3e; }
        td:first-child { color: #9cdcfe; width: 200px; }
    </style>
</head>
<body>
    <h1>ðŸ" Image Upload System Diagnostics</h1>
    
    <?php
    $projectRoot = dirname(__DIR__);
    $uploadDir = $projectRoot . '/public/img/products/cockpit3d/';
    
    // TEST 1: PHP Environment
    echo '<div class="section">';
    echo '<h2>1ï¸âƒ£ PHP Environment</h2>';
    echo '<table>';
    
    $checks = [
        'PHP Version' => phpversion(),
        'Server Software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'PHP User' => get_current_user(),
        'Operating System' => PHP_OS,
        'GD Library' => extension_loaded('gd') ? 'âœ… Enabled (' . gd_info()['GD Version'] . ')' : 'âŒ Not available',
        'Max Upload Size' => ini_get('upload_max_filesize'),
        'Max POST Size' => ini_get('post_max_size'),
        'Memory Limit' => ini_get('memory_limit'),
        'Temp Dir' => sys_get_temp_dir(),
    ];
    
    foreach ($checks as $label => $value) {
        $class = (strpos($value, 'âœ…') !== false) ? 'success' : 
                 (strpos($value, 'âŒ') !== false) ? 'error' : 'info';
        echo "<tr><td>$label</td><td class='$class'>$value</td></tr>";
    }
    echo '</table></div>';
    
    // TEST 2: Directory Permissions
    echo '<div class="section">';
    echo '<h2>2ï¸âƒ£ Directory Permissions</h2>';
    echo '<table>';
    
    $dirs = [
        'Project Root' => $projectRoot,
        'Public Dir' => $projectRoot . '/public',
        'Images Dir' => $projectRoot . '/public/img',
        'Products Dir' => $projectRoot . '/public/img/products',
        'Cockpit3D Dir' => $uploadDir,
    ];
    
    foreach ($dirs as $label => $path) {
        $exists = file_exists($path) ? 'âœ… Exists' : 'âŒ Missing';
        $writable = is_writable($path) ? 'âœ… Writable' : 'âŒ Not writable';
        $perms = file_exists($path) ? substr(sprintf('%o', fileperms($path)), -4) : 'N/A';
        
        $class = ($exists === 'âœ… Exists' && $writable === 'âœ… Writable') ? 'success' : 'error';
        echo "<tr><td>$label</td><td class='$class'>$exists | $writable | Perms: $perms<br><code>$path</code></td></tr>";
    }
    echo '</table></div>';
    
    // TEST 3: Find Recently Uploaded Images
    echo '<div class="section">';
    echo '<h2>3ï¸âƒ£ Recent Uploads</h2>';
    
    if (file_exists($uploadDir)) {
        $productDirs = glob($uploadDir . '*', GLOB_ONLYDIR);
        
        if (empty($productDirs)) {
            echo '<p class="warning">âš ï¸ No product directories found</p>';
        } else {
            $recentImages = [];
            
            foreach ($productDirs as $productDir) {
                $images = glob($productDir . '/product_*');
                foreach ($images as $image) {
                    $recentImages[] = [
                        'path' => $image,
                        'time' => filemtime($image),
                        'size' => filesize($image),
                        'readable' => is_readable($image),
                        'perms' => substr(sprintf('%o', fileperms($image)), -4),
                    ];
                }
            }
            
            // Sort by time, newest first
            usort($recentImages, function($a, $b) {
                return $b['time'] - $a['time'];
            });
            
            // Show last 10
            $recentImages = array_slice($recentImages, 0, 10);
            
            if (empty($recentImages)) {
                echo '<p class="warning">âš ï¸ No uploaded images found</p>';
            } else {
                echo '<table>';
                echo '<tr><td><strong>File</strong></td><td><strong>Details</strong></td></tr>';
                
                foreach ($recentImages as $img) {
                    $filename = basename($img['path']);
                    $relPath = str_replace($projectRoot . '/public/', '', $img['path']);
                    $readableStatus = $img['readable'] ? 'âœ… Readable' : 'âŒ Not readable';
                    $class = $img['readable'] ? 'success' : 'error';
                    $size = number_format($img['size'] / 1024, 2) . ' KB';
                    $age = date('Y-m-d H:i:s', $img['time']);
                    
                    echo "<tr><td><code>$filename</code></td>";
                    echo "<td class='$class'>";
                    echo "Size: $size | $readableStatus | Perms: {$img['perms']}<br>";
                    echo "Uploaded: $age<br>";
                    echo "<code>$relPath</code>";
                    echo "</td></tr>";
                }
                
                echo '</table>';
            }
        }
    } else {
        echo '<p class="error">âŒ Upload directory does not exist!</p>';
    }
    
    echo '</div>';
    
    // TEST 4: Test Image Serving
    echo '<div class="section">';
    echo '<h2>4ï¸âƒ£ Image Serving Test</h2>';
    
    // Find a test image
    $testImagePath = null;
    if (!empty($recentImages)) {
        $testImagePath = str_replace($projectRoot . '/public/', '', $recentImages[0]['path']);
    }
    
    if ($testImagePath) {
        $backendUrl = 'http://localhost:8888/crystalkeepsakes'; // Adjust if needed
        $directUrl = $backendUrl . '/' . $testImagePath;
        $phpUrl = $backendUrl . '/api/serve-image.php?path=' . urlencode($testImagePath);
        
        echo '<p><strong>Test Image:</strong> <code>' . basename($testImagePath) . '</code></p>';
        echo '<p><strong>Direct URL (Next.js):</strong><br><code>' . $directUrl . '</code></p>';
        echo '<p><strong>PHP Served URL:</strong><br><code>' . $phpUrl . '</code></p>';
        
        echo '<div style="display: flex; gap: 20px; margin-top: 20px;">';
        echo '<div><p>Direct (Next.js):</p><img src="' . $directUrl . '" style="max-width: 200px; max-height: 200px; border: 2px solid #555;" onerror="this.style.border=\'2px solid red\'"></div>';
        echo '<div><p>PHP Served:</p><img src="' . $phpUrl . '" style="max-width: 200px; max-height: 200px; border: 2px solid #555;" onerror="this.style.border=\'2px solid red\'"></div>';
        echo '</div>';
        
        echo '<p class="info">âš¡ If both images load, system is working!<br>âš¡ If only PHP image loads, use PHP serving method.</p>';
    } else {
        echo '<p class="warning">âš ï¸ No test images available. Upload an image first.</p>';
    }
    
    echo '</div>';
    
    // TEST 5: Windows-Specific Checks
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        echo '<div class="section">';
        echo '<h2>5ï¸âƒ£ Windows-Specific Checks</h2>';
        
        echo '<p class="info">ðŸªŸ Running on Windows</p>';
        
        if (!empty($recentImages)) {
            $testFile = $recentImages[0]['path'];
            $winPath = str_replace('/', '\\', $testFile);
            
            echo '<p><strong>Testing file:</strong> <code>' . basename($testFile) . '</code></p>';
            
            // Check attrib
            exec("attrib \"$winPath\" 2>&1", $attribOutput, $attribCode);
            echo '<p><strong>File Attributes (attrib):</strong></p>';
            echo '<pre>' . htmlspecialchars(implode("\n", $attribOutput)) . '</pre>';
            
            if (strpos(implode('', $attribOutput), ' R ') !== false) {
                echo '<p class="error">âŒ File is READ-ONLY! This will cause issues.</p>';
                echo '<p>Run: <code>attrib -R "' . $winPath . '"</code></p>';
            } else {
                echo '<p class="success">âœ… File is NOT read-only</p>';
            }
            
            // Check icacls
            exec("icacls \"$winPath\" 2>&1", $icaclsOutput, $icaclsCode);
            echo '<p><strong>File Permissions (icacls):</strong></p>';
            echo '<pre>' . htmlspecialchars(implode("\n", array_slice($icaclsOutput, 0, 5))) . '</pre>';
        }
        
        echo '</div>';
    }
    
    // Summary
    echo '<div class="section">';
    echo '<h2>âœ… Summary</h2>';
    
    $issues = [];
    
    if (!extension_loaded('gd')) {
        $issues[] = 'GD Library not available - image compression disabled';
    }
    
    if (!file_exists($uploadDir)) {
        $issues[] = 'Upload directory does not exist';
    } elseif (!is_writable($uploadDir)) {
        $issues[] = 'Upload directory not writable';
    }
    
    if (!empty($recentImages)) {
        foreach (array_slice($recentImages, 0, 3) as $img) {
            if (!$img['readable']) {
                $issues[] = 'Some uploaded images are not readable: ' . basename($img['path']);
                break;
            }
        }
    }
    
    if (empty($issues)) {
        echo '<p class="success">âœ… All checks passed! System should be working.</p>';
    } else {
        echo '<p class="error">âŒ Found ' . count($issues) . ' issue(s):</p>';
        echo '<ul>';
        foreach ($issues as $issue) {
            echo '<li class="error">' . htmlspecialchars($issue) . '</li>';
        }
        echo '</ul>';
    }
    
    echo '</div>';
    ?>
    
    <div class="section">
        <h2>ðŸ"„ Refresh</h2>
        <button onclick="location.reload()" style="padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; font-size: 16px;">
            Refresh Diagnostics
        </button>
    </div>
    
</body>
</html>