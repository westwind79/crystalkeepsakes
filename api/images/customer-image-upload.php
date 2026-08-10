<?php
/**
 * Customer Image Upload API
 *
 * Production: /public_html/crystalkeepsakes.com/api/images/customer-image-upload.php
 * Uploads to: /public_html/crystalkeepsakes.com/crystal-data/orders/{ORDER_ID}/
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

$logger = null;
$input = '';
$imageType = 'unknown';
$productId = 'unknown';
$orderNumber = null;

try {
    $envLoaderPath = dirname(__DIR__) . '/env-loader.php';
    $loggerPath = dirname(__DIR__) . '/upload-logger.php';

    if (!file_exists($envLoaderPath)) {
        throw new Exception('Server configuration missing env loader');
    }
    require_once $envLoaderPath;

    if (file_exists($loggerPath)) {
        require_once $loggerPath;
    }

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!is_array($data) || empty($data['imageData'])) {
        throw new Exception('No image data provided');
    }

    $imageData = $data['imageData'];
    $productId = isset($data['productId']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', (string) $data['productId']) : 'unknown';
    $imageType = isset($data['imageType']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', (string) $data['imageType']) : 'masked';
    $orderNumber = !empty($data['orderNumber']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', (string) $data['orderNumber']) : null;

    if (!preg_match('/^data:image\/([a-zA-Z0-9.+-]+);base64,/', $imageData, $matches)) {
        throw new Exception('Invalid base64 image format');
    }

    $imageExtension = strtolower($matches[1]);
    if ($imageExtension === 'jpeg') {
        $imageExtension = 'jpg';
    }
    if (!in_array($imageExtension, ['jpg', 'png', 'gif', 'webp'], true)) {
        throw new Exception('Unsupported image type');
    }

    $base64Image = substr($imageData, strpos($imageData, ',') + 1);
    $binaryImage = base64_decode($base64Image, true);
    if ($binaryImage === false) {
        throw new Exception('Failed to decode base64 image');
    }

    $imageSize = strlen($binaryImage);
    if ($imageSize > 10 * 1024 * 1024) {
        throw new Exception('Image too large. Maximum size is 10MB.');
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $detectedMime = $finfo->buffer($binaryImage);
    if (strpos($detectedMime, 'image/') !== 0) {
        throw new Exception("Invalid image data. Detected type: $detectedMime");
    }

    $mode = getEnvVar('NEXT_PUBLIC_ENV_MODE') ?: 'production';
    $basePath = trim((string) (getEnvVar('NEXT_PUBLIC_BASE_PATH') ?: ''), '/');

    $scriptDir = str_replace('\\', '/', __DIR__);
    $scriptDir = rtrim($scriptDir, '/');
    $siteRoot = ($basePath === 'test')
        ? dirname(dirname(dirname($scriptDir)))
        : dirname(dirname($scriptDir));

    if (class_exists('UploadLogger')) {
        $logger = new UploadLogger($siteRoot);
        $logger->logUploadStart($imageType, $productId, $orderNumber, strlen($input));
        $logger->logImageValidation(strlen($imageData), $imageSize, $detectedMime, $imageExtension);
    }

    $subFolder = ($mode === 'development' || $mode === 'testing') ? 'orders-test' : 'orders';
    $uploadDir = $siteRoot . '/crystal-data/' . $subFolder . '/';
    $fullUploadDir = $uploadDir . ($orderNumber ? $orderNumber : 'temp-' . date('Ymd-His')) . '/';

    if ($logger) {
        $logger->logDirectoryCheck($fullUploadDir);
    }

    if (!file_exists($fullUploadDir) && !mkdir($fullUploadDir, 0755, true)) {
        throw new Exception('Failed to create upload directory. Check crystal-data permissions.');
    }

    if (!is_writable($fullUploadDir)) {
        throw new Exception('Upload directory is not writable. Check crystal-data permissions.');
    }

    $timestamp = round(microtime(true) * 1000);
    $filename = "customer_{$productId}_{$imageType}_{$timestamp}_" . uniqid() . ".{$imageExtension}";
    $filePath = $fullUploadDir . $filename;

    $bytesWritten = file_put_contents($filePath, $binaryImage);
    if ($bytesWritten === false) {
        throw new Exception('Failed to save image file');
    }

    @chmod($filePath, 0644);

    if ($mode === 'development') {
        $backendUrl = rtrim(getEnvVar('NEXT_PUBLIC_PHP_BACKEND_URL') ?: 'http://localhost:8888/crystalkeepsakes', '/');
        $fileUrl = $backendUrl . '/crystal-data/' . $subFolder . '/' . ($orderNumber ? $orderNumber . '/' : '') . $filename;
    } else {
        $fileUrl = '/crystal-data/' . $subFolder . '/' . ($orderNumber ? $orderNumber . '/' : '') . $filename;
    }

    if ($logger) {
        $logger->logUploadSuccess($filePath, $fileUrl, filesize($filePath));
        $logger->writeLog();
    }

    echo json_encode([
        'success' => true,
        'filename' => $filename,
        'url' => $fileUrl,
        'size' => $imageSize,
        'type' => $imageType,
        'environment' => $mode,
        'orderNumber' => $orderNumber,
        'logRequestId' => $logger ? $logger->getRequestId() : null,
    ]);
} catch (Exception $e) {
    if ($logger) {
        $logger->logUploadFailure($e->getMessage(), 'EXCEPTION', [
            'exception_class' => get_class($e),
        ]);
        $logger->writeLog();
    }

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'logRequestId' => $logger ? $logger->getRequestId() : null,
    ]);
}
?>
