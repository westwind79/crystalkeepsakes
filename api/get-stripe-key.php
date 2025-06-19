<?php
// api/get-stripe-key.php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/stripe_key_errors.log');

// Function to get .env variables
function getEnvVariable($key) {
    // Try multiple possible .env file locations
    $possiblePaths = [
        dirname(__DIR__) . '/.env',           // dist/.env
        dirname(dirname(__DIR__)) . '/.env',  // project root/.env
        $_SERVER['DOCUMENT_ROOT'] . '/.env',  // htdocs/.env
        dirname($_SERVER['DOCUMENT_ROOT']) . '/.env' // parent of htdocs/.env
    ];
    
    $envFile = null;
    foreach ($possiblePaths as $path) {
        error_log("Checking .env path: $path");
        if (file_exists($path) && is_readable($path)) {
            $envFile = $path;
            error_log("Found readable .env file at: $path");
            break;
        }
    }
    
    if (!$envFile) {
        error_log("No readable .env file found in any of the expected locations");
        return null;
    }
    
    $content = file_get_contents($envFile);
    if ($content === false) {
        error_log("Failed to read .env file at: $envFile");
        return null;
    }
    
    $lines = explode("\n", $content);
    error_log("Total lines in .env file: " . count($lines));
    
    foreach ($lines as $lineNum => $line) {
        $line = trim($line);
        
        // Debug: log each line we're processing
        if (!empty($line) && strpos($line, '#') !== 0) {
            error_log("Processing line " . ($lineNum + 1) . ": '" . $line . "'");
        }
        
        // Skip comments and empty lines
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }
        
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) {
            error_log("Skipping malformed line " . ($lineNum + 1) . ": '" . $line . "'");
            continue;
        }
        
        $envKey = trim($parts[0]);
        $envValue = trim($parts[1]);
        
        // Debug: log what we extracted
        error_log("Found key: '$envKey' with value length: " . strlen($envValue));
        
        // Remove quotes if present
        if ((strpos($envValue, '"') === 0 && strrpos($envValue, '"') === strlen($envValue) - 1) || 
            (strpos($envValue, "'") === 0 && strrpos($envValue, "'") === strlen($envValue) - 1)) {
            $envValue = substr($envValue, 1, -1);
            error_log("Removed quotes, new value length: " . strlen($envValue));
        }
        
        if ($envKey === $key) {
            error_log("Found matching key '$key' with final value length: " . strlen($envValue));
            return $envValue;
        }
    }
    
    error_log("Key '$key' not found in .env file");
    return null;
}

try {
    // Debug: Log the exact path we're checking
    $envFile = dirname(__DIR__) . '/.env';
    error_log("Looking for .env file at: $envFile");
    error_log("File exists? " . (file_exists($envFile) ? 'YES' : 'NO'));
    
    if (file_exists($envFile)) {
        error_log("File is readable? " . (is_readable($envFile) ? 'YES' : 'NO'));
        $content = file_get_contents($envFile);
        error_log("File content length: " . strlen($content));
    }
    
    // Get stripe mode from .env (using VITE_ prefix)
    $mode = getEnvVariable('VITE_STRIPE_MODE') ?? 'test';
    error_log("Mode from .env: $mode");
    
    // Use the mode directly with VITE_ prefix
    if ($mode === 'test' || $mode === 'development') {
        $keyName = 'VITE_STRIPE_TEST_PUBLISHABLE_KEY';
    } else {
        $keyName = 'VITE_STRIPE_LIVE_PUBLISHABLE_KEY';
    }
    error_log("Looking for key: $keyName");
    
    $publishableKey = getEnvVariable($keyName);
    error_log("Key found? " . ($publishableKey ? 'YES' : 'NO'));
    
    // No fallback keys - fail if not found
    if (empty($publishableKey)) {
        throw new Exception("Publishable key '$keyName' not found in .env file for mode: $mode");
    }
    
    error_log("Successfully found key, returning response");
    
    echo json_encode([
        'publishableKey' => $publishableKey,
        'mode' => $mode
    ]);
    
} catch (Exception $e) {
    error_log('Stripe key error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
?>