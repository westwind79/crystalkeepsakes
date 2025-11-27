<?php
header('Content-Type: application/json');

require_once __DIR__ . './stripe/image-storage.php';
require_once __DIR__ . './stripe/db-connect.php';

try {
  $input = json_decode(file_get_contents('php://input'), true);

  if (!$input || !$input['image'] || !$input['cartItemId'] || !$input['imageType']) {
    throw new Exception('Missing required fields');
  }

  $storage = new ImageStorage();
  $fileInfo = $storage->saveImageFromBase64(
    $input['image'],
    $input['orderNumber'] ?? 'temp',
    $input['cartItemId'],
    $input['imageType']
  );

  echo json_encode([
    'success' => true,
    'url' => '/uploads/order-images/' . ($input['orderNumber'] ?? 'temp') . '/' . $fileInfo['filename']
  ]);

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}