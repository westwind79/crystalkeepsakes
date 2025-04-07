<?php
// Set secure headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');

// Only allow from the correct origin
header('Access-Control-Allow-Origin: ' . getEnv('SITE_URL', 'https://crystalkeepsakes.com'));
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
// api/stripe-webhook.php
$config = require_once dirname(__DIR__) . '/config/config.php';

// Set your webhook secret
$webhookSecret = getEnv('STRIPE_WEBHOOK_SECRET');
if (!$webhookSecret) {
    error_log('STRIPE_WEBHOOK_SECRET not set in environment');
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error']);
    exit;
}
// Get the event
$payload = @file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];

try {
    require_once dirname(__DIR__) . '/vendor/autoload.php';
    \Stripe\Stripe::setApiKey($config['stripe']['secret_key']);
    
    $event = \Stripe\Webhook::constructEvent(
        $payload, $sig_header, $webhookSecret
    );
    
    // Handle the event
    switch ($event->type) {
        case 'payment_intent.succeeded':
            $paymentIntent = $event->data->object;
            // Handle successful payment
            // You could update an order in your database here
            error_log('Payment succeeded: ' . $paymentIntent->id);
            break;
        case 'payment_intent.payment_failed':
            $paymentIntent = $event->data->object;
            error_log('Payment failed: ' . $paymentIntent->id);
            break;
        default:
            error_log('Received unknown event type: ' . $event->type);
    }
    
    http_response_code(200);
    echo json_encode(['status' => 'success']);
} catch(\UnexpectedValueException $e) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payload']);
} catch(\Stripe\Exception\SignatureVerificationException $e) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid signature']);
} catch (Exception $e) {
    error_log('Webhook error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>