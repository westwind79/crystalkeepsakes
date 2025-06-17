<?php
// api/get-cockpit3d-catalog.php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Reuse your existing getEnvVariable function
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
    // Get credentials
    $username = getEnvVariable('COCKPIT3D_USERNAME');
    $password = getEnvVariable('COCKPIT3D_PASSWORD');
    $baseUrl = getEnvVariable('COCKPIT3D_BASE_URL');
    
    // Step 1: Get access token
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
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("CURL Error: $error");
    }
    
    if ($httpCode !== 200) {
        throw new Exception("Login failed with HTTP code: $httpCode");
    }
    
    $token = trim($response, '"');
    
    // Step 2: Get full catalog
    $catalogUrl = $baseUrl . '/rest/V2/catalog';
    
    $ch2 = curl_init();
    curl_setopt($ch2, CURLOPT_URL, $catalogUrl);
    curl_setopt($ch2, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch2, CURLOPT_TIMEOUT, 60); // Longer timeout for large catalog
    
    $catalogResponse = curl_exec($ch2);
    $catalogHttpCode = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
    $catalogError = curl_error($ch2);
    curl_close($ch2);
    
    if ($catalogError) {
        throw new Exception("Catalog CURL Error: $catalogError");
    }
    
    if ($catalogHttpCode !== 200) {
        throw new Exception("Catalog request failed with HTTP code: $catalogHttpCode");
    }
    
    $catalogData = json_decode($catalogResponse, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Failed to decode catalog JSON: " . json_last_error_msg());
    }
    
    // Save catalog to file
    $outputFile = dirname(__DIR__, 2) . '/src/data/cockpit3d-catalog.json';
    $result = file_put_contents($outputFile, json_encode($catalogData, JSON_PRETTY_PRINT));
    
    if ($result === false) {
        throw new Exception("Failed to save catalog to file");
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Catalog saved successfully',
        'file_path' => $outputFile,
        'catalog_stats' => [
            'categories' => count($catalogData),
            'products' => array_sum(array_map(function($cat) {
                return count($cat['products'] ?? []);
            }, $catalogData))
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'success' => false
    ]);
}