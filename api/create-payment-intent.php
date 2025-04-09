<?php
    ob_start();

    if (ob_get_length()) ob_clean();

    echo json_encode([
        'test' => 'PHP is executing',
        'time' => time()
    ]);

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    header('Content-Type: application/json');

    $isProduction = $_SERVER['HTTP_HOST'] === 'crystalkeepsakes.com';

    if ($isProduction) {
        $vendorPath = '/home/uydbo2r007mb/public_html/crystalkeepsakes.com/vendor/autoload.php';
    } else {
        // Local development
        $projectRoot = dirname(dirname(dirname(__FILE__))); 
        $vendorPath = $projectRoot . '/vendor/autoload.php';
    }

    // EDIT: Fix path to look for vendor in project root, not in dist
    // $projectRoot = dirname(dirname(dirname(__FILE__))); // Go up two levels from dist/api
    // $vendorPath = $projectRoot . '/vendor/autoload.php';

    error_log("Current directory: " . $currentDir);
    error_log("Root path: " . $rootPath);
    error_log("Vendor path: " . $vendorPath);
    error_log("Vendor exists: " . (file_exists($vendorPath) ? 'Yes' : 'No'));

    try {
        require_once $vendorPath;
        
        // EDIT: Replace with your Stripe secret key or env variable
        $stripeKey = 'sk_test_51QoDXkFGPmVZe548MJulhkA9Zi7bHAISVpWWqqgwv3fK7MHT77bzrKcDbDhKd0fRY3KT7eJ8cvsprqwDXn9MdCRw00QYFA8f3V';
        
        if (!$stripeKey) {
            throw new Exception('Stripe secret key not found');
        }

        \Stripe\Stripe::setApiKey($stripeKey);

        $jsonStr = file_get_contents('php://input');
        error_log('Received request body: ' . $jsonStr); // Debug log

        $data = json_decode($jsonStr);

        if (!$data || !isset($data->cartItems)) {
            throw new Exception('Invalid cart data');
        }

        $amount = 0;
        foreach ($data->cartItems as $item) {
            $amount += $item->price * ($item->quantity ?? 1);
        }

        $amountInCents = round($amount * 100);

        // EDIT: Add any additional metadata or options you need for your Stripe payments
        $paymentIntent = \Stripe\PaymentIntent::create([
            'amount' => $amountInCents,
            'currency' => 'usd',
            'automatic_payment_methods' => [
                'enabled' => true,
            ]
        ]);

        ob_clean();

        echo json_encode([
            'clientSecret' => $paymentIntent->client_secret,
            'success' => true
        ]);

        exit;

    } catch(Exception $e) {
        error_log('Error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'error' => $e->getMessage(),
            'debug' => [
                'currentDir' => $currentDir,
                'rootPath' => $rootPath,
                'vendorPath' => $vendorPath
            ],
            'success' => false
        ]);
        
        exit;
    }
?>