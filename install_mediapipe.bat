@echo off
echo ============================================================
echo  IMPORTANT: Make sure the backend is STOPPED before running!
echo  (Press Ctrl+C in the backend terminal first)
echo ============================================================
echo.
echo Installing mediapipe + opencv-contrib-python...
cd /d "c:\Users\manoh\OneDrive\Desktop\hack the marix\backend"
.venv\Scripts\pip.exe uninstall opencv-python -y 2>nul
.venv\Scripts\pip.exe install mediapipe opencv-contrib-python
echo.
echo Done! Now restart the backend with:
echo   cd backend
echo   .venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8001
pause
