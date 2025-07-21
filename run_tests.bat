@echo off
echo 🛡️  AI-Firewall System Test Runner
echo ================================

echo.
echo 📋 Checking prerequisites...

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

echo ✅ Python is installed

REM Check if backend dependencies are installed
echo.
echo 📦 Checking backend dependencies...
cd backend
python -c "import flask, transformers, torch, PIL, requests" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend dependencies not installed
    echo Installing dependencies...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

echo ✅ Backend dependencies are ready

REM Start backend server in background
echo.
echo 🚀 Starting backend server...
start /b python app.py
timeout /t 3 /nobreak >nul

REM Run tests
echo.
echo 🧪 Running system tests...
cd ..
python test_system.py

echo.
echo 🏁 Tests completed!
echo.
echo Next steps:
echo 1. Load Chrome extension from 'extension' folder
echo 2. Start dashboard: cd dashboard ^&^& npm start
echo 3. Test on real websites
echo.
pause
