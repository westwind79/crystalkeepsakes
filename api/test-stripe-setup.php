<?php
/**
 * Test Stripe Setup
 * Checks if Stripe library is installed and keys are configured
 */

header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Load environment
require_once __DIR__ . '/env-loader.php';

$results = [
    'timestamp' => date('Y-m-d H:i:s'),
    'checks' => []
];

// Check 1: Vendor autoload
$results['checks']['vendor_autoload'] = [
    'name' => 'Composer Autoload',
    'path' => dirname(__DIR__) . '/vendor/autoload.php',
    'exists' => file_exists(dirname(__DIR__) . '/vendor/autoload.php'),
    'status' => file_exists(dirname(__DIR__) . '/vendor/autoload.php') ? 'PASS' : 'FAIL'
];

// Check 2: Stripe library
$stripePath = dirname(__DIR__) . '/vendor/stripe/stripe-php';
$results['checks']['stripe_library'] = [
    'name' => 'Stripe PHP Library',
    'path' => $stripePath,
    'exists' => is_dir($stripePath),
    'status' => is_dir($stripePath) ? 'PASS' : 'FAIL'
];

// Check 3: Environment mode
$mode = getEnvVar('NEXT_PUBLIC_ENV_MODE') ?? 'not_set';
$results['checks']['env_mode'] = [
    'name' => 'Environment Mode',
    'value' => $mode,
    'status' => $mode !== 'not_set' ? 'PASS' : 'FAIL'
];

// Check 4: Stripe key - ONLY uses STRIPE_SECRET_KEY
$secretKey = getEnvVar('STRIPE_SECRET_KEY');
$keyType = strpos($secretKey, 'sk_live_') === 0 ? 'LIVE' : 'TEST';

$results['checks']['stripe_key'] = [
    'name' => 'Stripe Secret Key',
    'type' => "STRIPE_SECRET_KEY ($keyType)",
    'configured' => !empty($secretKey),
    'starts_with' => $secretKey ? substr($secretKey, 0, 12) : 'NOT_SET',
    'status' => !empty($secretKey) ? 'PASS' : 'FAIL'
];

// Check 5: Try loading Stripe
$stripeLoadError = null;
$stripeVersion = null;

if ($results['checks']['vendor_autoload']['exists']) {
    try {
        require_once dirname(__DIR__) . '/vendor/autoload.php';
        
        // Check if Stripe class exists
        if (class_exists('\Stripe\Stripe')) {
            $stripeVersion = \Stripe\Stripe::VERSION ?? 'unknown';
            
            // Try setting API key
            if ($secretKey) {
                \Stripe\Stripe::setApiKey($secretKey);
            }
        } else {
            $stripeLoadError = 'Stripe class not found';
        }
    } catch (Exception $e) {
        $stripeLoadError = $e->getMessage();
    }
}

$results['checks']['stripe_loaded'] = [
    'name' => 'Stripe Library Loaded',
    'version' => $stripeVersion,
    'error' => $stripeLoadError,
    'status' => ($stripeVersion && !$stripeLoadError) ? 'PASS' : 'FAIL'
];

// Check 6: Try creating a test session (won't actually create it)
$sessionTestError = null;
$canCreateSession = false;

if ($stripeVersion && !$stripeLoadError && $secretKey) {
    try {
        // Just verify the API is accessible
        // We won't actually create a session, just test the class
        $canCreateSession = class_exists('\Stripe\Checkout\Session');
        
        if (!$canCreateSession) {
            $sessionTestError = 'Stripe\Checkout\Session class not found';
        }
    } catch (Exception $e) {
        $sessionTestError = $e->getMessage();
    }
}

$results['checks']['checkout_session_class'] = [
    'name' => 'Checkout Session Class',
    'available' => $canCreateSession,
    'error' => $sessionTestError,
    'status' => $canCreateSession ? 'PASS' : 'FAIL'
];

// Overall status
$allPassed = true;
foreach ($results['checks'] as $check) {
    if ($check['status'] === 'FAIL') {
        $allPassed = false;
        break;
    }
}

$results['overall_status'] = $allPassed ? 'PASS' : 'FAIL';

// Action items
$results['action_items'] = [];

if (!$results['checks']['vendor_autoload']['exists']) {
    $results['action_items'][] = 'Run: composer install';
}

if (!$results['checks']['stripe_library']['exists']) {
    $results['action_items'][] = 'Run: composer require stripe/stripe-php';
}

if (!$results['checks']['stripe_key']['configured']) {
    $results['action_items'][] = 'Add ' . $keyType . ' to .env file';
    $results['action_items'][] = 'Get test keys from: https://dashboard.stripe.com/test/apikeys';
}

echo json_encode($results, JSON_PRETTY_PRINT);
