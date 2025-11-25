@echo off
REM Fix read-only flags on uploaded product images
REM This is a simpler version - use the .ps1 file for more details

echo.
echo ========================================
echo  Fixing Read-Only Flags on Images
echo ========================================
echo.

REM Get the directory where this script is located
set "PROJECT_DIR=%~dp0"
set "UPLOAD_DIR=%PROJECT_DIR%public\img\products\cockpit3d"

echo Upload directory: %UPLOAD_DIR%
echo.

REM Check if directory exists
if not exist "%UPLOAD_DIR%" (
    echo ERROR: Upload directory not found!
    echo Expected: %UPLOAD_DIR%
    pause
    exit /b 1
)

echo Removing read-only flags from all images...
echo.

REM Remove read-only flag from all image files recursively
attrib -R "%UPLOAD_DIR%\*.png" /S
attrib -R "%UPLOAD_DIR%\*.jpg" /S
attrib -R "%UPLOAD_DIR%\*.jpeg" /S
attrib -R "%UPLOAD_DIR%\*.gif" /S
attrib -R "%UPLOAD_DIR%\*.webp" /S

echo.
echo ========================================
echo  DONE!
echo ========================================
echo.
echo Read-only flags have been removed from all image files.
echo.
echo You should now be able to:
echo 1. View images in the admin panel
echo 2. Build without permission errors
echo 3. Upload new images successfully
echo.

pause
