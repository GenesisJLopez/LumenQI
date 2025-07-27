#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Build optimization script for Lumen deployment
 * Optimizes assets and reduces bundle size
 */

async function optimizeBuild() {
  console.log('🚀 Starting build optimization...');
  
  // 1. Clean up large PNG files and replace with SVG
  const rootDir = path.dirname(__dirname);
  const attachedAssetsDir = path.join(rootDir, 'attached_assets');
  const distDir = path.join(rootDir, 'dist/public');
  
  // Remove large PNG screenshots from attached_assets
  if (fs.existsSync(attachedAssetsDir)) {
    const files = fs.readdirSync(attachedAssetsDir);
    let removedSize = 0;
    
    files.forEach(file => {
      if (file.includes('Screenshot') && file.endsWith('.png')) {
        const filePath = path.join(attachedAssetsDir, file);
        const stats = fs.statSync(filePath);
        removedSize += stats.size;
        fs.unlinkSync(filePath);
        console.log(`🗑️  Removed large screenshot: ${file} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
      }
    });
    
    if (removedSize > 0) {
      console.log(`✅ Removed ${(removedSize / 1024 / 1024).toFixed(2)}MB of screenshot files`);
    }
  }
  
  // 2. Optimize built assets
  if (fs.existsSync(distDir)) {
    const assetsDir = path.join(distDir, 'assets');
    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      
      files.forEach(file => {
        const filePath = path.join(assetsDir, file);
        const stats = fs.statSync(filePath);
        
        // Log large files
        if (stats.size > 500 * 1024) { // Files larger than 500KB
          console.log(`⚠️  Large asset found: ${file} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
        }
      });
    }
  }
  
  // 3. Create optimized package.json for production
  const packageJsonPath = path.join(rootDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Remove dev dependencies and unnecessary fields for smaller image
    const prodPackageJson = {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      main: packageJson.main,
      scripts: {
        start: packageJson.scripts.start,
        build: packageJson.scripts.build
      },
      dependencies: packageJson.dependencies,
      engines: packageJson.engines
    };
    
    const prodPackageJsonPath = path.join(rootDir, 'package-prod.json');
    fs.writeFileSync(prodPackageJsonPath, JSON.stringify(prodPackageJson, null, 2));
    console.log('📦 Created optimized package-prod.json');
  }
  
  console.log('✅ Build optimization completed!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  optimizeBuild().catch(console.error);
}

export { optimizeBuild };