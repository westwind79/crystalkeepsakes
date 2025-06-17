<?php
    // api/get-stripe-key.php
    header('Content-Type: application/json');
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);

    // Simple function to get environment variables
    function getEnvironmentVariable($key) {
        // First try direct environment variable
        $value = getenv($key);
        if ($value !== false) {
            return $value;
        }
        
        // Then try from $_ENV
        if (isset($_ENV[$key])) {
            return $_ENV[$key];
        }
        
        // Then try loading from .env file directly
        $envFile = dirname(__DIR__) . '/.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                
                $parts = explode('=', $line, 2);
                if (count($parts) !== 2) continue;
                
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
        }
        
        return null;
    }

    try {
        // Get stripe mode from environment variable
        $mode = getEnvironmentVariable('STRIPE_MODE') ?? 'test';
            
        // Get the appropriate key based on mode
        $publishableKey = ($mode === 'live')
            ? getEnvironmentVariable('STRIPE_LIVE_PUBLISHABLE_KEY')
            : getEnvironmentVariable('STRIPE_TEST_PUBLISHABLE_KEY');

        if (empty($publishableKey)) {
            throw new Exception('Stripe publishable key not found for mode: ' . $mode);
        }
        
        echo json_encode([
            'publishableKey' => $publishableKey,
            'mode' => $mode
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'error' => $e->getMessage(),
            'debug' => [
                'host' => $_SERVER['HTTP_HOST'],
                'env_file_exists' => file_exists(dirname(__DIR__) . '/.env'),
                'mode' => getEnvironmentVariable('STRIPE_MODE') ?? 'test',
                'env_dir' => dirname(__DIR__),
                'files_in_dir' => scandir(dirname(__DIR__))
            ]
        ]);
    }
?>