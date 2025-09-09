#!/bin/bash

# Savebucks Render Deployment Script
# This script helps prepare your project for Render deployment

echo "🚀 Savebucks Render Deployment Preparation"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure verified"

# Check for required files
echo "📋 Checking required files..."

required_files=(
    "render.yaml"
    "apps/web/package.json"
    "apps/api/package.json"
    "apps/worker/package.json"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file is missing"
        exit 1
    fi
done

echo ""
echo "🔧 Environment Variables Checklist"
echo "=================================="
echo "Make sure you have these environment variables ready:"
echo ""
echo "📊 Supabase:"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_ROLE"
echo ""
echo "🔴 Redis (Upstash):"
echo "  - UPSTASH_REDIS_REST_URL"
echo "  - UPSTASH_REDIS_REST_TOKEN"
echo ""
echo "🤖 Telegram Bot:"
echo "  - TELEGRAM_BOT_TOKEN"
echo "  - TELEGRAM_ALLOWED_CHANNELS"
echo "  - TELEGRAM_MIN_TITLE_LEN (optional, defaults to 12)"
echo ""

# Check if git is initialized
if [ -d ".git" ]; then
    echo "✅ Git repository initialized"
    
    # Check if there are uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠️  Warning: You have uncommitted changes"
        echo "   Consider committing your changes before deploying:"
        echo "   git add ."
        echo "   git commit -m 'Prepare for Render deployment'"
        echo ""
    else
        echo "✅ No uncommitted changes"
    fi
else
    echo "❌ Git repository not initialized"
    echo "   Please run: git init && git add . && git commit -m 'Initial commit'"
    exit 1
fi

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Push your code to GitHub:"
echo "   git remote add origin https://github.com/yourusername/savebucks.git"
echo "   git push -u origin main"
echo ""
echo "2. Go to https://render.com and sign up/login"
echo ""
echo "3. Click 'New +' → 'Blueprint'"
echo ""
echo "4. Connect your GitHub repository"
echo ""
echo "5. Set the environment variables in the Render dashboard"
echo ""
echo "6. Click 'Apply' to deploy all services"
echo ""
echo "📖 For detailed instructions, see RENDER_DEPLOYMENT.md"
echo ""
echo "🎉 Happy deploying!"
