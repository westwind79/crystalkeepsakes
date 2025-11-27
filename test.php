<?php
/**
 * MAMP 500 Error Diagnostic
 * Place in: C:\MAMP\htdocs\crystalkeepsakes\diagnose-500.php
 * Access: http://localhost:8888/crystalkeepsakes/diagnose-500.php
 */

// Turn on all error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

?>
<!DOCTYPE html>
<html>
<head>
    <title>MAMP 500 Error Diagnostic</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .test { margin: 15px 0; padding: 15px; background: white; border-left: 4px solid #ccc; }
        .pass { border-left-color: #4CAF50; }
        .fail { border-left-color: #f44336; }
        .warn { border-left-color: #ff9800; }
        h1 { color: #333; }
        h2 { color: #666; margin-top: 0; }
        pre { background: #f9f9f9; padding: 10px; overflow-x: auto; }
        code { background: #ffe; padding: 2px 6px; }
    </style>
</head>
<body>
    <h1>[SEARCH] MAMP 500 Error Diagnostic</h1>
    
    <?php
    $allPassed = true;
    
    // TEST 1: Basic PHP
    echo '<div class="test pass">';
    echo '<h2>âœ… Test 1: PHP is Working</h2>';
    echo '<p>PHP Version: ' . phpversion() . '</p>';
    echo '<p>If you can see this, PHP is running!</p>';
    echo '</div>';
    
    // TEST 2: Project Root
    $projectRoot = __DIR__;
    echo '<div class="test">';
    echo '<h2>Test 2: Project Root</h2>';
    echo '<p>Current Directory: <code>' . $projectRoot . '</code></p>';
    
    // Check if this looks like project root
    $hasPackageJson = file_exists($projectRoot . '/package.json');
    if ($hasPackageJson) {
        echo '<p class="pass">âœ… Found package.json - this is project root</p>';
    } else {
        echo '<p class="warn">âš ï¸ No package.json found - might not be in project root</p>';
    }
    echo '</div>';
    
    // TEST 3: .env File Location
    echo '<div class="test">';
    echo '<h2>Test 3: .env File Search</h2>';
    
    $envLocations = [
        'Current directory' => $projectRoot . '/.env',
        'Parent directory (dirname)' => dirname($projectRoot) . '/.env',
        'Two levels up' => dirname(dirname($projectRoot)) . '/.env',
    ];
    
    $foundEnv = false;
    foreach ($envLocations as $label => $path) {
        $exists = file_exists($path);
        $readable = $exists ? is_readable($path) : false;
        
        echo '<p>';
        echo "<strong>$label:</strong><br>";
        echo "<code>$path</code><br>";
        
        if ($exists && $readable) {
            echo '<span style="color: green;">âœ… Found and readable</span>';
            $foundEnv = true;
        } elseif ($exists) {
            echo '<span style="color: orange;">âš ï¸ Found but not readable</span>';
        } else {
            echo '<span style="color: red;">âŒ Not found</span>';
        }
        echo '</p>';
    }
    
    if (!$foundEnv) {
        echo '<p class="fail"><strong>âŒ PROBLEM: No .env file found!</strong></p>';
        echo '<p>Your PHP files probably crash when trying to load .env</p>';
        $allPassed = false;
    }
    
    echo '</div>';
    
    // TEST 4: Try to Load .env (SAFELY)
    echo '<div class="test">';
    echo '<h2>Test 4: Try Loading .env</h2>';
    
    try {
        // Try current directory first
        $envFile = $projectRoot . '/.env';
        
        if (file_exists($envFile)) {
            $content = file_get_contents($envFile);
            
            if ($content === false) {
                throw new Exception('Could not read .env file');
            }
            
            $lines = explode("\n", $content);
            $validLines = array_filter($lines, function($line) {
                $line = trim($line);
                return !empty($line) && strpos($line, '#') !== 0;
            });
            
            echo '<p class="pass">âœ… Successfully loaded .env</p>';
            echo '<p>Found ' . count($validLines) . ' variables</p>';
            
            // Show first few keys (without values)
            echo '<p><strong>Sample variables:</strong></p>';
            echo '<pre>';
            $count = 0;
            foreach ($validLines as $line) {
                if ($count >= 5) break;
                $parts = explode('=', $line, 2);
                if (count($parts) === 2) {
                    $key = trim($parts[0]);
                    echo htmlspecialchars($key) . " = (hidden)\n";
                    $count++;
                }
            }
            echo '</pre>';
            
        } else {
            throw new Exception('.env file not found at: ' . $envFile);
        }
        
    } catch (Exception $e) {
        echo '<p class="fail">âŒ Error: ' . htmlspecialchars($e->getMessage()) . '</p>';
        $allPassed = false;
    }
    
    echo '</div>';
    
    // TEST 5: Check PHP Extensions
    echo '<div class="test">';
    echo '<h2>Test 5: PHP Extensions</h2>';
    
    $requiredExtensions = ['curl', 'openssl', 'json', 'mbstring'];
    $missingExtensions = [];
    
    foreach ($requiredExtensions as $ext) {
        $loaded = extension_loaded($ext);
        echo '<p>';
        echo "<strong>$ext:</strong> ";
        if ($loaded) {
            echo '<span style="color: green;">âœ… Loaded</span>';
        } else {
            echo '<span style="color: red;">âŒ Missing</span>';
            $missingExtensions[] = $ext;
        }
        echo '</p>';
    }
    
    if (!empty($missingExtensions)) {
        echo '<p class="fail"><strong>âŒ Missing extensions: ' . implode(', ', $missingExtensions) . '</strong></p>';
        $allPassed = false;
    }
    
    echo '</div>';
    
    // TEST 6: Error Log Location
    echo '<div class="test">';
    echo '<h2>Test 6: Error Logs</h2>';
    
    $errorLog = ini_get('error_log');
    echo '<p><strong>PHP Error Log:</strong></p>';
    
    if ($errorLog) {
        echo '<p><code>' . $errorLog . '</code></p>';
        
        if (file_exists($errorLog)) {
            $size = filesize($errorLog);
            echo '<p>Size: ' . number_format($size) . ' bytes</p>';
            
            if ($size > 0) {
                echo '<p class="warn">âš ï¸ Error log has content - check for errors!</p>';
                
                // Show last 10 lines
                $lines = file($errorLog);
                $lastLines = array_slice($lines, -10);
                
                echo '<p><strong>Last 10 lines:</strong></p>';
                echo '<pre style="max-height: 200px; overflow-y: auto;">';
                echo htmlspecialchars(implode('', $lastLines));
                echo '</pre>';
            } else {
                echo '<p class="pass">âœ… No errors logged</p>';
            }
        } else {
            echo '<p>File does not exist yet (no errors have occurred)</p>';
        }
    } else {
        // Try MAMP default location
        $mampLog = 'C:\MAMP\logs\php_error.log';
        echo '<p>Default: <code>' . $mampLog . '</code></p>';
        
        if (file_exists($mampLog)) {
            echo '<p class="warn">âš ï¸ MAMP error log exists - check it!</p>';
        }
    }
    
    echo '</div>';
    
    // SUMMARY
    echo '<div class="test ' . ($allPassed ? 'pass' : 'fail') . '">';
    echo '<h2>Summary</h2>';
    
    if ($allPassed) {
        echo '<p><strong>âœ… All tests passed!</strong></p>';
        echo '<p>Your PHP setup looks good. The 500 error might be in your specific code.</p>';
    } else {
        echo '<p><strong>âŒ Some tests failed</strong></p>';
        echo '<p>Fix the issues above to resolve the 500 error.</p>';
    }
    
    echo '<h3>Common 500 Error Causes:</h3>';
    echo '<ol>';
    echo '<li>âŒ .env file not found (PHP crashes when trying to load it)</li>';
    echo '<li>âŒ Syntax error in PHP file</li>';
    echo '<li>âŒ Missing PHP extension</li>';
    echo '<li>âŒ Calling undefined function</li>';
    echo '<li>âŒ Fatal error in included file</li>';
    echo '</ol>';
    
    echo '<h3>Next Steps:</h3>';
    echo '<ol>';
    echo '<li>Check the PHP error log (location shown above)</li>';
    echo '<li>Look for the LAST error in the log (most recent)</li>';
    echo '<li>Fix that error</li>';
    echo '<li>Restart MAMP</li>';
    echo '<li>Try accessing your page again</li>';
    echo '</ol>';
    
    echo '</div>';
    ?>
    
    <div class="test">
        <h2>ðŸ"„ Refresh Test</h2>
        <button onclick="location.reload()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; cursor: pointer; font-size: 16px;">
            Run Tests Again
        </button>
    </div>
    
</body>
</html>