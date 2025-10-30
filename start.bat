@echo off
echo 🏕️ Starting Scout Planner...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

echo 🐳 Starting with Docker Compose...
docker-compose up --build

echo.
echo ✅ Scout Planner started!
echo 🌐 Access: http://localhost:8000
pause