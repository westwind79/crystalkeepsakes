<?php
    return [
        'square' => [
            'access_token' => getenv('SQUARE_ACCESS_TOKEN'),
            'location_id' => getenv('SQUARE_LOCATION_ID'),
            'environment' => getenv('SQUARE_ENVIRONMENT'),
        ]
    ];
?>