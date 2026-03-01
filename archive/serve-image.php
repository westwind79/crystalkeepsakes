<?php
/**
 * Image Proxy Script
 * Serves images from crystal-data directory
 * Use this if .htaccess RewriteRule doesn't work on GoDaddy
 * 
 * URL: https://crystalkeepsakes.com/serve-image.php?path=ORDER-123/image.jpg
 */

// Get requested image path
$requestPath = $_GET['path'] ?? '';

// Security: Prevent directory traversal
$requestPath = str_replace(['..', '\\'], '', $requestPath);
$requestPath = ltrim($requestPath, '/');

if (empty($requestPath)) {
    header('HTTP/1.0 400 Bad Request');
    die('No image path specified');
}

// Build full path to image
$basePath = dirname(dirname(__DIR__)) . '/crystal-data/order-images';
$imagePath = $basePath . '/' . $requestPath;

// Check if file exists
if (!file_exists($imagePath)) {
    header('HTTP/1.0 404 Not Found');
    die('Image not found');
}

// Check if it's actually an image
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
$extension = strtolower(pathinfo($imagePath, PATHINFO_EXTENSION));

if (!in_array($extension, $allowedExtensions)) {
    header('HTTP/1.0 403 Forbidden');
    die('Invalid file type');
}

// Get mime type
$mimeTypes = [
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'gif' => 'image/gif',
    'webp' => 'image/webp'
];

$mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';

// Set headers
header('Content-Type: ' . $mimeType);
header('Content-Length: ' . filesize($imagePath));
header('Cache-Control: public, max-age=31536000'); // 1 year
header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');

// Output image
readfile($imagePath);
exit;
?>
