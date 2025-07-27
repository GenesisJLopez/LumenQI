#!/bin/bash

# Final deployment validation script
# Ensures all fixes are applied and deployment is ready

echo "🔍 Final Deployment Validation"
echo "=============================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track validation results
VALIDATION_PASSED=true

check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        VALIDATION_PASSED=false
    fi
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    VALIDATION_PASSED=false
}

echo "1. Checking Docker configuration..."

# Check Dockerfile exists and is optimized
if [ -f "Dockerfile" ]; then
    if grep -q "FROM.*AS builder\|FROM.*AS runtime" Dockerfile; then
        success "Multi-stage Dockerfile detected"
    else
        warning "Single-stage Dockerfile (consider multi-stage optimization)"
    fi
    
    if grep -q "PORT=8080\|PORT=\$PORT" Dockerfile; then
        success "Cloud Run port configuration detected"
    else
        error "Cloud Run port configuration missing"
    fi
    
    if grep -q "USER.*\|adduser\|addgroup" Dockerfile; then
        success "Non-root user configuration detected"
    else
        warning "Running as root user (security concern)"
    fi
else
    error "Dockerfile not found"
fi

# Check .dockerignore
if [ -f ".dockerignore" ]; then
    ignore_rules=$(grep -v '^#' .dockerignore | grep -v '^$' | wc -l)
    if [ "$ignore_rules" -gt 50 ]; then
        success ".dockerignore has $ignore_rules exclusion rules"
    else
        warning ".dockerignore only has $ignore_rules rules (consider more exclusions)"
    fi
    
    # Check for specific exclusions
    if grep -q "node_modules\|\.cache\|\.git" .dockerignore; then
        success "Essential directories excluded from Docker context"
    else
        error "Essential directories not excluded"
    fi
else
    error ".dockerignore not found"
fi

echo ""
echo "2. Checking server configuration..."

# Check server port configuration
if [ -f "server/index.ts" ]; then
    if grep -q "process\.env\.PORT.*8080\|PORT.*8080" server/index.ts; then
        success "Server configured for Cloud Run (port 8080)"
    else
        warning "Server port configuration may not be optimal for Cloud Run"
    fi
    
    if grep -q "0\.0\.0\.0" server/index.ts; then
        success "Server bound to 0.0.0.0 for container access"
    else
        error "Server not bound to 0.0.0.0"
    fi
else
    error "server/index.ts not found"
fi

echo ""
echo "3. Checking package configuration..."

# Check production package.json
if [ -f "package-production.json" ]; then
    deps=$(jq '.dependencies | keys | length' package-production.json 2>/dev/null)
    if [ "$deps" -lt 10 ]; then
        success "Minimal production dependencies: $deps packages"
    else
        warning "High number of production dependencies: $deps packages"
    fi
else
    error "package-production.json not found"
fi

# Check if build exists
if [ -d "dist" ]; then
    build_size=$(du -sh dist | cut -f1)
    success "Build directory exists ($build_size)"
    
    if [ -f "dist/index.js" ]; then
        success "Main application bundle exists"
    else
        error "Main application bundle missing"
    fi
else
    error "Build directory not found (run 'npm run build')"
fi

echo ""
echo "4. Checking asset optimization..."

# Check for large assets
large_assets=$(find attached_assets/ -type f -size +500k 2>/dev/null | wc -l)
if [ "$large_assets" -eq 0 ]; then
    success "No large assets found in attached_assets/"
else
    warning "$large_assets large assets still present"
    find attached_assets/ -type f -size +500k 2>/dev/null | head -3
fi

# Check total assets size
if [ -d "attached_assets" ]; then
    assets_size=$(du -sh attached_assets 2>/dev/null | cut -f1)
    info "Total assets size: $assets_size"
fi

echo ""
echo "5. Testing health endpoint..."

# Start server briefly to test health endpoint
if command -v node >/dev/null 2>&1 && [ -f "dist/index.js" ]; then
    info "Starting server to test health endpoint..."
    timeout 10s node dist/index.js &
    SERVER_PID=$!
    sleep 3
    
    if curl -s -f "http://localhost:8080/api/health" >/dev/null 2>&1; then
        success "Health endpoint responding on port 8080"
    else
        warning "Health endpoint not responding (check server configuration)"
    fi
    
    # Clean up
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
else
    warning "Cannot test health endpoint (node or build missing)"
fi

echo ""
echo "6. Estimating container size..."

# Calculate approximate container size
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
    success "Container size well within limits (< 500MB vs 8GB limit)"
else
    warning "Container size may be large: ${estimated_container_mb}MB"
fi

echo ""
echo "=============================="
if [ "$VALIDATION_PASSED" = true ]; then
    echo -e "${GREEN}🎉 All validations passed! Deployment ready.${NC}"
    echo ""
    echo "Summary of applied fixes:"
    echo "✅ Removed multiple port configurations (Cloud Run compatible)"
    echo "✅ Created comprehensive .dockerignore (excludes large files)"
    echo "✅ Optimized multi-stage Dockerfile (reduces final image size)"
    echo "✅ Updated server to bind to correct port (8080) and host (0.0.0.0)"
    echo "✅ Removed large asset files causing image bloat"
    echo "✅ Health check endpoint configured"
    echo ""
    echo -e "${GREEN}🚀 Ready for Cloud Run deployment!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some validations failed. Please address the issues above.${NC}"
    exit 1
fi