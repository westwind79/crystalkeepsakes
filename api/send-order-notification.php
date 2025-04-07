<?php
// api/send-order-notification.php

	header('Content-Type: application/json');

	// Function to sanitize input data
	function sanitizeInput($data) {
	    if (is_array($data)) {
	        foreach ($data as $key => $value) {
	            $data[$key] = sanitizeInput($value);
	        }
	        return $data;
	    }
	    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
	}

	// Get JSON data from request
	$jsonData = file_get_contents('php://input');
	$orderData = json_decode($jsonData, true);

	if (!$orderData || !isset($orderData['orderId'])) {
	    http_response_code(400);
	    echo json_encode(['success' => false, 'message' => 'Invalid order data']);
	    exit;
	}

	// Sanitize the input data
	$orderData = sanitizeInput($orderData);

	// Email settings
	$to = 'orders@crystalkeepsakes.com';
	$subject = 'New Order: ' . $orderData['orderId'];

	// Create email content
	$message = "<html><body>";
	$message .= "<h2>New Order Received: #{$orderData['orderId']}</h2>";
	$message .= "<p><strong>Date:</strong> " . date('Y-m-d H:i:s') . "</p>";
	$message .= "<p><strong>Payment ID:</strong> " . ($orderData['paymentId'] ?? 'N/A') . "</p>";

	// Add customer information if available
	if (isset($orderData['customer'])) {
	    $message .= "<h3>Customer Information</h3>";
	    $message .= "<p><strong>Name:</strong> " . ($orderData['customer']['name'] ?? 'N/A') . "</p>";
	    $message .= "<p><strong>Email:</strong> " . ($orderData['customer']['email'] ?? 'N/A') . "</p>";
	    $message .= "<p><strong>Phone:</strong> " . ($orderData['customer']['phone'] ?? 'N/A') . "</p>";
	}

	// Add order items
	if (isset($orderData['items']) && is_array($orderData['items'])) {
	    $message .= "<h3>Order Items</h3>";
	    $message .= "<table border='1' cellpadding='5' cellspacing='0' width='100%'>";
	    $message .= "<tr><th>Product</th><th>Options</th><th>Price</th></tr>";
	    
	    $total = 0;
	    foreach ($orderData['items'] as $item) {
	        $message .= "<tr>";
	        $message .= "<td>" . ($item['name'] ?? 'Unknown Product') . "</td>";
	        
	        // Format options
	        $options = "";
	        if (isset($item['options'])) {
	            foreach ($item['options'] as $key => $value) {
	                if ($key === 'customText' && is_array($value)) {
	                    if (!empty($value['line1'])) $options .= "Text Line 1: {$value['line1']}<br>";
	                    if (!empty($value['line2'])) $options .= "Text Line 2: {$value['line2']}<br>";
	                } elseif (!is_array($value) && !empty($value) && $key !== 'imageUrl' && $key !== 'maskedImageUrl') {
	                    $options .= ucfirst($key) . ": {$value}<br>";
	                }
	            }
	        }
	        
	        $message .= "<td>" . $options . "</td>";
	        $message .= "<td>$" . number_format(($item['price'] ?? 0), 2) . "</td>";
	        $message .= "</tr>";
	        
	        $total += ($item['price'] ?? 0);
	    }
	    
	    $message .= "<tr><td colspan='2' align='right'><strong>Total:</strong></td>";
	    $message .= "<td><strong>$" . number_format($total, 2) . "</strong></td></tr>";
	    $message .= "</table>";
	}

	// Add note about images
	$message .= "<p><em>Note: Customer images are not included in this email. Please check the order system to view uploaded images.</em></p>";

	$message .= "</body></html>";

	// Set email headers
	$headers = [
	    'MIME-Version: 1.0',
	    'Content-type: text/html; charset=utf-8',
	    'From: CrystalKeepsakes Order System <noreply@crystalkeepsakes.com>',
	    'Reply-To: orders@crystalkeepsakes.com',
	    'X-Mailer: PHP/' . phpversion()
	];

	// Attempt to send the email
	$emailSent = mail($to, $subject, $message, implode("\r\n", $headers));

	if ($emailSent) {
	    // Log success
	    error_log("Order notification email sent for order ID: " . $orderData['orderId']);
	    echo json_encode(['success' => true, 'message' => 'Order notification sent']);
	} else {
	    // Log failure
	    error_log("Failed to send order notification email for order ID: " . $orderData['orderId']);
	    echo json_encode(['success' => false, 'message' => 'Failed to send order notification']);
	}
?>