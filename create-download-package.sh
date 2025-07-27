#!/bin/bash

echo "📦 Creating Lumen AI Download Package"
echo "===================================="

# Create download directory
DOWNLOAD_DIR="lumen-ai-download"
rm -rf "$DOWNLOAD_DIR"
mkdir -p "$DOWNLOAD_DIR"

echo "Building application..."
npm run build

echo "Copying essential files..."

# Copy production files
cp package-production.json "$DOWNLOAD_DIR/package.json"
cp package-lock.json "$DOWNLOAD_DIR/"
cp -r dist/ "$DOWNLOAD_DIR/"

# Copy Docker files
cp Dockerfile "$DOWNLOAD_DIR/"
cp .dockerignore "$DOWNLOAD_DIR/"

# Copy deployment validation script
cp validate-deployment.sh "$DOWNLOAD_DIR/"

# Copy README and documentation
cp replit.md "$DOWNLOAD_DIR/README.md"

# Create startup script
cat > "$DOWNLOAD_DIR/start.sh" << 'EOF'
#!/bin/bash
echo "🚀 Starting Lumen AI..."
echo "Installing dependencies..."
npm install --only=production
echo "Starting server..."
npm start
EOF

chmod +x "$DOWNLOAD_DIR/start.sh"

# Create deployment instructions
cat > "$DOWNLOAD_DIR/DEPLOYMENT.md" << 'EOF'
# Lumen AI - Deployment Instructions

## Quick Start (Local)
```bash
chmod +x start.sh
./start.sh
```

## Docker Deployment
```bash
# Build Docker image
docker build -t lumen-ai .

# Run container
docker run -p 8080:8080 -e DATABASE_URL="your_db_url" -e OPENAI_API_KEY="your_key" lumen-ai
```

## Cloud Run Deployment
1. Upload this package to your cloud platform
2. Set environment variables: DATABASE_URL, OPENAI_API_KEY
3. Deploy with provided Dockerfile
4. The app will run on port 8080

## Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: Your OpenAI API key

## Validation
Run `./validate-deployment.sh` to verify deployment readiness.
EOF

# Create environment template
cat > "$DOWNLOAD_DIR/.env.example" << 'EOF'
# Lumen AI Environment Configuration
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# AI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Perplexity API for web search (if available)
PERPLEXITY_API_KEY=your_perplexity_key
EOF

# Calculate package size
PACKAGE_SIZE=$(du -sh "$DOWNLOAD_DIR" | cut -f1)

echo ""
echo "✅ Download package created successfully!"
echo ""
echo "📊 Package Details:"
echo "   • Location: ./$DOWNLOAD_DIR/"
echo "   • Size: $PACKAGE_SIZE"
echo "   • Files included:"
echo "     - Optimized production build (dist/)"
echo "     - Production package.json (minimal dependencies)"
echo "     - Docker configuration (Dockerfile, .dockerignore)"
echo "     - Deployment scripts and validation"
echo "     - Documentation and setup instructions"
echo ""
echo "🚀 Ready for deployment on any platform!"
echo "   • Local development: Run ./start.sh"
echo "   • Docker: Use provided Dockerfile"
echo "   • Cloud platforms: Deploy dist/ folder"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"