@echo off
REM Local setup for Dakato Query Tools (Windows)
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is required but was not found on this computer.
  echo.
  echo Install Node.js 18 or later, then run setup again:
  echo   https://nodejs.org/
  echo.
  echo After installing, open a new Command Prompt and run:
  echo   setup.bat
  echo.
  pause
  exit /b 1
)

node setup.mjs
if errorlevel 1 exit /b 1
pause
