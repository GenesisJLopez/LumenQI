#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Pre-deployment optimization...');

// Function to clean up large files before deployment
function cleanupForDeployment() {
  const targetDirs = [
    'attached_assets',
    'dist',
    'node_modules/.cache',
    '.cache',
    '.pythonlibs'
  ];
  
  let totalSizeReduced = 0;
  
  targetDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    
    if (fs.existsSync(dirPath)) {
      const stats = fs.statSync(dirPath);
      
      if (stats.isDirectory()) {
        // Calculate size before cleanup
        const sizeBefore = getDirSize(dirPath);
        
        // Clean up large files
        cleanupLargeFiles(dirPath);
        
        // Calculate size after cleanup
        const sizeAfter = getDirSize(dirPath);
        const sizeReduced = sizeBefore - sizeAfter;
        
        if (sizeReduced > 0) {
          console.log(`📦 Cleaned ${dir}: ${(sizeReduced / 1024 / 1024).toFixed(2)}MB reduced`);
          totalSizeReduced += sizeReduced;
        }
      }
    }
  });
  
  if (totalSizeReduced > 0) {
    console.log(`✅ Total deployment size reduced: ${(totalSizeReduced / 1024 / 1024).toFixed(2)}MB`);
  } else {
    console.log('✅ No large files found to clean up');
  }
}

// Function to get directory size
function getDirSize(dirPath) {
  let totalSize = 0;
  
  try {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += getDirSize(filePath);
      } else {
        totalSize += stats.size;
      }
    });
  } catch (error) {
    // Ignore errors for inaccessible directories
  }
  
  return totalSize;
}

// Function to clean up large files in a directory
function cleanupLargeFiles(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        // Recursively clean subdirectories
        cleanupLargeFiles(filePath);
      } else {
        // Remove files larger than 10MB
        if (stats.size > 10 * 1024 * 1024) {
          console.log(`🗑️  Removing large file: ${file} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
          fs.unlinkSync(filePath);
        }
      }
    });
  } catch (error) {
    // Ignore errors for inaccessible directories
  }
}

// Run pre-deployment cleanup
try {
  cleanupForDeployment();
  console.log('✅ Pre-deployment optimization completed successfully!');
} catch (error) {
  console.error('❌ Pre-deployment optimization failed:', error.message);
  process.exit(1);
}