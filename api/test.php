<?php
// api/get-stripe-key-simple.php
header('Content-Type: application/json');

// Hardcoded key for development only
echo json_encode([
    'publishableKey' => 'pk_test_51MwVSvCPW9vHGVtnAYOOKdnWQUv4D4iHkkIIeHgfKzGV6DfUSCwvxCsKrAxVWGhYxtZJDnlxbkfEHFhH4b8CkIbO00kImXoR0F'
]);