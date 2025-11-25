@echo off
SETLOCAL EnableDelayedExpansion

REM ============================================================================
REM Complete System Health Check After Hard Shutdown
REM Checks ALL common corruption points
REM ============================================================================

set "TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "OUTPUT_FILE=%USERPROFILE%\Desktop\system-health-check-%TIMESTAMP%.txt"

echo ======================================== > "%OUTPUT_FILE%"
echo System Health Check After Hard Shutdown >> "%OUTPUT_FILE%"
echo Crystal Keepsakes Project >> "%OUTPUT_FILE%"
echo ======================================== >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"
echo Generated: %date% %time% >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"

echo ========================================
echo System Health Check After Hard Shutdown
echo ========================================
echo.
echo This will check for corruption caused by unexpected shutdown
echo.
echo Saving to: %OUTPUT_FILE%
echo.
echo Press any key to start...
pause >nul
echo.

REM ============================================================================
REM SECTION 1: PHP CONFIGURATION
REM ============================================================================
echo ========================================
echo [SECTION 1] PHP Configuration
echo ========================================
echo.
echo ======================================== >> "%OUTPUT_FILE%"
echo [SECTION 1] PHP Configuration >> "%OUTPUT_FILE%"
echo ======================================== >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"

REM Find PHP installation
echo [1.1] Locating PHP Installation...
echo [1.1] Locating PHP Installation... >> "%OUTPUT_FILE%"

set "PHP_FOUND=0"
for %%v in (php8.3.1 php8.3.0 php8.2.0 php8.1.0 php8.0.0) do (
    if exist "C:\MAMP\bin\php\%%v\php.exe" (
        set "PHP_DIR=C:\MAMP\bin\php\%%v"
        set "PHP_EXE=C:\MAMP\bin\php\%%v\php.exe"
        set "PHP_INI=C:\MAMP\bin\php\%%v\php.ini"
        set "PHP_FOUND=1"
        echo       Found: !PHP_DIR!
        echo       Found: !PHP_DIR! >> "%OUTPUT_FILE%"
        goto :php_found
    )
)

:php_found
if !PHP_FOUND!==0 (
    echo       [X] PHP not found in MAMP directory
    echo       [X] PHP not found in MAMP directory >> "%OUTPUT_FILE%"
    goto :skip_php
)
echo.
echo. >> "%OUTPUT_FILE%"

REM Check PATH environment variable
echo [1.2] Checking PHP in System PATH...
echo [1.2] Checking PHP in System PATH... >> "%OUTPUT_FILE%"
echo %PATH% | findstr /C:"!PHP_DIR!" >nul 2>&1
if errorlevel 1 (
    echo       [X] FAIL - PHP NOT in system PATH
    echo       [X] FAIL - PHP NOT in system PATH >> "%OUTPUT_FILE%"
    echo       FIX: Run fix-php-path.bat as Administrator
    echo       FIX: Run fix-php-path.bat as Administrator >> "%OUTPUT_FILE%"
) else (
    echo       [+] PASS - PHP in system PATH
    echo       [+] PASS - PHP in system PATH >> "%OUTPUT_FILE%"
)
echo.
echo. >> "%OUTPUT_FILE%"

REM Test PHP command
echo [1.3] Testing PHP Command...
echo [1.3] Testing PHP Command... >> "%OUTPUT_FILE%"
php -v >nul 2>&1
if errorlevel 1 (
    echo       [X] FAIL - PHP command not working
    echo       [X] FAIL - PHP command not working >> "%OUTPUT_FILE%"
) else (
    echo       [+] PASS - PHP command works
    echo       [+] PASS - PHP command works >> "%OUTPUT_FILE%"
    php -v | findstr /C:"PHP" >> "%OUTPUT_FILE%"
)
echo.
echo. >> "%OUTPUT_FILE%"

