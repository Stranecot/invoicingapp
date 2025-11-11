# Start Both Apps - Development Mode
# This script starts both the client portal and admin dashboard in parallel

Write-Host "🚀 Starting Invoice App Development Servers..." -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Starting Client Portal on http://localhost:3001" -ForegroundColor Cyan
Write-Host "Starting Admin Dashboard on http://localhost:3002" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

# Start both apps using Turbo
npm run dev
