@echo off
echo ========================================
echo   Crystal Keepsakes - Development Setup
echo ========================================
echo.
echo This script will help you start development.
echo.
echo STEP 1: Start MAMP
echo ----------------------------------------
echo Please start MAMP manually:
echo 1. Open MAMP application
echo 2. Click START button
echo 3. Wait for Apache and MySQL to turn green
echo.
pause
echo.
echo STEP 2: Starting Next.js...
echo ----------------------------------------
echo Starting the website on http://localhost:3000
echo Press Ctrl+C to stop when done
echo.
npm run dev
