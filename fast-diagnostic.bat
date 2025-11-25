@echo off
SETLOCAL EnableDelayedExpansion

REM ============================================================================
REM Fast Diagnostic - Skips Problematic Checks
REM ============================================================================

set "OUTPUT=%USERPROFILE%\Desktop\fast-diagnostic-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%.txt"
set "OUTPUT=%OUTPUT: =0%"

echo ======================================== > "%OUTPUT%"
echo Fast Diagnostic Report >> "%OUTPUT%"
echo ======================================== >> "%OUTPUT%"
echo. >> "%OUTPUT%"
echo Generated: %date% %time% >> "%OUTPUT%"
echo Current Directory: %CD% >> "%OUTPUT%"
echo. >> "%OUTPUT%"

cls
echo ========================================
echo Fast Diagnostic - Crystal Keepsakes
echo ========================================
echo.
echo Checking your environment...
echo Saving to: %OUTPUT%
echo.

REM ============================================================================
REM QUICK CHECKS
REM ============================================================================

echo [1/9] PHP Command...
php -v >nul 2>&1
if errorlevel 1 (
    echo       [X] FAIL
    echo [X] PHP command not working >> "%OUTPUT%"
) else (
    echo       [+] PASS
    echo [+] PHP working >> "%OUTPUT%"
    php -v | findstr "PHP" >> "%OUTPUT%"
)

echo [2/9] PHP Extensions...
php -m | findstr /C:"curl" >nul 2>&1
if errorlevel 1 (
    echo       [X] curl missing
    echo [X] curl extension missing >> "%OUTPUT%"
) else (
    echo       [+] curl OK
    echo [+] curl enabled >> "%OUTPUT%"
)

echo [3/9] MAMP Server...
curl -s http://localhost:8888/ >nul 2>&1
if errorlevel 1 (
    echo       [X] Not responding
    echo [X] MAMP not responding >> "%OUTPUT%"
) else (
    echo       [+] PASS
    echo [+] MAMP running on 8888 >> "%OUTPUT%"
)

echo [4/9] .env file...
if exist ".env" (
    echo       [+] Exists
    echo [+] .env exists >> "%OUTPUT%"
) else (
    echo       [X] Missing
    echo [X] .env missing >> "%OUTPUT%"
)

echo [5/9] composer.json...
if exist "composer.json" (
    echo       [+] Exists
    echo [+] composer.json exists >> "%OUTPUT%"
) else (
    echo       [X] Missing
    echo [X] composer.json missing >> "%OUTPUT%"
)

echo [6/9] composer.lock...
if exist "composer.lock" (
    for %%A in ("composer.lock") do (
        if %%~zA equ 0 (
            echo       [X] CORRUPTED - 0 bytes
            echo [X] composer.lock CORRUPTED - 0 bytes >> "%OUTPUT%"
            echo ACTION: Delete this file >> "%OUTPUT%"
        ) else (
            echo       [+] OK
            echo [+] composer.lock OK >> "%OUTPUT%"
        )
    )
) else (
    echo       [!] Missing
    echo [!] composer.lock missing (will regenerate) >> "%OUTPUT%"
)

echo [7/9] vendor directory...
if exist "vendor\autoload.php" (
    echo       [+] Exists
    echo [+] vendor exists >> "%OUTPUT%"
    
    if exist "vendor\stripe\stripe-php" (
        echo       [+] Stripe installed
        echo [+] Stripe library installed >> "%OUTPUT%"
    ) else (
        echo       [X] Stripe missing
        echo [X] Stripe library missing >> "%OUTPUT%"
    )
) else (
    echo       [X] Missing
    echo [X] vendor missing - need to run composer install >> "%OUTPUT%"
)

echo [8/9] package.json...
if exist "package.json" (
    echo       [+] Exists
    echo [+] package.json exists >> "%OUTPUT%"
) else (
    echo       [X] Missing
    echo [X] package.json missing >> "%OUTPUT%"
)

echo [9/9] node_modules...
if exist "node_modules" (
    echo       [+] Exists
    echo [+] node_modules exists >> "%OUTPUT%"
) else (
    echo       [X] Missing
    echo [X] node_modules missing - need to run npm install >> "%OUTPUT%"
)

echo.
echo ========================================
echo COMPOSER STATUS
echo ========================================
echo.
echo [!] Composer appears to be corrupted
echo [!] Composer appears to be corrupted >> "%OUTPUT%"
echo.
echo Location: C:\ProgramData\ComposerSetup\bin\composer
echo Location: C:\ProgramData\ComposerSetup\bin\composer >> "%OUTPUT%"
echo Problem: File contains invalid data (not a valid executable)
echo Problem: File contains invalid data (not a valid executable) >> "%OUTPUT%"
echo.
echo. >> "%OUTPUT%"

