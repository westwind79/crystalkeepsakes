<?php
// api/stripe-webhook.php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/webhook_errors.log');

// Retrieve the request body and parse it as JSON
$input = file_get_contents('php://input');
$event = json_decode($input);

// Get environment variables function
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
    
    return null;
}

try {
    // Connect to database
    $pdo = require_once __DIR__ . '/db_connect.php';
    
    // Load Stripe library
    $vendorPath = null;
    $possiblePaths = [
        dirname(__DIR__) . '/vendor/autoload.php',
        dirname(dirname(__DIR__)) . '/vendor/autoload.php',
        $_SERVER['DOCUMENT_ROOT'] . '/vendor/autoload.php',
        $_SERVER['DOCUMENT_ROOT'] . '/../vendor/autoload.php'
    ];
    
    foreach ($possiblePaths as $path) {
        if (file_exists($path)) {
            $vendorPath = $path;
            break;
        }
    }
    
    if (!$vendorPath) {
        throw new Exception('Vendor autoload file not found');
    }
    
    require_once $vendorPath;
    
    // Get stripe mode from environment variable
    $mode = getEnvironmentVariable('STRIPE_MODE') ?? 'test';

    // Get the appropriate key based on mode
    $stripeKey = ($mode === 'live')
        ? getEnvironmentVariable('STRIPE_SECRET_KEY')
        : getEnvironmentVariable('STRIPE_TEST_SECRET_KEY');

    if (empty($stripeKey)) {
        throw new Exception('Stripe secret key not found');
    }
    
    // Set up Stripe
    \Stripe\Stripe::setApiKey($stripeKey);
    
    // Get the webhook signing secret
    $endpointSecret = getEnvironmentVariable('STRIPE_WEBHOOK_SECRET');
    
    // Verify webhook signature
    if ($endpointSecret) {
        $signature = $_SERVER['HTTP_STRIPE_SIGNATURE'];
        
        try {
            $event = \Stripe\Webhook::constructEvent(
                $input, $signature, $endpointSecret
            );
        } catch(\Stripe\Exception\SignatureVerificationException $e) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid signature']);
            exit();
        }
    } else {
        // For testing without signature verification
        $event = json_decode($input);
    }
    
    // Handle specific event types
    if ($event->type === 'payment_intent.succeeded') {
        $paymentIntent = $event->data->object;
        $paymentIntentId = $paymentIntent->id;
        
        // Retrieve the full payment intent to get shipping info
        $retrievedIntent = \Stripe\PaymentIntent::retrieve($paymentIntentId);
        
        // Get shipping and customer information
        $shippingInfo = $retrievedIntent->shipping;
        $customerEmail = $retrievedIntent->receipt_email;
        
        // Additional order data
        $orderNumber = $retrievedIntent->metadata->order_number ?? null;
        $itemsCount = $retrievedIntent->metadata->items_count ?? 0;
        $amount = $retrievedIntent->amount / 100; // Convert from cents
        
        // Log the shipping information
        error_log("Shipping information for order $orderNumber: " . json_encode($shippingInfo));
        
        // Check if order exists
        $stmt = $pdo->prepare("SELECT id FROM orders WHERE order_id = ?");
        $stmt->execute([$orderNumber]);
        $existingOrder = $stmt->fetch();
        
        // Format shipping address
        $address = $shippingInfo->address;
        $addressJson = json_encode($address);
        
        if ($existingOrder) {
            // Update existing order
            $stmt = $pdo->prepare("
                UPDATE orders 
                SET 
                    payment_id = ?,
                    payment_status = 'succeeded',
                    customer_name = ?,
                    customer_email = ?,
                    amount = ?,
                    shipping_address = ?,
                    order_status = 'paid'
                WHERE order_id = ?
            ");
            
            $stmt->execute([
                $paymentIntentId,
                $shippingInfo->name,
                $customerEmail,
                $amount,
                $addressJson,
                $orderNumber
            ]);
            
        } else {
            // Create new order
            $stmt = $pdo->prepare("
                INSERT INTO orders (
                    order_id, customer_name, customer_email,
                    payment_id, payment_status, amount, 
                    shipping_amount, shipping_method, shipping_address,
                    order_status
                ) VALUES (
                    ?, ?, ?, ?, 'succeeded', ?, 0, 'standard', ?, 'paid'
                )
            ");
            
            $stmt->execute([
                $orderNumber,
                $shippingInfo->name,
                $customerEmail,
                $paymentIntentId,
                $amount,
                $addressJson
            ]);
        }
        
        // Record status history
        $stmt = $pdo->prepare("
            INSERT INTO order_status_history (
                order_id, status, notes
            ) VALUES (?, ?, ?)
        ");
        
        $stmt->execute([
            $orderNumber,
            'paid',
            'Payment succeeded via Stripe webhook'
        ]);
        
        // Send email notification with order details
        $to = getEnvironmentVariable('ADMIN_EMAIL') ?? 'your-email@example.com';
        $subject = "New Order: $orderNumber";
        
        // Format shipping address for email
        $addressStr = $address->line1 . "\n";
        if (!empty($address->line2)) {
            $addressStr .= $address->line2 . "\n";
        }
        $addressStr .= $address->city . ", " . $address->state . " " . $address->postal_code . "\n";
        $addressStr .= $address->country;
        
        $message = "New order received!\n\n";
        $message .= "Order Number: $orderNumber\n";
        $message .= "Amount: $" . number_format($amount, 2) . "\n";
        $message .= "Items: $itemsCount\n\n";
        $message .= "Customer: " . $shippingInfo->name . "\n";
        if ($customerEmail) {
            $message .= "Email: $customerEmail\n";
        }
        $message .= "Shipping Address:\n$addressStr\n\n";
        $message .= "Payment ID: $paymentIntentId\n";
        
        $headers = "From: noreply@crystalkeepsakes.com\r\n";
        
        mail($to, $subject, $message, $headers);
        
        http_response_code(200);
        echo json_encode(['status' => 'success']);
    } elseif ($event->type === 'payment_intent.payment_failed') {
        $paymentIntent = $event->data->object;
        $paymentIntentId = $paymentIntent->id;
        $orderNumber = $paymentIntent->metadata->order_number ?? null;
        
        if ($orderNumber) {
            // Check if order exists
            $stmt = $pdo->prepare("SELECT id FROM orders WHERE order_id = ?");
            $stmt->execute([$orderNumber]);
            $existingOrder = $stmt->fetch();
            
            if ($existingOrder) {
                // Update order status
                $stmt = $pdo->prepare("
                    UPDATE orders 
                    SET 
                        payment_status = 'failed',
                        order_status = 'payment_failed'
                    WHERE order_id = ?
                ");
                
                $stmt->execute([$orderNumber]);
                
                // Record status history
                $stmt = $pdo->prepare("
                    INSERT INTO order_status_history (
                        order_id, status, notes
                    ) VALUES (?, ?, ?)
                ");
                
                $stmt->execute([
                    $orderNumber,
                    'payment_failed',
                    'Payment failed via Stripe webhook'
                ]);
            }
        }
        
        http_response_code(200);
        echo json_encode(['status' => 'payment_failed_recorded']);
    } else {
        // Handle other event types if needed
        http_response_code(200);
        echo json_encode(['status' => 'ignored']);
    }
} catch (Exception $e) {
    error_log('Webhook error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>