REM Check php.ini exists and is readable
echo [1.4] Checking php.ini File...
echo [1.4] Checking php.ini File... >> "%OUTPUT_FILE%"
if exist "!PHP_INI!" (
    echo       [+] File exists: !PHP_INI!
    echo       [+] File exists: !PHP_INI! >> "%OUTPUT_FILE%"
    
    REM Check file size (corrupted files often 0 bytes)
    for %%A in ("!PHP_INI!") do set SIZE=%%~zA
    if !SIZE! equ 0 (
        echo       [X] CRITICAL - php.ini is 0 bytes (CORRUPTED)
        echo       [X] CRITICAL - php.ini is 0 bytes (CORRUPTED) >> "%OUTPUT_FILE%"
        echo       FIX: Restore from backup or reinstall MAMP
        echo       FIX: Restore from backup or reinstall MAMP >> "%OUTPUT_FILE%"
    ) else (
        echo       [+] File size: !SIZE! bytes
        echo       [+] File size: !SIZE! bytes >> "%OUTPUT_FILE%"
    )
) else (
    echo       [X] CRITICAL - php.ini file missing
    echo       [X] CRITICAL - php.ini file missing >> "%OUTPUT_FILE%"
)
echo.
echo. >> "%OUTPUT_FILE%"

REM Check critical extensions
echo [1.5] Checking PHP Extensions in php.ini...
echo [1.5] Checking PHP Extensions in php.ini... >> "%OUTPUT_FILE%"

if exist "!PHP_INI!" (
    findstr /C:"extension=curl" "!PHP_INI!" | findstr /V /C:";" >nul 2>&1
    if errorlevel 1 (
        echo       [X] curl - DISABLED or commented
        echo       [X] curl - DISABLED or commented >> "%OUTPUT_FILE%"
    ) else (
        echo       [+] curl - enabled
        echo       [+] curl - enabled >> "%OUTPUT_FILE%"
    )
    
    findstr /C:"extension=openssl" "!PHP_INI!" | findstr /V /C:";" >nul 2>&1
    if errorlevel 1 (
        echo       [X] openssl - DISABLED or commented
        echo       [X] openssl - DISABLED or commented >> "%OUTPUT_FILE%"
    ) else (
        echo       [+] openssl - enabled
        echo       [+] openssl - enabled >> "%OUTPUT_FILE%"
    )
    
    findstr /C:"extension=mbstring" "!PHP_INI!" | findstr /V /C:";" >nul 2>&1
    if errorlevel 1 (
        echo       [X] mbstring - DISABLED or commented
        echo       [X] mbstring - DISABLED or commented >> "%OUTPUT_FILE%"
    ) else (
        echo       [+] mbstring - enabled
        echo       [+] mbstring - enabled >> "%OUTPUT_FILE%"
    )
    
    findstr /C:"extension=fileinfo" "!PHP_INI!" | findstr /V /C:";" >nul 2>&1
    if errorlevel 1 (
        echo       [X] fileinfo - DISABLED or commented
        echo       [X] fileinfo - DISABLED or commented >> "%OUTPUT_FILE%"
    ) else (
        echo       [+] fileinfo - enabled
        echo       [+] fileinfo - enabled >> "%OUTPUT_FILE%"
    )
    
    echo       FIX: Run enable-php-extensions.bat if any disabled
    echo       FIX: Run enable-php-extensions.bat if any disabled >> "%OUTPUT_FILE%"
)
echo.
echo. >> "%OUTPUT_FILE%"

:skip_php

REM ============================================================================
REM SECTION 2: COMPOSER
REM ============================================================================
echo ========================================
echo [SECTION 2] Composer
echo ========================================
echo.
echo ======================================== >> "%OUTPUT_FILE%"
echo [SECTION 2] Composer >> "%OUTPUT_FILE%"
echo ======================================== >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"

echo [2.1] Checking Composer Installation...
echo [2.1] Checking Composer Installation... >> "%OUTPUT_FILE%"

