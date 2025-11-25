@echo off
SETLOCAL EnableDelayedExpansion

REM ============================================================================
REM NUCLEAR RECOVERY - Complete Environment Rebuild
REM Use this after hard shutdown/crash when multiple things are broken
REM ============================================================================

set "TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "OUTPUT_FILE=%USERPROFILE%\Desktop\nuclear-recovery-%TIMESTAMP%.txt"

echo ======================================== > "%OUTPUT_FILE%"
echo NUCLEAR RECOVERY - Complete Rebuild >> "%OUTPUT_FILE%"
echo ======================================== >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"
echo Started: %date% %time% >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"

echo ========================================
echo NUCLEAR RECOVERY
echo Complete Environment Rebuild
echo ========================================
echo.
echo This script will:
echo 1. Clean all potentially corrupted files
echo 2. Rebuild Composer dependencies
echo 3. Rebuild NPM dependencies
echo 4. Verify PHP configuration
echo.
echo WARNING: This will delete vendor/ and node_modules/
echo Make sure you have backups!
echo.
echo Press Ctrl+C to cancel, or
pause
echo.

REM ============================================================================
REM STEP 1: CHECK PREREQUISITES
REM ============================================================================
echo [STEP 1] Checking prerequisites...
echo [STEP 1] Checking prerequisites... >> "%OUTPUT_FILE%"
echo.
echo. >> "%OUTPUT_FILE%"

REM Check if in project directory
if not exist "composer.json" (
    echo [X] ERROR: Not in project directory
    echo [X] ERROR: Not in project directory >> "%OUTPUT_FILE%"
    echo     composer.json not found
    echo     composer.json not found >> "%OUTPUT_FILE%"
    echo.
    echo Please cd to your project directory first:
    echo cd C:\MAMP\htdocs\crystalkeepsakes
    echo.
    pause
    exit /b 1
)

echo [+] In project directory: %CD%
echo [+] In project directory: %CD% >> "%OUTPUT_FILE%"
echo.
echo. >> "%OUTPUT_FILE%"

REM ============================================================================
REM STEP 2: CLEAN CORRUPTED FILES
REM ============================================================================
echo [STEP 2] Cleaning potentially corrupted files...
echo [STEP 2] Cleaning potentially corrupted files... >> "%OUTPUT_FILE%"
echo.
echo. >> "%OUTPUT_FILE%"

REM Check for 0-byte files and delete them
if exist "composer.lock" (
    for %%A in ("composer.lock") do (
        if %%~zA equ 0 (
            echo     Deleting corrupted composer.lock (0 bytes)
            echo     Deleting corrupted composer.lock (0 bytes) >> "%OUTPUT_FILE%"
            del "composer.lock"
        ) else (
            echo     composer.lock seems OK (%%~zA bytes)
            echo     composer.lock seems OK (%%~zA bytes) >> "%OUTPUT_FILE%"
        )
    )
)

if exist "package-lock.json" (
    for %%A in ("package-lock.json") do (
        if %%~zA equ 0 (
            echo     Deleting corrupted package-lock.json (0 bytes)
            echo     Deleting corrupted package-lock.json (0 bytes) >> "%OUTPUT_FILE%"
            del "package-lock.json"
        ) else (
            echo     package-lock.json seems OK (%%~zA bytes)
            echo     package-lock.json seems OK (%%~zA bytes) >> "%OUTPUT_FILE%"
        )
    )
)

if exist ".env" (
    for %%A in (".env") do (
        if %%~zA equ 0 (
            echo     [!] WARNING: .env is 0 bytes - you'll need to recreate it
            echo     [!] WARNING: .env is 0 bytes - you'll need to recreate it >> "%OUTPUT_FILE%"
            del ".env"
        ) else (
            echo     .env seems OK (%%~zA bytes)
            echo     .env seems OK (%%~zA bytes) >> "%OUTPUT_FILE%"
        )
    )
)
echo.
echo. >> "%OUTPUT_FILE%"

REM ============================================================================
REM STEP 3: DELETE AND REBUILD VENDOR
REM ============================================================================
echo [STEP 3] Rebuilding Composer dependencies...
echo [STEP 3] Rebuilding Composer dependencies... >> "%OUTPUT_FILE%"
echo.
echo. >> "%OUTPUT_FILE%"

if exist "vendor" (
    echo     Deleting vendor directory...
    echo     Deleting vendor directory... >> "%OUTPUT_FILE%"
    rmdir /s /q "vendor" 2>nul
    if exist "vendor" (
        echo     [!] Could not delete vendor (files in use?)
        echo     [!] Could not delete vendor (files in use?) >> "%OUTPUT_FILE%"
        echo     Close any IDEs and try again
        echo     Close any IDEs and try again >> "%OUTPUT_FILE%"
    ) else (
        echo     [+] Deleted
        echo     [+] Deleted >> "%OUTPUT_FILE%"
    )
)

echo     Running composer install...
echo     Running composer install... >> "%OUTPUT_FILE%"
composer install >> "%OUTPUT_FILE%" 2>&1
if errorlevel 1 (
    echo     [X] Composer install failed
    echo     [X] Composer install failed >> "%OUTPUT_FILE%"
    echo     Check the log file for details
    echo     Check the log file for details >> "%OUTPUT_FILE%"
) else (
    echo     [+] Composer install successful
    echo     [+] Composer install successful >> "%OUTPUT_FILE%"
)
echo.
echo. >> "%OUTPUT_FILE%"

