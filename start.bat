@echo off
title ClinicVIP Server

cd /d "%~dp0"

echo ========================================================
echo               CLINIC VIP - WEB SERVER
echo ========================================================
echo.

if not exist ".env" (
    echo [INFO] Creating .env file from .env.example...
    copy .env.example .env >nul
)

if not exist "node_modules\" (
    echo [INFO] Installing packages, please wait...
    call npm install
)

echo [INFO] Opening web browser...
start http://localhost:3000

echo [INFO] Starting Node.js server...
echo [INFO] Homepage:    http://localhost:3000
echo [INFO] Admin Panel: http://localhost:3000/admin
echo.
echo Press Ctrl + C to stop the server.
echo --------------------------------------------------------

node server.js

echo.
echo [INFO] Server stopped.
pause