where composer >nul 2>&1
if errorlevel 1 (
    echo       [X] FAIL - Composer not found in PATH
    echo       [X] FAIL - Composer not found in PATH >> "%OUTPUT_FILE%"
    echo       Download: https://getcomposer.org/download/
    echo       Download: https://getcomposer.org/download/ >> "%OUTPUT_FILE%"
) else (
    echo       [+] PASS - Composer found
    echo       [+] PASS - Composer found >> "%OUTPUT_FILE%"
    
    REM Get composer location
    for /f "tokens=*" %%i in ('where composer 2^>^&1') do (
        echo       Location: %%i
        echo       Location: %%i >> "%OUTPUT_FILE%"
        goto :composer_found
    )
)
:composer_found
echo.
echo. >> "%OUTPUT_FILE%"

echo [2.2] Testing Composer Command...
echo [2.2] Testing Composer Command... >> "%OUTPUT_FILE%"
composer --version >nul 2>&1
if errorlevel 1 (
    echo       [X] FAIL - Composer command fails
    echo       [X] FAIL - Composer command fails >> "%OUTPUT_FILE%"
) else (
    echo       [+] PASS - Composer works
    echo       [+] PASS - Composer works >> "%OUTPUT_FILE%"
    composer --version 2>&1 | findstr /C:"Composer" >> "%OUTPUT_FILE%"
)
echo.
echo. >> "%OUTPUT_FILE%"

REM ============================================================================
REM SECTION 3: PROJECT FILES
REM ============================================================================
echo ========================================
echo [SECTION 3] Project Files
echo ========================================
echo.
echo ======================================== >> "%OUTPUT_FILE%"
echo [SECTION 3] Project Files >> "%OUTPUT_FILE%"
echo ======================================== >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"

echo Current Directory: %CD%
echo Current Directory: %CD% >> "%OUTPUT_FILE%"
echo.
echo. >> "%OUTPUT_FILE%"

REM Check composer.json
echo [3.1] Checking composer.json...
echo [3.1] Checking composer.json... >> "%OUTPUT_FILE%"
if exist "composer.json" (
    for %%A in ("composer.json") do set SIZE=%%~zA
    if !SIZE! equ 0 (
        echo       [X] CRITICAL - composer.json is 0 bytes (CORRUPTED)
        echo       [X] CRITICAL - composer.json is 0 bytes (CORRUPTED) >> "%OUTPUT_FILE%"
    ) else (
        echo       [+] File exists: !SIZE! bytes
        echo       [+] File exists: !SIZE! bytes >> "%OUTPUT_FILE%"
    )
) else (
    echo       [X] composer.json missing
    echo       [X] composer.json missing >> "%OUTPUT_FILE%"
)
echo.
echo. >> "%OUTPUT_FILE%"

REM Check composer.lock
echo [3.2] Checking composer.lock...
echo [3.2] Checking composer.lock... >> "%OUTPUT_FILE%"
if exist "composer.lock" (
    for %%A in ("composer.lock") do set SIZE=%%~zA
    if !SIZE! equ 0 (
        echo       [X] CORRUPTED - composer.lock is 0 bytes
        echo       [X] CORRUPTED - composer.lock is 0 bytes >> "%OUTPUT_FILE%"
        echo       FIX: Delete composer.lock and run composer install
        echo       FIX: Delete composer.lock and run composer install >> "%OUTPUT_FILE%"
    ) else (
        echo       [+] File exists: !SIZE! bytes
        echo       [+] File exists: !SIZE! bytes >> "%OUTPUT_FILE%"
    )
) else (
    echo       [!] composer.lock missing (will regenerate on install)
    echo       [!] composer.lock missing (will regenerate on install) >> "%OUTPUT_FILE%"
)
echo.
echo. >> "%OUTPUT_FILE%"

