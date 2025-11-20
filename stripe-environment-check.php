<?php
/**
 * Stripe Environment Verification Tool
 * CRITICAL: Verify which Stripe keys are being used
 */

header('Content-Type: text/html; charset=utf-8');

// Load environment
function loadEnv($envFile) {
    $env = [];
    if (!file_exists($envFile)) {
        return $env;
    }
    
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) continue;
        
        $name = trim($parts[0]);
        $value = trim($parts[1], " \t\n\r\0\x0B\"'");
        $env[$name] = $value;
        putenv("$name=$value");
    }
    return $env;
}

$env = loadEnv(__DIR__ . '/.env.production');
if (empty($env)) {
    $env = loadEnv(__DIR__ . '/.env');
}

$envMode = getenv('NEXT_PUBLIC_ENV_MODE') ?: 'not set';
$phpBackend = getenv('NEXT_PUBLIC_PHP_BACKEND_URL') ?: 'not set';

// Get Stripe keys
$stripeSecretKey = '';
$stripePublishableKey = '';

if ($envMode === 'production') {
    $stripeSecretKey = getenv('STRIPE_SECRET_KEY') ?: 'NOT SET';
    $stripePublishableKey = getenv('NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY') ?: 'NOT SET';
} else {
    $stripeSecretKey = getenv('STRIPE_DEVELOPMENT_SECRET_KEY') ?: 'NOT SET';
    $stripePublishableKey = getenv('NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY') ?: 'NOT SET';
}

// Detect key type
function detectKeyType($key) {
    if (strpos($key, 'sk_live_') === 0 || strpos($key, 'pk_live_') === 0) {
        return 'LIVE';
    } elseif (strpos($key, 'sk_test_') === 0 || strpos($key, 'pk_test_') === 0) {
        return 'TEST';
    } elseif ($key === 'NOT SET') {
        return 'MISSING';
    } else {
        return 'UNKNOWN';
    }
}

$secretKeyType = detectKeyType($stripeSecretKey);
$publishableKeyType = detectKeyType($stripePublishableKey);

// Determine overall status
$isCorrect = true;
$errors = [];

