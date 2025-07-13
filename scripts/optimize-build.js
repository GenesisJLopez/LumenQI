#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting build optimization...');

// Clean up large files from attached_assets before build
function cleanupAssets() {
  const assetsDir = path.join(__dirname, '..', 'attached_assets');
  
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    let totalSizeReduced = 0;
    
    files.forEach(file => {
      const filePath = path.join(assetsDir, file);
      const stats = fs.statSync(filePath);
      
      // Remove files larger than 5MB
      if (stats.size > 5 * 1024 * 1024) {
        console.log(`📦 Removing large file: ${file} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
        fs.unlinkSync(filePath);
        totalSizeReduced += stats.size;
      }
    });
    
    if (totalSizeReduced > 0) {
      console.log(`✅ Total size reduced: ${(totalSizeReduced / 1024 / 1024).toFixed(2)}MB`);
    }
  }
}

// Optimize SVG files
function optimizeSVGs() {
  const svgFiles = [];
  
  function findSVGs(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        findSVGs(filePath);
      } else if (file.endsWith('.svg')) {
        svgFiles.push(filePath);
      }
    });
  }
  
  findSVGs(path.join(__dirname, '..', 'client', 'src'));
  
  if (svgFiles.length > 0) {
    console.log(`🎨 Found ${svgFiles.length} SVG files to optimize`);
    // SVG optimization could be added here if needed
  }
}

// Run optimization
try {
  cleanupAssets();
  optimizeSVGs();
  
  console.log('✅ Build optimization completed successfully!');
} catch (error) {
  console.error('❌ Build optimization failed:', error.message);
  process.exit(1);
}