REM Check vendor directory
echo [3.3] Checking vendor directory...
echo [3.3] Checking vendor directory... >> "%OUTPUT_FILE%"
if exist "vendor\autoload.php" (
    echo       [+] Vendor directory exists
    echo       [+] Vendor directory exists >> "%OUTPUT_FILE%"
    
    REM Check Stripe library
    if exist "vendor\stripe\stripe-php" (
        echo       [+] Stripe library installed
        echo       [+] Stripe library installed >> "%OUTPUT_FILE%"
    ) else (
        echo       [X] Stripe library missing
        echo       [X] Stripe library missing >> "%OUTPUT_FILE%"
        echo       FIX: Run composer install
        echo       FIX: Run composer install >> "%OUTPUT_FILE%"
    )
) else (
    echo       [X] Vendor directory missing or incomplete
    echo       [X] Vendor directory missing or incomplete >> "%OUTPUT_FILE%"
    echo       FIX: Run composer install
    echo       FIX: Run composer install >> "%OUTPUT_FILE%"
)
echo.
echo. >> "%OUTPUT_FILE%"

REM Check package.json
echo [3.4] Checking package.json...
echo [3.4] Checking package.json... >> "%OUTPUT_FILE%"
if exist "package.json" (
    for %%A in ("package.json") do set SIZE=%%~zA
    if !SIZE! equ 0 (
        echo       [X] CRITICAL - package.json is 0 bytes (CORRUPTED)
        echo       [X] CRITICAL - package.json is 0 bytes (CORRUPTED) >> "%OUTPUT_FILE%"
    ) else (
        echo       [+] File exists: !SIZE! bytes
        echo       [+] File exists: !SIZE! bytes >> "%OUTPUT_FILE%"
    )
) else (
    echo       [X] package.json missing
    echo       [X] package.json missing >> "%OUTPUT_FILE%"
)
echo.
echo. >> "%OUTPUT_FILE%"

REM Check package-lock.json
echo [3.5] Checking package-lock.json...
echo [3.5] Checking package-lock.json... >> "%OUTPUT_FILE%"
if exist "package-lock.json" (
    for %%A in ("package-lock.json") do set SIZE=%%~zA
    if !SIZE! equ 0 (
        echo       [X] CORRUPTED - package-lock.json is 0 bytes
        echo       [X] CORRUPTED - package-lock.json is 0 bytes >> "%OUTPUT_FILE%"
        echo       FIX: Delete and run npm install
        echo       FIX: Delete and run npm install >> "%OUTPUT_FILE%"
    ) else (
        echo       [+] File exists: !SIZE! bytes
        echo       [+] File exists: !SIZE! bytes >> "%OUTPUT_FILE%"
    )
) else (
    echo       [!] package-lock.json missing
    echo       [!] package-lock.json missing >> "%OUTPUT_FILE%"
)
echo.
echo. >> "%OUTPUT_FILE%"

REM Check node_modules
echo [3.6] Checking node_modules...
echo [3.6] Checking node_modules... >> "%OUTPUT_FILE%"
if exist "node_modules" (
    echo       [+] Directory exists
    echo       [+] Directory exists >> "%OUTPUT_FILE%"
) else (
    echo       [X] Missing - run npm install
    echo       [X] Missing - run npm install >> "%OUTPUT_FILE%"
)
echo.
echo. >> "%OUTPUT_FILE%"

REM Check .env
echo [3.7] Checking .env file...
echo [3.7] Checking .env file... >> "%OUTPUT_FILE%"
if exist ".env" (
    for %%A in (".env") do set SIZE=%%~zA
    if !SIZE! equ 0 (
        echo       [X] CRITICAL - .env is 0 bytes (CORRUPTED)
        echo       [X] CRITICAL - .env is 0 bytes (CORRUPTED) >> "%OUTPUT_FILE%"
    ) else (
        echo       [+] File exists: !SIZE! bytes
        echo       [+] File exists: !SIZE! bytes >> "%OUTPUT_FILE%"
        
        REM Check for Stripe keys
        findstr /C:"STRIPE_DEVELOPMENT_SECRET_KEY" .env >nul 2>&1
        if errorlevel 1 (
            echo       [X] Stripe keys not configured
            echo       [X] Stripe keys not configured >> "%OUTPUT_FILE%"
        ) else (
            echo       [+] Stripe keys present
            echo       [+] Stripe keys present >> "%OUTPUT_FILE%"
        )
    )
) else (
    echo       [X] .env file missing
    echo       [X] .env file missing >> "%OUTPUT_FILE%"
)
echo.
echo. >> "%OUTPUT_FILE%"

