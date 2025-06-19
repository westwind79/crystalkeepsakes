<?php
// api/send-order-notification.php

header('Content-Type: application/json');
require_once __DIR__ . '/image-storage.php';

function sanitizeInput($data) {
    if (is_array($data)) {
        foreach ($data as $key => $value) {
            $data[$key] = sanitizeInput($value);
        }
        return $data;
    }
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

function sendOrderEmailWithImages($orderData, $pdo) {
    try {
        $imageStorage = new ImageStorage();
        $orderNumber = $orderData['orderId'];
        
        // Get image attachments
        $attachments = $imageStorage->createEmailAttachments($pdo, $orderNumber, 500); // 500KB max per image
        
        // Email settings
        $to = 'orders@crystalkeepsakes.com';
        $subject = 'New Order: ' . $orderNumber;
        
        // Create boundary for multipart email
        $boundary = uniqid('boundary_');
        
        // Email headers
        $headers = [
            'MIME-Version: 1.0',
            'Content-Type: multipart/mixed; boundary="' . $boundary . '"',
            'From: CrystalKeepsakes Order System <noreply@crystalkeepsakes.com>',
            'Reply-To: orders@crystalkeepsakes.com',
            'X-Mailer: PHP/' . phpversion()
        ];
        
        // Create email body
        $message = "--$boundary\r\n";
        $message .= "Content-Type: text/html; charset=utf-8\r\n";
        $message .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
        
        // HTML content
        $htmlContent = "<html><body>";
        $htmlContent .= "<h2>New Order Received: #{$orderNumber}</h2>";
        $htmlContent .= "<p><strong>Date:</strong> " . date('Y-m-d H:i:s') . "</p>";
        $htmlContent .= "<p><strong>Payment ID:</strong> " . ($orderData['paymentId'] ?? 'Pending') . "</p>";
        
        // Customer information
        if (isset($orderData['shippingInfo'])) {
            $htmlContent .= "<h3>Customer Information</h3>";
            $htmlContent .= "<p><strong>Name:</strong> " . ($orderData['shippingInfo']['name'] ?? 'N/A') . "</p>";
            $htmlContent .= "<p><strong>Email:</strong> " . ($orderData['receipt_email'] ?? $orderData['shippingInfo']['email'] ?? 'N/A') . "</p>";
            $htmlContent .= "<p><strong>Phone:</strong> " . ($orderData['shippingInfo']['phone'] ?? 'N/A') . "</p>";
        }
        
        // Order items
        if (isset($orderData['cartItems']) && is_array($orderData['cartItems'])) {
            $htmlContent .= "<h3>Order Items</h3>";
            $htmlContent .= "<table border='1' cellpadding='5' cellspacing='0' width='100%'>";
            $htmlContent .= "<tr><th>Product</th><th>Options</th><th>Price</th></tr>";
            
            $total = 0;
            foreach ($orderData['cartItems'] as $item) {
                $htmlContent .= "<tr>";
                $htmlContent .= "<td>" . ($item['name'] ?? 'Unknown Product') . "</td>";
                
                // Format options
                $options = "";
                if (isset($item['options'])) {
                    foreach ($item['options'] as $key => $value) {
                        if ($key === 'customText' && is_array($value)) {
                            if (!empty($value['line1'])) $options .= "Text Line 1: {$value['line1']}<br>";
                            if (!empty($value['line2'])) $options .= "Text Line 2: {$value['line2']}<br>";
                        } elseif (!is_array($value) && !empty($value) && !in_array($key, ['imageUrl', 'maskedImageUrl', 'rawImageUrl'])) {
                            $options .= ucfirst($key) . ": {$value}<br>";
                        }
                    }
                }
                
                $htmlContent .= "<td>" . $options . "</td>";
                $htmlContent .= "<td>$" . number_format(($item['price'] ?? 0), 2) . "</td>";
                $htmlContent .= "</tr>";
                
                $total += ($item['price'] ?? 0);
            }
            
            $htmlContent .= "<tr><td colspan='2' align='right'><strong>Total:</strong></td>";
            $htmlContent .= "<td><strong>$" . number_format($total, 2) . "</strong></td></tr>";
            $htmlContent .= "</table>";
        }
        
        // Image information
        if (!empty($attachments)) {
            $htmlContent .= "<h3>Customer Images</h3>";
            $htmlContent .= "<p>Customer uploaded images are included with this order:</p>";
            $htmlContent .= "<ul>";
            
            foreach ($attachments as $attachment) {
                if ($attachment['type'] === 'link') {
                    $htmlContent .= "<li><strong>{$attachment['name']}:</strong> <a href='{$attachment['url']}'>Download Link</a> (Large file)</li>";
                } else {
                    $htmlContent .= "<li><strong>{$attachment['name']}:</strong> Attached to this email</li>";
                }
            }
            
            $htmlContent .= "</ul>";
        }
        
        $htmlContent .= "</body></html>";
        
        $message .= $htmlContent . "\r\n";
        
        // Add attachments
        foreach ($attachments as $attachment) {
            if ($attachment['type'] !== 'link' && file_exists($attachment['path'])) {
                $fileContent = file_get_contents($attachment['path']);
                $encodedContent = chunk_split(base64_encode($fileContent));
                
                $message .= "--$boundary\r\n";
                $message .= "Content-Type: {$attachment['type']}; name=\"{$attachment['name']}\"\r\n";
                $message .= "Content-Transfer-Encoding: base64\r\n";
                $message .= "Content-Disposition: attachment; filename=\"{$attachment['name']}\"\r\n\r\n";
                $message .= $encodedContent . "\r\n";
            }
        }
        
        $message .= "--$boundary--\r\n";
        
        // Send email
        $emailSent = mail($to, $subject, $message, implode("\r\n", $headers));
        
        return [
            'success' => $emailSent,
            'attachments_count' => count($attachments),
            'message' => $emailSent ? 'Order notification sent with images' : 'Failed to send email'
        ];
        
    } catch (Exception $e) {
        error_log('Email with images error: ' . $e->getMessage());
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Main execution
try {
    $jsonData = file_get_contents('php://input');
    $orderData = json_decode($jsonData, true);
    
    if (!$orderData || !isset($orderData['orderId'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid order data']);
        exit;
    }
    
    // Sanitize input
    $orderData = sanitizeInput($orderData);
    
    // Connect to database
    $pdo = require_once __DIR__ . '/db_connect.php';
    
    // Send email with images
    $result = sendOrderEmailWithImages($orderData, $pdo);
    
    echo json_encode($result);
    
} catch (Exception $e) {
    error_log('Order notification error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>