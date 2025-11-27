<?php
/**
 * .env Path Diagnostic Tool
 * Checks all PHP files for .env path issues
 * 
 * Run this from project root via browser:
 * http://localhost:8888/crystalkeepsakes/check-env-paths.php
 */

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>.env Path Diagnostics</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
        .section { margin: 20px 0; padding: 15px; background: #2d2d2d; border-left: 4px solid #007acc; }
        .success { color: #4ec9b0; }
        .error { color: #f48771; }
        .warning { color: #ce9178; }
        .info { color: #9cdcfe; }
        h2 { color: #569cd6; margin-top: 0; }
        pre { background: #1e1e1e; padding: 10px; overflow-x: auto; white-space: pre-wrap; }
        table { border-collapse: collapse; width: 100%; }
        td { padding: 8px; border-bottom: 1px solid #3e3e3e; vertical-align: top; }
        td:first-child { color: #9cdcfe; width: 30%; }
        code { background: #333; padding: 2px 6px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>ðŸ" .env Path Diagnostics</h1>
    
    <?php
    $projectRoot = __DIR__;
    
    // TEST 1: Check if .env exists
    echo '<div class="section">';
    echo '<h2>1 .env File Location</h2>';
    echo '<table>';
    
    $envFile = $projectRoot . '/.env';
    $envExists = file_exists($envFile);
    $envReadable = $envExists ? is_readable($envFile) : false;
    
    $statusClass = $envExists && $envReadable ? 'success' : 'error';
    $statusText = $envExists && $envReadable ? '✓… Found & Readable' : '✓ Not Found or Not Readable';
    
    echo "<tr><td>Project Root</td><td><code>$projectRoot</code></td></tr>";
    echo "<tr><td>.env Path</td><td><code>$envFile</code></td></tr>";
    echo "<tr><td>Status</td><td class='$statusClass'>$statusText</td></tr>";
    
    if ($envExists && $envReadable) {
        $content = file_get_contents($envFile);
        $lines = array_filter(explode("\n", $content), function($line) {
            $line = trim($line);
            return !empty($line) && strpos($line, '#') !== 0;
        });
        
        echo "<tr><td>Variables Found</td><td class='success'>" . count($lines) . " variables</td></tr>";
        
        // Show first few variables (without values)
        $keys = [];
        foreach (array_slice($lines, 0, 5) as $line) {
            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $keys[] = trim($parts[0]);
            }
        }
        echo "<tr><td>Sample Keys</td><td><code>" . implode('</code>, <code>', $keys) . "</code>...</td></tr>";
    }
    
    echo '</table></div>';
    
    // TEST 2: Find all PHP files that might load .env
    echo '<div class="section">';
    echo '<h2>2 PHP Files Scanning for .env Issues</h2>';
    
    $phpFiles = array_merge(
        glob($projectRoot . '/*.php'),
        glob($projectRoot . '/api/*.php')
    );
    
    $issues = [];
    $goodFiles = [];
    
    foreach ($phpFiles as $file) {
        $filename = basename($file);
        $relativePath = str_replace($projectRoot . '/', '', $file);
        $content = file_get_contents($file);
        
        // Check for problematic patterns
        $hasOldGetEnv = preg_match('/function\s+getEnvVariable\s*\(/', $content);
        $hasWrongPath = preg_match('/dirname\s*\(\s*__DIR__\s*\)\s*\.\s*[\'"]\/\.env/', $content);
        $hasEnvLoader = preg_match('/require.*env-loader\.php/', $content);
        $usesGetEnvVar = preg_match('/getEnvVar\s*\(/', $content);
        
        if ($hasOldGetEnv || $hasWrongPath) {
            $issues[] = [
                'file' => $filename,
                'path' => $relativePath,
                'hasOldFunction' => $hasOldGetEnv,
                'hasWrongPath' => $hasWrongPath,
                'hasEnvLoader' => $hasEnvLoader,
            ];
        } elseif ($hasEnvLoader || $usesGetEnvVar) {
            $goodFiles[] = [
                'file' => $filename,
                'path' => $relativePath,
                'hasEnvLoader' => $hasEnvLoader,
            ];
        }
    }
    
    if (!empty($issues)) {
        echo '<h3 class="error">✓ Files with Issues (' . count($issues) . ')</h3>';
        echo '<table>';
        echo '<tr><td><strong>File</strong></td><td><strong>Issues Found</strong></td></tr>';
        
        foreach ($issues as $issue) {
            $problems = [];
            if ($issue['hasOldFunction']) {
                $problems[] = '<span class="error">✓ Has old getEnvVariable() function</span>';
            }
            if ($issue['hasWrongPath']) {
                $problems[] = '<span class="error">✓ Uses dirname(__DIR__)/.env (wrong path)</span>';
            }
            if (!$issue['hasEnvLoader']) {
                $problems[] = '<span class="warning">⚠️¸ Not using env-loader.php</span>';
            }
            
            echo '<tr>';
            echo '<td><code>' . htmlspecialchars($issue['path']) . '</code></td>';
            echo '<td>' . implode('<br>', $problems) . '</td>';
            echo '</tr>';
        }
        
        echo '</table>';
    } else {
        echo '<p class="success">✓… No issues found in scanned files!</p>';
    }
    
    if (!empty($goodFiles)) {
        echo '<h3 class="success">✓… Files Already Fixed (' . count($goodFiles) . ')</h3>';
        echo '<table>';
        
        foreach ($goodFiles as $good) {
            $status = $good['hasEnvLoader'] ? '✓… Using env-loader.php' : '✓… Using getEnvVar()';
            echo '<tr>';
            echo '<td><code>' . htmlspecialchars($good['path']) . '</code></td>';
            echo '<td class="success">' . $status . '</td>';
            echo '</tr>';
        }
        
        echo '</table>';
    }
    
    echo '</div>';
    
    // TEST 3: Check if env-loader.php exists
    echo '<div class="section">';
    echo '<h2>3 env-loader.php Status</h2>';
    
    $envLoaderPath = $projectRoot . '/env-loader.php';
    $envLoaderExists = file_exists($envLoaderPath);
    
    if ($envLoaderExists) {
        echo '<p class="success">✓… env-loader.php found at: <code>' . $envLoaderPath . '</code></p>';
        
        // Try to load it and test
        try {
            require_once $envLoaderPath;
            
            echo '<p class="success">✓… env-loader.php loaded successfully</p>';
            
            // Test the functions
            if (function_exists('getEnvVar')) {
                echo '<p class="success">✓… getEnvVar() function available</p>';
                
                // Test loading a variable
                $testKey = 'NEXT_PUBLIC_ENV_MODE';
                $testValue = getEnvVar($testKey);
                
                if ($testValue) {
                    echo '<p class="success">✓… Successfully loaded test variable: <code>' . $testKey . ' = ' . $testValue . '</code></p>';
                } else {
                    echo '<p class="warning">⚠️¸ Could not load test variable: <code>' . $testKey . '</code></p>';
                }
                
                // Test helper functions
                if (function_exists('isProduction')) {
                    $mode = getEnvironmentMode();
                    $isProd = isProduction() ? 'YES' : 'NO';
                    $isDev = isDevelopment() ? 'YES' : 'NO';
                    $isTest = isTesting() ? 'YES' : 'NO';
                    
                    echo '<table>';
                    echo '<tr><td>Environment Mode</td><td class="info"><code>' . $mode . '</code></td></tr>';
                    echo '<tr><td>Is Production?</td><td>' . $isProd . '</td></tr>';
                    echo '<tr><td>Is Development?</td><td>' . $isDev . '</td></tr>';
                    echo '<tr><td>Is Testing?</td><td>' . $isTest . '</td></tr>';
                    echo '</table>';
                }
            } else {
                echo '<p class="error">✓ getEnvVar() function not found!</p>';
            }
        } catch (Exception $e) {
            echo '<p class="error">✓ Error loading env-loader.php: ' . htmlspecialchars($e->getMessage()) . '</p>';
        }
    } else {
        echo '<p class="error">✓ env-loader.php NOT FOUND!</p>';
        echo '<p class="warning">⚠️¸ You need to add env-loader.php to your project root.</p>';
        echo '<p>Expected location: <code>' . $envLoaderPath . '</code></p>';
    }
    
    echo '</div>';
    
    // TEST 4: Summary & Action Items
    echo '<div class="section">';
    echo '<h2>Summary & Action Items</h2>';
    
    $actionItems = [];
    
    if (!$envExists || !$envReadable) {
        $actionItems[] = '✓ Create or fix .env file in project root';
    }
    
    if (!$envLoaderExists) {
        $actionItems[] = '✓ Add env-loader.php to project root';
    }
    
    if (!empty($issues)) {
        $actionItems[] = 'Update ' . count($issues) . ' PHP file(s) to use env-loader.php';
        foreach ($issues as $issue) {
            $actionItems[] = ' Update: ' . $issue['path'];
        }
    }
    
    if (empty($actionItems)) {
        echo '<p class="success">ðŸŽ‰ All checks passed! Your .env configuration looks good.</p>';
    } else {
        echo '<p class="warning">🎐 Action items needed:</p>';
        echo '<ol>';
        foreach ($actionItems as $item) {
            echo '<li>' . htmlspecialchars($item) . '</li>';
        }
        echo '</ol>';
        
        echo '<p class="info">🔥 See: <strong>FIX_ENV_PATHS.md</strong> for detailed instructions</p>';
    }
    
    echo '</div>';
    ?>
    
    <div class="section">
        <h2>Refresh</h2>
        <button onclick="location.reload()" style="padding: 10px 20px; background: #007acc; color: white; border: none; cursor: pointer; font-size: 16px;">
            Refresh Diagnostics
        </button>
    </div>
    
</body>
</html>