REM ============================================================================
REM SECTION 4: WINDOWS HOSTS FILE
REM ============================================================================
echo ========================================
echo [SECTION 4] Windows Hosts File
echo ========================================
echo.
echo ======================================== >> "%OUTPUT_FILE%"
echo [SECTION 4] Windows Hosts File >> "%OUTPUT_FILE%"
echo ======================================== >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"

set "HOSTS_FILE=C:\Windows\System32\drivers\etc\hosts"

echo [4.1] Checking hosts file...
echo [4.1] Checking hosts file... >> "%OUTPUT_FILE%"
if exist "%HOSTS_FILE%" (
    for %%A in ("%HOSTS_FILE%") do set SIZE=%%~zA
    if !SIZE! equ 0 (
        echo       [X] CRITICAL - hosts file is 0 bytes (CORRUPTED)
        echo       [X] CRITICAL - hosts file is 0 bytes (CORRUPTED) >> "%OUTPUT_FILE%"
        echo       FIX: Restore default hosts file
        echo       FIX: Restore default hosts file >> "%OUTPUT_FILE%"
    ) else (
        echo       [+] File exists: !SIZE! bytes
        echo       [+] File exists: !SIZE! bytes >> "%OUTPUT_FILE%"
        
        REM Check for localhost entry
        findstr /C:"127.0.0.1" "%HOSTS_FILE%" >nul 2>&1
        if errorlevel 1 (
            echo       [X] Missing localhost entry
            echo       [X] Missing localhost entry >> "%OUTPUT_FILE%"
        ) else (
            echo       [+] localhost entry present
            echo       [+] localhost entry present >> "%OUTPUT_FILE%"
        )
    )
) else (
    echo       [X] CRITICAL - hosts file missing
    echo       [X] CRITICAL - hosts file missing >> "%OUTPUT_FILE%"
)
echo.
echo. >> "%OUTPUT_FILE%"

REM ============================================================================
REM SECTION 5: MAMP STATUS
REM ============================================================================
echo ========================================
echo [SECTION 5] MAMP Status
echo ========================================
echo.
echo ======================================== >> "%OUTPUT_FILE%"
echo [SECTION 5] MAMP Status >> "%OUTPUT_FILE%"
echo ======================================== >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"

echo [5.1] Testing MAMP Apache...
echo [5.1] Testing MAMP Apache... >> "%OUTPUT_FILE%"
curl -s http://localhost:8888/ >nul 2>&1
if errorlevel 1 (
    echo       [X] Apache not responding on port 8888
    echo       [X] Apache not responding on port 8888 >> "%OUTPUT_FILE%"
) else (
    echo       [+] Apache running on port 8888
    echo       [+] Apache running on port 8888 >> "%OUTPUT_FILE%"
)
echo.
echo. >> "%OUTPUT_FILE%"

echo [5.2] Testing project access...
echo [5.2] Testing project access... >> "%OUTPUT_FILE%"
curl -s http://localhost:8888/crystalkeepsakes/ >nul 2>&1
if errorlevel 1 (
    echo       [X] Cannot access project
    echo       [X] Cannot access project >> "%OUTPUT_FILE%"
) else (
    echo       [+] Project accessible
    echo       [+] Project accessible >> "%OUTPUT_FILE%"
)
echo.
echo. >> "%OUTPUT_FILE%"

REM ============================================================================
REM SUMMARY AND RECOMMENDATIONS
REM ============================================================================
echo ========================================
echo SUMMARY AND RECOMMENDED FIXES
echo ========================================
echo.
echo ======================================== >> "%OUTPUT_FILE%"
echo SUMMARY AND RECOMMENDED FIXES >> "%OUTPUT_FILE%"
echo ======================================== >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"

