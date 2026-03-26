#!/bin/bash

# BidSmith Local Deployment Script
# Usage: ./deploy-local.sh

echo "🚀 Starting BidSmith Local Deployment..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Start the preview server
    echo "🌐 Starting production preview server..."
    echo "📍 Frontend will be available at: http://localhost:4173"
    echo "📍 Backend API should be at: http://localhost:8080"
    echo ""
    echo "💡 To start the backend API, run: npm start"
    echo "💡 To stop the preview server, press Ctrl+C"
    echo ""
    
    npm run preview
else
    echo "❌ Build failed!"
    exit 1
fi
