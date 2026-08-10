<?php
/**
 * Stripe Webhook Handler - Stripe Checkout + Cockpit3D Integration
 * @version 2.0.0
 * @date 2025-11-10
 * @description Handles Stripe Checkout sessions and sends orders to Cockpit3D
 */

$possibleVendorPaths = [
    dirname(dirname(__DIR__)) . '/vendor/autoload.php',
    dirname(__DIR__) . '/vendor/autoload.php',
    dirname(dirname(dirname(__DIR__))) . '/vendor/autoload.php',
    $_SERVER['DOCUMENT_ROOT'] . '/vendor/autoload.php',
    $_SERVER['DOCUMENT_ROOT'] . '/crystalkeepsakes/vendor/autoload.php',
];

$vendorLoaded = false;
foreach ($possibleVendorPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $vendorLoaded = true;
        break;
    }
}

if (!$vendorLoaded) {
    error_log('ERROR: Stripe library not found. Checked: ' . implode(', ', $possibleVendorPaths));
    http_response_code(500);
    exit('Stripe library not found');
}

// Load environment helper
function getEnvVariable($key) {
    static $envCache = null;
    
    if ($envCache === null) {
        $envCache = [];
        
        $possibleEnvPaths = [
            dirname(dirname(__DIR__)) . '/.env',
            dirname(__DIR__) . '/.env',
            $_SERVER['DOCUMENT_ROOT'] . '/crystalkeepsakes/.env',
            $_SERVER['DOCUMENT_ROOT'] . '/.env'
        ];
        
        foreach ($possibleEnvPaths as $path) {
            if (file_exists($path)) {
                $content = file_get_contents($path);
                $lines = explode("\n", $content);
                
                foreach ($lines as $line) {
                    $line = trim($line);
                    if (empty($line) || strpos($line, '#') === 0) continue;
                    
                    $parts = explode('=', $line, 2);
                    if (count($parts) !== 2) continue;
                    
                    $envKey = trim($parts[0]);
                    $envValue = trim($parts[1], " \t\n\r\0\x0B\"'");
                    $envCache[$envKey] = $envValue;
                }
                break;
            }
        }
    }
    
    return $envCache[$key] ?? null;
}

// Get environment variables - ONLY uses standardized names
$mode = getEnvVariable('NEXT_PUBLIC_ENV_MODE') ?? 'development';

// ONLY use STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET
$stripeSecretKey = getEnvVariable('STRIPE_SECRET_KEY');
$webhookSecret = getEnvVariable('STRIPE_WEBHOOK_SECRET');

if (!$stripeSecretKey) {
    error_log('ERROR: STRIPE_SECRET_KEY not found in .env');
    http_response_code(500);
    exit('Stripe secret key not configured');
}

if (!$webhookSecret) {
    error_log('ERROR: STRIPE_WEBHOOK_SECRET not found in .env');
    http_response_code(500);
    exit('Stripe webhook secret not configured');
}

\Stripe\Stripe::setApiKey($stripeSecretKey);

// Local diagnostic mode: build the same Cockpit3D payload without requiring a
// Stripe signature and without submitting an external order.
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['dry_run_order'])) {
    $orderNumber = sanitizeOrderNumber($_GET['dry_run_order']);
    if (!$orderNumber) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing or invalid dry_run_order']);
        exit;
    }

    try {
        $session = buildDryRunCheckoutSession($orderNumber);
        $cockpit3dOrder = buildCockpit3DOrder($session, $orderNumber);
        $cockpit3dResult = sendToCockpit3D($cockpit3dOrder, true);

        echo json_encode([
            'success' => true,
            'dry_run' => true,
            'order_number' => $orderNumber,
            'cockpit3d' => $cockpit3dResult,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'dry_run' => true, 'error' => $e->getMessage()]);
    }
    exit;
}

// Get database connection if available. Skip this for diagnostics so dry runs
// do not log unrelated local database connection errors.
$conn = null;
if (file_exists(__DIR__ . '/db-connect.php')) {
    try {
        $conn = require_once __DIR__ . '/db-connect.php';
    } catch (Exception $e) {
        error_log('DB connection failed: ' . $e->getMessage());
    }
}

// Get webhook payload
$payload = @file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

