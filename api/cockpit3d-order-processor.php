<?php
// api/cockpit3d-order-processor.php
// Complete implementation for sending orders to CockPit3D API

require_once __DIR__ . '/cockpit3d-data-fetcher.php';

class CockPit3DOrderProcessor extends CockPit3DFetcher {
    
    private $apiBaseUrl;
    private $bearerToken;
    private $retailerId;  // ← Add this
    private $mode;
    
    public function __construct() {
        parent::__construct();
        
        // Get environment mode
        $this->mode = getEnvVariable('VITE_STRIPE_MODE') ?? 'development';
        
        // SIMPLE: Just use what the parent fetcher already has
        $this->apiBaseUrl = $this->baseUrl;     // ✅ From parent
        $this->bearerToken = $this->token;      // ✅ From parent (API response)
        $this->retailerId = $this->retailerId;  // ✅ From parent
        
        // Log what we're actually using
        if ($this->mode === 'development' || $this->mode === 'test') {
            error_log("🚀 COCKPIT3D: API URL: " . ($this->apiBaseUrl ?: 'MISSING'));
            error_log("🔑 COCKPIT3D: Token: " . ($this->bearerToken ? 'SET (' . substr($this->bearerToken, 0, 10) . '...)' : 'MISSING'));
            error_log("🏪 COCKPIT3D: Store Key: " . ($this->retailerId ?: 'MISSING'));
        }
    }

