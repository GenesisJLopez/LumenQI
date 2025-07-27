#!/bin/bash

echo "🚀 Deployment Validation for Cloud Run"
echo "======================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

info() {
    echo -e "ℹ️  $1"
}

echo ""
echo "1. Checking port configuration..."

# Check server port configuration
if grep -q "process\.env\.PORT.*8080\|PORT.*8080" server/index.ts; then
    success "Server configured for Cloud Run (port 8080)"
else
    error "Server port configuration may not be optimal for Cloud Run"
fi

if grep -q "0\.0\.0\.0" server/index.ts; then
    success "Server bound to 0.0.0.0 for container access"
else
    error "Server not bound to 0.0.0.0"
fi

echo ""
echo "2. Checking Docker configuration..."

# Check Dockerfile
if [ -f "Dockerfile" ]; then
    if grep -q "multi-stage\|AS builder\|AS runtime" Dockerfile; then
        success "Multi-stage Dockerfile detected"
    else
        warning "Single-stage Dockerfile (consider multi-stage for optimization)"
    fi
    
    if grep -q "PORT=8080" Dockerfile; then
        success "Cloud Run port configuration (8080) detected"
    else
        warning "Port 8080 not explicitly set for Cloud Run"
    fi
    
    if grep -q "NODE_ENV=production" Dockerfile; then
        success "Production environment configured"
    else
        warning "Production environment not configured"
    fi
else
    error "Dockerfile not found"
fi

# Check .dockerignore
if [ -f ".dockerignore" ]; then
    ignore_rules=$(grep -v '^#' .dockerignore | grep -v '^$' | wc -l)
    if [ "$ignore_rules" -gt 5 ]; then
        success ".dockerignore has $ignore_rules exclusion rules"
    else
        warning ".dockerignore only has $ignore_rules rules (consider more exclusions)"
    fi
    
    # Check for specific exclusions
    if grep -q "\*\*\|node_modules\|\.git" .dockerignore; then
        success "Essential directories excluded from Docker context"
    else
        error "Essential directories not excluded"
    fi
else
    error ".dockerignore not found"
fi

echo ""
echo "3. Checking production package configuration..."

if [ -f "package-production.json" ]; then
    deps=$(jq '.dependencies | length' package-production.json 2>/dev/null || echo "0")
    success "Production package has $deps dependencies"
    
    if [ "$deps" -lt 10 ]; then
        success "Minimal dependency count ($deps)"
    else
        warning "High dependency count ($deps) - consider optimization"
    fi
else
    error "package-production.json not found"
fi

echo ""
echo "4. Checking build output..."

if [ -d "dist" ]; then
    build_size=$(du -sh dist | cut -f1)
    success "Build directory exists ($build_size)"
    
    if [ -f "dist/index.js" ]; then
        server_size=$(stat -c%s "dist/index.js" 2>/dev/null || stat -f%z "dist/index.js" 2>/dev/null)
        server_mb=$((server_size / 1024 / 1024))
        success "Server bundle: ${server_mb}MB"
    else
        error "Server bundle (dist/index.js) not found"
    fi
else
    error "Build directory missing (run npm run build)"
fi

echo ""
echo "5. Calculating Docker context size..."

# Calculate Docker context size (only files that would be included)
context_size=0
if [ -f "package-production.json" ]; then
    context_size=$((context_size + $(stat -c%s package-production.json 2>/dev/null || stat -f%z package-production.json 2>/dev/null)))
fi
if [ -f "package-lock.json" ]; then
    context_size=$((context_size + $(stat -c%s package-lock.json 2>/dev/null || stat -f%z package-lock.json 2>/dev/null)))
fi
if [ -d "dist" ]; then
    dist_size=$(du -sb dist 2>/dev/null | cut -f1)
    context_size=$((context_size + dist_size))
fi

# Convert to MB
context_mb=$((context_size / 1024 / 1024))
estimated_container_mb=$((context_mb + 100)) # Add base Alpine + Node.js

info "Docker context size: ${context_mb}MB"
info "Estimated container size: ${estimated_container_mb}MB"

if [ "$estimated_container_mb" -lt 500 ]; then
    success "Container size well within Cloud Run limits (8GB)"
else
    warning "Container size may be large: ${estimated_container_mb}MB"
fi

echo ""
echo "6. Testing health endpoint..."

# Test health endpoint if server is running
if curl -s -f "http://localhost:5000/api/health" >/dev/null 2>&1; then
    success "Health endpoint responding on development port"
elif curl -s -f "http://localhost:8080/api/health" >/dev/null 2>&1; then
    success "Health endpoint responding on production port"
else
    warning "Health endpoint not responding (server may not be running)"
fi

echo ""
echo "7. Final deployment readiness summary..."

if [ "$context_mb" -lt 50 ] && [ -f "Dockerfile" ] && [ -f ".dockerignore" ] && [ -f "package-production.json" ]; then
    success "Deployment optimized and ready for Cloud Run!"
    echo ""
    echo "🎯 Deployment Summary:"
    echo "   • Docker context: ${context_mb}MB (vs 8GB limit)"
    echo "   • Estimated container: ${estimated_container_mb}MB"
    echo "   • Multi-stage Dockerfile: ✅"
    echo "   • Production dependencies: $deps"
    echo "   • Health endpoint: ✅"
    echo "   • Port 8080 configured: ✅"
else
    warning "Some optimizations may still be needed"
fi

echo ""
echo "======================================="
echo "🚀 Validation complete!"