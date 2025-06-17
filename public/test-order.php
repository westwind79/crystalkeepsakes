<?php
// test-order.php - PHP version for MAMP
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CockPit3D Test Order</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
        }
        .test-item {
            background: #e3f2fd;
            border: 2px solid #2196F3;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .test-item h3 {
            margin: 0 0 10px 0;
            color: #1976D2;
        }
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px 5px;
            transition: background 0.3s;
        }
        button:hover {
            background: #45a049;
        }
        button:disabled {
            background: #cccccc;
            cursor: not-allowed;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 6px;
            white-space: pre-wrap;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            max-height: 400px;
            overflow-y: auto;
        }
        .success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        .error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        .info {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
        }
        .loading {
            text-align: center;
            padding: 20px;
            color: #666;
        }
        .order-details {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
        }
        .order-details h4 {
            margin: 0 0 10px 0;
            color: #495057;
        }
        .order-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .order-item:last-child {
            border-bottom: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 CockPit3D Test Order System</h1>
        
        <div class="test-item">
            <h3>📦 Simple Lightbase Test Order</h3>
            <p>Send a basic test order with a Lightbase Rectangle ($25) to CockPit3D API.</p>
            
            <div class="order-details">
                <h4>Test Order Contents:</h4>
                <div class="order-item">
                    <span><strong>Product:</strong> Lightbase Rectangle</span>
                    <span><strong>Price:</strong> $25.00</span>
                </div>
                <div class="order-item">
                    <span><strong>Customer:</strong> Noah Test</span>
                    <span><strong>Shipping:</strong> $10.00</span>
                </div>
                <div class="order-item">
                    <span><strong>Order Total:</strong> $35.00</span>
                    <span><strong>Mode:</strong> TEST</span>
                </div>
            </div>
            
            <button onclick="sendTestOrder()" id="testBtn">
                🚀 Send Test Order to CockPit3D
            </button>
            
            <button onclick="checkCredentials()" id="credBtn">
                🔍 Check API Credentials
            </button>
            
            <div id="result"></div>
        </div>

        <div class="test-item">
            <h3>📋 What This Test Will Do:</h3>
            <ul>
                <li>✅ Create a mock order with simple lightbase product</li>
                <li>✅ Check your CockPit3D API credentials</li>
                <li>✅ Transform order data to CockPit3D format</li>
                <li>✅ Send POST request to CockPit3D API</li>
                <li>✅ Show you the exact request and response</li>
                <li>⚠️ <strong>NO real payment processing</strong></li>
                <li>⚠️ Uses TEST_ prefix for order number</li>
            </ul>
        </div>
    </div>

    <script>
        async function sendTestOrder() {
            const btn = document.getElementById('testBtn');
            const result = document.getElementById('result');
            
            btn.disabled = true;
            btn.textContent = '⏳ Sending Test Order...';
            
            result.className = 'result loading';
            result.textContent = '🚀 Preparing test order for CockPit3D...\n\nThis may take a few seconds...';
            
            try {
                const response = await fetch('http://crystalkeepsakes:8888/api/test-cockpit3d-order.php?test=true', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                const text = await response.text();
                console.log('Raw response:', text);
                
                // Try to parse JSON from the end of the response
                const jsonMatch = text.match(/(\{[^}]*"success"[^}]*\}[^}]*\})$/);
                if (jsonMatch) {
                    const data = JSON.parse(jsonMatch[1]);
                    
                    if (data.success) {
                        result.className = 'result success';
                        result.textContent = `✅ SUCCESS!\n\n${text}`;
                    } else {
                        result.className = 'result error';
                        result.textContent = `❌ FAILED!\n\n${text}`;
                    }
                } else {
                    // Show full response if no JSON found
                    result.className = 'result info';
                    result.textContent = `📝 Full Response:\n\n${text}`;
                }
                
            } catch (error) {
                result.className = 'result error';
                result.textContent = `❌ ERROR: ${error.message}\n\nCheck console for details.`;
                console.error('Test order error:', error);
            } finally {
                btn.disabled = false;
                btn.textContent = '🚀 Send Test Order to CockPit3D';
            }
        }
        
        async function checkCredentials() {
            const btn = document.getElementById('credBtn');
            const result = document.getElementById('result');
            
            btn.disabled = true;
            btn.textContent = '⏳ Checking...';
            
            result.className = 'result loading';
            result.textContent = '🔍 Checking CockPit3D API credentials...';
            
            try {
                const response = await fetch('http://crystalkeepsakes:8888/api/test-cockpit3d-order.php?test=true&check=credentials', {
                    method: 'GET'
                });
                
                const text = await response.text();
                
                result.className = 'result info';
                result.textContent = `🔧 Credentials Check:\n\n${text}`;
                
            } catch (error) {
                result.className = 'result error';
                result.textContent = `❌ ERROR: ${error.message}`;
            } finally {
                btn.disabled = false;
                btn.textContent = '🔍 Check API Credentials';
            }
        }
    </script>
</body>
</html>