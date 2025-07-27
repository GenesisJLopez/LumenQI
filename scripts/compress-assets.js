#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Asset compression script for deployment optimization
 * Compresses and optimizes assets for smaller bundle size
 */

async function compressAssets() {
  console.log('🗜️  Starting asset compression...');
  
  const rootDir = path.dirname(__dirname);
  const distDir = path.join(rootDir, 'dist/public');
  
  if (!fs.existsSync(distDir)) {
    console.log('⚠️  dist/public directory not found, skipping compression');
    return;
  }
  
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.log('⚠️  assets directory not found, skipping compression');
    return;
  }
  
  const files = fs.readdirSync(assetsDir);
  let totalSavings = 0;
  
  for (const file of files) {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    
    // Log large files
    if (stats.size > 100 * 1024) { // Files larger than 100KB
      console.log(`📊 Asset: ${file} - ${(stats.size / 1024).toFixed(1)}KB`);
    }
    
    // For JavaScript files, remove console.log statements if not already done
    if (file.endsWith('.js') && !file.includes('.min.')) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalSize = content.length;
        
        // Remove console.log statements (basic implementation)
        content = content.replace(/console\.log\([^)]*\);?/g, '');
        content = content.replace(/console\.warn\([^)]*\);?/g, '');
        content = content.replace(/console\.error\([^)]*\);?/g, '');
        
        if (content.length < originalSize) {
          fs.writeFileSync(filePath, content);
          const savedBytes = originalSize - content.length;
          totalSavings += savedBytes;
          console.log(`🗜️  Compressed ${file}: saved ${(savedBytes / 1024).toFixed(1)}KB`);
        }
      } catch (error) {
        console.log(`⚠️  Could not compress ${file}: ${error.message}`);
      }
    }
  }
  
  if (totalSavings > 0) {
    console.log(`✅ Total compression savings: ${(totalSavings / 1024).toFixed(1)}KB`);
  } else {
    console.log('ℹ️  No additional compression performed');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  compressAssets().catch(console.error);
}

export { compressAssets };