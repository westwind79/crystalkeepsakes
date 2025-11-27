@echo off
REM Crystal Keepsakes - MAMP Diagnostic
REM Run this from your project directory

echo ================================================
echo Crystal Keepsakes - MAMP Diagnostic
echo ================================================
echo.

REM Get current directory
set CURRENT_DIR=%CD%
echo Current directory: %CURRENT_DIR%
echo.

REM Check 1: .env file exists
echo [1/6] Checking for .env file...
if exist ".env" (
    echo [OK] .env file found
    
    REM Check if it has Stripe keys
    findstr /C:"STRIPE_DEVELOPMENT_SECRET_KEY" .env >nul 2>&1
    if %errorlevel%==0 (
        echo [OK] Stripe keys appear to be configured
    ) else (
        echo [ERROR] .env file exists but no Stripe keys found
        echo        Edit .env and add: STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_YOUR_KEY
    )
) else (
    echo [ERROR] .env file NOT found
    echo        Download .env from outputs folder
    echo        Save to: %CURRENT_DIR%\.env
)
echo.

REM Check 2: PHP files exist
echo [2/6] Checking for PHP files...
if exist "create-checkout-session.php" (
    echo [OK] create-checkout-session.php found
) else (
    echo [ERROR] create-checkout-session.php NOT found
    echo        Are you in the right directory?
)

if exist "contact.php" (
    echo [OK] contact.php found
) else (
    echo [WARNING] contact.php not found (optional)
)
echo.

REM Check 3: package.json (Next.js project)
echo [3/6] Checking for Next.js project...
if exist "package.json" (
    echo [OK] package.json found - this is a Next.js project
) else (
    echo [ERROR] package.json NOT found
    echo        Are you in the project root?
)
echo.

REM Check 4: MAMP running
echo [4/6] Checking if MAMP is accessible...
curl -s http://localhost:8888 >nul 2>&1
if %errorlevel%==0 (
    echo [OK] MAMP is responding on port 8888
) else (
    echo [ERROR] Cannot reach localhost:8888
    echo        Start MAMP or check Apache port
)
echo.

REM Check 5: Project accessible via MAMP
echo [5/6] Checking if project is accessible...
echo Testing: http://localhost:8888/crystalkeepsakes/
curl -s -o nul -w "HTTP Status: %%{http_code}" http://localhost:8888/crystalkeepsakes/ 2>nul
echo.
echo If you see 200, project is accessible
echo If you see 404, check project path in MAMP
echo.

REM Check 6: node_modules
echo [6/6] Checking Node.js dependencies...
if exist "node_modules" (
    echo [OK] node_modules found
) else (
    echo [ERROR] node_modules NOT found
    echo        Run: npm install
)
echo.

REM Summary
echo ================================================
echo Summary
echo ================================================
echo.

if exist ".env" (
    echo Status: .env exists - GOOD
    findstr /C:"sk_test_" .env >nul 2>&1
    if %errorlevel%==0 (
        echo Stripe: Keys configured - GOOD
    ) else (
        echo Stripe: Keys missing - ACTION NEEDED
    )
) else (
    echo Status: .env missing - ACTION NEEDED
)
echo.

curl -s http://localhost:8888 >nul 2>&1
if %errorlevel%==0 (
    echo MAMP: Running - GOOD
) else (
    echo MAMP: Not running - ACTION NEEDED
)
echo.

if exist "node_modules" (
    echo Dependencies: Installed - GOOD
) else (
    echo Dependencies: Missing - ACTION NEEDED
)
echo.

echo ================================================
echo Recommended Actions
echo ================================================
echo.

if not exist ".env" (
    echo 1. Download .env file from outputs folder
    echo 2. Save to: %CURRENT_DIR%\.env
    echo 3. Edit and add your Stripe test keys
    echo.
)

curl -s http://localhost:8888 >nul 2>&1
if not %errorlevel%==0 (
    echo - Start MAMP
    echo - Make sure Apache is on port 8888
    echo.
)

if not exist "node_modules" (
    echo - Run: npm install
    echo.
)

echo ================================================
echo Next Steps
echo ================================================
echo.
echo Once fixes are applied:
echo 1. Start MAMP
echo 2. Run: npm run dev
echo 3. Open: http://localhost:3000
echo 4. Test checkout
echo.

echo ================================================
echo Test URLs
echo ================================================
echo.
echo Next.js:  http://localhost:3000
echo MAMP:     http://localhost:8888/crystalkeepsakes
echo PHP API:  http://localhost:8888/crystalkeepsakes/create-checkout-session.php
echo.

pause