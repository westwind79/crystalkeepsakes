<?php
/**
 * Upload Log Viewer API
 * View recent upload logs for debugging
 * 
 * Usage: GET /api/view-upload-logs.php?lines=100&key=YOUR_SECRET_KEY
 * 
 * Security: Requires a secret key to access logs
 */

header('Content-Type: text/plain');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load environment
require_once __DIR__ . '/env-loader.php';

// Simple security check - use a query parameter key
// In production, you should use proper authentication
$accessKey = $_GET['key'] ?? '';
$expectedKey = getEnvVar('LOG_VIEWER_KEY') ?? 'crystal-debug-2024';

if ($accessKey !== $expectedKey) {
    http_response_code(403);
    echo "Access denied. Provide valid key parameter.\n";
    echo "Usage: ?key=YOUR_SECRET_KEY&lines=100\n";
    exit();
}

// Calculate main site root (same logic as customer-image-upload.php)
$scriptDir = str_replace('\\', '/', __DIR__);
$scriptDir = rtrim($scriptDir, '/');
$siteFolder = dirname($scriptDir);

$basePath = getEnvVar('NEXT_PUBLIC_BASE_PATH') ?? '';
$basePath = trim($basePath, '/');

if ($basePath === 'test') {
    $mainSiteRoot = dirname($siteFolder);
} else {
    $mainSiteRoot = $siteFolder;
}

// Log file path
$logFile = $mainSiteRoot . '/crystal-data/logs/upload-log.txt';

// Parameters
$lines = (int)($_GET['lines'] ?? 200);
$lines = min(max($lines, 10), 1000); // Clamp between 10 and 1000

$format = $_GET['format'] ?? 'text';

// Output header
echo "==============================================\n";
echo "UPLOAD LOG VIEWER\n";
echo "==============================================\n";
echo "Log file: $logFile\n";
echo "Showing last $lines lines\n";
echo "Time: " . date('Y-m-d H:i:s') . "\n";
echo "==============================================\n\n";

// Check if log file exists
if (!file_exists($logFile)) {
    echo "No upload log file found.\n";
    echo "Logs will appear here after the first image upload attempt.\n";
    echo "\nExpected log location: $logFile\n";
    
    // Check if directory exists
    $logDir = dirname($logFile);
    if (!file_exists($logDir)) {
        echo "Log directory does not exist: $logDir\n";
    } else {
        echo "Log directory exists: $logDir\n";
        echo "Directory is writable: " . (is_writable($logDir) ? 'Yes' : 'No') . "\n";
    }
    exit();
}

// Read file size
$fileSize = filesize($logFile);
echo "Log file size: " . number_format($fileSize) . " bytes\n";
echo "Last modified: " . date('Y-m-d H:i:s', filemtime($logFile)) . "\n";
echo "==============================================\n\n";

// Read last N lines efficiently
try {
    $file = new SplFileObject($logFile, 'r');
    $file->seek(PHP_INT_MAX);
    $totalLines = $file->key();
    
    echo "Total lines in log: $totalLines\n\n";
    
    $startLine = max(0, $totalLines - $lines);
    $file->seek($startLine);
    
    echo "--- LOG OUTPUT (lines $startLine to $totalLines) ---\n\n";
    
    while (!$file->eof()) {
        echo $file->current();
        $file->next();
    }
    
} catch (Exception $e) {
    echo "Error reading log file: " . $e->getMessage() . "\n";
}

echo "\n--- END OF LOG ---\n";
?>