error_log('=== STRIPE WEBHOOK RECEIVED ===');
error_log('Mode: ' . $mode);

try {
    // Verify webhook signature
    if ($webhookSecret) {
        $event = \Stripe\Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
    } else {
        error_log('⚠️  No webhook secret - using unverified payload (DEVELOPMENT ONLY)');
        $event = json_decode($payload, false);
    }
    
    error_log('Event type: ' . $event->type);
    
    // Handle different event types
    switch ($event->type) {
        case 'checkout.session.completed':
            handleCheckoutCompleted($event->data->object);
            break;
            
        case 'payment_intent.succeeded':
            handlePaymentSuccess($event->data->object);
            break;
            
        case 'payment_intent.payment_failed':
            handlePaymentFailure($event->data->object);
            break;
            
        case 'payment_intent.canceled':
            handlePaymentCanceled($event->data->object);
            break;
            
        default:
            error_log('Unhandled event type: ' . $event->type);
    }
    
    http_response_code(200);
    echo json_encode(['success' => true]);
    
} catch (\Stripe\Exception\SignatureVerificationException $e) {
    error_log('❌ Webhook signature verification failed: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode(['error' => 'Invalid signature']);
} catch (Exception $e) {
    error_log('❌ Webhook error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Handle Stripe Checkout Session Completed
 * This is where we send the order to Cockpit3D
 */
function handleCheckoutCompleted($session) {
    global $conn;
    
    error_log('🛒 Processing checkout session: ' . $session->id);
    
    // Only process if payment succeeded
    if ($session->payment_status !== 'paid') {
        error_log('⚠️  Payment not completed yet, skipping');
        return;
    }
    
    try {
        // Retrieve full session details
        $fullSession = \Stripe\Checkout\Session::retrieve([
            'id' => $session->id,
            'expand' => ['line_items', 'customer_details', 'shipping_details', 'total_details']
        ]);
        
        $orderNumber = $session->metadata->order_number ?? ('ORD-' . time());
        $customerDetails = $fullSession->customer_details;
        $shippingDetails = $fullSession->shipping_details ?? $fullSession->shipping;
        $totalDetails = $fullSession->total_details;
        
        error_log('📋 Order: ' . $orderNumber);
        error_log('👤 Customer: ' . $customerDetails->email);
        
        // Build Cockpit3D order payload
        $cockpit3dOrder = buildCockpit3DOrder($fullSession, $orderNumber);
        
        // Send to Cockpit3D
        $cockpit3dResult = sendToCockpit3D($cockpit3dOrder);
        
        if ($cockpit3dResult['success']) {
            error_log('✅ Order sent to Cockpit3D successfully');
            
            $cockpit3dOrderId = $cockpit3dResult['data']['id'] ?? null;
            
            // Save to local database if available
            if ($conn) {
                saveOrderToDatabase($conn, $orderNumber, $fullSession, $cockpit3dOrderId);
            }
            
            // Send order notification email
            if (file_exists(dirname(__DIR__) . '/cockpit3d/send-order-notification.php')) {
                sendOrderNotification($orderNumber, $fullSession);
            }
            
        } else {
            error_log('❌ Failed to send to Cockpit3D: ' . ($cockpit3dResult['error'] ?? 'Unknown error'));
        }
        
    } catch (Exception $e) {
        error_log('❌ Error processing checkout: ' . $e->getMessage());
        error_log('Stack trace: ' . $e->getTraceAsString());
    }
}

/**
 * Load full cart data from server storage
 * This contains image URLs and all options needed for Cockpit3D
 */
function sanitizeOrderNumber($orderNumber) {
    return preg_replace('/[^a-zA-Z0-9_-]/', '', (string) $orderNumber);
}

function loadFullCartData($orderNumber) {
    $safeOrderNumber = sanitizeOrderNumber($orderNumber);
    $cartDataFile = dirname(__DIR__) . '/order-data/' . $safeOrderNumber . '.json';
    
    if (!file_exists($cartDataFile)) {
        error_log("⚠️  No cart data file found: $cartDataFile");
        return null;
    }
    
    $content = file_get_contents($cartDataFile);
    $data = json_decode($content, true);
    
    if ($data) {
        error_log("✓ Loaded full cart data for order: $orderNumber");
        error_log("  Items: " . count($data['items'] ?? []));
    }
    
    return $data;
}

/**
 * Build Cockpit3D order payload from Stripe session
 * Matches: POST https://api.cockpit3d.com/rest/V2/orders
 * POST https://profit.cockpit3d.com/rest/V2/orders (or dev URL)
 */
function buildCockpit3DOrder($session, $orderNumber) {
    $customerDetails = $session->customer_details;
    $shippingDetails = $session->shipping_details ?? $session->shipping;
    if (!$shippingDetails || empty($shippingDetails->address)) {
        throw new Exception('Missing Stripe shipping details; Cockpit3D requires a shipping address');
    }
    
    // Parse name from shipping or customer details
    $fullName = $shippingDetails->name ?? $customerDetails->name ?? '';
    $nameParts = explode(' ', $fullName, 2);
    $firstName = $nameParts[0] ?? '';
    $lastName = $nameParts[1] ?? '';
    
    // Get phone - Stripe stores it in customer_details
    $phone = $customerDetails->phone ?? '';
    
    $retailerId = getEnvVariable('COCKPIT3D_RETAILER_ID') ?? getEnvVariable('COCKPIT3D_RETAIL_ID') ?? '';
    
    // Address object includes order_id per Cockpit3D spec
    $order = [
        'retailer_id' => (int) $retailerId,
        'address' => [
            'email' => $customerDetails->email ?? '',
            'firstname' => $firstName,
            'lastname' => $lastName,
            'telephone' => $phone,
            'street' => ($shippingDetails->address->line1 ?? '') . (!empty($shippingDetails->address->line2) ? "\n" . $shippingDetails->address->line2 : ''),
            'city' => $shippingDetails->address->city ?? '',
            'region' => $shippingDetails->address->state ?? '',
            'postcode' => $shippingDetails->address->postal_code ?? '',
            'country' => $shippingDetails->address->country ?? 'US',
            'shipping_method' => 'air',
            'destination' => 'customer_home',
            'order_id' => $orderNumber,
            'staff_user' => 'Web Order'
        ],
        'items' => []
    ];
    
    // LOAD FULL CART DATA from server storage (includes image URLs)
    $fullCartData = loadFullCartData($orderNumber);
    $fullCartItems = $fullCartData['items'] ?? [];
    
    // Fallback to Stripe metadata if no full data available
    $metaCartItems = [];
    if (isset($session->metadata->cart_items)) {
        $metaCartItems = json_decode($session->metadata->cart_items, true) ?: [];
    }
    
    // Build items array from Stripe line items
    foreach ($session->line_items->data as $index => $lineItem) {
        // Get full item data (with image URLs) if available
        $fullItem = $fullCartItems[$index] ?? null;
        $metaItem = $metaCartItems[$index] ?? [];
        
        // Get SKU - prefer full data, then metadata, then fallback
        $sku = $fullItem['sku'] ?? $metaItem['sku'] ?? 'PRODUCT-' . $lineItem->price->product;
        $item = [
            'sku' => $sku,
            'qty' => (string) $lineItem->quantity,
            'client_item_id' => $orderNumber . '-' . ($index + 1),
            'price' => isset($fullItem['unitPrice'])
                ? (float) $fullItem['unitPrice']
                : (($lineItem->amount_subtotal ?? $lineItem->amount_total ?? 0) / max(1, $lineItem->quantity) / 100),
        ];
        
        // ADD IMAGE URLs for Cockpit3D (critical for custom products!)
        // These were uploaded during checkout and stored in cart data
        if (!empty($fullItem['rawImageUrl'])) {
            $item['original_photo'] = $fullItem['rawImageUrl'];
            error_log("📸 Item $index original_photo: " . $fullItem['rawImageUrl']);
        }
        if (!empty($fullItem['maskedImageUrl'])) {
            $item['cropped_photo'] = $fullItem['maskedImageUrl'];
            error_log("📸 Item $index cropped_photo: " . $fullItem['maskedImageUrl']);
        }
        
        // Build options array for Cockpit3D
        $item['options'] = buildCockpit3DItemOptions($fullItem);
        
        // Add special instructions if custom text is present
        $specialInstructions = [];
        if (!empty($fullItem['customText'])) {
            $text = $fullItem['customText'];
            if (is_string($text)) {
                $specialInstructions[] = "Custom Text: $text";
            } elseif (is_array($text)) {
                $textLines = [];
                if (!empty($text['line1'])) $textLines[] = $text['line1'];
                if (!empty($text['line2'])) $textLines[] = $text['line2'];
                if (!empty($textLines)) {
                    $specialInstructions[] = "Custom Text: " . implode(' / ', $textLines);
                }
            }
        }
        if (!empty($specialInstructions)) {
            $item['special_instructions'] = implode('. ', $specialInstructions);
        }

        $pricingDetails = buildPricingSnapshot($fullItem, $lineItem);
        if (!empty($pricingDetails)) {
            $item['_pricing'] = $pricingDetails;
        }
        
        $order['items'][] = $item;
    }
    
    error_log('📦 Cockpit3D order payload: ' . json_encode($order, JSON_PRETTY_PRINT));
    
    return $order;
}

/**
 * Build Cockpit3D options array from cart item
 */
function buildCockpit3DItemOptions($item) {
    if (!$item) return [];
    
    $options = [];
    
    // Size option - use cockpit3d_id from the size
    if (!empty($item['sizeDetails']['cockpit3d_id'])) {
        $options[] = [
            'id' => (string) $item['sizeDetails']['cockpit3d_id'],
            'qty' => '1'
        ];
    } elseif (!empty($item['sizeDetails']['sizeId'])) {
        $options[] = [
            'id' => (string) $item['sizeDetails']['sizeId'],
            'qty' => '1'
        ];
    } elseif (!empty($item['size']['cockpit3d_id'])) {
        $options[] = [
            'id' => (string) $item['size']['cockpit3d_id'],
            'qty' => '1'
        ];
    } elseif (!empty($item['size']['sizeId'])) {
        $options[] = [
            'id' => (string) $item['size']['sizeId'],
            'qty' => '1'
        ];
    }
    
    // Process options array from cart item
    if (!empty($item['options']) && is_array($item['options'])) {
        foreach ($item['options'] as $opt) {
            $category = $opt['category'] ?? '';
            
            // Light base option
            if ($category === 'lightBase' && (!empty($opt['cockpit3d_id']) || !empty($opt['cockpit3d_option_id']) || !empty($opt['optionId']))) {
                $options[] = [
                    'id' => (string) ($opt['cockpit3d_id'] ?? $opt['cockpit3d_option_id'] ?? $opt['optionId']),
                    'qty' => '1'
                ];
            }
            
            // Background option
            if ($category === 'background') {
                $backgroundId = $opt['cockpit3d_option_id'] ?? null;
                if (!$backgroundId) {
                    $backgroundKey = strtolower((string) ($opt['optionId'] ?? $opt['value'] ?? $opt['name'] ?? ''));
                    $backgroundMap = [
                        'rm' => '154',
                        'remove backdrop' => '154',
                        '2d' => '154',
                        '2d backdrop' => '154',
                        '3d' => '155',
                        '3d backdrop' => '155',
                    ];
                    $backgroundId = $backgroundMap[$backgroundKey] ?? null;
                }
            }

            if ($category === 'background' && !empty($backgroundId)) {
                $options[] = [
                    'id' => (string) $backgroundId,
                    'qty' => '1'
                ];
            }
            
            // Custom text option - ID 199 for customer_text
            if ($category === 'customText') {
                $textLines = [];
                if (!empty($opt['line1'])) $textLines[] = $opt['line1'];
                if (!empty($opt['line2'])) $textLines[] = $opt['line2'];
                if (!empty($opt['value'])) {
                    $textLines = is_array($opt['value']) ? $opt['value'] : [$opt['value']];
                }
                
                if (!empty($textLines)) {
                    $options[] = [
                        'id' => '199', // customer_text option ID
                        'value' => $textLines
                    ];
                }
            }
        }
    }
    
    return $options;
}

/**
 * Send order to Cockpit3D Retailer API
 * POST https://profit.cockpit3d.com/rest/V2/orders (production)
 * POST https://c3d-profit-dev.host.alva.tools/rest/V2/orders (dev)
 */
function getCockpit3DBaseUrl() {
    return getEnvVariable('COCKPIT3D_API_URL')
        ?? getEnvVariable('COCKPIT3D_BASE_URL')
        ?? 'https://profit.cockpit3d.com';
}

function validateCockpit3DOrder($orderData) {
    $errors = [];
    if (empty($orderData['retailer_id'])) $errors[] = 'Missing retailer_id';
    if (empty($orderData['address']['email'])) $errors[] = 'Missing address.email';
    if (empty($orderData['address']['street'])) $errors[] = 'Missing address.street';
    if (empty($orderData['address']['city'])) $errors[] = 'Missing address.city';
    if (empty($orderData['address']['region'])) $errors[] = 'Missing address.region';
    if (empty($orderData['address']['postcode'])) $errors[] = 'Missing address.postcode';
    if (empty($orderData['address']['order_id'])) $errors[] = 'Missing address.order_id';
    if (empty($orderData['items']) || !is_array($orderData['items'])) $errors[] = 'Missing items';

    foreach ($orderData['items'] ?? [] as $idx => $item) {
        if (empty($item['sku'])) $errors[] = "Missing items[$idx].sku";
        if (empty($item['qty'])) $errors[] = "Missing items[$idx].qty";
    }

    return $errors;
}

function getCockpit3DAccessToken($baseUrl, $username, $password) {
    $loginUrl = rtrim($baseUrl, '/') . (getEnvVariable('COCKPIT3D_LOGIN_PATH') ?: '/rest/V2/login');
    $ch = curl_init($loginUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode([
            'username' => $username,
            'password' => $password,
        ]),
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        throw new Exception("Cockpit3D login CURL error: $curlError");
    }
    if ($httpCode < 200 || $httpCode >= 300) {
        throw new Exception("Cockpit3D login failed with HTTP $httpCode: $response");
    }

    $decoded = json_decode($response, true);
    if (is_string($decoded)) {
        $token = $decoded;
    } elseif (is_array($decoded)) {
        $token = $decoded['token'] ?? $decoded['data']['token'] ?? '';
    } else {
        $token = trim($response, "\" \t\n\r\0\x0B");
    }

    if (!$token) {
        throw new Exception('Cockpit3D login returned an empty token');
    }

    return $token;
}

function sendToCockpit3D($orderData, $dryRun = false) {
    // Get API URL from environment
    // Production: https://profit.cockpit3d.com
    // Development: https://c3d-profit-dev.host.alva.tools
    $baseUrl = getCockpit3DBaseUrl();

    $username = getEnvVariable('COCKPIT3D_USERNAME');
    $password = getEnvVariable('COCKPIT3D_PASSWORD');
    
    if (!$username || !$password) {
        error_log('❌ Missing Cockpit3D credentials (COCKPIT3D_USERNAME, COCKPIT3D_PASSWORD)');
        return ['success' => false, 'error' => 'Missing Cockpit3D credentials'];
    }
    
    $apiUrl = rtrim($baseUrl, '/') . '/rest/V2/orders';
    $submissionData = stripInternalFields($orderData);
    $validationErrors = validateCockpit3DOrder($submissionData);
    if (!empty($validationErrors)) {
        return [
            'success' => false,
            'submitted' => false,
            'dry_run' => $dryRun,
            'api_url' => $apiUrl,
            'validation_errors' => $validationErrors,
            'payload' => $submissionData,
            'error' => 'Cockpit3D payload validation failed',
        ];
    }

    if ($dryRun) {
        return [
            'success' => true,
            'submitted' => false,
            'dry_run' => true,
            'api_url' => $apiUrl,
            'payload' => $submissionData,
            'message' => 'Dry run only; no Cockpit3D order was submitted',
        ];
    }
    error_log("🔐 Submitting to Cockpit3D: $apiUrl");
    error_log("📋 Retailer ID: " . ($orderData['retailer_id'] ?? 'NOT SET'));
    error_log("📦 Items count: " . count($orderData['items'] ?? []));
    
    // Log image URLs for debugging
    foreach ($orderData['items'] as $idx => $item) {
        if (!empty($item['original_photo'])) {
            error_log("  Item $idx original_photo: " . $item['original_photo']);
        }
        if (!empty($item['cropped_photo'])) {
            error_log("  Item $idx cropped_photo: " . $item['cropped_photo']);
        }
    }
    
    try {
        $token = getCockpit3DAccessToken($baseUrl, $username, $password);
    } catch (Exception $e) {
        error_log('âŒ ' . $e->getMessage());
        return [
            'success' => false,
            'submitted' => false,
            'api_url' => $apiUrl,
            'error' => $e->getMessage(),
        ];
    }
    
    $ch = curl_init($apiUrl);

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token
        ],
        CURLOPT_POSTFIELDS => json_encode($submissionData),
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        error_log('❌ CURL error: ' . $curlError);
        return ['success' => false, 'error' => $curlError];
    }
    
    error_log("📥 Cockpit3D response ($httpCode): $response");
    
    $result = json_decode($response, true);
    
    $isSuccess = $httpCode >= 200 && $httpCode < 300;
    
    if ($isSuccess) {
        error_log('✅ Order successfully submitted to Cockpit3D');
        if (!empty($result['id'])) {
            error_log("   Cockpit3D Order ID: " . $result['id']);
        }
    } else {
        error_log('❌ Cockpit3D API error: ' . ($result['message'] ?? $response));
    }
    
    return [
        'success' => $isSuccess,
        'http_code' => $httpCode,
        'data' => $result,
        'error' => !$isSuccess ? ($result['message'] ?? 'API error') : null
    ];
}

/**
 * Save order to local database
 */
function saveOrderToDatabase($conn, $orderNumber, $session, $cockpit3dOrderId) {
    try {
        $stmt = $conn->prepare("
            INSERT INTO orders (
                order_number, stripe_session_id, cockpit3d_order_id,
                customer_email, customer_name, amount_total,
                currency, payment_status, created_at, order_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        ");
        
        $customerEmail = $session->customer_details->email ?? null;
        $customerName = ($session->shipping_details->name ?? $session->customer_details->name) ?? null;
        $amountTotal = $session->amount_total / 100;
        $currency = $session->currency;
        $paymentStatus = $session->payment_status;
        $orderData = json_encode($session);
        
        $stmt->bind_param(
            'sssssdss',
            $orderNumber,
            $session->id,
            $cockpit3dOrderId,
            $customerEmail,
            $customerName,
            $amountTotal,
            $currency,
            $paymentStatus,
            $orderData
        );
        
        $stmt->execute();
        $stmt->close();
        
        error_log('✅ Order saved to database');
        
    } catch (Exception $e) {
        error_log('❌ Failed to save to database: ' . $e->getMessage());
    }
}

/**
 * Send order notification
 */
function sendOrderNotification($orderNumber, $session) {
    try {
        $orderData = [
            'orderId' => $orderNumber,
            'receipt_email' => $session->customer_details->email ?? null,
            'shippingInfo' => [
                'name' => $session->shipping_details->name ?? $session->customer_details->name,
                'email' => $session->customer_details->email,
                'phone' => $session->customer_details->phone ?? null,
                'address' => $session->shipping_details->address ?? null
            ],
            'cartItems' => []
        ];
        
        // Add cart items
        foreach ($session->line_items->data as $item) {
            $orderData['cartItems'][] = [
                'name' => $item->description,
                'quantity' => $item->quantity,
                'price' => $item->amount_total / 100
            ];
        }
        
        $backendUrl = rtrim(getEnvVariable('NEXT_PUBLIC_PHP_BACKEND_URL') ?? 'http://crystalkeepsakes:8888', '/');
        $ch = curl_init($backendUrl . '/api/cockpit3d/send-order-notification.php');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
        
        curl_exec($ch);
        curl_close($ch);
        
        error_log('✅ Notification sent');
        
    } catch (Exception $e) {
        error_log('❌ Notification failed: ' . $e->getMessage());
    }
}

/**
 * Handle successful payment (existing functionality)
 */
function handlePaymentSuccess($paymentIntent) {
    global $conn;
    
    $orderNumber = $paymentIntent->metadata->order_number ?? null;
    $cockpit3dOrderId = $paymentIntent->metadata->cockpit3d_order_id ?? null;
    $localOrderId = $paymentIntent->metadata->local_order_id ?? null;
    
    error_log("💳 Payment succeeded for order: $orderNumber");
    error_log("💰 Amount: $" . ($paymentIntent->amount / 100));
    
    try {
        // Extract Cockpit3D order data from metadata
        $cockpitOrderJson = $paymentIntent->metadata->cockpit3d_order ?? null;
        
        if ($cockpitOrderJson) {
            error_log("📦 Processing Cockpit3D order from metadata");
            
            $cockpitOrderData = json_decode($cockpitOrderJson, true);
            $shippingAddress = json_decode($paymentIntent->metadata->shipping_address ?? '{}', true);
            
            // Build Cockpit3D order
            $retailerId = getEnvVariable('COCKPIT3D_RETAIL_ID') ?? '256568874';
            
            $nameParts = explode(' ', $cockpitOrderData['customer_name'] ?? '', 2);
            $firstName = $nameParts[0] ?? '';
            $lastName = $nameParts[1] ?? '';
            
            $cockpit3dOrder = [
                'retailer_id' => $retailerId,
                'address' => [
                    'firstname' => $firstName,
                    'lastname' => $lastName,
                    'street' => $shippingAddress['line1'] ?? '',
                    'city' => $shippingAddress['city'] ?? '',
                    'region' => $shippingAddress['state'] ?? '',
                    'postcode' => $shippingAddress['postal_code'] ?? '',
                    'country' => $shippingAddress['country'] ?? 'US',
                    'telephone' => $shippingAddress['phone'] ?? '',
                    'email' => $cockpitOrderData['customer_email'] ?? '',
                ],
                'items' => []
            ];
            
            // Add items with options
            if (isset($cockpitOrderData['items']) && is_array($cockpitOrderData['items'])) {
                foreach ($cockpitOrderData['items'] as $item) {
                    $orderItem = [
                        'product_id' => $item['product_id'],
                        'qty' => $item['quantity'],
                        'options' => []
                    ];
                    
                    // Add options
                    if (isset($item['options']) && is_array($item['options'])) {
                        foreach ($item['options'] as $option) {
                            $orderItem['options'][] = [
                                'id' => $option['option_id'],
                                'value' => $option['value_id'] ?? $option['value']
                            ];
                        }
                    }
                    
                    // Note: Custom images from IndexedDB need to be handled separately
                    // They can't be accessed from server-side webhook
                    if (isset($item['custom_image'])) {
                        error_log("⚠️  Custom image detected but not retrievable from IndexedDB");
                        error_log("   Image ID: " . $item['custom_image']['image_id']);
                        // TODO: Implement image upload before payment or email link after
                    }
                    
                    $cockpit3dOrder['items'][] = $orderItem;
                }
            }
            
            error_log("📤 Sending to Cockpit3D: " . json_encode($cockpit3dOrder));
            
            // Send to Cockpit3D
            $result = sendToCockpit3D($cockpit3dOrder);
            
            if ($result['success']) {
                error_log("✅ Order sent to Cockpit3D successfully");
                error_log("   Cockpit3D Order ID: " . ($result['data']['id'] ?? 'N/A'));
            } else {
                error_log("❌ Failed to send to Cockpit3D: " . ($result['error'] ?? 'Unknown'));
            }
        } else {
            error_log("⚠️  No Cockpit3D order data in metadata");
        }
        
        // Update local database if available
        if ($conn && $localOrderId) {
            updateOrderStatus($localOrderId, [
                'status' => 'paid',
                'stripe_payment_intent_id' => $paymentIntent->id,
                'amount_paid' => $paymentIntent->amount / 100,
                'paid_at' => date('Y-m-d H:i:s')
            ]);
            
            error_log("✅ Local order status updated");
        }
        
    } catch (Exception $e) {
        error_log('❌ Error processing payment success: ' . $e->getMessage());
        error_log('Stack trace: ' . $e->getTraceAsString());
    }
}

/**
 * Handle failed payment
 */
function handlePaymentFailure($paymentIntent) {
    error_log("❌ Payment failed: " . ($paymentIntent->metadata->order_number ?? 'Unknown'));
}

/**
 * Handle canceled payment
 */
function handlePaymentCanceled($paymentIntent) {
    error_log("🚫 Payment canceled: " . ($paymentIntent->metadata->order_number ?? 'Unknown'));
}

/**
 * Update order status
 */
function updateOrderStatus($orderId, $updates) {
    global $conn;
    
    if (!$conn || !$orderId) return;
    
    $setParts = [];
    $params = [];
    $types = '';
    
    foreach ($updates as $key => $value) {
        $setParts[] = "$key = ?";
        $params[] = $value;
        $types .= is_numeric($value) ? 'd' : 's';
    }
    
    $params[] = $orderId;
    $types .= 'i';
    
    $sql = "UPDATE orders SET " . implode(', ', $setParts) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $stmt->close();
}

function buildDryRunCheckoutSession($orderNumber) {
    $cartData = loadFullCartData($orderNumber);
    if (!$cartData) {
        throw new Exception("No stored order data found for dry run: $orderNumber");
    }

    $session = new stdClass();
    $session->id = 'dry_run_' . $orderNumber;
    $session->payment_status = 'paid';
    $session->amount_total = (int) round(($cartData['subtotal'] ?? 0) * 100);
    $session->currency = 'usd';

    $session->metadata = new stdClass();
    $session->metadata->order_number = $orderNumber;
    $session->metadata->cart_items = json_encode(array_map(function ($item) {
        return [
            'sku' => $item['sku'] ?? 'UNKNOWN',
            'name' => $item['name'] ?? 'Product',
            'qty' => $item['quantity'] ?? 1,
        ];
    }, $cartData['items'] ?? []));

    $session->customer_details = (object) [
        'email' => 'webhook-dry-run@example.com',
        'name' => 'Webhook Dry Run',
        'phone' => '555-0100',
    ];
    $session->shipping_details = (object) [
        'name' => 'Webhook Dry Run',
        'address' => (object) [
            'line1' => '123 Test St',
            'line2' => '',
            'city' => 'Grass Valley',
            'state' => 'CA',
            'postal_code' => '95945',
            'country' => 'US',
        ],
    ];

    $lineItems = [];
    foreach ($cartData['items'] ?? [] as $item) {
        $lineItems[] = (object) [
            'description' => $item['name'] ?? 'Product',
            'quantity' => $item['quantity'] ?? 1,
            'amount_subtotal' => (int) round(($item['lineSubtotal'] ?? $item['price'] ?? 0) * 100),
            'amount_total' => (int) round(($item['totalPrice'] ?? $item['lineSubtotal'] ?? $item['price'] ?? 0) * 100),
            'price' => (object) ['product' => $item['productId'] ?? $item['sku'] ?? 'dry-run-product'],
        ];
    }
    $session->line_items = (object) ['data' => $lineItems];

    return $session;
}

function stripInternalFields($value) {
    if (!is_array($value)) {
        return $value;
    }

    $clean = [];
    foreach ($value as $key => $item) {
        if (is_string($key) && strpos($key, '_') === 0) {
            continue;
        }
        $clean[$key] = stripInternalFields($item);
    }

    return $clean;
}

/**
 * Build local pricing snapshot for logs/internal review.
 * This should not be treated as Profit-derived pricing.
 */
function buildPricingSnapshot($fullItem, $lineItem) {
    $quantity = (int) ($fullItem['quantity'] ?? $fullItem['qty'] ?? $lineItem->quantity ?? 1);
    $unitPrice = isset($fullItem['unitPrice'])
        ? (float) $fullItem['unitPrice']
        : (($lineItem->amount_subtotal ?? $lineItem->amount_total ?? 0) / max(1, $quantity) / 100);
    $lineSubtotal = isset($fullItem['lineSubtotal'])
        ? (float) $fullItem['lineSubtotal']
        : round($unitPrice * $quantity, 2);

    return [
        'source' => $fullItem['pricingSource'] ?? 'crystalkeepsakes_checkout',
        'unit_price' => round($unitPrice, 2),
        'quantity' => $quantity,
        'line_subtotal' => round($lineSubtotal, 2),
        'base_price' => isset($fullItem['basePrice']) ? (float) $fullItem['basePrice'] : null,
        'options_price' => isset($fullItem['optionsPrice']) ? (float) $fullItem['optionsPrice'] : null,
        'total_price' => isset($fullItem['totalPrice']) ? (float) $fullItem['totalPrice'] : round($lineSubtotal, 2),
        'note' => 'Local site/Stripe pricing; Profit API pricing is not authoritative for this account.',
    ];
}
