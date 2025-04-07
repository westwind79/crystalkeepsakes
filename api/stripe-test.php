<?php
// api/stripe-test.php
header('Content-Type: application/json');

// Debugging info
$debug = [
    'server' => $_SERVER,
    'get' => $_GET,
    'post' => $_POST,
    'files' => $_FILES,
    'env' => getenv(),
];

// Test config loading
$configPath = dirname(__DIR__) . '/config/config.php';
$configExists = file_exists($configPath);
$configContent = $configExists ? 'Config file exists' : 'Config file missing';

if ($configExists) {
    try {
        $config = require $configPath;
        $stripeConfigExists = isset($config['stripe']);
        $publishableKeyExists = isset($config['stripe']['publishable_key']);
        $secretKeyExists = isset($config['stripe']['secret_key']);
        
        $configStructure = [
            'stripe_config_exists' => $stripeConfigExists,
            'publishable_key_exists' => $publishableKeyExists,
            'secret_key_exists' => $secretKeyExists,
            'publishable_key_value' => $publishableKeyExists ? substr($config['stripe']['publishable_key'], 0, 7) . '...' : 'N/A',
            'secret_key_value' => $secretKeyExists ? substr($config['stripe']['secret_key'], 0, 7) . '...' : 'N/A',
        ];
    } catch (Exception $e) {
        $configStructure = [
            'error' => $e->getMessage()
        ];
    }
} else {
    $configStructure = 'Config file not found';
}

// Test .env loading
$envPath = dirname(__DIR__) . '/.env';
$envExists = file_exists($envPath);
$envContent = $envExists ? 'ENV file exists' : 'ENV file missing';

// Return all debug info
echo json_encode([
    'status' => 'OK',
    'time' => date('Y-m-d H:i:s'),
    'config_path' => $configPath,
    'config_exists' => $configExists,
    'config_structure' => $configStructure,
    'env_path' => $envPath,
    'env_exists' => $envExists,
    'php_version' => phpversion(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
], JSON_PRETTY_PRINT);
?>