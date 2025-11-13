<?php
/**
 * Stripe Backend Diagnostics
 * Run this to check if everything is configured correctly
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$results = [
    'timestamp' => date('Y-m-d H:i:s'),
    'checks' => []
];

// Check 1: PHP Version
$results['checks']['php_version'] = [
    'test' => 'PHP Version',
    'value' => PHP_VERSION,
    'status' => version_compare(PHP_VERSION, '7.4.0', '>=') ? 'PASS' : 'FAIL',
    'message' => version_compare(PHP_VERSION, '7.4.0', '>=') ? 'PHP version is compatible' : 'PHP 7.4+ required'
];

// Check 2: Find .env file
function findEnvFile() {
    $possiblePaths = [
        dirname(dirname(__DIR__)) . '/.env',
        dirname(dirname(__DIR__)) . '/.env.local',
        dirname(__DIR__) . '/.env',
        $_SERVER['DOCUMENT_ROOT'] . '/crystalkeepsakes/.env',
        $_SERVER['DOCUMENT_ROOT'] . '/.env'
    ];
    
    foreach ($possiblePaths as $path) {
        if (file_exists($path)) {
            return $path;
        }
    }
    return null;
}

$envPath = findEnvFile();
$results['checks']['env_file'] = [
    'test' => '.env File Location',
    'value' => $envPath ?: 'NOT FOUND',
    'status' => $envPath ? 'PASS' : 'FAIL',
    'message' => $envPath ? 'Environment file found' : 'No .env file found. Create one with STRIPE keys.',
    'searched_paths' => [
        dirname(dirname(__DIR__)) . '/.env',
        dirname(dirname(__DIR__)) . '/.env.local',
        dirname(__DIR__) . '/.env',
        $_SERVER['DOCUMENT_ROOT'] . '/crystalkeepsakes/.env',
        $_SERVER['DOCUMENT_ROOT'] . '/.env'
    ]
];

// Check 3: Load environment variables
function getEnvVariable($key) {
    static $envCache = null;
    
    if ($envCache === null) {
        $envCache = [];
        $envPath = findEnvFile();
        
        if ($envPath && file_exists($envPath)) {
            $content = file_get_contents($envPath);
            $lines = explode("\n", $content);
            
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || strpos($line, '#') === 0) continue;
                
                $parts = explode('=', $line, 2);
                if (count($parts) !== 2) continue;
                
                $envKey = trim($parts[0]);
                $envValue = trim($parts[1], " \t\n\r\x0B\"'");
                $envCache[$envKey] = $envValue;
            }
        }
    }
    
    return $envCache[$key] ?? null;
}

$mode = getEnvVariable('NEXT_PUBLIC_ENV_MODE') ?? 'development';
$results['checks']['env_mode'] = [
    'test' => 'Environment Mode',
    'value' => $mode,
    'status' => 'INFO',
    'message' => "Running in $mode mode"
];

// Check 4: Stripe keys
$stripeKey = ($mode === 'production') 
    ? getEnvVariable('STRIPE_SECRET_KEY')
    : getEnvVariable('STRIPE_DEVELOPMENT_SECRET_KEY');

$results['checks']['stripe_key'] = [
    'test' => 'Stripe Secret Key',
    'value' => $stripeKey ? (substr($stripeKey, 0, 10) . '...' . substr($stripeKey, -4)) : 'NOT FOUND',
    'status' => $stripeKey ? 'PASS' : 'FAIL',
    'message' => $stripeKey ? 'Stripe key loaded' : "Missing STRIPE_DEVELOPMENT_SECRET_KEY in .env",
    'looking_for' => $mode === 'production' ? 'STRIPE_SECRET_KEY' : 'STRIPE_DEVELOPMENT_SECRET_KEY'
];

// Check 5: Composer vendor directory
function findVendorPath() {
    $possiblePaths = [
        dirname(dirname(__DIR__)) . '/vendor/autoload.php',
        dirname(__DIR__) . '/vendor/autoload.php',
        dirname(dirname(dirname(__DIR__))) . '/vendor/autoload.php',
        $_SERVER['DOCUMENT_ROOT'] . '/crystalkeepsakes/vendor/autoload.php',
    ];
    
    foreach ($possiblePaths as $path) {
        if (file_exists($path)) {
            return $path;
        }
    }
    return null;
}

$vendorPath = findVendorPath();
$results['checks']['composer_vendor'] = [
    'test' => 'Composer Vendor (Stripe Library)',
    'value' => $vendorPath ?: 'NOT FOUND',
    'status' => $vendorPath ? 'PASS' : 'FAIL',
    'message' => $vendorPath ? 'Stripe library installed' : 'Run: composer install',
    'searched_paths' => [
        dirname(dirname(__DIR__)) . '/vendor/autoload.php',
        dirname(__DIR__) . '/vendor/autoload.php',
        dirname(dirname(dirname(__DIR__))) . '/vendor/autoload.php',
        $_SERVER['DOCUMENT_ROOT'] . '/crystalkeepsakes/vendor/autoload.php'
    ]
];

// Check 6: Try loading Stripe
if ($vendorPath) {
    try {
        require_once $vendorPath;
        $stripeLoaded = class_exists('\Stripe\Stripe');
        $results['checks']['stripe_library'] = [
            'test' => 'Stripe Library Load',
            'value' => $stripeLoaded ? 'SUCCESS' : 'FAILED',
            'status' => $stripeLoaded ? 'PASS' : 'FAIL',
            'message' => $stripeLoaded ? 'Stripe PHP library loaded successfully' : 'Stripe class not found after loading vendor'
        ];
        
        // Check 7: Try setting API key
        if ($stripeLoaded && $stripeKey) {
            try {
                \Stripe\Stripe::setApiKey($stripeKey);
                $results['checks']['stripe_auth'] = [
                    'test' => 'Stripe API Authentication',
                    'value' => 'API Key Set',
                    'status' => 'PASS',
                    'message' => 'Stripe API key configured (not yet tested with API call)'
                ];
            } catch (Exception $e) {
                $results['checks']['stripe_auth'] = [
                    'test' => 'Stripe API Authentication',
                    'value' => 'FAILED',
                    'status' => 'FAIL',
                    'message' => $e->getMessage()
                ];
            }
        }
    } catch (Exception $e) {
        $results['checks']['stripe_library'] = [
            'test' => 'Stripe Library Load',
            'value' => 'ERROR',
            'status' => 'FAIL',
            'message' => $e->getMessage()
        ];
    }
} else {
    $results['checks']['stripe_library'] = [
        'test' => 'Stripe Library Load',
        'value' => 'SKIPPED',
        'status' => 'FAIL',
        'message' => 'Vendor directory not found, cannot load Stripe'
    ];
}

// Check 8: DOCUMENT_ROOT
$results['checks']['document_root'] = [
    'test' => 'Document Root',
    'value' => $_SERVER['DOCUMENT_ROOT'] ?? 'NOT SET',
    'status' => 'INFO',
    'message' => 'PHP document root directory'
];

// Check 9: Current script directory
$results['checks']['script_dir'] = [
    'test' => 'Script Directory',
    'value' => __DIR__,
    'status' => 'INFO',
    'message' => 'Current PHP script location'
];

// Summary
$failCount = 0;
$passCount = 0;
foreach ($results['checks'] as $check) {
    if ($check['status'] === 'FAIL') $failCount++;
    if ($check['status'] === 'PASS') $passCount++;
}

$results['summary'] = [
    'total_checks' => count($results['checks']),
    'passed' => $passCount,
    'failed' => $failCount,
    'ready' => $failCount === 0 ? 'YES' : 'NO',
    'message' => $failCount === 0 
        ? '✅ All checks passed! Backend is ready for Stripe checkout.' 
        : "❌ $failCount check(s) failed. Fix the issues above."
];

echo json_encode($results, JSON_PRETTY_PRINT);