if ($envMode === 'production') {
    if ($secretKeyType !== 'LIVE') {
        $isCorrect = false;
        $errors[] = "Production mode but using TEST/MISSING secret key!";
    }
    if ($publishableKeyType !== 'LIVE') {
        $isCorrect = false;
        $errors[] = "Production mode but using TEST/MISSING publishable key!";
    }
} else {
    if ($secretKeyType === 'LIVE') {
        $errors[] = "Warning: Using LIVE keys in development/testing!";
    }
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>Stripe Environment Check</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 900px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .card {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        h1 {
            margin-top: 0;
            color: #333;
        }
        .status {
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
            font-size: 18px;
        }
        .status.correct {
            background: #d4edda;
            color: #155724;
            border: 2px solid #28a745;
        }
        .status.incorrect {
            background: #f8d7da;
            color: #721c24;
            border: 2px solid #dc3545;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: 600;
            color: #666;
        }
        .value {
            font-family: monospace;
            color: #333;
        }
        .key-display {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
        }
        .live {
            color: #dc3545;
            font-weight: bold;
        }
        .test {
            color: #28a745;
            font-weight: bold;
        }
        .missing {
            color: #ffc107;
            font-weight: bold;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 10px;
            border-radius: 4px;
            margin: 5px 0;
        }
        .instructions {
            background: #e7f3ff;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #0066cc;
        }
        .instructions h3 {
            margin-top: 0;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>🔐 Stripe Environment Verification</h1>
        
        <?php if ($isCorrect && empty($errors)): ?>
            <div class="status correct">
                ✅ Configuration is CORRECT!
            </div>
        <?php else: ?>
            <div class="status incorrect">
                ❌ Configuration has ERRORS!
            </div>
            <?php foreach ($errors as $error): ?>
                <div class="error">⚠️ <?php echo htmlspecialchars($error); ?></div>
            <?php endforeach; ?>
        <?php endif; ?>

        <h2>Environment Configuration</h2>
        <div class="info-row">
            <span class="label">Environment Mode:</span>
            <span class="value"><?php echo htmlspecialchars($envMode); ?></span>
        </div>
        <div class="info-row">
            <span class="label">Backend URL:</span>
            <span class="value"><?php echo htmlspecialchars($phpBackend); ?></span>
        </div>
        <div class="info-row">
            <span class="label">Current URL:</span>
            <span class="value"><?php echo htmlspecialchars($_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']); ?></span>
        </div>

        <h2>Stripe Keys</h2>
        
        <h3>Secret Key (Backend)</h3>
        <div class="info-row">
            <span class="label">Key Type:</span>
            <span class="value <?php echo strtolower($secretKeyType); ?>">
                <?php echo $secretKeyType; ?>
            </span>
        </div>
        <div class="key-display">
            <?php 
            if ($stripeSecretKey === 'NOT SET') {
                echo 'NOT SET - CHECK .env.production!';
            } else {
                echo substr($stripeSecretKey, 0, 12) . '********************************';
            }
            ?>
        </div>

        <h3>Publishable Key (Frontend)</h3>
        <div class="info-row">
            <span class="label">Key Type:</span>
            <span class="value <?php echo strtolower($publishableKeyType); ?>">
                <?php echo $publishableKeyType; ?>
            </span>
        </div>
        <div class="key-display">
            <?php 
            if ($stripePublishableKey === 'NOT SET') {
                echo 'NOT SET - CHECK .env.production!';
            } else {
                echo substr($stripePublishableKey, 0, 20) . '****************************';
            }
            ?>
        </div>

        <h2>Key Format Reference</h2>
        <div class="info-row">
            <span class="label">Test Secret:</span>
            <span class="value test">sk_test_51...</span>
        </div>
        <div class="info-row">
            <span class="label">Test Publishable:</span>
            <span class="value test">pk_test_51...</span>
        </div>
        <div class="info-row">
            <span class="label">Live Secret:</span>
            <span class="value live">sk_live_51...</span>
        </div>
        <div class="info-row">
            <span class="label">Live Publishable:</span>
            <span class="value live">pk_live_51...</span>
        </div>
    </div>

    <div class="card instructions">
        <h3>🔧 How to Fix</h3>
        
        <?php if ($envMode === 'production' && ($secretKeyType !== 'LIVE' || $publishableKeyType !== 'LIVE')): ?>
            <p><strong>Your site is in PRODUCTION mode but using TEST keys!</strong></p>
            <ol>
                <li>Get your LIVE Stripe keys from: <a href="https://dashboard.stripe.com/apikeys" target="_blank">Stripe Dashboard</a></li>
                <li>Edit <code>.env.production</code> on your server</li>
                <li>Update these variables with LIVE keys:
                    <pre>STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE</pre>
                </li>
                <li>Rebuild: <code>npm run build:prod</code></li>
                <li>Clear browser cache and refresh</li>
                <li>Run this check again</li>
            </ol>
        <?php elseif ($stripeSecretKey === 'NOT SET' || $stripePublishableKey === 'NOT SET'): ?>
            <p><strong>Stripe keys are MISSING!</strong></p>
            <ol>
                <li>Create/edit <code>.env.production</code> file</li>
                <li>Add your Stripe keys (test or live depending on environment)</li>
                <li>Rebuild your app</li>
                <li>Run this check again</li>
            </ol>
        <?php elseif ($isCorrect): ?>
            <p><strong>✅ Everything looks good!</strong></p>
            <p>Your Stripe configuration is correct for <?php echo $envMode; ?> mode.</p>
            
            <?php if ($envMode === 'production'): ?>
                <p><strong>⚠️ IMPORTANT:</strong> You're using LIVE keys. Real charges will be processed!</p>
                <p>Next steps:</p>
                <ul>
                    <li>Verify your Stripe account is fully activated</li>
                    <li>Check that webhooks are configured</li>
                    <li>Test with a small real transaction</li>
                </ul>
            <?php else: ?>
                <p>You're using TEST keys - safe for testing!</p>
            <?php endif; ?>
        <?php endif; ?>
    </div>

    <div class="card">
        <h3>📊 Stripe Dashboard Links</h3>
        <ul>
            <li><a href="https://dashboard.stripe.com/test/dashboard" target="_blank">Test Mode Dashboard</a></li>
            <li><a href="https://dashboard.stripe.com/dashboard" target="_blank">Live Mode Dashboard</a></li>
            <li><a href="https://dashboard.stripe.com/apikeys" target="_blank">API Keys</a></li>
            <li><a href="https://dashboard.stripe.com/webhooks" target="_blank">Webhooks</a></li>
            <li><a href="https://dashboard.stripe.com/settings/account" target="_blank">Account Activation Status</a></li>
        </ul>
    </div>
</body>
</html>
