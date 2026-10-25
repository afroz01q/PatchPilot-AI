@echo off
echo.
echo ============================================================
echo   PatchPilot AI — Video Studio Startup
echo ============================================================
echo.

echo [1/3] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js not found. Install from https://nodejs.org
  pause
  exit /b 1
)

echo [2/3] Starting Video Studio backend server...
echo       API will run at http://127.0.0.1:3717
echo.
start "PatchPilot Video Studio Server" cmd /k "cd /d "%~dp0studio-server" && node server.js"

timeout /t 2 >nul

echo [3/3] Starting PatchPilot AI frontend dev server...
echo       App will be at http://localhost:5174
echo.
start "PatchPilot AI Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo ============================================================
echo   Both servers starting. Open your browser:
echo   http://localhost:5174
echo   Then click "Video Studio" in the topbar or sidebar.
echo ============================================================
echo.
pause
