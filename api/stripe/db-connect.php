<?php
/**
 * Database Connection
 * @version 1.0.0
 * @date 2025-11-07
 * @description MySQL database connection for Crystal Keepsakes
 */

/**
 * Get environment variable from .env file
 */
function getEnvVar($key) {
    static $cache = null;
    
    if ($cache === null) {
        $cache = [];
        $envFile = dirname(__DIR__) . '/.env';
        
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || strpos($line, '#') === 0) continue;
                
                $parts = explode('=', $line, 2);
                if (count($parts) === 2) {
                    $envKey = trim($parts[0]);
                    $envValue = trim($parts[1], " \t\n\r\0\x0B\"'");
                    $cache[$envKey] = $envValue;
                }
            }
        }
    }
    
    return $cache[$key] ?? null;
}

try {
    // Get database credentials from environment
    $host = getEnvVar('DB_HOST') ?? 'localhost';
    $port = getEnvVar('DB_PORT') ?? '8809';
    $database = getEnvVar('DB_NAME') ?? 'crystal_orders';
    $username = getEnvVar('DB_USER') ?? 'ck_admin';
    $password = getEnvVar('DB_PASSWORD') ?? '[M9hl~a]Pr?f';
    
    // Create DSN
    $dsn = "mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4";
    
    // PDO options
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    // Create connection
    $pdo = new PDO($dsn, $username, $password, $options);
    
    return $pdo;
    
} catch (PDOException $e) {
    error_log('Database connection error: ' . $e->getMessage());
    throw new Exception('Database connection failed');
}