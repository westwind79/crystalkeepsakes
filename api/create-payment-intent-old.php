<?php
    // api/create-payment-intent.php
    // Creates a Stripe payment intent for the checkout process
    error_reporting(E_ALL);
    ini_set('display_errors', 0); // Don't display in response
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/payment_intent_errors.log');

    // Set appropriate headers
    header('Content-Type: application/json');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('X-XSS-Protection: 1; mode=block');
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');

    // Only allow from the correct origin
    $allowedOrigin = getenv('SITE_URL') ?: 'https://crystalkeepsakes.com';
    header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        echo json_encode(['success' => true]);
        exit;
    }

    // Only allow POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed'
        ]);
        exit;
    }

    try {
        // Get the Stripe key - hardcoded for development
        $isProduction = $_SERVER['HTTP_HOST'] === 'crystalkeepsakes.com';
        $stripeKey = $isProduction 
            ? getenv('STRIPE_SECRET_KEY') 
            : 'sk_test_51MwVSvCPW9vHGVtnAYOOKdnWQUv4D4iHkkIIeHgfKzGV6DfUSCwvxCsKrAxVWGhYxtZJDnlxbkfEHFhH4b8CkIbO00kImXoR0F';
        
        if (empty($stripeKey)) {
            throw new Exception('Stripe secret key not found');
        }
        
        // Log vendor path search
        error_log('Looking for vendor autoload file...');
        
        // Get vendor path - try multiple possible locations
        $vendorPath = null;
        $possiblePaths = [
            // Current directory's parent (project root)
            dirname(__DIR__) . '/vendor/autoload.php',
            
            // One level up from project root
            dirname(dirname(__DIR__)) . '/vendor/autoload.php',
            
            // Absolute paths for common configurations
            $_SERVER['DOCUMENT_ROOT'] . '/vendor/autoload.php',
            $_SERVER['DOCUMENT_ROOT'] . '/../vendor/autoload.php',
            
            // Production path
            '/home/uydbo2r007mb/public_html/crystalkeepsakes.com/vendor/autoload.php'
        ];
        
        foreach ($possiblePaths as $path) {
            error_log('Checking path: ' . $path);
            if (file_exists($path)) {
                $vendorPath = $path;
                error_log('Found vendor path: ' . $path);
                break;
            }
        }
        
        if (!$vendorPath) {
            // Return a more helpful error message
            http_response_code(500);
            echo json_encode([
                'error' => 'Vendor autoload file not found',
                'details' => 'Please install Composer dependencies: composer require stripe/stripe-php',
                'paths_checked' => $possiblePaths,
                'document_root' => $_SERVER['DOCUMENT_ROOT'],
                'script_filename' => $_SERVER['SCRIPT_FILENAME'],
                'success' => false
            ]);
            exit;
        }
        
        // Load Stripe
        require_once $vendorPath;
        
        // Set up Stripe
        \Stripe\Stripe::setApiKey($stripeKey);
        
        // Parse request data
        $jsonStr = file_get_contents('php://input');
        $data = json_decode($jsonStr);
        
        if (!$data || !isset($data->cartItems) || empty($data->cartItems)) {
            throw new Exception('Invalid or empty cart data');
        }
        
        // Calculate amount
        $amount = 0;
        foreach ($data->cartItems as $item) {
            $amount += $item->price * ($item->quantity ?? 1);
        }
        
        $amountInCents = round($amount * 100);
        
        // Create payment intent
        $paymentIntent = \Stripe\PaymentIntent::create([
            'amount' => $amountInCents,
            'currency' => 'usd',
            'automatic_payment_methods' => [
                'enabled' => true,
            ],
            'metadata' => [
                'order_number' => $data->orderNumber ?? ('ORD-' . time()),
                'items_count' => count($data->cartItems),
            ]
        ]);
        
        // Return the client secret
        echo json_encode([
            'clientSecret' => $paymentIntent->client_secret,
            'success' => true
        ]);
        
    } catch (Exception $e) {
        error_log('Payment intent error: ' . $e->getMessage());
        
        http_response_code(500);
        echo json_encode([
            'error' => $e->getMessage(),
            'success' => false
        ]);
    }
?>