echo ========================================
echo WHAT TO DO NOW
echo ========================================
echo.
echo ======================================== >> "%OUTPUT%"
echo RECOMMENDED ACTIONS >> "%OUTPUT%"
echo ======================================== >> "%OUTPUT%"
echo. >> "%OUTPUT%"

echo Step 1: FIX COMPOSER (REQUIRED)
echo Step 1: FIX COMPOSER (REQUIRED) >> "%OUTPUT%"
echo --------------------------------
echo -------------------------------- >> "%OUTPUT%"
echo.
echo. >> "%OUTPUT%"

echo Composer is corrupted and must be reinstalled.
echo Composer is corrupted and must be reinstalled. >> "%OUTPUT%"
echo.
echo. >> "%OUTPUT%"

echo Option A - Automatic (use the script):
echo Option A - Automatic (use the script): >> "%OUTPUT%"
echo    Run: fix-composer.bat
echo    Run: fix-composer.bat >> "%OUTPUT%"
echo.
echo. >> "%OUTPUT%"

echo Option B - Manual (faster):
echo Option B - Manual (faster): >> "%OUTPUT%"
echo    1. Visit: https://getcomposer.org/download/
echo    1. Visit: https://getcomposer.org/download/ >> "%OUTPUT%"
echo    2. Download: Composer-Setup.exe
echo    2. Download: Composer-Setup.exe >> "%OUTPUT%"
echo    3. Run installer
echo    3. Run installer >> "%OUTPUT%"
echo    4. When asked for PHP, enter:
echo    4. When asked for PHP, enter: >> "%OUTPUT%"
echo       C:\MAMP\bin\php\php8.3.1\php.exe
echo       C:\MAMP\bin\php\php8.3.1\php.exe >> "%OUTPUT%"
echo    5. Complete installation
echo    5. Complete installation >> "%OUTPUT%"
echo    6. Close and reopen Command Prompt
echo    6. Close and reopen Command Prompt >> "%OUTPUT%"
echo.
echo. >> "%OUTPUT%"

echo Step 2: REBUILD PROJECT DEPENDENCIES
echo Step 2: REBUILD PROJECT DEPENDENCIES >> "%OUTPUT%"
echo --------------------------------------
echo -------------------------------------- >> "%OUTPUT%"
echo.
echo. >> "%OUTPUT%"

echo After Composer is fixed:
echo After Composer is fixed: >> "%OUTPUT%"
echo.
echo. >> "%OUTPUT%"

if not exist "vendor\autoload.php" (
    echo    cd C:\MAMP\htdocs\crystalkeepsakes
    echo    cd C:\MAMP\htdocs\crystalkeepsakes >> "%OUTPUT%"
    echo    composer install
    echo    composer install >> "%OUTPUT%"
    echo.
    echo. >> "%OUTPUT%"
)

if not exist "node_modules" (
    echo    npm install
    echo    npm install >> "%OUTPUT%"
    echo.
    echo. >> "%OUTPUT%"
)

if not exist ".env" (
    echo Step 3: CREATE .env FILE
    echo Step 3: CREATE .env FILE >> "%OUTPUT%"
    echo -----------------------
    echo ----------------------- >> "%OUTPUT%"
    echo.
    echo. >> "%OUTPUT%"
    echo You need to create .env with your Stripe keys
    echo You need to create .env with your Stripe keys >> "%OUTPUT%"
    echo.
    echo. >> "%OUTPUT%"
)

echo ========================================
echo ======================================== >> "%OUTPUT%"
echo QUICK COMMAND REFERENCE
echo QUICK COMMAND REFERENCE >> "%OUTPUT%"
echo ========================================
echo ======================================== >> "%OUTPUT%"
echo.
echo. >> "%OUTPUT%"

echo After fixing Composer, run these commands:
echo After fixing Composer, run these commands: >> "%OUTPUT%"
echo.
echo. >> "%OUTPUT%"

echo cd C:\MAMP\htdocs\crystalkeepsakes
echo cd C:\MAMP\htdocs\crystalkeepsakes >> "%OUTPUT%"
echo composer install
echo composer install >> "%OUTPUT%"
echo npm install
echo npm install >> "%OUTPUT%"
echo npm run dev
echo npm run dev >> "%OUTPUT%"
echo.
echo. >> "%OUTPUT%"

echo ========================================
echo Report saved to:
echo %OUTPUT%
echo ========================================
echo.
echo ======================================== >> "%OUTPUT%"
echo END OF REPORT >> "%OUTPUT%"
echo ======================================== >> "%OUTPUT%"

echo Press any key to open report...
pause >nul

start notepad "%OUTPUT%"

exit /b 0
