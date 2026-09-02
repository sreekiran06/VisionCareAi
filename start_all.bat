@echo off
title VisionCare AI Launcher
echo ===================================================
echo   Starting VisionCare AI System
echo ===================================================
echo.

set "ROOT=%~dp0"

echo [1/2] Starting Backend Server (Port 8000)...
start "VisionCare Backend" cmd /k "cd /d %ROOT%backend && python -m uvicorn app.main:app --reload --port 8000"

echo [2/2] Starting Frontend App (Port 3000)...
start "VisionCare Frontend" cmd /k "cd /d %ROOT%visioncare-frontend && npm start"

echo.
echo ===================================================
echo   Both servers started!
echo   - App: http://localhost:3000
echo   - API: http://127.0.0.1:8000/docs
echo ===================================================
echo.
