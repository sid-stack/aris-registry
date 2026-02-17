#!/bin/bash

# Function to kill background processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

echo "🚀 Starting Aris Agents Dashboard..."

# 1. Start Backend (Background)
echo "🔌 Starting Registry API (Port 8000)..."
source env/bin/activate
export PYTHONPATH=$PYTHONPATH:.
python3 registry/main.py &
BACKEND_PID=$!

# Wait for backend to be ready (simple sleep)
sleep 2

# 2. Start Frontend
echo "💻 Starting Web Interface (Port 3000)..."
cd web
npm run dev

# Keep script running if npm exits early for some reason, but usually npm run dev blocks.
wait $BACKEND_PID
