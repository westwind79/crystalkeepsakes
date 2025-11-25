# Fix read-only flags on uploaded product images
# Run this in PowerShell: .\fix-readonly-files.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Fixing Read-Only Flags on Images" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$uploadDir = Join-Path $scriptDir "public\img\products\cockpit3d"

Write-Host "Project directory: $scriptDir" -ForegroundColor Yellow
Write-Host "Upload directory: $uploadDir" -ForegroundColor Yellow
Write-Host ""

# Check if directory exists
if (-not (Test-Path $uploadDir)) {
    Write-Host "ERROR: Upload directory not found!" -ForegroundColor Red
    Write-Host "Expected: $uploadDir" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Find all image files
Write-Host "Scanning for image files..." -ForegroundColor Cyan
$imageFiles = Get-ChildItem -Path $uploadDir -Recurse -Include *.png,*.jpg,*.jpeg,*.gif,*.webp

Write-Host "Found $($imageFiles.Count) image files" -ForegroundColor Yellow
Write-Host ""

if ($imageFiles.Count -eq 0) {
    Write-Host "No image files found. Nothing to fix." -ForegroundColor Green
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 0
}

# Process each file
$fixedCount = 0
$skippedCount = 0
$errorCount = 0

foreach ($file in $imageFiles) {
    $isReadOnly = $file.IsReadOnly
    
    if ($isReadOnly) {
        Write-Host "Fixing: $($file.Name)" -ForegroundColor Yellow -NoNewline
        
        try {
            # Remove read-only flag
            Set-ItemProperty -Path $file.FullName -Name IsReadOnly -Value $false
            
            # Verify it worked
            $file.Refresh()
            if (-not $file.IsReadOnly) {
                Write-Host " [OK]" -ForegroundColor Green
                $fixedCount++
            } else {
                Write-Host " [FAILED]" -ForegroundColor Red
                $errorCount++
            }
        } catch {
            Write-Host " [ERROR: $($_.Exception.Message)]" -ForegroundColor Red
            $errorCount++
        }
    } else {
        # File is already writable, skip it
        $skippedCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total files: $($imageFiles.Count)" -ForegroundColor White
Write-Host "Fixed: $fixedCount" -ForegroundColor Green
Write-Host "Already OK: $skippedCount" -ForegroundColor Gray
Write-Host "Errors: $errorCount" -ForegroundColor Red
Write-Host ""

if ($fixedCount -gt 0) {
    Write-Host "SUCCESS! Fixed $fixedCount read-only files." -ForegroundColor Green
}

if ($errorCount -gt 0) {
    Write-Host "WARNING: $errorCount files could not be fixed." -ForegroundColor Yellow
    Write-Host "Try running PowerShell as Administrator." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "You should now be able to:" -ForegroundColor Cyan
Write-Host "1. View images in the admin panel" -ForegroundColor White
Write-Host "2. Build without permission errors" -ForegroundColor White
Write-Host "3. Upload new images successfully" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
