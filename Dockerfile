# Multi-stage optimized Dockerfile for Cloud Run deployment
# Stage 1: Build stage (minimal)
FROM node:20-alpine AS builder

WORKDIR /tmp

# Copy package files for caching
COPY package-production.json package.json
COPY package-lock.json ./

# Install only production dependencies with maximum optimization
RUN npm ci --only=production --no-audit --no-fund --no-optional && \
    npm cache clean --force && \
    rm -rf ~/.npm /tmp/.npm

# Stage 2: Runtime stage (ultra-minimal)
FROM node:20-alpine AS runtime

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

WORKDIR /app

# Copy production dependencies from builder stage
COPY --from=builder /tmp/node_modules ./node_modules

# Copy pre-built application
COPY --chown=appuser:nodejs dist ./dist

# Switch to non-root user
USER appuser

# Configure environment for Cloud Run
ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

# Expose Cloud Run port
EXPOSE 8080

# Add health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/index.js"]