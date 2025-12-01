#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 * Analyzes the production build and reports bundle sizes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';

// eslint-disable-next-line no-redeclare
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-redeclare
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '..', 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');

// Size thresholds (in bytes)
const THRESHOLDS = {
  js: {
    warning: 250 * 1024, // 250 KB
    error: 500 * 1024,   // 500 KB
  },
  css: {
    warning: 50 * 1024,  // 50 KB
    error: 100 * 1024,   // 100 KB
  },
  total: {
    warning: 1 * 1024 * 1024,   // 1 MB
    error: 2 * 1024 * 1024,     // 2 MB
  },
};

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file size with gzip compression
 */
function getGzipSize(filePath) {
  const content = fs.readFileSync(filePath);
  const gzipped = gzipSync(content);
  return gzipped.length;
}

/**
 * Get all files in directory recursively
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Analyze bundle
 */
function analyzeBundle() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Build directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  console.log('📊 Analyzing bundle...\n');

  const files = getAllFiles(ASSETS_DIR);
  
  const jsFiles = files.filter((f) => f.endsWith('.js'));
  const cssFiles = files.filter((f) => f.endsWith('.css'));
  
  let totalJsSize = 0;
  let totalJsGzipSize = 0;
  let totalCssSize = 0;
  let totalCssGzipSize = 0;
  
  const jsStats = [];
  const cssStats = [];

  // Analyze JS files
  jsFiles.forEach((file) => {
    const stat = fs.statSync(file);
    const size = stat.size;
    const gzipSize = getGzipSize(file);
    const name = path.relative(ASSETS_DIR, file);
    
    totalJsSize += size;
    totalJsGzipSize += gzipSize;
    
    jsStats.push({ name, size, gzipSize });
  });

  // Analyze CSS files
  cssFiles.forEach((file) => {
    const stat = fs.statSync(file);
    const size = stat.size;
    const gzipSize = getGzipSize(file);
    const name = path.relative(ASSETS_DIR, file);
    
    totalCssSize += size;
    totalCssGzipSize += gzipSize;
    
    cssStats.push({ name, size, gzipSize });
  });

  // Sort by size
  jsStats.sort((a, b) => b.gzipSize - a.gzipSize);
  cssStats.sort((a, b) => b.gzipSize - a.gzipSize);

  // Print summary
  console.log('='.repeat(80));
  console.log('BUNDLE SIZE SUMMARY');
  console.log('='.repeat(80));
  console.log();
  
  console.log('JavaScript:');
  console.log(`  Raw:    ${formatBytes(totalJsSize)}`);
  console.log(`  Gzipped: ${formatBytes(totalJsGzipSize)}`);
  console.log();
  
  console.log('CSS:');
  console.log(`  Raw:    ${formatBytes(totalCssSize)}`);
  console.log(`  Gzipped: ${formatBytes(totalCssGzipSize)}`);
  console.log();
  
  const totalSize = totalJsSize + totalCssSize;
  const totalGzipSize = totalJsGzipSize + totalCssGzipSize;
  
  console.log('Total:');
  console.log(`  Raw:    ${formatBytes(totalSize)}`);
  console.log(`  Gzipped: ${formatBytes(totalGzipSize)}`);
  console.log();

  // Print largest files
  console.log('='.repeat(80));
  console.log('LARGEST JAVASCRIPT FILES (Top 10)');
  console.log('='.repeat(80));
  console.log();
  
  jsStats.slice(0, 10).forEach((file, i) => {
    const status = file.gzipSize > THRESHOLDS.js.error ? '❌' :
                   file.gzipSize > THRESHOLDS.js.warning ? '⚠️' : '✅';
    console.log(`${i + 1}. ${status} ${file.name}`);
    console.log(`   Raw: ${formatBytes(file.size)} | Gzipped: ${formatBytes(file.gzipSize)}`);
    console.log();
  });

  if (cssStats.length > 0) {
    console.log('='.repeat(80));
    console.log('LARGEST CSS FILES');
    console.log('='.repeat(80));
    console.log();
    
    cssStats.forEach((file, i) => {
      const status = file.gzipSize > THRESHOLDS.css.error ? '❌' :
                     file.gzipSize > THRESHOLDS.css.warning ? '⚠️' : '✅';
      console.log(`${i + 1}. ${status} ${file.name}`);
      console.log(`   Raw: ${formatBytes(file.size)} | Gzipped: ${formatBytes(file.gzipSize)}`);
      console.log();
    });
  }

  // Check thresholds
  console.log('='.repeat(80));
  console.log('THRESHOLD CHECKS');
  console.log('='.repeat(80));
  console.log();

  let hasErrors = false;
  let hasWarnings = false;

  if (totalGzipSize > THRESHOLDS.total.error) {
    console.log(`❌ Total bundle size (${formatBytes(totalGzipSize)}) exceeds error threshold (${formatBytes(THRESHOLDS.total.error)})`);
    hasErrors = true;
  } else if (totalGzipSize > THRESHOLDS.total.warning) {
    console.log(`⚠️  Total bundle size (${formatBytes(totalGzipSize)}) exceeds warning threshold (${formatBytes(THRESHOLDS.total.warning)})`);
    hasWarnings = true;
  } else {
    console.log(`✅ Total bundle size (${formatBytes(totalGzipSize)}) is within limits`);
  }

  const largeJsFiles = jsStats.filter((f) => f.gzipSize > THRESHOLDS.js.error);
  if (largeJsFiles.length > 0) {
    console.log(`❌ ${largeJsFiles.length} JavaScript file(s) exceed error threshold`);
    hasErrors = true;
  }

  const warningJsFiles = jsStats.filter(
    (f) => f.gzipSize > THRESHOLDS.js.warning && f.gzipSize <= THRESHOLDS.js.error
  );
  if (warningJsFiles.length > 0) {
    console.log(`⚠️  ${warningJsFiles.length} JavaScript file(s) exceed warning threshold`);
    hasWarnings = true;
  }

  console.log();

  // Exit with appropriate code
  if (hasErrors) {
    console.log('❌ Bundle analysis failed with errors');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Bundle analysis completed with warnings');
    process.exit(0);
  } else {
    console.log('✅ Bundle analysis passed');
    process.exit(0);
  }
}

// Run analysis
analyzeBundle();
