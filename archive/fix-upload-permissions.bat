@echo off
REM Fix upload directory permissions for MAMP on Windows
REM Run this as Administrator if needed

echo.
echo ========================================
echo  Fixing Upload Directory Permissions
echo ========================================
echo.

REM Get the directory where this script is located
set "PROJECT_DIR=%~dp0"

echo Project directory: %PROJECT_DIR%
echo.

REM Set the upload directory
set "UPLOAD_DIR=%PROJECT_DIR%public\img\products\cockpit3d"

echo Checking upload directory: %UPLOAD_DIR%
echo.

REM Check if directory exists
if not exist "%UPLOAD_DIR%" (
    echo ERROR: Directory does not exist!
    echo Creating directory...
    mkdir "%UPLOAD_DIR%"
    if errorlevel 1 (
        echo FAILED to create directory!
        echo Please create manually: %UPLOAD_DIR%
        pause
        exit /b 1
    )
    echo Directory created successfully!
)

echo.
echo Setting permissions (full control for current user)...
echo.

REM Give full control to current user
icacls "%UPLOAD_DIR%" /grant %USERNAME%:(OI)(CI)F /T

if errorlevel 1 (
    echo.
    echo WARNING: Permission change may have failed.
    echo Try running this script as Administrator.
    echo.
) else (
    echo.
    echo SUCCESS! Permissions updated.
    echo.
)

REM Also set permissions on parent directories
echo Setting permissions on parent directories...
icacls "%PROJECT_DIR%public\img\products" /grant %USERNAME%:(OI)(CI)F /T
icacls "%PROJECT_DIR%public\img" /grant %USERNAME%:(OI)(CI)F /T

echo.
echo ========================================
echo  DONE!
echo ========================================
echo.
echo You should now be able to upload images in the admin panel.
echo.
echo If you still get permission errors:
echo 1. Run this script as Administrator (right-click ^> Run as administrator)
echo 2. Check your MAMP configuration (httpd.conf)
echo 3. Make sure MAMP is running under your user account
echo.

pause
