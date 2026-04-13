#!/bin/bash

# Pre-deployment script for ARIS application
# This script runs all necessary checks before deployment

set -e

echo "🚀 Starting pre-deployment checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Check if we're on the correct branch
echo "📋 Checking branch..."
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "main" && "$BRANCH" != "develop" ]]; then
    print_warning "Not on main or develop branch (current: $BRANCH)"
fi

# 2. Check for uncommitted changes
echo "🔍 Checking for uncommitted changes..."
if [[ -n $(git status --porcelain) ]]; then
    print_error "Uncommitted changes found. Please commit or stash before deploying."
    exit 1
else
    print_status "No uncommitted changes"
fi

# 3. Install dependencies
echo "📦 Installing dependencies..."
npm ci
print_status "Dependencies installed"

# 4. Run security audit
echo "🔒 Running security audit..."
npm audit --audit-level=moderate
print_status "Security audit passed"

# 5. Run linting
echo "🧹 Running linting..."
npm run lint
print_status "Linting passed"

# 6. Remove console statements
echo "🧽 Checking for console statements..."
CONSOLES=$(grep -r "console\." src/ --include="*.js" --include="*.jsx" | wc -l || true)
if [ "$CONSOLES" -gt 0 ]; then
    print_error "Found $CONSOLES console statements that need to be removed:"
    grep -r "console\." src/ --include="*.js" --include="*.jsx"
    exit 1
else
    print_status "No console statements found"
fi

# 7. Build application
echo "🏗️ Building application..."
npm run build
print_status "Build successful"

# 8. Check build size
echo "📏 Checking build size..."
BUILD_SIZE=$(du -k dist/ | cut -f1)
if [ "$BUILD_SIZE" -gt 5000 ]; then
    print_warning "Build size is large: ${BUILD_SIZE}KB"
else
    print_status "Build size acceptable: ${BUILD_SIZE}KB"
fi

# 9. Run tests
echo "🧪 Running tests..."
npm run test:ci
print_status "Tests passed"

# 10. Check environment variables
echo "🔧 Checking environment variables..."
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Using environment variables from host."
else
    print_status ".env file found"
fi

# 11. Validate critical files exist
echo "📁 Checking critical files..."
CRITICAL_FILES=("package.json" "vite.config.js" "vercel.json" "railway.json")
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "$file exists"
    else
        print_error "$file missing"
        exit 1
    fi
done

# 12. Check API health (if running locally)
echo "🏥 Checking API health..."
if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    print_status "API is healthy"
else
    print_warning "API not running locally or health check endpoint missing"
fi

echo ""
echo "🎉 Pre-deployment checks completed successfully!"
echo "🚀 Ready to deploy!"

# Exit with success
exit 0
