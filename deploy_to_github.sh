#!/bin/bash

# Quick script to initialize git and push to GitHub
# Make this file executable: chmod +x deploy_to_github.sh

echo "🚀 Chat App - GitHub Deployment Script"
echo "========================================"
echo ""

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

# Get repository name (default: chat-app)
read -p "Enter repository name (default: chat-app): " REPO_NAME
REPO_NAME=${REPO_NAME:-chat-app}

echo ""
echo "📝 Summary:"
echo "   Username: $GITHUB_USERNAME"
echo "   Repository: $REPO_NAME"
echo ""
read -p "Continue? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Step 1: Initializing git repository..."
git init

echo "Step 2: Adding all files..."
git add .

echo "Step 3: Creating initial commit..."
git commit -m "Initial commit - Chat app ready for deployment"

echo "Step 4: Renaming branch to main..."
git branch -M main

echo "Step 5: Adding remote repository..."
git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git

echo "Step 6: Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Done!"
echo ""
echo "🌐 Your repository: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""
echo "📝 Next steps:"
echo "   1. Go to https://dashboard.render.com"
echo "   2. Click 'New +' → 'Web Service'"
echo "   3. Connect your GitHub repository"
echo "   4. Follow the instructions in DEPLOYMENT.md"
echo ""

