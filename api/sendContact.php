<?php
/**
 * Contact Form Handler
 * @version 1.0.0
 * @date 2025-11-07
 * @description Processes contact form submissions
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/contact_errors.log');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Get input
    $input = file_get_contents('php://input');
    if (!$input) {
        throw new Exception('No input received');
    }
    
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON');
    }
    
    // Validate required fields
    $required = ['name', 'email', 'comment'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            throw new Exception("Missing field: $field");
        }
    }
    
    // Sanitize
    $name = htmlspecialchars(trim($data['name']), ENT_QUOTES, 'UTF-8');
    $email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
    $phone = isset($data['phone']) ? htmlspecialchars(trim($data['phone']), ENT_QUOTES, 'UTF-8') : '';
    $comment = htmlspecialchars(trim($data['comment']), ENT_QUOTES, 'UTF-8');
    
    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email');
    }
    
    // Validate phone if provided
    if ($phone && !preg_match('/^[\d\s\-\(\)]+$/', $phone)) {
        throw new Exception('Invalid phone format');
    }
    
    // Length validation
    if (strlen($name) < 2) {
        throw new Exception('Name too short');
    }
    if (strlen($comment) < 10) {
        throw new Exception('Message too short');
    }
    
    // Build email
    $to = 'contact@crystalkeepsakes.com';
    $subject = 'Contact Form: ' . $name;
    
    $message = "Contact Form Submission\n\n";
    $message .= "Name: $name\n";
    $message .= "Email: $email\n";
    if ($phone) {
        $message .= "Phone: $phone\n";
    }
    $message .= "\nMessage:\n$comment\n";
    
    $headers = [
        'From: ' . $email,
        'Reply-To: ' . $email,
        'X-Mailer: PHP/' . phpversion()
    ];
    
    // Send email
    if (!mail($to, $subject, $message, implode("\r\n", $headers))) {
        throw new Exception('Failed to send email');
    }
    
    error_log("Contact form sent from: $email");
    
    // Success
    echo json_encode([
        'success' => true,
        'message' => 'Thank you! We\'ll get back to you soon.'
    ]);
    
} catch (Exception $e) {
    error_log('Contact form error: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}