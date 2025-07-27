# Ultra-minimal production Dockerfile for maximum size reduction
FROM node:20-alpine

# Create app user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

WORKDIR /app

# Copy only essential production files
COPY package-production.json package.json
COPY package-lock.json ./

# Install only production dependencies with minimal cache
RUN npm ci --only=production --no-audit --no-fund && npm cache clean --force

# Copy pre-built application
COPY dist ./dist

# Set proper ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Configure environment
ENV NODE_ENV=production PORT=5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/index.js"]