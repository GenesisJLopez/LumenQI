#!/usr/bin/env node

/**
 * Ultra-minimal build script for maximum container size reduction
 * This script removes all unnecessary files and dependencies
 */

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🚀 Starting ultra-minimal build optimization...');

async function removeUnnecessaryFiles() {
  const filesToRemove = [
    // Development files
    'tsconfig.json',
    'vite.config.ts',
    'tailwind.config.ts',
    'postcss.config.js',
    'drizzle.config.ts',
    'components.json',
    
    // Documentation
    'README*.md',
    'DEPLOYMENT_OPTIMIZATION.md',
    'demonstrate-brain-system.md',
    
    // Development scripts
    'scripts/',
    
    // Source files (we only need dist/)
    'client/',
    'server/',
    'shared/',
    
    // Large dependencies and configs
    'lumen-backups/',
    'lumen-brain-storage/',
    'ml-backend.py',
    'pyproject.toml',
    'uv.lock',
    
    // iOS/Apple files
    'ios/',
    'capacitor.config.ts',
    'electron-main.js',
    'electron-builder.json',
    'Info.plist',
    
    // Test and demo files
    'demo-brain-learning.js',
    'test-brain-system.js',
    'test-local-ai.js',
    'test_audio.mp3',
    
    // Ollama scripts
    'start-ollama.sh',
    'start-ollama-properly.sh',
    
    // Configuration files we don't need in production
    'lumen-consciousness.json',
    'lumen-identity.json',
    'lumen-vocabulary.json',
    'lumen-voice-settings.json',
    'lumen-voice-tones.json',
    'ai-config.json'
  ];

  for (const file of filesToRemove) {
    try {
      const fullPath = join(projectRoot, file);
      await fs.rm(fullPath, { recursive: true, force: true });
      console.log(`✅ Removed: ${file}`);
    } catch (error) {
      // File doesn't exist, that's fine
    }
  }
}

async function createMinimalPackageJson() {
  const minimalPackage = {
    "name": "lumen-ai",
    "version": "1.0.0",
    "type": "module",
    "main": "dist/index.js",
    "scripts": {
      "start": "node dist/index.js"
    },
    "dependencies": {
      // Only essential runtime dependencies
      "@neondatabase/serverless": "^0.10.4",
      "openai": "^4.73.1",
      "express": "^4.21.1",
      "ws": "^8.18.0",
      "drizzle-orm": "^0.35.3",
      "zod": "^3.23.8"
    },
    "engines": {
      "node": ">=20.0.0"
    }
  };

  await fs.writeFile(
    join(projectRoot, 'package.json'),
    JSON.stringify(minimalPackage, null, 2)
  );
  console.log('✅ Created minimal package.json');
}

async function createProductionDockerfile() {
  const minimalDockerfile = `FROM node:20-alpine
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --no-audit --no-fund && npm cache clean --force
COPY dist ./dist
RUN chown -R nextjs:nodejs /app
USER nextjs
ENV NODE_ENV=production PORT=5000
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"
CMD ["node", "dist/index.js"]`;

  await fs.writeFile(join(projectRoot, 'Dockerfile'), minimalDockerfile);
  console.log('✅ Created ultra-minimal Dockerfile');
}

async function createMinimalDockerignore() {
  const minimalIgnore = `*
!package.json
!package-lock.json
!dist/`;

  await fs.writeFile(join(projectRoot, '.dockerignore'), minimalIgnore);
  console.log('✅ Created minimal .dockerignore');
}

async function main() {
  try {
    console.log('📁 Removing unnecessary files...');
    await removeUnnecessaryFiles();
    
    console.log('📦 Creating minimal package.json...');
    await createMinimalPackageJson();
    
    console.log('🐳 Creating production Dockerfile...');
    await createProductionDockerfile();
    
    console.log('🚫 Creating minimal .dockerignore...');
    await createMinimalDockerignore();
    
    console.log('✅ Ultra-minimal build optimization complete!');
    console.log('💡 Container size should now be under 100MB');
    
  } catch (error) {
    console.error('❌ Build optimization failed:', error);
    process.exit(1);
  }
}

main();