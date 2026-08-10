<?php
/**
 * Centralized Environment Variable Loader
 * @version 1.0.0
 * @description Finds and loads .env file from project root
 * 
 * Usage: require_once __DIR__ . '/env-loader.php';
 *        $value = getEnvVar('MY_KEY');
 */

/**
 * Get environment variable from .env file
 * Searches for .env in multiple possible locations
 */
function getEnvVar($key) {
    static $envCache = null;
    
    if ($envCache === null) {
        $envCache = [];
        
        // Determine project root based on this file's location
        // This file is at: /api/env-loader.php
        // Project root is: one level up
        $projectRoot = dirname(__DIR__);
        
        // Search paths in order of preference
        $possibleEnvPaths = [
            // 1. Project root (most common)
            $projectRoot . '/.env',
            
            // 2. One level up from project root (for nested structures)
            dirname($projectRoot) . '/.env',
            
            // 3. MAMP document root + project name
            $_SERVER['DOCUMENT_ROOT'] . '/crystalkeepsakes/.env',
            
            // 4. Current directory (fallback)
            __DIR__ . '/.env',
            
            // 5. Document root directly
            $_SERVER['DOCUMENT_ROOT'] . '/.env',
        ];
        
        $foundPath = null;
        
        foreach ($possibleEnvPaths as $path) {
            if (file_exists($path) && is_readable($path)) {
                $foundPath = $path;
                break;
            }
        }
        
        if ($foundPath) {
            error_log("✓ .env found at: $foundPath");
            
            $content = file_get_contents($foundPath);
            $lines = explode("\n", $content);
            
            foreach ($lines as $line) {
                $line = trim($line);
                
                // Skip empty lines and comments
                if (empty($line) || strpos($line, '#') === 0) {
                    continue;
                }
                
                // Parse KEY=VALUE
                $parts = explode('=', $line, 2);
                if (count($parts) !== 2) {
                    continue;
                }
                
                $envKey = trim($parts[0]);
                $envValue = trim($parts[1]);
                
                // Remove quotes from value
                $envValue = trim($envValue, " \t\n\r\x0B\"'");
                
                $envCache[$envKey] = $envValue;
                $_ENV[$envKey] = $envValue;
                $_SERVER[$envKey] = $envValue;
                putenv($envKey . '=' . $envValue);
            }
            
            error_log("✓ Loaded " . count($envCache) . " environment variables");
            
        } else {
            error_log("⚠️  WARNING: .env file not found in any of these locations:");
            foreach ($possibleEnvPaths as $path) {
                error_log("   - $path");
            }
        }
    }
    
    if (!isset($envCache[$key])) {
        error_log("⚠️  Environment variable '$key' not found");
    }
    
    return $envCache[$key] ?? null;
}

/**
 * Debug function to show where .env was found
 * Only use during development
 */
function debugEnvPaths() {
    $projectRoot = dirname(__DIR__);
    
    echo "<pre>";
    echo "🔍 Environment File Debug\n";
    echo "========================\n\n";
    echo "Project Root: $projectRoot\n";
    echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
    echo "Current File: " . __FILE__ . "\n\n";
    
    $possibleEnvPaths = [
        $projectRoot . '/.env',
        dirname($projectRoot) . '/.env',
        $_SERVER['DOCUMENT_ROOT'] . '/crystalkeepsakes/.env',
        __DIR__ . '/.env',
        $_SERVER['DOCUMENT_ROOT'] . '/.env',
    ];
    
    echo "Searching for .env in:\n";
    foreach ($possibleEnvPaths as $i => $path) {
        $exists = file_exists($path);
        $readable = $exists && is_readable($path);
        $status = $exists ? ($readable ? '✓ EXISTS & READABLE' : '⚠ EXISTS BUT NOT READABLE') : '✗ NOT FOUND';
        
        echo ($i + 1) . ". $path\n";
        echo "   Status: $status\n";
        
        if ($exists && $readable) {
            $size = filesize($path);
            echo "   Size: $size bytes\n";
            echo "   👉 THIS FILE WILL BE USED\n";
            break;
        }
        echo "\n";
    }
    echo "</pre>";
}