    /**
     * Process and send order to CockPit3D after successful Stripe payment
     * @param array $orderData - Order data from Stripe checkout
     * @return array - Success/error response
     */
    public function processOrder($orderData) {
        try {
            error_log("DEBUG: processOrder method started");
            echo "DEBUG: processOrder method started\n";
        
            // PUT REAL AUTH BACK:
            $this->ensureAuthenticated();
            echo "DEBUG: Creds from parent\n";
            
            // GET REAL CREDENTIALS:
            $this->apiBaseUrl = $this->baseUrl;
            $this->bearerToken = $this->token;
            
            echo "DEBUG: Got real credentials\n";
            
            // Rest of your existing code...
            if ($this->mode === 'development' || $this->mode === 'test') {
                echo "🔑 COCKPIT3D: Using token: DUMMY_TOKEN\n";
                echo "🏪 COCKPIT3D: Using store key: " . $this->retailerId . "\n";
            }

            if ($this->mode === 'development' || $this->mode === 'test') {
                error_log("🚀 COCKPIT3D: Processing order for CockPit3D");
                error_log("📦 COCKPIT3D: Order data: " . json_encode($orderData, JSON_PRETTY_PRINT));
            }
            
            // Validate order data
            $this->validateOrderData($orderData);
            
            // Transform cart items for CockPit3D
            $cockpit3dItems = $this->transformCartItems($orderData['cartItems']);
            
            if (empty($cockpit3dItems)) {
                return [
                    'success' => true,
                    'message' => 'No CockPit3D items to process',
                    'cockpit3d_order_id' => null
                ];
            }
            
            // Prepare CockPit3D order payload
            $cockpit3dOrder = $this->prepareCockPit3DOrder($orderData, $cockpit3dItems);
            
            if ($this->mode === 'development' || $this->mode === 'test') {
                error_log("📤 COCKPIT3D: Sending order payload: " . json_encode($cockpit3dOrder, JSON_PRETTY_PRINT));
            }
            
            // Send order to CockPit3D
            $response = $this->sendOrderToCockPit3D($cockpit3dOrder);
            
            if ($this->mode === 'development' || $this->mode === 'test') {
                error_log("📥 COCKPIT3D: Response: " . json_encode($response, JSON_PRETTY_PRINT));
            }
            
            return [
                'success' => true,
                'message' => 'Order successfully sent to CockPit3D',
                'cockpit3d_order_id' => $response['id'] ?? null,
                'cockpit3d_response' => $response
            ];
            
        } catch (Exception $e) {
            if ($this->mode === 'development' || $this->mode === 'test') {
                error_log("❌ COCKPIT3D: Error processing order: " . $e->getMessage());
                error_log("❌ COCKPIT3D: Stack trace: " . $e->getTraceAsString());
            }
            
            return [
                'success' => false,
                'message' => 'Failed to process CockPit3D order: ' . $e->getMessage(),
                'cockpit3d_order_id' => null,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Validate order data structure
     * @param array $orderData
     * @throws Exception
     */
    private function validateOrderData($orderData) {
        $required = ['orderNumber', 'cartItems', 'customerInfo', 'shippingAddress'];
        
        foreach ($required as $field) {
            if (!isset($orderData[$field])) {
                throw new Exception("Missing required field: {$field}");
            }
        }
        
        if (!is_array($orderData['cartItems']) || empty($orderData['cartItems'])) {
            throw new Exception("Cart items must be a non-empty array");
        }
        
        if ($this->mode === 'development' || $this->mode === 'test') {
            error_log("✅ COCKPIT3D: Order data validation passed");
        }
    }
    
    /**
     * Transform cart items to CockPit3D format
     * @param array $cartItems
     * @return array
     */
    private function transformCartItems($cartItems) {
        $cockpit3dItems = [];
        
        foreach ($cartItems as $item) {
            // Only process crystal engraving items (you can adjust this logic)
            if ($this->isCrystalEngravingItem($item)) {
                $cockpit3dItem = $this->transformSingleItem($item);
                if ($cockpit3dItem) {
                    $cockpit3dItems[] = $cockpit3dItem;
                }
            }
        }
        
        if ($this->mode === 'development' || $this->mode === 'test') {
            error_log("🔄 COCKPIT3D: Transformed " . count($cartItems) . " cart items to " . count($cockpit3dItems) . " CockPit3D items");
        }
        
        return $cockpit3dItems;
    }
    
    /**
     * Check if item is a crystal engraving item that needs CockPit3D processing
     * @param array $item
     * @return bool
     */
    private function isCrystalEngravingItem($item) {
        // Check if item has options that indicate it's a crystal engraving
        return isset($item['options']) && (
            isset($item['options']['size']) ||
            isset($item['options']['background']) ||
            isset($item['options']['lightBase']) ||
            isset($item['options']['rawImageUrl']) ||
            isset($item['options']['maskedImageUrl'])
        );
    }
    
    /**
     * Transform single cart item to CockPit3D format
     * @param array $item
     * @return array|null
     */
    private function transformSingleItem($item) {
        try {
            $options = $item['options'] ?? [];
            
            // Map your product options to CockPit3D format
            $cockpit3dItem = [
                'sku' => $this->mapProductToCockPit3DSKU($item),
                'quantity' => $item['quantity'] ?? 1,
                'price' => $item['price'] ?? 0,
                'product_name' => $item['name'] ?? 'Crystal Engraving',
                'specifications' => [
                    'size' => $options['size'] ?? 'medium',
                    'background_type' => $options['background'] ?? '3d',
                    'light_base' => $options['lightBase'] ?? 'standard',
                    'gift_stand' => $options['giftStand'] ?? 'none'
                ]
            ];
            
            // Add custom text if present
            if (isset($options['customText'])) {
                $cockpit3dItem['specifications']['custom_text'] = $options['customText'];
            }
            
            // Add image URLs if present
            if (isset($options['rawImageUrl'])) {
                $cockpit3dItem['specifications']['raw_image_url'] = $options['rawImageUrl'];
            }
            
            if (isset($options['maskedImageUrl'])) {
                $cockpit3dItem['specifications']['masked_image_url'] = $options['maskedImageUrl'];
            }
            
            if ($this->mode === 'development' || $this->mode === 'test') {
                error_log("🔄 COCKPIT3D: Transformed item: " . json_encode($cockpit3dItem, JSON_PRETTY_PRINT));
            }
            
            return $cockpit3dItem;
            
        } catch (Exception $e) {
            if ($this->mode === 'development' || $this->mode === 'test') {
                error_log("❌ COCKPIT3D: Error transforming item: " . $e->getMessage());
            }
            return null;
        }
    }
    
    /**
     * Map your product to CockPit3D SKU
     * @param array $item
     * @return string
     */
    private function mapProductToCockPit3DSKU($item) {
        // Map your products to CockPit3D SKUs
        $productId = $item['productId'] ?? 0;
        $options = $item['options'] ?? [];
        
        // Example mapping - adjust based on your products
        $skuMap = [
            2 => 'CRYSTAL_RECT_TALL', // 3D Crystal Rectangle Tall
            105 => 'Lightbase_Rectangle', // Lightbase Rectangle
            106 => 'Lightbase_Square', // Lightbase Square
            107 => 'Lightbase_Wood_Small', // Lightbase Wood Small
            108 => 'Lightbase_Wood_Medium', // Lightbase Wood Medium
            119 => 'Lightbase_Wood_Long', // Lightbase Wood Long
            160 => 'Rotating_LED_Lightbase', // Rotating LED Lightbase
            252 => 'wooden_base_mini', // Wooden Premium Base Mini
            276 => 'concave_lightbase', // Concave Lightbase
            279 => 'ornament_stand', // Ornament Stand
        ];
        
        $baseSku = $skuMap[$productId] ?? 'CRYSTAL_CUSTOM';
        
        // Add size suffix if available
        if (isset($options['size'])) {
            $baseSku .= '_' . strtoupper($options['size']);
        }
        
        return $baseSku;
    }
    
    /**
     * Prepare complete CockPit3D order payload
     * @param array $orderData
     * @param array $cockpit3dItems
     * @return array
     */
    private function prepareCockPit3DOrder($orderData, $cockpit3dItems) {
        $customerInfo = $orderData['customerInfo'];
        $shippingAddress = $orderData['shippingAddress'];
        
        $order = [
            'retailer_id' => $orderData['orderNumber'],
            'address' => [
                'email' => $customerInfo['email'] ?? '',
                'firstname' => $shippingAddress['firstName'] ?? '',
                'lastname' => $shippingAddress['lastName'] ?? '',
                'telephone' => $customerInfo['phone'] ?? '',
                'region' => $shippingAddress['state'] ?? '',
                'country' => $shippingAddress['country'] ?? 'US',
                'street' => $shippingAddress['address'] ?? '',
                'city' => $shippingAddress['city'] ?? '',
                'postcode' => $shippingAddress['postalCode'] ?? '',
                'shipping_method' => 'standard',
                'destination' => 'vendor_store'
            ],
            'items' => $cockpit3dItems
        ];
        
        return $order;
    }
    
    /**
     * Send order to CockPit3D API
     * @param array $orderData
     * @return array
     * @throws Exception
     */
    private function sendOrderToCockPit3D($orderData) {
        if (empty($this->apiBaseUrl) || empty($this->bearerToken)) {
            throw new Exception("CockPit3D API credentials not configured");
        }
        
        // Use retailerId as store key - get it from parent fetcher
        $storeKey = $this->retailerId ?? getEnvVariable('COCKPIT3D_API_TOKEN');
        
        // Build URL with store key
        $url = rtrim($this->apiBaseUrl, '/') . '/rest/V2/orders';
    
        echo "📤 COCKPIT3D: Full URL: " . $url . "\n";
        
        // Log the URL being used
        if ($this->mode === 'development' || $this->mode === 'test') {
            error_log("🔑 COCKPIT3D: Using store key: " . $storeKey);
            error_log("📤 COCKPIT3D: Full URL: " . $url);
        }
        
        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->bearerToken,
            'Accept: application/json'
        ];
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($orderData),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2
        ]);
        
        if ($this->mode === 'development' || $this->mode === 'test') {
            error_log("📤 COCKPIT3D: Sending POST to: " . $url);
            curl_setopt($ch, CURLOPT_VERBOSE, true);
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        if ($curlError) {
            throw new Exception("CURL Error: " . $curlError);
        }
        
        if ($httpCode !== 200 && $httpCode !== 201) {
            $errorMsg = "HTTP {$httpCode}: " . ($response ?: 'Unknown error');
            throw new Exception($errorMsg);
        }
        
        $decodedResponse = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON response: " . json_last_error_msg());
        }
        
        return $decodedResponse;
    }
}

// Usage example for Stripe webhook or payment success handler:
/*
// After successful Stripe payment, call this processor
$processor = new CockPit3DOrderProcessor();

$orderData = [
    'orderNumber' => 'ORD-123456789',
    'cartItems' => $stripeMetadata['cartItems'], // From Stripe metadata
    'customerInfo' => [
        'email' => $customer->email,
        'phone' => $customer->phone
    ],
    'shippingAddress' => [
        'firstName' => $shipping->name,
        'lastName' => '',
        'address' => $shipping->address->line1,
        'city' => $shipping->address->city,
        'state' => $shipping->address->state,
        'postalCode' => $shipping->address->postal_code,
        'country' => $shipping->address->country
    ]
];

$result = $processor->processOrder($orderData);

if ($result['success']) {
    // Order successfully sent to CockPit3D
    $cockpit3dOrderId = $result['cockpit3d_order_id'];
    // Update your database with CockPit3D order ID
} else {
    // Handle error
    error_log("CockPit3D processing failed: " . $result['message']);
}
*/

?>