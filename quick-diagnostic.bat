@echo off
SETLOCAL EnableDelayedExpansion

REM ============================================================================
REM Quick Diagnostic - Won't Hang
REM ============================================================================

set "OUTPUT=%USERPROFILE%\Desktop\quick-diagnostic.txt"

echo Crystal Keepsakes - Quick Diagnostic > "%OUTPUT%"
echo Generated: %date% %time% >> "%OUTPUT%"
echo ======================================== >> "%OUTPUT%"
echo. >> "%OUTPUT%"

echo Running Quick Diagnostic...
echo Saving to: %OUTPUT%
echo.

REM Project Directory
echo Current Directory: %CD% >> "%OUTPUT%"
echo. >> "%OUTPUT%"

REM ============================================================================
REM PHP
REM ============================================================================
echo Checking PHP... >> "%OUTPUT%"
php -v >> "%OUTPUT%" 2>&1
if errorlevel 1 (
    echo [X] PHP command failed >> "%OUTPUT%"
) else (
    echo [+] PHP working >> "%OUTPUT%"
)
echo. >> "%OUTPUT%"

REM ============================================================================
REM Composer
REM ============================================================================
echo Checking Composer... >> "%OUTPUT%"
timeout /t 1 /nobreak >nul
composer --version --no-interaction >> "%OUTPUT%" 2>&1
if errorlevel 1 (
    echo [X] Composer failed >> "%OUTPUT%"
) else (
    echo [+] Composer working >> "%OUTPUT%"
)
echo. >> "%OUTPUT%"

REM ============================================================================
REM PHP Extensions
REM ============================================================================
echo Checking PHP Extensions... >> "%OUTPUT%"
php -m | findstr /C:"curl" >> "%OUTPUT%" 2>&1
php -m | findstr /C:"openssl" >> "%OUTPUT%" 2>&1
php -m | findstr /C:"mbstring" >> "%OUTPUT%" 2>&1
echo. >> "%OUTPUT%"

REM ============================================================================
REM Project Files
REM ============================================================================
echo Checking Project Files... >> "%OUTPUT%"

if exist ".env" (
    echo [+] .env exists >> "%OUTPUT%"
) else (
    echo [X] .env missing >> "%OUTPUT%"
)

if exist "composer.json" (
    echo [+] composer.json exists >> "%OUTPUT%"
) else (
    echo [X] composer.json missing >> "%OUTPUT%"
)

if exist "composer.lock" (
    for %%A in ("composer.lock") do (
        if %%~zA equ 0 (
            echo [X] composer.lock CORRUPTED - 0 bytes >> "%OUTPUT%"
        ) else (
            echo [+] composer.lock OK - %%~zA bytes >> "%OUTPUT%"
        )
    )
) else (
    echo [!] composer.lock missing >> "%OUTPUT%"
)

if exist "vendor\autoload.php" (
    echo [+] vendor directory exists >> "%OUTPUT%"
) else (
    echo [X] vendor directory missing >> "%OUTPUT%"
)

if exist "vendor\stripe\stripe-php" (
    echo [+] Stripe library installed >> "%OUTPUT%"
) else (
    echo [X] Stripe library missing >> "%OUTPUT%"
)

if exist "package.json" (
    echo [+] package.json exists >> "%OUTPUT%"
) else (
    echo [X] package.json missing >> "%OUTPUT%"
)

if exist "node_modules" (
    echo [+] node_modules exists >> "%OUTPUT%"
) else (
    echo [X] node_modules missing >> "%OUTPUT%"
)

echo. >> "%OUTPUT%"

REM ============================================================================
REM MAMP
REM ============================================================================
echo Checking MAMP... >> "%OUTPUT%"
curl -s http://localhost:8888/ >nul 2>&1
if errorlevel 1 (
    echo [X] MAMP not responding >> "%OUTPUT%"
) else (
    echo [+] MAMP responding on port 8888 >> "%OUTPUT%"
)

echo. >> "%OUTPUT%"
echo Diagnostic complete! >> "%OUTPUT%"

echo.
echo Done! Opening report...
timeout /t 2 /nobreak >nul

start notepad "%OUTPUT%"
