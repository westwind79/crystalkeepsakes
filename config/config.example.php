<?php
    // config/config.php
    return [
        'stripe' => [
            'secret_key' => getenv('sk_test_'),
            'publishable_key' => getenv('pk_test_')
        ],
        'site' => [
            'url' => getenv('SITE_URL') ?: 'https://example.com'
        ]
    ];
?>