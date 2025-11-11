# Redeploy to Vercel - PowerShell Script
# This script commits changes and deploys to Vercel in one command

param(
    [string]$CommitMessage = "Update: redeploy to Vercel"
)

Write-Host "Starting Vercel redeploy process..." -ForegroundColor Cyan

# Check if there are any changes
Write-Host "`nChecking for changes..." -ForegroundColor Cyan
$status = git status --porcelain

if ([string]::IsNullOrEmpty($status)) {
    Write-Host "No changes detected. Deploying current version..." -ForegroundColor Yellow
} else {
    Write-Host "Changes detected. Committing..." -ForegroundColor Green

    # Add all changes except .env and dev.db
    git add -A
    git reset HEAD .env prisma/dev.db 2>$null

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
        Write-Host "Changes committed successfully!" -ForegroundColor Green

        # Push to origin
        Write-Host "`nPushing to origin/master..." -ForegroundColor Cyan
        git push origin master

        if ($LASTEXITCODE -ne 0) {
            Write-Host "Push failed!" -ForegroundColor Red
            exit 1
        }
        Write-Host "Pushed to origin successfully!" -ForegroundColor Green
    }
}

# Deploy to Vercel
Write-Host "`nDeploying to Vercel..." -ForegroundColor Cyan
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployment successful!" -ForegroundColor Green
    Write-Host "Your app is now live on Vercel!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Deployment failed!" -ForegroundColor Red
    exit 1
}
