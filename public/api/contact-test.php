<?php
// Contact Form Test Script - Use this to diagnose GoDaddy issues
error_reporting(E_ALL);
ini_set('display_errors', 0);
header('Content-Type: application/json');

$response = [
    'test' => 'Contact form test',
    'php_version' => phpversion(),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
    'method' => $_SERVER['REQUEST_METHOD'],
    'can_send_mail' => function_exists('mail'),
];

// Test reading POST data
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    $response['received_data'] = $data;
    $response['json_valid'] = json_last_error() === JSON_ERROR_NONE;
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        $response['json_error'] = json_last_error_msg();
    }
}

// Test mail function
if (function_exists('mail')) {
    $testEmail = 'test@crystalkeepsakes.com';
    $testSubject = 'Test Email from Contact Form';
    $testBody = 'This is a test email to verify mail() function works.';
    $testHeaders = "From: noreply@crystalkeepsakes.com\r\n";
    
    $mailTest = @mail($testEmail, $testSubject, $testBody, $testHeaders);
    $response['mail_test'] = $mailTest ? 'success' : 'failed';
}

echo json_encode($response, JSON_PRETTY_PRINT);
?>