echo Based on the checks above, here's what to fix:
echo Based on the checks above, here's what to fix: >> "%OUTPUT_FILE%"
echo.
echo. >> "%OUTPUT_FILE%"

echo CRITICAL FIXES (Do these first):
echo CRITICAL FIXES (Do these first): >> "%OUTPUT_FILE%"
echo.
echo. >> "%OUTPUT_FILE%"

REM Check for 0-byte files
set "HAS_CORRUPTION=0"
if exist "composer.lock" (
    for %%A in ("composer.lock") do if %%~zA equ 0 set "HAS_CORRUPTION=1"
)
if exist "package-lock.json" (
    for %%A in ("package-lock.json") do if %%~zA equ 0 set "HAS_CORRUPTION=1"
)
if exist ".env" (
    for %%A in (".env") do if %%~zA equ 0 set "HAS_CORRUPTION=1"
)

if !HAS_CORRUPTION!==1 (
    echo 1. CORRUPTED FILES DETECTED
    echo 1. CORRUPTED FILES DETECTED >> "%OUTPUT_FILE%"
    echo    - Delete any 0-byte files shown above
    echo    - Delete any 0-byte files shown above >> "%OUTPUT_FILE%"
    echo    - Restore from Git or backup
    echo    - Restore from Git or backup >> "%OUTPUT_FILE%"
    echo.
    echo. >> "%OUTPUT_FILE%"
)

php -v >nul 2>&1
if errorlevel 1 (
    echo 2. FIX PHP PATH
    echo 2. FIX PHP PATH >> "%OUTPUT_FILE%"
    echo    - Run: fix-php-path.bat (as Administrator)
    echo    - Run: fix-php-path.bat (as Administrator) >> "%OUTPUT_FILE%"
    echo.
    echo. >> "%OUTPUT_FILE%"
)

if exist "!PHP_INI!" (
    findstr /C:"extension=curl" "!PHP_INI!" | findstr /V /C:";" >nul 2>&1
    if errorlevel 1 (
        echo 3. ENABLE PHP EXTENSIONS
        echo 3. ENABLE PHP EXTENSIONS >> "%OUTPUT_FILE%"
        echo    - Run: enable-php-extensions.bat
        echo    - Run: enable-php-extensions.bat >> "%OUTPUT_FILE%"
        echo    - Then restart MAMP Apache
        echo    - Then restart MAMP Apache >> "%OUTPUT_FILE%"
        echo.
        echo. >> "%OUTPUT_FILE%"
    )
)

if not exist "vendor\autoload.php" (
    echo 4. REINSTALL COMPOSER DEPENDENCIES
    echo 4. REINSTALL COMPOSER DEPENDENCIES >> "%OUTPUT_FILE%"
    echo    - Delete vendor folder if exists
    echo    - Delete vendor folder if exists >> "%OUTPUT_FILE%"
    echo    - Run: composer install
    echo    - Run: composer install >> "%OUTPUT_FILE%"
    echo.
    echo. >> "%OUTPUT_FILE%"
)

if not exist "node_modules" (
    echo 5. REINSTALL NPM DEPENDENCIES
    echo 5. REINSTALL NPM DEPENDENCIES >> "%OUTPUT_FILE%"
    echo    - Delete node_modules if exists
    echo    - Delete node_modules if exists >> "%OUTPUT_FILE%"
    echo    - Run: npm install
    echo    - Run: npm install >> "%OUTPUT_FILE%"
    echo.
    echo. >> "%OUTPUT_FILE%"
)

echo ========================================
echo Report saved to:
echo %OUTPUT_FILE%
echo ========================================
echo.
echo ======================================== >> "%OUTPUT_FILE%"
echo END OF REPORT >> "%OUTPUT_FILE%"
echo ======================================== >> "%OUTPUT_FILE%"

echo Press any key to open report...
pause >nul

start notepad "%OUTPUT_FILE%"

exit /b 0
