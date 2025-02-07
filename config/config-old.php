<?php
// Load .env file
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        
        if (!empty($name)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

return [
    'square' => [
        'access_token' => getenv('SQUARE_ACCESS_TOKEN'),
        'environment' => getenv('SQUARE_ENVIRONMENT'),
        'location_id' => getenv('SQUARE_LOCATION_ID')
    ],
    'site' => [
        'url' => getenv('SITE_URL') ?: 'https://crystalkeepsakes.com'
    ]
];