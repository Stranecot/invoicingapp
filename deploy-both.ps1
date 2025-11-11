# Deploy Both Apps to Vercel - PowerShell Script
# This script deploys both client-portal and admin-dashboard to Vercel

param(
    [string]$CommitMessage = "Deploy: update both apps",
    [switch]$Production
)

Write-Host "🚀 Deploying Both Apps to Vercel..." -ForegroundColor Green
Write-Host ""

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not installed. Installing globally..." -ForegroundColor Yellow
    npm install -g vercel
}

# Check if there are any changes
Write-Host "📋 Checking for changes..." -ForegroundColor Cyan
$status = git status --porcelain

if (-not [string]::IsNullOrEmpty($status)) {
    Write-Host "Changes detected. Committing..." -ForegroundColor Yellow

    # Add all changes
    git add -A
    git reset HEAD .env .env.local .env.production 2>$null

    # Commit changes
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $fullMessage = @"
$CommitMessage

Deployed: $timestamp

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
"@

    git commit -m $fullMessage

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Commit failed. Continuing with deployment..." -ForegroundColor Yellow
    } else {
        Write-Host "✅ Changes committed successfully!" -ForegroundColor Green

        # Push to origin
        Write-Host "`n📤 Pushing to origin..." -ForegroundColor Cyan
        git push origin master

        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Push failed!" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Pushed to origin successfully!" -ForegroundColor Green
    }
}

# Determine deployment mode
$deployMode = if ($Production) { "--prod" } else { "" }
$modeText = if ($Production) { "PRODUCTION" } else { "PREVIEW" }

Write-Host "`n🔧 Deployment Mode: $modeText" -ForegroundColor Cyan
Write-Host ""

# Deploy Client Portal
Write-Host "📦 1/2 Deploying Client Portal..." -ForegroundColor Cyan
Push-Location "src\apps\client-portal"
if ($Production) {
    vercel --prod
} else {
    vercel
}
$clientExitCode = $LASTEXITCODE
Pop-Location

if ($clientExitCode -eq 0) {
    Write-Host "✅ Client Portal deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Client Portal deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Deploy Admin Dashboard
Write-Host "📦 2/2 Deploying Admin Dashboard..." -ForegroundColor Cyan
Push-Location "src\apps\admin-dashboard"
if ($Production) {
    vercel --prod
} else {
    vercel
}
$adminExitCode = $LASTEXITCODE
Pop-Location

if ($adminExitCode -eq 0) {
    Write-Host "✅ Admin Dashboard deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Admin Dashboard deployment failed!" -ForegroundColor Red
    exit 1
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "🎉 Both Apps Deployed Successfully!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Check Vercel dashboard for deployment URLs"
Write-Host "2. Verify both apps are working correctly"
Write-Host "3. Configure custom domains if needed"
Write-Host ""
