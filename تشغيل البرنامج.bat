@echo off
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
    echo Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo Starting Smart Sales App...
start "" http://127.0.0.1:3002
npm run dev
