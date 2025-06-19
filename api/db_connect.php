<?php
// api/db_connect.php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/database_errors.log');

// Function to get environment variables (reuse from your existing files)
function getEnvVariable($key) {
    $envFile = dirname(__DIR__) . '/.env';
    if (!file_exists($envFile)) {
        error_log(".env file not found at: $envFile");
        return null;
    }
    
    $content = file_get_contents($envFile);
    if ($content === false) {
        error_log("Failed to read .env file");
        return null;
    }
    
    $lines = explode("\n", $content);
    foreach ($lines as $line) {
        $line = trim($line);
        
        // Skip comments and empty lines
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }
        
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) {
            continue;
        }
        
        $envKey = trim($parts[0]);
        $envValue = trim($parts[1]);
        
        // Remove quotes if present
        if ((strpos($envValue, '"') === 0 && strrpos($envValue, '"') === strlen($envValue) - 1) || 
            (strpos($envValue, "'") === 0 && strrpos($envValue, "'") === strlen($envValue) - 1)) {
            $envValue = substr($envValue, 1, -1);
        }
        
        if ($envKey === $key) {
            return $envValue;
        }
    }
    
    error_log("Key '$key' not found in .env file");
    return null;
}


try {
    // Get current mode for console logging
    $currentMode = getEnvVariable('VITE_STRIPE_MODE') ?? 'development';
    
    // Console log in development/test mode only
    if ($currentMode === 'development' || $currentMode === 'test') {
        error_log("Database connection attempt in $currentMode mode");
    }
    
    // Get database connection details from environment variables
    $db_host = getEnvVariable('DB_HOST') ?? 'localhost';
    $db_name = getEnvVariable('DB_NAME') ?? 'crystal_orders';
    $db_user = getEnvVariable('DB_USER');
    $db_pass = getEnvVariable('DB_PASS');
    
    // Check if required credentials are available
    if (!$db_user || !$db_pass) {
        if ($currentMode === 'development' || $currentMode === 'test') {
            error_log("Database credentials missing - DB_USER or DB_PASS not found in .env");
        }
        throw new Exception('Database credentials not configured');
    }
    
    // Console log connection details (without password) in development/test
    if ($currentMode === 'development' || $currentMode === 'test') {
        error_log("Connecting to database: Host=$db_host, Database=$db_name, User=$db_user");
    }
    
    // Create PDO connection
    $dsn = "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4";
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Console log success in development/test mode
    if ($currentMode === 'development' || $currentMode === 'test') {
        error_log("Database connection successful");
    }
    
    // Return the PDO connection
    return $pdo;
} catch (Exception $e) {
    // Log error details
    error_log("Database connection failed: " . $e->getMessage());
    
    // In development/test mode, provide more details
    if ($currentMode === 'development' || $currentMode === 'test') {
        error_log("Connection details - Host: $db_host, Database: $db_name, User: $db_user");
    }
    
    // Throw exception to be handled by calling code
    throw new Exception('Database connection failed: ' . $e->getMessage());
}
