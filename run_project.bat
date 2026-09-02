@echo off
title VisionCare AI - Launcher
echo =============================================
echo   VisionCare AI - Starting All Services...
echo =============================================

:: Start Backend in a new window
start "VisionCare Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --reload --port 8000"

:: Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak > nul

:: Start Frontend in a new window
start "VisionCare Frontend" cmd /k "cd /d "%~dp0visioncare-frontend" && npm start"

echo.
echo Both services are starting in separate windows.
echo  - Backend:  http://localhost:8000
echo  - API Docs: http://localhost:8000/docs
echo  - Frontend: http://localhost:3000
echo.
pause
