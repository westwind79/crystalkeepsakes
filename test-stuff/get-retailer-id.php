<?php
/**
 * Cockpit3D Retailer ID Fetcher
 * Simple script to display your retailer ID
 * 
 * Usage: Upload to your server and visit in browser
 */

// Load environment variables (adjust path as needed)
function loadEnv($filePath) {
    if (!file_exists($filePath)) {
        return;
    }
    
    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        
        if (!array_key_exists($name, $_ENV)) {
            putenv("$name=$value");
            $_ENV[$name] = $value;
        }
    }
}

// Try to load .env file (adjust path to your setup)
loadEnv(__DIR__ . '/.env');

// Get credentials from environment
$baseUrl = getenv('COCKPIT3D_BASE_URL') ?: 'https://api.cockpit3d.com';
$username = getenv('COCKPIT3D_USERNAME');
$password = getenv('COCKPIT3D_PASSWORD');

?>
<!DOCTYPE html>
<html>
<head>
    <title>Cockpit3D Retailer ID</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #1a1a1a;
            color: #0f0;
        }
        .container {
            background: #000;
            border: 2px solid #0f0;
            padding: 30px;
            border-radius: 10px;
        }
        h1 {
            color: #0f0;
            text-align: center;
            text-shadow: 0 0 10px #0f0;
        }
        .result {
            background: #1a1a1a;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #0f0;
            font-size: 18px;
        }
        .retailer-id {
            font-size: 32px;
            color: #0ff;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            background: #000;
            border: 2px solid #0ff;
            margin: 20px 0;
            text-shadow: 0 0 10px #0ff;
        }
        .error {
            color: #f00;
            border-color: #f00;
        }
        .info {
            color: #ff0;
            font-size: 14px;
            margin-top: 10px;
        }
        .success {
            color: #0f0;
        }
        pre {
            background: #1a1a1a;
            padding: 15px;
            overflow-x: auto;
            border: 1px solid #333;
        }
        .copy-btn {
            background: #0f0;
            color: #000;
            padding: 10px 20px;
            border: none;
            cursor: pointer;
            font-weight: bold;
            font-size: 16px;
            border-radius: 5px;
            display: block;
            margin: 20px auto;
        }
        .copy-btn:hover {
            background: #0ff;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔑 Cockpit3D Retailer ID Finder</h1>

<?php

if (!$username || !$password) {
    echo '<div class="result error">';
    echo '<h2>❌ Missing Credentials</h2>';
    echo '<p>COCKPIT3D_USERNAME: ' . ($username ? '✅ Set' : '❌ Missing') . '</p>';
    echo '<p>COCKPIT3D_PASSWORD: ' . ($password ? '✅ Set' : '❌ Missing') . '</p>';
    echo '<p class="info">Make sure your .env file is in the same directory as this script.</p>';
    echo '</div>';
} else {
    echo '<div class="result success">';
    echo '<p>✅ Credentials found. Attempting authentication...</p>';
    echo '</div>';

    // Step 1: Authenticate
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $baseUrl . '/rest/V2/login');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'username' => $username,
        'password' => $password
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        echo '<div class="result error">';
        echo '<h2>❌ Authentication Failed</h2>';
        echo '<p>HTTP Code: ' . $httpCode . '</p>';
        echo '<p>Response: ' . htmlspecialchars($response) . '</p>';
        echo '</div>';
    } else {
        $token = str_replace('"', '', $response);
        
        echo '<div class="result success">';
        echo '<p>✅ Authentication successful!</p>';
        echo '<p class="info">Token: ' . substr($token, 0, 33) . '</p>';
        echo '<p class="info">Base Url: ' . substr($baseUrl, 0, 33) . '</p>';
        echo '</div>';

        // Step 2: Fetch catalog to get retailer info
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $baseUrl . '/rest/V2/catalog');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $catalogResponse = curl_exec($ch);
        $catalogHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($catalogHttpCode !== 200) {
            echo '<div class="result error">';
            echo '<h2>❌ Failed to fetch catalog</h2>';
            echo '<p>HTTP Code: ' . $catalogHttpCode . '</p>';
            echo '</div>';
        } else {
            $catalogData = json_decode($catalogResponse, true);
            
            // Step 3: Try to extract retailer_id
            // Method 1: Check if it's in the response
            $retailerId = null;
            
            // Check various possible locations
            if (isset($catalogData['retailer_id'])) {
                $retailerId = $catalogData['retailer_id'];
            } elseif (isset($catalogData[0]['retailer_id'])) {
                $retailerId = $catalogData[0]['retailer_id'];
            }
            
            // Display results
            if ($retailerId) {
                echo '<div class="retailer-id" id="retailerId">' . $retailerId . '</div>';
                echo '<button class="copy-btn" onclick="copyRetailerId()">📋 Copy Retailer ID</button>';
                
                echo '<div class="result success">';
                echo '<h3>✅ Retailer ID Found!</h3>';
                echo '<p>Add this to your .env file:</p>';
                echo '<pre>COCKPIT3D_RETAILER_ID=' . $retailerId . '</pre>';
                echo '</div>';
            } else {
                // Show full catalog structure to help find it
                echo '<div class="result">';
                echo '<h3>⚠️ Retailer ID not found automatically</h3>';
                echo '<p>Here\'s the catalog data structure. Look for a field that might be your retailer/store ID:</p>';
                echo '<pre>' . json_encode($catalogData, JSON_PRETTY_PRINT) . '</pre>';
                echo '</div>';
                
                // Alternative: Try making an order request to see the structure
                echo '<div class="result info">';
                echo '<h3>💡 Alternative Method</h3>';
                echo '<p>Check your Cockpit3D account dashboard or contact support:</p>';
                echo '<p>📧 Email: m.shanta@alvacommerce.com</p>';
                echo '<p>They can provide your retailer_id directly.</p>';
                echo '</div>';
            }
        }
    }
}
?>

    </div>

    <script>
        function copyRetailerId() {
            const id = document.getElementById('retailerId').innerText;
            navigator.clipboard.writeText(id).then(() => {
                alert('✅ Retailer ID copied: ' + id);
            });
        }
    </script>
</body>
</html>
