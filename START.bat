@echo off
echo ============================================
echo  Rice Mill App - Startup Script
echo ============================================
echo.

echo [1/3] Detecting network IP and updating .env...
node update-ip.js
if %ERRORLEVEL% NEQ 0 (
  echo WARNING: IP update failed, using existing .env
)

echo.
echo [2/3] Starting Backend...
start "Backend Server" cmd /k "cd backend && npm start"

timeout /t 4 /nobreak >nul

echo [3/3] Starting Frontend...
start "Frontend Dev" cmd /k "cd frontend && npm start"

echo.
echo ============================================
echo  Both servers are starting!
echo  Backend:  http://localhost:5001
echo  Frontend: http://localhost:3000
echo ============================================
pause
