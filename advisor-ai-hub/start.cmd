@echo off
REM Simple startup command - just run the PowerShell script
powershell.exe -ExecutionPolicy Bypass -File "%~dp0start-advisorai.ps1"
if %ERRORLEVEL% neq 0 (
    echo.
    echo If PowerShell is restricted, try right-clicking start-advisorai.ps1 and select "Run with PowerShell"
    echo Or use the batch file: start-advisorai.bat
    echo.
    pause
)
