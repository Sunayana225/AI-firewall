#!/bin/bash

echo "🛡️  AI-Firewall System Test Runner"
echo "================================"

echo ""
echo "📋 Checking prerequisites..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    echo "Please install Python 3.8+ and try again"
    exit 1
fi

echo "✅ Python is installed"

# Check if backend dependencies are installed
echo ""
echo "📦 Checking backend dependencies..."
cd backend

if ! python3 -c "import flask, transformers, torch, PIL, requests" &> /dev/null; then
    echo "❌ Backend dependencies not installed"
    echo "Installing dependencies..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

echo "✅ Backend dependencies are ready"

# Start backend server in background
echo ""
echo "🚀 Starting backend server..."
python3 app.py &
BACKEND_PID=$!
sleep 3

# Run tests
echo ""
echo "🧪 Running system tests..."
cd ..
python3 test_system.py

# Clean up
echo ""
echo "🧹 Cleaning up..."
kill $BACKEND_PID 2>/dev/null

echo ""
echo "🏁 Tests completed!"
echo ""
echo "Next steps:"
echo "1. Load Chrome extension from 'extension' folder"
echo "2. Start dashboard: cd dashboard && npm start"
echo "3. Test on real websites"
echo ""
