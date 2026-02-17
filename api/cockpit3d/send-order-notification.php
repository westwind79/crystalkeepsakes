<?php
/**
 * COMPREHENSIVE Order Notification Email Handler
 * @version 2.0.0
 * @description Sends detailed order notifications to orders@crystalkeepsakes.com
 * 
 * Includes:
 * - Order ID (unified)
 * - Customer info
 * - All line items with options
 * - Image URLs (server paths)
 * - Cockpit3D order data
 * - Stripe session info
 * - Links to image folder
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/order_notification.log');

require_once __DIR__ . '/../env-loader.php';

/**
 * Build comprehensive HTML email for order notification
 */
function buildOrderEmailHTML($orderData) {
    $orderId = $orderData['orderId'] ?? $orderData['orderNumber'] ?? 'UNKNOWN';
    $timestamp = date('Y-m-d H:i:s');
    $baseUrl = getEnvVar('NEXT_PUBLIC_PHP_BACKEND_URL') ?? 'https://crystalkeepsakes.com';
    
    // Calculate total
    $subtotal = 0;
    $items = $orderData['cartItems'] ?? $orderData['items'] ?? [];
    foreach ($items as $item) {
        $price = $item['price'] ?? 0;
        $qty = $item['quantity'] ?? 1;
        $subtotal += $price * $qty;
    }
    
    $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #72B01D; border-bottom: 2px solid #72B01D; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .order-id { font-size: 24px; font-weight: bold; color: #72B01D; background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .section { background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .label { font-weight: bold; color: #666; min-width: 150px; display: inline-block; }
        .value { color: #333; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { background: #72B01D; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f9f9f9; }
        .total-row { font-weight: bold; background: #e8f5e9 !important; }
        .image-link { color: #1976d2; text-decoration: none; }
        .image-link:hover { text-decoration: underline; }
        .warning { background: #fff3e0; border: 1px solid #ff9800; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .success { background: #e8f5e9; border: 1px solid #4caf50; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .options-list { margin: 5px 0; padding-left: 15px; }
        .option-item { margin: 3px 0; font-size: 13px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 11px; }
    </style>
</head>
<body>
    <h1>🛒 New Order Received</h1>
    
    <div class="order-id">
        Order ID: ' . htmlspecialchars($orderId) . '
    </div>
    
    <div class="section">
        <div><span class="label">📅 Date/Time:</span> <span class="value">' . $timestamp . '</span></div>
        <div><span class="label">💰 Total:</span> <span class="value">$' . number_format($subtotal, 2) . '</span></div>
        <div><span class="label">📦 Items:</span> <span class="value">' . count($items) . '</span></div>
    </div>';

    // Stripe Info
    if (!empty($orderData['stripeSessionId']) || !empty($orderData['paymentIntentId'])) {
        $html .= '
    <h2>💳 Payment Information</h2>
    <div class="section">';
        
        if (!empty($orderData['stripeSessionId'])) {
            $html .= '<div><span class="label">Stripe Session:</span> <span class="value">' . htmlspecialchars($orderData['stripeSessionId']) . '</span></div>';
        }
        if (!empty($orderData['paymentIntentId'])) {
            $html .= '<div><span class="label">Payment Intent:</span> <span class="value">' . htmlspecialchars($orderData['paymentIntentId']) . '</span></div>';
        }
        $html .= '</div>';
    }

    // Customer Info
    $customer = $orderData['customer'] ?? $orderData['shippingInfo'] ?? [];
    $html .= '
    <h2>👤 Customer Information</h2>
    <div class="section">';
    
    $email = $orderData['receipt_email'] ?? $customer['email'] ?? 'N/A';
    $name = trim(($customer['firstName'] ?? $customer['firstname'] ?? '') . ' ' . ($customer['lastName'] ?? $customer['lastname'] ?? ''));
    if (empty($name)) $name = $customer['name'] ?? 'N/A';
    
    $html .= '<div><span class="label">Name:</span> <span class="value">' . htmlspecialchars($name) . '</span></div>';
    $html .= '<div><span class="label">Email:</span> <span class="value">' . htmlspecialchars($email) . '</span></div>';
    
    if (!empty($customer['phone']) || !empty($customer['telephone'])) {
        $html .= '<div><span class="label">Phone:</span> <span class="value">' . htmlspecialchars($customer['phone'] ?? $customer['telephone']) . '</span></div>';
    }
    $html .= '</div>';

    // Shipping Address
    $shipping = $orderData['shippingInfo'] ?? $customer['shippingAddress'] ?? $customer;
    if (!empty($shipping)) {
        $html .= '
    <h2>📍 Shipping Address</h2>
    <div class="section">';
        
        $address = $shipping['address'] ?? $shipping;
        $street = $address['street'] ?? $address['street1'] ?? $address['line1'] ?? '';
        $street2 = $address['street2'] ?? $address['line2'] ?? '';
        $city = $address['city'] ?? $shipping['city'] ?? '';
        $state = $address['state'] ?? $address['region'] ?? $shipping['state'] ?? '';
        $zip = $address['zipCode'] ?? $address['postcode'] ?? $address['postal_code'] ?? $shipping['zipCode'] ?? '';
        $country = $address['country'] ?? $shipping['country'] ?? 'US';
        
        if ($street) $html .= '<div>' . htmlspecialchars($street) . '</div>';
        if ($street2) $html .= '<div>' . htmlspecialchars($street2) . '</div>';
        if ($city || $state || $zip) {
            $html .= '<div>' . htmlspecialchars("$city, $state $zip") . '</div>';
        }
        $html .= '<div>' . htmlspecialchars($country) . '</div>';
        $html .= '</div>';
    }

    // Order Items
    $html .= '
    <h2>📦 Order Items</h2>
    <table>
        <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Options</th>
            <th>Qty</th>
            <th>Price</th>
        </tr>';
    
    foreach ($items as $idx => $item) {
        $name = $item['name'] ?? 'Unknown Product';
        $sku = $item['sku'] ?? $item['cockpit3d_id'] ?? '-';
        $qty = $item['quantity'] ?? 1;
        $price = $item['price'] ?? 0;
        $lineTotal = $price * $qty;
        
        // Build options string
        $optionsHtml = '';
        $options = $item['options'] ?? [];
        
        if (is_array($options)) {
            $optionsHtml = '<ul class="options-list">';
            foreach ($options as $opt) {
                if (is_array($opt)) {
                    $optName = $opt['name'] ?? $opt['category'] ?? '';
                    $optValue = $opt['value'] ?? $opt['name'] ?? '';
                    if ($optName || $optValue) {
                        $optionsHtml .= '<li class="option-item">' . htmlspecialchars("$optName: $optValue") . '</li>';
                    }
                }
            }
            $optionsHtml .= '</ul>';
        }
        
        // Custom text
        $customText = $item['customText'] ?? null;
        if ($customText) {
            $text = is_array($customText) 
                ? ($customText['text'] ?? (($customText['line1'] ?? '') . ' / ' . ($customText['line2'] ?? '')))
                : $customText;
            if ($text) {
                $optionsHtml .= '<div class="option-item"><strong>Custom Text:</strong> ' . htmlspecialchars($text) . '</div>';
            }
        }
        
        $html .= '<tr>
            <td><strong>' . htmlspecialchars($name) . '</strong></td>
            <td>' . htmlspecialchars($sku) . '</td>
            <td>' . ($optionsHtml ?: '-') . '</td>
            <td>' . $qty . '</td>
            <td>$' . number_format($lineTotal, 2) . '</td>
        </tr>';
    }
    
    $html .= '<tr class="total-row">
            <td colspan="4" style="text-align: right;"><strong>TOTAL:</strong></td>
            <td><strong>$' . number_format($subtotal, 2) . '</strong></td>
        </tr>
    </table>';

    // Customer Images
    $html .= '
    <h2>🖼️ Customer Images</h2>
    <div class="section">';
    
    $hasImages = false;
    foreach ($items as $idx => $item) {
        $maskedUrl = $item['maskedImageUrl'] ?? $item['customImage']['serverUrl'] ?? null;
        $rawUrl = $item['rawImageUrl'] ?? $item['customImage']['originalServerUrl'] ?? null;
        $orderRef = $item['tempOrderRef'] ?? $item['customImage']['tempOrderRef'] ?? null;
        
        if ($maskedUrl || $rawUrl || $orderRef) {
            $hasImages = true;
            $html .= '<div style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 4px;">';
            $html .= '<strong>Item ' . ($idx + 1) . ': ' . htmlspecialchars($item['name'] ?? 'Product') . '</strong><br>';
            
            if ($orderRef) {
                $html .= '<span class="label">Order Ref:</span> <code>' . htmlspecialchars($orderRef) . '</code><br>';
            }
            
            if ($maskedUrl) {
                $fullUrl = (strpos($maskedUrl, 'http') === 0) ? $maskedUrl : $baseUrl . $maskedUrl;
                $html .= '<span class="label">Masked Image:</span> <a href="' . htmlspecialchars($fullUrl) . '" class="image-link" target="_blank">' . htmlspecialchars($maskedUrl) . '</a><br>';
            }
            
            if ($rawUrl) {
                $fullUrl = (strpos($rawUrl, 'http') === 0) ? $rawUrl : $baseUrl . $rawUrl;
                $html .= '<span class="label">Original Image:</span> <a href="' . htmlspecialchars($fullUrl) . '" class="image-link" target="_blank">' . htmlspecialchars($rawUrl) . '</a><br>';
            }
            
            $html .= '</div>';
        }
    }
    
    if (!$hasImages) {
        $html .= '<div class="warning">⚠️ No custom images found for this order</div>';
    }
    $html .= '</div>';

    // Image Folder Link
    if (!empty($orderId) && $orderId !== 'UNKNOWN') {
        $mode = getEnvVar('NEXT_PUBLIC_ENV_MODE') ?? 'testing';
        $folderPath = ($mode === 'production') 
            ? "/crystal-data/orders/$orderId/"
            : "/crystal-data/orders-test/$orderId/";
        
        $html .= '
    <h2>📁 Image Folder</h2>
    <div class="section">
        <a href="' . htmlspecialchars($baseUrl . $folderPath) . '" class="image-link" target="_blank">' . htmlspecialchars($baseUrl . $folderPath) . '</a>
    </div>';
    }

    // Cockpit3D Order Data (if available)
    if (!empty($orderData['cockpit3dOrder'])) {
        $html .= '
    <h2>🏭 Cockpit3D Order Data</h2>
    <div class="section">
        <pre>' . htmlspecialchars(json_encode($orderData['cockpit3dOrder'], JSON_PRETTY_PRINT)) . '</pre>
    </div>';
    }

    // Raw Order Data (for debugging)
    $html .= '
    <h2>🔧 Raw Order Data (Debug)</h2>
    <div class="section">
        <details>
            <summary>Click to expand full order JSON</summary>
            <pre>' . htmlspecialchars(json_encode($orderData, JSON_PRETTY_PRINT)) . '</pre>
        </details>
    </div>';

    $html .= '
    <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
    <p style="color: #999; font-size: 12px;">
        This is an automated order notification from Crystal Keepsakes.<br>
        Generated at: ' . $timestamp . '
    </p>
</body>
</html>';

    return $html;
}

/**
 * Build plain text version for email clients that don't support HTML
 */
function buildOrderEmailText($orderData) {
    $orderId = $orderData['orderId'] ?? $orderData['orderNumber'] ?? 'UNKNOWN';
    $timestamp = date('Y-m-d H:i:s');
    
    $text = "=== NEW ORDER RECEIVED ===\n\n";
    $text .= "Order ID: $orderId\n";
    $text .= "Date: $timestamp\n\n";
    
    // Customer info
    $customer = $orderData['customer'] ?? $orderData['shippingInfo'] ?? [];
    $email = $orderData['receipt_email'] ?? $customer['email'] ?? 'N/A';
    $name = trim(($customer['firstName'] ?? '') . ' ' . ($customer['lastName'] ?? ''));
    
    $text .= "--- Customer ---\n";
    $text .= "Name: $name\n";
    $text .= "Email: $email\n\n";
    
    // Items
    $text .= "--- Items ---\n";
    $items = $orderData['cartItems'] ?? $orderData['items'] ?? [];
    $total = 0;
    
    foreach ($items as $item) {
        $text .= "- " . ($item['name'] ?? 'Unknown') . "\n";
        $text .= "  SKU: " . ($item['sku'] ?? '-') . "\n";
        $text .= "  Qty: " . ($item['quantity'] ?? 1) . "\n";
        $price = ($item['price'] ?? 0) * ($item['quantity'] ?? 1);
        $text .= "  Price: $" . number_format($price, 2) . "\n";
        $total += $price;
        
        // Images
        if (!empty($item['maskedImageUrl'])) {
            $text .= "  Masked Image: " . $item['maskedImageUrl'] . "\n";
        }
        if (!empty($item['rawImageUrl'])) {
            $text .= "  Original Image: " . $item['rawImageUrl'] . "\n";
        }
        $text .= "\n";
    }
    
    $text .= "TOTAL: $" . number_format($total, 2) . "\n\n";
    
    return $text;
}

/**
 * Send the order notification email
 */
function sendOrderNotification($orderData) {
    $orderId = $orderData['orderId'] ?? $orderData['orderNumber'] ?? 'UNKNOWN';
    $to = 'orders@crystalkeepsakes.com';
    $subject = "🛒 New Order: $orderId";
    
    // Generate both HTML and plain text versions
    $htmlContent = buildOrderEmailHTML($orderData);
    $textContent = buildOrderEmailText($orderData);
    
    // Create multipart email
    $boundary = md5(uniqid(time()));
    
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
        'From: Crystal Keepsakes <noreply@crystalkeepsakes.com>',
        'Reply-To: orders@crystalkeepsakes.com',
        'X-Order-ID: ' . $orderId,
        'X-Mailer: CrystalKeepsakes-OrderSystem/2.0'
    ];
    
    // Build multipart message
    $message = "--$boundary\r\n";
    $message .= "Content-Type: text/plain; charset=utf-8\r\n";
    $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $message .= $textContent . "\r\n\r\n";
    
    $message .= "--$boundary\r\n";
    $message .= "Content-Type: text/html; charset=utf-8\r\n";
    $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $message .= $htmlContent . "\r\n\r\n";
    
    $message .= "--$boundary--\r\n";
    
    // Send email
    $sent = mail($to, $subject, $message, implode("\r\n", $headers));
    
    error_log("📧 Order notification email " . ($sent ? "SENT" : "FAILED") . " for order: $orderId");
    
    return [
        'success' => $sent,
        'to' => $to,
        'subject' => $subject,
        'orderId' => $orderId,
        'timestamp' => date('Y-m-d H:i:s'),
        'message' => $sent ? 'Email sent successfully' : 'Failed to send email'
    ];
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        // GET request - show status
        echo json_encode([
            'status' => 'ready',
            'endpoint' => 'Order Notification Email',
            'to' => 'orders@crystalkeepsakes.com',
            'usage' => 'POST with order data JSON'
        ]);
        exit;
    }
    
    $input = file_get_contents('php://input');
    $orderData = json_decode($input, true);
    
    if (!$orderData) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid JSON input'
        ]);
        exit;
    }
    
    // Validate required fields
    if (empty($orderData['orderId']) && empty($orderData['orderNumber'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Order ID is required'
        ]);
        exit;
    }
    
    // Send the email
    $result = sendOrderNotification($orderData);
    
    http_response_code($result['success'] ? 200 : 500);
    echo json_encode($result, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    error_log('Order notification error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
