@echo off
REM Crystal Keepsakes - Local Dev Cleanup Script
REM Run this in: C:\MAMP\htdocs\crystalkeepsakes\

echo.
echo ======================================
echo Crystal Keepsakes - Dev Cleanup
echo ======================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please run this script from C:\MAMP\htdocs\crystalkeepsakes\
    pause
    exit /b 1
)

echo Step 1: Backing up current .env
if exist ".env" (
    copy /Y ".env" ".env.backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%"
    echo   [OK] Backed up to .env.backup
) else (
    echo   [SKIP] No .env file found
)

echo.
echo Step 2: Removing conflicting files
if exist ".env.production" (
    del /F ".env.production"
    echo   [OK] Removed .env.production
) else (
    echo   [SKIP] .env.production not found
)

if exist "check-env-paths.php" (
    del /F "check-env-paths.php"
    echo   [OK] Removed check-env-paths.php
) else (
    echo   [SKIP] check-env-paths.php not found
)

if exist "test-image-upload.php" (
    del /F "test-image-upload.php"
    echo   [OK] Removed test-image-upload.php
) else (
    echo   [SKIP] test-image-upload.php not found
)

echo.
echo Step 3: Creating upload directories
if not exist "public\img\customer-uploads" (
    mkdir "public\img\customer-uploads"
    echo   [OK] Created public\img\customer-uploads
) else (
    echo   [OK] Directory already exists
)

echo.
echo Step 4: Checking vendor directory
if exist "vendor\autoload.php" (
    echo   [OK] Composer dependencies installed
) else (
    echo   [WARNING] vendor/ missing!
    echo   Please run: composer install
)

echo.
echo ======================================
echo Cleanup Complete!
echo ======================================
echo.
echo Next Steps:
echo 1. Edit .env file (add your Stripe test keys)
echo 2. Restart MAMP servers
echo 3. Test: http://localhost:8888/crystalkeepsakes/api/debug-env.php
echo.
echo See CLEAN_LOCAL_DEV_SETUP.md for details
echo.
pause
