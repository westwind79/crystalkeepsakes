@echo off
REM Clear all caches that might cause permission issues

echo.
echo ========================================
echo  Clearing All Caches
echo ========================================
echo.

REM Get the directory where this script is located
set "PROJECT_DIR=%~dp0"

echo Project directory: %PROJECT_DIR%
echo.

REM Clear Next.js build cache
echo [1/4] Clearing Next.js cache (.next folder)...
if exist "%PROJECT_DIR%.next" (
    rmdir /S /Q "%PROJECT_DIR%.next"
    echo   Done!
) else (
    echo   Already clean
)
echo.

REM Clear Yarn cache
echo [2/4] Clearing Yarn cache...
cd /d "%PROJECT_DIR%"
call yarn cache clean
echo.

REM Clear node_modules (optional - uncomment if needed)
REM echo [3/4] Removing node_modules...
REM if exist "%PROJECT_DIR%node_modules" (
REM     rmdir /S /Q "%PROJECT_DIR%node_modules"
REM     echo   Done! Run 'yarn install' to reinstall.
REM ) else (
REM     echo   Not found
REM )
REM echo.

echo [3/4] Clearing build outputs...
if exist "%PROJECT_DIR%out" (
    rmdir /S /Q "%PROJECT_DIR%out"
    echo   out/ cleared
)
if exist "%PROJECT_DIR%out-test" (
    rmdir /S /Q "%PROJECT_DIR%out-test"
    echo   out-test/ cleared
)
if exist "%PROJECT_DIR%out-prod" (
    rmdir /S /Q "%PROJECT_DIR%out-prod"
    echo   out-prod/ cleared
)
echo.

echo [4/4] Clearing temporary files...
if exist "%PROJECT_DIR%*.log" (
    del /Q "%PROJECT_DIR%*.log"
    echo   Log files cleared
)
echo.

echo ========================================
echo  DONE!
echo ========================================
echo.
echo All caches have been cleared.
echo.
echo Next steps:
echo 1. Close all file explorer windows viewing this project
echo 2. Stop the dev server if running (Ctrl+C)
echo 3. Run: yarn dev
echo.

pause
