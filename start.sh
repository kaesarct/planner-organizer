#!/bin/bash

echo "🏕️ Starting Scout Planner..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "🐳 Starting with Docker Compose..."
docker-compose up --build

echo ""
echo "✅ Scout Planner started!"
echo "🌐 Access: http://localhost:8000"