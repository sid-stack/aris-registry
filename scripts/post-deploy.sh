#!/bin/bash

# Post-deployment script for ARIS application
# This script runs health checks and validations after deployment

set -e

echo "🔍 Starting post-deployment validation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Get deployment URL from arguments or use default
DEPLOY_URL=${1:-"https://aris-bidsmith.vercel.app"}
API_URL=${2:-"https://api.bidsmith.pro"}

echo "🌐 Deployment URL: $DEPLOY_URL"
echo "🔌 API URL: $API_URL"

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
sleep 30

# 1. Check if main site is accessible
echo "🏠 Checking main site accessibility..."
if curl -f -s "$DEPLOY_URL" > /dev/null; then
    print_status "Main site is accessible"
else
    print_error "Main site is not accessible"
    exit 1
fi

# 2. Check API health
echo "🏥 Checking API health..."
if curl -f -s "$API_URL/api/health" > /dev/null; then
    print_status "API is healthy"
else
    print_warning "API health check failed (endpoint may not exist)"
fi

# 3. Check critical pages
echo "📄 Checking critical pages..."
CRITICAL_PAGES=("/" "/templates" "/privacy" "/terms" "/about")
for page in "${CRITICAL_PAGES[@]}"; do
    if curl -f -s "$DEPLOY_URL$page" > /dev/null; then
        print_status "Page $page is accessible"
    else
        print_error "Page $page is not accessible"
        exit 1
    fi
done

# 4. Check API endpoints
echo "🔌 Checking API endpoints..."
API_ENDPOINTS=("/api/health" "/api/usage" "/api/track")
for endpoint in "${API_ENDPOINTS[@]}"; do
    if curl -f -s "$API_URL$endpoint" > /dev/null; then
        print_status "API endpoint $endpoint is accessible"
    else
        print_warning "API endpoint $endpoint may not exist or is not accessible"
    fi
done

# 5. Check SSL certificate
echo "🔒 Checking SSL certificate..."
if curl -s --head "$DEPLOY_URL" | grep -q "200 OK"; then
    print_status "SSL certificate is valid"
else
    print_warning "SSL certificate check failed"
fi

# 6. Check response time
echo "⚡ Checking response time..."
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$DEPLOY_URL")
if (( $(echo "$RESPONSE_TIME < 3.0" | bc -l) )); then
    print_status "Response time is good: ${RESPONSE_TIME}s"
else
    print_warning "Response time is slow: ${RESPONSE_TIME}s"
fi

# 7. Run Lighthouse check (if lhci is installed)
echo "🔦 Running Lighthouse check..."
if command -v lhci &> /dev/null; then
    lhci autorun --config=.lighthouserc.js || print_warning "Lighthouse check failed"
else
    print_warning "Lighthouse CLI not installed, skipping performance check"
fi

# 8. Check for console errors in production
echo "🧽 Checking for production console errors..."
# This would ideally be done with a headless browser, but for now we'll just check the build
if [ -d "dist" ]; then
    CONSOLES_IN_BUILD=$(grep -r "console\." dist/ --include="*.js" | wc -l || true)
    if [ "$CONSOLES_IN_BUILD" -gt 0 ]; then
        print_error "Found $CONSOLES_IN_BUILD console statements in production build"
        exit 1
    else
        print_status "No console statements in production build"
    fi
fi

# 9. Check environment-specific files
echo "🔧 Checking environment configuration..."
if curl -s "$DEPLOY_URL" | grep -q "localhost"; then
    print_error "Development references found in production"
    exit 1
else
    print_status "No development references in production"
fi

# 10. Check analytics tracking
echo "📊 Checking analytics tracking..."
if curl -s "$DEPLOY_URL" | grep -q "plausible\|analytics"; then
    print_status "Analytics tracking is present"
else
    print_warning "Analytics tracking may be missing"
fi

echo ""
echo "🎉 Post-deployment validation completed!"
echo "🚀 Deployment appears to be successful!"

# Optional: Open the site in browser for manual verification
if command -v open &> /dev/null; then
    echo "🌐 Opening $DEPLOY_URL in browser for manual verification..."
    open "$DEPLOY_URL"
fi

exit 0
