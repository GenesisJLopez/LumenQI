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
