@echo off
title ScanBite Restaurant Platform Server
cd /d "%~dp0"
echo ========================================================
echo   Starting ScanBite Restaurant Digital Menu Server...
echo ========================================================
echo.
echo Server URL: http://localhost:3000/dashboard
echo.
start http://localhost:3000/dashboard
node start-server.js
pause
