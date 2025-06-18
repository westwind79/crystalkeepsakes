<?php
// api/send-contact.php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/contact_form_errors.log');

// Ensure we always send JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Function to send JSON response and exit
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit();
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendJsonResponse(['status' => 'ok']);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(
        ['error' => 'Method not allowed'],
        405
    );
}

try {
    // Get and decode JSON input
    $jsonInput = file_get_contents('php://input');
    if (!$jsonInput) {
        throw new Exception('No input received');
    }

    $input = json_decode($jsonInput, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg());
    }

    // Validate required fields
    $requiredFields = ['name', 'email', 'comment'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || trim($input[$field]) === '') {
            throw new Exception("Missing required field: {$field}");
        }
    }

    // Sanitize inputs
    $name = filter_var(trim($input['name']), FILTER_SANITIZE_STRING);
    $email = filter_var(trim($input['email']), FILTER_SANITIZE_EMAIL);
    $phone = isset($input['phone']) ? filter_var(trim($input['phone']), FILTER_SANITIZE_STRING) : '';
    $comment = filter_var(trim($input['comment']), FILTER_SANITIZE_STRING);

    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }

    // Validate phone if provided
    if ($phone !== '') {
        if (!preg_match('/^[\d\s\-\(\)]+$/', $phone)) {
            throw new Exception('Invalid phone format');
        }
    }

    // Validate lengths
    if (strlen($name) < 2) {
        throw new Exception('Name must be at least 2 characters');
    }
    if (strlen($comment) < 10) {
        throw new Exception('Message must be at least 10 characters');
    }

    // Prepare email content
    $to = 'contact@crystalkeepsakes.com'; // Replace with your email
    $subject = 'New Contact Form Submission';
    $message = "New contact form submission:\n\n";
    $message .= "Name: {$name}\n";
    $message .= "Email: {$email}\n";
    if ($phone) {
        $message .= "Phone: {$phone}\n";
    }
    $message .= "\nMessage:\n{$comment}";

    // Additional headers
    $headers = [
        'From' => $email,
        'Reply-To' => $email,
        'X-Mailer' => 'PHP/' . phpversion(),
        'MIME-Version' => '1.0',
        'Content-Type' => 'text/plain; charset=utf-8'
    ];

    // Log attempt
    error_log("Attempting to send email from {$email}");

    // Send email
    if (!mail($to, $subject, $message, $headers)) {
        throw new Exception('Failed to send email');
    }

    // Success response
    sendJsonResponse([
        'success' => true,
        'message' => 'Thank you for your message! We\'ll get back to you soon.'
    ]);

} catch (Exception $e) {
    // Log the error
    error_log('Contact form error: ' . $e->getMessage());
    
    // Send error response
    sendJsonResponse([
        'success' => false,
        'error' => $e->getMessage()
    ], 400);
}
?>