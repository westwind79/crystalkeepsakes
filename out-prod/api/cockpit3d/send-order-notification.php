<?php
/**
 * Order Notification Email Handler
 * @version 1.0.0
 * @date 2025-11-07
 * @description Sends order notifications with attached images
 */

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/order_notification_errors.log');

/**
 * Send order email with image attachments
 */
function sendOrderEmail($orderData, $pdo = null) {
    try {
        $orderNumber = $orderData['orderId'] ?? 'UNKNOWN';
        $to = 'orders@crystalkeepsakes.com';
        $subject = "New Order: $orderNumber";
        
        $boundary = uniqid('boundary_');
        
        // Headers
        $headers = [
            'MIME-Version: 1.0',
            'Content-Type: multipart/mixed; boundary="' . $boundary . '"',
            'From: Crystal Keepsakes Orders <noreply@crystalkeepsakes.com>',
            'Reply-To: orders@crystalkeepsakes.com'
        ];
        
        // Start message
        $message = "--$boundary\r\n";
        $message .= "Content-Type: text/html; charset=utf-8\r\n";
        $message .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
        
        // HTML content
        $html = "<html><body style='font-family: Arial, sans-serif;'>";
        $html .= "<h2>New Order: #$orderNumber</h2>";
        $html .= "<p><strong>Date:</strong> " . date('Y-m-d H:i:s') . "</p>";
        
        if (isset($orderData['paymentId'])) {
            $html .= "<p><strong>Payment ID:</strong> {$orderData['paymentId']}</p>";
        }
        
        // Customer info
        if (isset($orderData['shippingInfo'])) {
            $info = $orderData['shippingInfo'];
            $html .= "<h3>Customer Information</h3>";
            $html .= "<p><strong>Name:</strong> " . ($info['name'] ?? 'N/A') . "</p>";
            $html .= "<p><strong>Email:</strong> " . ($orderData['receipt_email'] ?? $info['email'] ?? 'N/A') . "</p>";
            
            if (isset($info['phone'])) {
                $html .= "<p><strong>Phone:</strong> {$info['phone']}</p>";
            }
            
            // Shipping address
            if (isset($info['address'])) {
                $addr = $info['address'];
                $html .= "<p><strong>Address:</strong><br>";
                $html .= $addr['line1'] ?? '';
                if (!empty($addr['line2'])) {
                    $html .= "<br>" . $addr['line2'];
                }
                $html .= "<br>" . ($addr['city'] ?? '') . ", " . ($addr['state'] ?? '') . " " . ($addr['postal_code'] ?? '');
                $html .= "<br>" . ($addr['country'] ?? '');
                $html .= "</p>";
            }
        }
        
        // Order items
        if (isset($orderData['cartItems'])) {
            $html .= "<h3>Order Items</h3>";
            $html .= "<table border='1' cellpadding='8' cellspacing='0' style='border-collapse: collapse; width: 100%;'>";
            $html .= "<tr style='background: #f0f0f0;'>";
            $html .= "<th>Product</th><th>Options</th><th>Qty</th><th>Price</th>";
            $html .= "</tr>";
            
            $total = 0;
            foreach ($orderData['cartItems'] as $item) {
                $html .= "<tr>";
                $html .= "<td>" . ($item['name'] ?? 'Unknown') . "</td>";
                
                // Options
                $options = "";
                if (isset($item['options'])) {
                    foreach ($item['options'] as $key => $value) {
                        // Skip image URLs
                        if (in_array($key, ['imageUrl', 'maskedImageUrl', 'rawImageUrl'])) {
                            continue;
                        }
                        
                        // Custom text
                        if ($key === 'customText' && is_array($value)) {
                            if (!empty($value['line1'])) {
                                $options .= "<strong>Line 1:</strong> {$value['line1']}<br>";
                            }
                            if (!empty($value['line2'])) {
                                $options .= "<strong>Line 2:</strong> {$value['line2']}<br>";
                            }
                        } elseif (!is_array($value) && !empty($value)) {
                            $options .= "<strong>" . ucfirst($key) . ":</strong> $value<br>";
                        }
                    }
                }
                
                $html .= "<td>" . ($options ?: 'None') . "</td>";
                $html .= "<td>" . ($item['quantity'] ?? 1) . "</td>";
                $html .= "<td>$" . number_format($item['price'] ?? 0, 2) . "</td>";
                $html .= "</tr>";
                
                $total += ($item['price'] ?? 0) * ($item['quantity'] ?? 1);
            }
            
            $html .= "<tr style='background: #f9f9f9; font-weight: bold;'>";
            $html .= "<td colspan='3' align='right'>Total:</td>";
            $html .= "<td>$" . number_format($total, 2) . "</td>";
            $html .= "</tr>";
            $html .= "</table>";
        }
        
        // Check for images
        $attachments = [];
        if ($pdo && file_exists(__DIR__ . '/image-storage.php')) {
            require_once __DIR__ . '/image-storage.php';
            $imageStorage = new ImageStorage();
            
            try {
                $attachments = $imageStorage->createEmailAttachments($pdo, $orderNumber, 500);
                
                if (!empty($attachments)) {
                    $html .= "<h3>Customer Images</h3>";
                    $html .= "<p>Custom images are attached to this email.</p>";
                    $html .= "<ul>";
                    foreach ($attachments as $att) {
                        if ($att['type'] === 'link') {
                            $html .= "<li><a href='{$att['url']}'>{$att['name']}</a> (Large file - download link)</li>";
                        } else {
                            $html .= "<li>{$att['name']} (attached)</li>";
                        }
                    }
                    $html .= "</ul>";
                }
            } catch (Exception $e) {
                error_log('Failed to get images: ' . $e->getMessage());
            }
        }
        
        $html .= "</body></html>";
        $message .= $html . "\r\n";
        
        // Add image attachments
        foreach ($attachments as $att) {
            if ($att['type'] !== 'link' && file_exists($att['path'])) {
                $fileContent = file_get_contents($att['path']);
                $encoded = chunk_split(base64_encode($fileContent));
                
                $message .= "--$boundary\r\n";
                $message .= "Content-Type: {$att['type']}; name=\"{$att['name']}\"\r\n";
                $message .= "Content-Transfer-Encoding: base64\r\n";
                $message .= "Content-Disposition: attachment; filename=\"{$att['name']}\"\r\n\r\n";
                $message .= $encoded . "\r\n";
            }
        }
        
        $message .= "--$boundary--\r\n";
        
        // Send
        $sent = mail($to, $subject, $message, implode("\r\n", $headers));
        
        return [
            'success' => $sent,
            'attachments_count' => count($attachments),
            'message' => $sent ? 'Email sent' : 'Failed to send'
        ];
        
    } catch (Exception $e) {
        error_log('Email error: ' . $e->getMessage());
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Main execution
try {
    $input = file_get_contents('php://input');
    $orderData = json_decode($input, true);
    
    if (!$orderData || !isset($orderData['orderId'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid order data']);
        exit;
    }
    
    // Get database connection if available
    $pdo = null;
    if (file_exists(__DIR__ . '/db_connect.php')) {
        try {
            $pdo = require_once __DIR__ . '/db_connect.php';
        } catch (Exception $e) {
            error_log('DB connection failed: ' . $e->getMessage());
        }
    }
    
    // Send email
    $result = sendOrderEmail($orderData, $pdo);
    
    echo json_encode($result);
    
} catch (Exception $e) {
    error_log('Order notification error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}