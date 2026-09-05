@echo off
setlocal
cd /d "%~dp0"
echo.
echo ===== BioSync =====
echo.
echo This launcher opens the three services in separate windows.
echo Make sure MongoDB is running locally first.
echo.
if exist "%~dp0.venv\Scripts\activate.bat" (
    set "VENV_ACTIVATE=%~dp0.venv\Scripts\activate.bat"
) else (
    set "VENV_ACTIVATE=%~dp0venv\Scripts\activate.bat"
)
start "BioSync ML API" cmd /k "cd /d %~dp0ml-api && call "%VENV_ACTIVATE%" && python -m uvicorn main:app --reload --port 8000"
start "BioSync Backend" cmd /k "cd /d %~dp0backend && npm run dev"
start "BioSync Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Open http://localhost:3000
pause
