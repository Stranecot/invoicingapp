# Vercel Deployment Setup Script (PowerShell)
# This script helps you prepare for Vercel deployment

Write-Host "Vercel Deployment Setup" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Check if vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "ERROR: Vercel CLI not found. Install it with:" -ForegroundColor Red
    Write-Host "   npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host "SUCCESS: Vercel CLI installed" -ForegroundColor Green
Write-Host ""

# Generate JWT Secret using .NET
Write-Host "Generating JWT Secret..." -ForegroundColor Cyan
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$JWT_SECRET = [Convert]::ToBase64String($bytes)
Write-Host "SUCCESS: Generated JWT_SECRET: $JWT_SECRET" -ForegroundColor Green
Write-Host ""

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "WARNING: DATABASE_URL not set" -ForegroundColor Yellow
    Write-Host "   You'll need to provide this manually in Vercel UI" -ForegroundColor Yellow
    Write-Host "   Format: postgresql://user:password@host:5432/database" -ForegroundColor Gray
} else {
    $dbUrlPreview = $env:DATABASE_URL.Substring(0, [Math]::Min(30, $env:DATABASE_URL.Length))
    Write-Host "SUCCESS: DATABASE_URL found: $dbUrlPreview..." -ForegroundColor Green
}
Write-Host ""

# Check if RESEND_API_KEY is set
if (-not $env:RESEND_API_KEY) {
    Write-Host "WARNING: RESEND_API_KEY not set" -ForegroundColor Yellow
    Write-Host "   Get your API key from: https://resend.com/api-keys" -ForegroundColor Yellow
} else {
    Write-Host "SUCCESS: RESEND_API_KEY found" -ForegroundColor Green
}
Write-Host ""

Write-Host "Environment Variables to Set in Vercel:" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SHARED VARIABLES (Set in both projects):" -ForegroundColor Yellow
Write-Host "-----------------------------------------" -ForegroundColor Yellow
Write-Host "JWT_SECRET=$JWT_SECRET"
Write-Host "JWT_EXPIRES_IN=7d"
Write-Host "DATABASE_URL=<your-postgres-url>"
Write-Host "RESEND_API_KEY=<your-resend-key>"
Write-Host ""
Write-Host "CLIENT PORTAL SPECIFIC:" -ForegroundColor Yellow
Write-Host "----------------------" -ForegroundColor Yellow
Write-Host "FROM_EMAIL=noreply@yourdomain.com"
Write-Host "FROM_NAME=Invoice App"
Write-Host "REPLY_TO_EMAIL=support@yourdomain.com"
Write-Host "APP_URL=https://app.yourdomain.com"
Write-Host "NEXT_PUBLIC_APP_URL=https://app.yourdomain.com"
Write-Host "CLIENT_PORTAL_URL=https://app.yourdomain.com"
Write-Host ""
Write-Host "ADMIN DASHBOARD SPECIFIC:" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Yellow
Write-Host "FROM_EMAIL=admin@yourdomain.com"
Write-Host "FROM_NAME=Invoice App Admin"
Write-Host "REPLY_TO_EMAIL=admin@yourdomain.com"
Write-Host "APP_URL=https://admin.yourdomain.com"
Write-Host "NEXT_PUBLIC_APP_URL=https://admin.yourdomain.com"
Write-Host "CLIENT_PORTAL_URL=https://app.yourdomain.com"
Write-Host ""

# Save to a file for easy reference
$envVarsContent = @"
# SHARED VARIABLES (Set in both projects)
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
DATABASE_URL=<your-postgres-url>
RESEND_API_KEY=<your-resend-key>

# CLIENT PORTAL SPECIFIC
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Invoice App
REPLY_TO_EMAIL=support@yourdomain.com
APP_URL=https://app.yourdomain.com
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
CLIENT_PORTAL_URL=https://app.yourdomain.com

# ADMIN DASHBOARD SPECIFIC
FROM_EMAIL=admin@yourdomain.com
FROM_NAME=Invoice App Admin
REPLY_TO_EMAIL=admin@yourdomain.com
APP_URL=https://admin.yourdomain.com
NEXT_PUBLIC_APP_URL=https://admin.yourdomain.com
CLIENT_PORTAL_URL=https://app.yourdomain.com
"@

$outputFile = "vercel-env-vars.txt"
$envVarsContent | Out-File -FilePath $outputFile -Encoding UTF8
Write-Host "SAVED: Environment variables saved to: $outputFile" -ForegroundColor Green
Write-Host ""

# Offer to create projects
Write-Host "Ready to create Vercel projects?" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy the JWT_SECRET above (or from $outputFile)"
Write-Host "2. Run: vercel link (to link this repo)"
Write-Host "3. Create two projects in Vercel UI:"
Write-Host "   - Client Portal (root: src/apps/client-portal)"
Write-Host "   - Admin Dashboard (root: src/apps/admin-dashboard)"
Write-Host "4. Add environment variables in Vercel UI for both projects"
Write-Host ""

$response = Read-Host "Would you like to link this repository to Vercel now? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "Linking repository..." -ForegroundColor Cyan
    vercel link
    Write-Host "SUCCESS: Repository linked!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now go to Vercel Dashboard to:" -ForegroundColor Yellow
    Write-Host "1. Create the Client Portal project" -ForegroundColor White
    Write-Host "2. Create the Admin Dashboard project" -ForegroundColor White
    Write-Host "3. Add environment variables to both" -ForegroundColor White
} else {
    Write-Host "SKIPPED: Vercel link" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setup complete! See DEPLOYMENT.md for full instructions." -ForegroundColor Green
Write-Host ""
Write-Host "Environment variables reference: $outputFile" -ForegroundColor Cyan
