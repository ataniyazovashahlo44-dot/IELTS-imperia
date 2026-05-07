#!/bin/bash
# Production-ready Start script for IELTS Platform

echo "Starting Application..."

cleanup() {
    echo "Shutting down background processes..."
    kill $(jobs -p) 2>/dev/null || true
    exit
}
trap cleanup SIGINT SIGTERM

# Start backend (Production mode)
echo "Starting Backend..."
cd backend
# Railway uses 'node dist/server.js', we'll simulate production start
npm start &
cd ..

# Start frontend (Preview build if possible, or dev)
echo "Starting Frontend..."
cd frontend
npm run dev &
cd ..

echo "Application started! Access it via the local URL (usually http://localhost:5173)"
wait
