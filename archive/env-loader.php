<?php
/**
 * Environment Variable Loader
 * Centralized .env file loading for all PHP scripts
 * 
 * @version 2.0.0
 * @date 2025-01-24
 * 
 * USAGE:
 * require_once __DIR__ . '/env-loader.php';
 * $value = getEnvVar('YOUR_KEY');
 */

/**
 * Find the project root directory by looking for package.json
 * This ensures we always find .env regardless of where PHP files are located
 */
function findProjectRoot($startDir = null) {
    $currentDir = $startDir ?: __DIR__;
    $maxDepth = 10; // Prevent infinite loop
    $depth = 0;
    
    while ($depth < $maxDepth) {
        // Check if package.json exists (indicates project root)
        if (file_exists($currentDir . '/package.json')) {
            return $currentDir;
        }
        
        // Check if .env exists
        if (file_exists($currentDir . '/.env')) {
            return $currentDir;
        }
        
        // Go up one directory
        $parentDir = dirname($currentDir);
        
        // If we've reached the root, stop
        if ($parentDir === $currentDir) {
            break;
        }
        
        $currentDir = $parentDir;
        $depth++;
    }
    
    // Fallback: assume script is in project root or api subdirectory
    $scriptDir = $startDir ?: __DIR__;
    
    // If script is in /api folder, go up one level
    if (basename($scriptDir) === 'api' || basename(dirname($scriptDir)) === 'api') {
        return dirname($scriptDir);
    }
    
    // Otherwise assume we're already in project root
    return $scriptDir;
}

/**
 * Load and cache environment variables from .env file
 * 
 * @return array Associative array of environment variables
 */
function loadEnvFile() {
    static $cache = null;
    
    if ($cache !== null) {
        return $cache;
    }
    
    $cache = [];
    
    // Find project root
    $projectRoot = findProjectRoot();
    $envFile = $projectRoot . '/.env';
    
    // Check for different environment files based on ENV_MODE
    $envMode = getenv('NEXT_PUBLIC_ENV_MODE') ?: 'development';
    
    $possibleEnvFiles = [
        $projectRoot . '/.env.' . $envMode,  // .env.production, .env.testing, etc.
        $projectRoot . '/.env',              // Default .env
    ];
    
    $foundEnvFile = null;
    foreach ($possibleEnvFiles as $file) {
        if (file_exists($file)) {
            $foundEnvFile = $file;
            error_log("âœ… Using .env file: $file");
            break;
        }
    }
    
    if (!$foundEnvFile) {
        error_log("âš ï¸ WARNING: No .env file found in project root: $projectRoot");
        error_log("Searched for: " . implode(', ', $possibleEnvFiles));
        return $cache;
    }
    
    $content = file_get_contents($foundEnvFile);
    if ($content === false) {
        error_log("âŒ Failed to read .env file: $foundEnvFile");
        return $cache;
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
        
        $key = trim($parts[0]);
        $value = trim($parts[1]);
        
        // Remove quotes if present
        if ((strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) || 
            (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1)) {
            $value = substr($value, 1, -1);
        }
        
        $cache[$key] = $value;
    }
    
    error_log("âœ… Loaded " . count($cache) . " environment variables from: $foundEnvFile");
    
    return $cache;
}

/**
 * Get a specific environment variable
 * 
 * @param string $key The environment variable name
 * @param mixed $default Default value if key not found
 * @return mixed The environment variable value or default
 */
function getEnvVar($key, $default = null) {
    $env = loadEnvFile();
    
    if (isset($env[$key])) {
        return $env[$key];
    }
    
    // Also check PHP environment variables (set via Apache, etc.)
    $value = getenv($key);
    if ($value !== false) {
        return $value;
    }
    
    if ($default === null) {
        error_log("âš ï¸ Environment variable '$key' not found");
    }
    
    return $default;
}

/**
 * Check if we have all required environment variables
 * 
 * @param array $requiredKeys Array of required key names
 * @return array Array of missing keys (empty if all present)
 */
function checkRequiredEnvVars(array $requiredKeys) {
    $missing = [];
    
    foreach ($requiredKeys as $key) {
        if (getEnvVar($key) === null) {
            $missing[] = $key;
        }
    }
    
    if (!empty($missing)) {
        error_log("âŒ Missing required environment variables: " . implode(', ', $missing));
    }
    
    return $missing;
}

/**
 * Get current environment mode
 * 
 * @return string 'development', 'testing', or 'production'
 */
function getEnvironmentMode() {
    $mode = getEnvVar('NEXT_PUBLIC_ENV_MODE', 'development');
    
    // Normalize to lowercase
    $mode = strtolower($mode);
    
    // Validate
    $validModes = ['development', 'testing', 'production'];
    if (!in_array($mode, $validModes)) {
        error_log("âš ï¸ Invalid NEXT_PUBLIC_ENV_MODE: $mode, defaulting to 'development'");
        return 'development';
    }
    
    return $mode;
}

/**
 * Check if currently in production mode
 * 
 * @return bool
 */
function isProduction() {
    return getEnvironmentMode() === 'production';
}

/**
 * Check if currently in development mode
 * 
 * @return bool
 */
function isDevelopment() {
    return getEnvironmentMode() === 'development';
}

/**
 * Check if currently in testing mode
 * 
 * @return bool
 */
function isTesting() {
    return getEnvironmentMode() === 'testing';
}

// Auto-load environment on require
loadEnvFile();
?>