REM ============================================================================
REM STEP 4: DELETE AND REBUILD NODE_MODULES
REM ============================================================================
echo [STEP 4] Rebuilding NPM dependencies...
echo [STEP 4] Rebuilding NPM dependencies... >> "%OUTPUT_FILE%"
echo.
echo. >> "%OUTPUT_FILE%"

if exist "node_modules" (
    echo     Deleting node_modules directory...
    echo     Deleting node_modules directory... >> "%OUTPUT_FILE%"
    rmdir /s /q "node_modules" 2>nul
    if exist "node_modules" (
        echo     [!] Could not delete node_modules (files in use?)
        echo     [!] Could not delete node_modules (files in use?) >> "%OUTPUT_FILE%"
        echo     Close any running processes and try again
        echo     Close any running processes and try again >> "%OUTPUT_FILE%"
    ) else (
        echo     [+] Deleted
        echo     [+] Deleted >> "%OUTPUT_FILE%"
    )
)

echo     Running npm install...
echo     Running npm install... >> "%OUTPUT_FILE%"
npm install >> "%OUTPUT_FILE%" 2>&1
if errorlevel 1 (
    echo     [X] NPM install failed
    echo     [X] NPM install failed >> "%OUTPUT_FILE%"
    echo     Check the log file for details
    echo     Check the log file for details >> "%OUTPUT_FILE%"
) else (
    echo     [+] NPM install successful
    echo     [+] NPM install successful >> "%OUTPUT_FILE%"
)
echo.
echo. >> "%OUTPUT_FILE%"

REM ============================================================================
REM STEP 5: VERIFY INSTALLATION
REM ============================================================================
echo [STEP 5] Verifying installation...
echo [STEP 5] Verifying installation... >> "%OUTPUT_FILE%"
echo.
echo. >> "%OUTPUT_FILE%"

if exist "vendor\stripe\stripe-php" (
    echo     [+] Stripe library installed
    echo     [+] Stripe library installed >> "%OUTPUT_FILE%"
) else (
    echo     [X] Stripe library missing
    echo     [X] Stripe library missing >> "%OUTPUT_FILE%"
)

if exist "node_modules" (
    echo     [+] Node modules installed
    echo     [+] Node modules installed >> "%OUTPUT_FILE%"
) else (
    echo     [X] Node modules missing
    echo     [X] Node modules missing >> "%OUTPUT_FILE%"
)
echo.
echo. >> "%OUTPUT_FILE%"

REM ============================================================================
REM STEP 6: CHECK ENVIRONMENT FILE
REM ============================================================================
echo [STEP 6] Checking environment configuration...
echo [STEP 6] Checking environment configuration... >> "%OUTPUT_FILE%"
echo.
echo. >> "%OUTPUT_FILE%"

if exist ".env" (
    echo     [+] .env file exists
    echo     [+] .env file exists >> "%OUTPUT_FILE%"
) else (
    echo     [X] .env file missing
    echo     [X] .env file missing >> "%OUTPUT_FILE%"
    echo.
    echo     You need to create .env with:
    echo     You need to create .env with: >> "%OUTPUT_FILE%"
    echo     - STRIPE_DEVELOPMENT_SECRET_KEY
    echo     - STRIPE_DEVELOPMENT_SECRET_KEY >> "%OUTPUT_FILE%"
    echo     - NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8888/crystalkeepsakes
    echo     - NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8888/crystalkeepsakes >> "%OUTPUT_FILE%"
    echo     - And other required keys
    echo     - And other required keys >> "%OUTPUT_FILE%"
)
echo.
echo. >> "%OUTPUT_FILE%"

REM ============================================================================
REM SUMMARY
REM ============================================================================
echo ========================================
echo RECOVERY COMPLETE
echo ========================================
echo.
echo ======================================== >> "%OUTPUT_FILE%"
echo RECOVERY COMPLETE >> "%OUTPUT_FILE%"
echo ======================================== >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"

echo Next steps:
echo Next steps: >> "%OUTPUT_FILE%"
echo.
echo. >> "%OUTPUT_FILE%"

echo 1. If .env was deleted, recreate it with your keys
echo 1. If .env was deleted, recreate it with your keys >> "%OUTPUT_FILE%"
echo.
echo. >> "%OUTPUT_FILE%"

echo 2. Start MAMP if not running
echo 2. Start MAMP if not running >> "%OUTPUT_FILE%"
echo.
echo. >> "%OUTPUT_FILE%"

echo 3. Test development server:
echo 3. Test development server: >> "%OUTPUT_FILE%"
echo    npm run dev
echo    npm run dev >> "%OUTPUT_FILE%"
echo.
echo. >> "%OUTPUT_FILE%"

echo 4. Test in browser:
echo 4. Test in browser: >> "%OUTPUT_FILE%"
echo    http://localhost:3000
echo    http://localhost:3000 >> "%OUTPUT_FILE%"
echo.
echo. >> "%OUTPUT_FILE%"

echo Full log saved to:
echo Full log saved to: >> "%OUTPUT_FILE%"
echo %OUTPUT_FILE%
echo %OUTPUT_FILE% >> "%OUTPUT_FILE%"
echo.
echo. >> "%OUTPUT_FILE%"

echo Press any key to open log...
pause >nul

start notepad "%OUTPUT_FILE%"

exit /b 0
