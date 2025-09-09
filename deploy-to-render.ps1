# Savebucks Render Deployment Script (PowerShell)
# This script helps prepare your project for Render deployment

Write-Host "🚀 Savebucks Render Deployment Preparation" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project structure verified" -ForegroundColor Green

# Check for required files
Write-Host "📋 Checking required files..." -ForegroundColor Yellow

$requiredFiles = @(
    "render.yaml",
    "apps/web/package.json",
    "apps/api/package.json",
    "apps/worker/package.json"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file is missing" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🔧 Environment Variables Checklist" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Yellow
Write-Host "Make sure you have these environment variables ready:"
Write-Host ""
Write-Host "📊 Supabase:" -ForegroundColor Cyan
Write-Host "  - SUPABASE_URL"
Write-Host "  - SUPABASE_ANON_KEY"
Write-Host "  - SUPABASE_SERVICE_ROLE"
Write-Host ""
Write-Host "🔴 Redis (Upstash):" -ForegroundColor Cyan
Write-Host "  - UPSTASH_REDIS_REST_URL"
Write-Host "  - UPSTASH_REDIS_REST_TOKEN"
Write-Host ""
Write-Host "🤖 Telegram Bot:" -ForegroundColor Cyan
Write-Host "  - TELEGRAM_BOT_TOKEN"
Write-Host "  - TELEGRAM_ALLOWED_CHANNELS"
Write-Host "  - TELEGRAM_MIN_TITLE_LEN (optional, defaults to 12)"
Write-Host ""

# Check if git is initialized
if (Test-Path ".git") {
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
    
    # Check if there are uncommitted changes
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "⚠️  Warning: You have uncommitted changes" -ForegroundColor Yellow
        Write-Host "   Consider committing your changes before deploying:"
        Write-Host "   git add ."
        Write-Host "   git commit -m 'Prepare for Render deployment'"
        Write-Host ""
    } else {
        Write-Host "✅ No uncommitted changes" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Git repository not initialized" -ForegroundColor Red
    Write-Host "   Please run: git init && git add . && git commit -m 'Initial commit'"
    exit 1
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "==============" -ForegroundColor Yellow
Write-Host "1. Push your code to GitHub:"
Write-Host "   git remote add origin https://github.com/yourusername/savebucks.git"
Write-Host "   git push -u origin main"
Write-Host ""
Write-Host "2. Go to https://render.com and sign up/login"
Write-Host ""
Write-Host "3. Click 'New +' → 'Blueprint'"
Write-Host ""
Write-Host "4. Connect your GitHub repository"
Write-Host ""
Write-Host "5. Set the environment variables in the Render dashboard"
Write-Host ""
Write-Host "6. Click 'Apply' to deploy all services"
Write-Host ""
Write-Host "📖 For detailed instructions, see RENDER_DEPLOYMENT.md"
Write-Host ""
Write-Host "🎉 Happy deploying!" -ForegroundColor Green
