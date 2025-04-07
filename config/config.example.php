<?php
// config/config.php

// Helper function to get environment variables
function getEnv($key, $default = null) {
    return isset($_ENV[$key]) ? $_ENV[$key] : (getenv($key) ?: $default);
}

// Load .env file if it exists
$envFile = dirname(__DIR__) . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        
        // Remove quotes if present
        if (strpos($value, '"') === 0 || strpos($value, "'") === 0) {
            $value = trim($value, '"\'');
        }
        
        putenv("$name=$value");
        $_ENV[$name] = $value;
    }
}

return [
    'stripe' => [
        'secret_key' => getEnv('STRIPE_SECRET_KEY'),
        'publishable_key' => getEnv('STRIPE_PUBLISHABLE_KEY')
    ],
    'site' => [
        'url' => getEnv('SITE_URL', 'https://crystalkeepsakes.com')
    ]
];
?>