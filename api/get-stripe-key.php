<?php
    // api/get-stripe-key.php
    header('Content-Type: application/json');

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
                if (strpos($envValue, '"') === 0 || strpos($envValue, "'") === 0) {
                    $envValue = trim($envValue, '"\'');
                }
                
                if ($envKey === $key) {
                    return $envValue;
                }
            }
        }
        
        // Last resort - hardcoded test key for development
        if ($key === 'STRIPE_PUBLISHABLE_KEY' && $_SERVER['HTTP_HOST'] !== 'crystalkeepsakes.com') {
            return 'pk_test_51QoDYf2YE48VQlzYdSB0UqhJphSSP6s82c2XYbprasSkna3EGfN0G5IgZXxR2nAVjsZrqtUttSJj6kfAsnrfye0T00AEwHQ8zq';
        }
        
        return null;
    }

    try {
        // Get the publishable key directly without relying on config.php
        $publishableKey = getEnvironmentVariable('STRIPE_PUBLISHABLE_KEY');
        
        if (empty($publishableKey)) {
            throw new Exception('Stripe publishable key not found');
        }
        
        echo json_encode([
            'publishableKey' => $publishableKey,
            'mode' => $_SERVER['HTTP_HOST'] === 'crystalkeepsakes.com' ? 'production' : 'development'
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'error' => $e->getMessage(),
            'debug' => [
                'host' => $_SERVER['HTTP_HOST'],
                'env_file_exists' => file_exists(dirname(__DIR__) . '/.env'),
                'env_vars' => getenv()
            ]
        ]);
    }
?>