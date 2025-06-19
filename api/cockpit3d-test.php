<?php
// api/test-cockpit3d.php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Function to get .env variables (reusing your existing pattern)
function getEnvVariable($key) {
    $envFile = dirname(__DIR__) . '/.env';
    if (!file_exists($envFile)) {
        throw new Exception(".env file not found at: $envFile");
    }
    
    $content = file_get_contents($envFile);
    if ($content === false) {
        throw new Exception("Failed to read .env file");
    }
    
    $lines = explode("\n", $content);
    foreach ($lines as $line) {
        $line = trim($line);
        
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }
        
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) {
            continue;
        }
        
        $envKey = trim($parts[0]);
        $envValue = trim($parts[1]);
        
        // Remove quotes if present
        if ((strpos($envValue, '"') === 0 && strrpos($envValue, '"') === strlen($envValue) - 1) || 
            (strpos($envValue, "'") === 0 && strrpos($envValue, "'") === strlen($envValue) - 1)) {
            $envValue = substr($envValue, 1, -1);
        }
        
        if ($envKey === $key) {
            return $envValue;
        }
    }
    
    throw new Exception("Key '$key' not found in .env file");
}

try {
    // Get credentials from .env
    $username = getEnvVariable('COCKPIT3D_USERNAME');
    $password = getEnvVariable('COCKPIT3D_PASSWORD');
    $baseUrl = getEnvVariable('COCKPIT3D_BASE_URL');
    
    echo json_encode([
        'step' => 'credentials_loaded',
        'username' => $username,
        'base_url' => $baseUrl,
        'password_length' => strlen($password)
    ]);
    
    echo "\n\n";
    
    // Test 1: Get access token (Cockpit3D Profit API)
    $loginUrl = $baseUrl . '/rest/V2/login';
    
    $loginData = [
        'username' => $username,
        'password' => $password
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $loginUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // In case of SSL issues in dev
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("CURL Error: $error");
    }
    
    echo json_encode([
        'step' => 'login_attempt',
        'http_code' => $httpCode,
        'response' => $response,
        'response_length' => strlen($response)
    ]);
    
    if ($httpCode === 200) {
        // Should return a JWT token string
        $token = trim($response, '"');
        
        echo "\n\n";
        echo json_encode([
            'step' => 'login_success',
            'token_received' => !empty($token),
            'token_length' => strlen($token),
            'token_preview' => substr($token, 0, 30) . '...'
        ]);
        
        // Test 2: Get catalog (to verify token works)
        $catalogUrl = $baseUrl . '/rest/V2/catalog';
        
        $ch2 = curl_init();
        curl_setopt($ch2, CURLOPT_URL, $catalogUrl);
        curl_setopt($ch2, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json',
            'Accept: application/json'
        ]);
        curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch2, CURLOPT_TIMEOUT, 30);
        
        $catalogResponse = curl_exec($ch2);
        $catalogHttpCode = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
        $catalogError = curl_error($ch2);
        curl_close($ch2);
        
        echo "\n\n";
        echo json_encode([
            'step' => 'catalog_test',
            'http_code' => $catalogHttpCode,
            'response_preview' => substr($catalogResponse, 0, 200) . '...',
            'full_response_length' => strlen($catalogResponse)
        ]);
        
        if ($catalogHttpCode === 200) {
            $catalogData = json_decode($catalogResponse, true);
            echo "\n\n";
            echo json_encode([
                'step' => 'success',
                'message' => 'Cockpit3D API connection successful!',
                'catalog_categories' => count($catalogData),
                'first_category' => isset($catalogData[0]) ? $catalogData[0]['name'] : 'none'
            ]);
        }
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'step' => 'failed'
    ]);
}