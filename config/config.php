<?php
// config/config.php
return [
    'stripe' => [
        'secret_key' => getenv('sk_test_51QoDXkFGPmVZe548MJulhkA9Zi7bHAISVpWWqqgwv3fK7MHT77bzrKcDbDhKd0fRY3KT7eJ8cvsprqwDXn9MdCRw00QYFA8f3V'),
        'publishable_key' => getenv('pk_test_51QoDXkFGPmVZe548YMJNAiNX4DoiU7jjlXJ89IPD4S80dvppPLltvgDDQlm8ILw8NibDlcimbSfRPPkn1lVS7P7W00rZzMONme')
    ],
    'site' => [
        'url' => getenv('SITE_URL') ?: 'https://crystalkeepsakes.com'
    ]
];
?>