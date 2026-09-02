@echo off
title VisionCare Backend
cd /d "%~dp0backend"
echo Starting VisionCare AI Backend on Port 8000...
python -m uvicorn app.main:app --reload --port 8000
pause
