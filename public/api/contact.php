<?php
// Contact Form Handler - GoDaddy Optimized
// Disable error display to prevent HTML in JSON response
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set JSON header FIRST before any output
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Capture any unexpected output
ob_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_clean();
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get POST data
try {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg());
    }
} catch (Exception $e) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request data']);
    exit();
}

$name = $data['name'] ?? '';
$email = $data['email'] ?? '';
$phone = $data['phone'] ?? '';
$topic = $data['topic'] ?? '';
$orderNumber = $data['orderNumber'] ?? '';
$comment = $data['comment'] ?? '';

// Validate
if (empty($name) || empty($email) || empty($topic) || empty($comment)) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit();
}

// Email routing
function getRecipientEmail($topic) {
    $routes = [
        'order_problem' => 'orders@crystalkeepsakes.com',
        'website_issue' => 'support@crystalkeepsakes.com',
        'custom_request' => 'admin@crystalkeepsakes.com'
    ];
    return $routes[$topic] ?? 'info@crystalkeepsakes.com';
}

$topicLabels = [
    'order_problem' => 'Problem with Order',
    'website_issue' => 'Website Issue',
    'product_question' => 'Product Question',
    'custom_request' => 'Custom Design Request',
    'other' => 'Other'
];

$recipientEmail = getRecipientEmail($topic);
$topicLabel = $topicLabels[$topic] ?? $topic;

// Build email
$emailSubject = "Contact Form: {$topicLabel} - {$name}";
$emailBody = "New Contact Form Submission\n\n";
$emailBody .= "From: {$name}\n";
$emailBody .= "Email: {$email}\n";
if (!empty($phone)) $emailBody .= "Phone: {$phone}\n";
$emailBody .= "Topic: {$topicLabel}\n";
if (!empty($orderNumber)) $emailBody .= "Order Number: {$orderNumber}\n";
$emailBody .= "\nMessage:\n{$comment}\n";

$headers = "From: noreply@crystalkeepsakes.com\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// Send to admin
$sent = mail($recipientEmail, $emailSubject, $emailBody, $headers);

// Send confirmation to customer
if ($sent) {
    $confirmSubject = "We received your message - CrystalKeepsakes";
    $confirmBody = "Hi {$name},\n\n";
    $confirmBody .= "We've received your message regarding: {$topicLabel}\n\n";
    $confirmBody .= "Our team will review your inquiry and get back to you as soon as possible.\n";
    if (!empty($orderNumber)) $confirmBody .= "\nReference Order Number: {$orderNumber}\n";
    $confirmBody .= "\n---\nYour message:\n{$comment}\n---\n\n";
    $confirmBody .= "Best regards,\nThe CrystalKeepsakes Team";
    
    $confirmHeaders = "From: noreply@crystalkeepsakes.com\r\n";
    $confirmHeaders .= "X-Mailer: PHP/" . phpversion();
    
    mail($email, $confirmSubject, $confirmBody, $confirmHeaders);
}

// Clean any buffered output before sending response
ob_clean();

if ($sent) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Message sent successfully'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to send message. Please try again or email us directly.'
    ]);
}

// End output buffering
ob_end_flush();
?>