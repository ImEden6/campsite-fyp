#!/usr/bin/env node

/**
 * Production Build Verification Script
 * Verifies that dev dependencies are excluded from production builds
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// eslint-disable-next-line no-redeclare
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-redeclare
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '..', 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');
const ASSETS_JS_DIR = path.join(ASSETS_DIR, 'js');

// Dev dependencies that should NEVER be in production builds
const DEV_DEPENDENCIES = [
  '@vite/client',
  '@react-refresh',
  '@vitejs/plugin-react',
  '/@vite/',
  '/@react-refresh',
  'vite/client',
  'react-refresh',
];

// Patterns that indicate dev code
const DEV_PATTERNS = [
  /@vite\/client/,
  /@react-refresh/,
  /react-refresh/,
  /vite\/client/,
  /__DEV__/,
  /process\.env\.NODE_ENV.*development/,
];

/**
 * Read file and check for dev dependencies
 */
function checkFileForDevDeps(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];

  DEV_PATTERNS.forEach((pattern) => {
    if (pattern.test(content)) {
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          pattern: pattern.toString(),
          matches: matches.slice(0, 3), // Show first 3 matches
        });
      }
    }
  });

  // Check for dev dependency strings
  DEV_DEPENDENCIES.forEach((dep) => {
    if (content.includes(dep)) {
      issues.push({
        dependency: dep,
        found: true,
      });
    }
  });

  return issues;
}

/**
 * Get all JavaScript files in dist
 */
function getAllJsFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Ensure React isn't split into a dedicated chunk (prevents circular deps)
 */
function findIsolatedReactChunks() {
  if (!fs.existsSync(ASSETS_JS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(ASSETS_JS_DIR)
    .filter((file) => /^react-vendor-/.test(file));
}

/**
 * Verify production build
 */
function verifyProductionBuild() {
  console.log('🔍 Verifying production build...\n');

  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Build directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  const jsFiles = getAllJsFiles(ASSETS_DIR);
  const issues = [];
  const fileIssues = new Map();
  const isolatedReactChunks = findIsolatedReactChunks();

  console.log(`Checking ${jsFiles.length} JavaScript files...\n`);

  if (isolatedReactChunks.length > 0) {
    const message = `Found isolated React chunk(s): ${isolatedReactChunks.join(', ')}`;
    fileIssues.set('assets/js', [
      {
        customMessage: `${message}. Please keep React in the main vendor chunk to avoid runtime crashes.`,
      },
    ]);
    issues.push({ customMessage: message });
  }

  jsFiles.forEach((file) => {
    const relativePath = path.relative(DIST_DIR, file);
    const fileIssuesList = checkFileForDevDeps(file);

    if (fileIssuesList.length > 0) {
      fileIssues.set(relativePath, fileIssuesList);
      issues.push(...fileIssuesList);
    }
  });

  // Print results
  console.log('='.repeat(80));
  console.log('PRODUCTION BUILD VERIFICATION');
  console.log('='.repeat(80));
  console.log();

  if (issues.length === 0) {
    console.log('✅ No dev dependencies found in production build!');
    console.log('✅ All files are production-ready.\n');
    process.exit(0);
  } else {
    console.log(`❌ Found ${issues.length} issue(s) in ${fileIssues.size} file(s):\n`);

    fileIssues.forEach((fileIssuesList, filePath) => {
      console.log(`📄 ${filePath}:`);
      fileIssuesList.forEach((issue) => {
        if (issue.dependency) {
          console.log(`   ❌ Dev dependency found: ${issue.dependency}`);
        } else if (issue.pattern) {
          console.log(`   ❌ Dev pattern matched: ${issue.pattern}`);
          if (issue.matches) {
            console.log(`      Matches: ${issue.matches.join(', ')}`);
          }
        } else if (issue.customMessage) {
          console.log(`   ❌ ${issue.customMessage}`);
        }
      });
      console.log();
    });

    console.log('='.repeat(80));
    console.log('❌ Production build verification FAILED');
    console.log('='.repeat(80));
    console.log();
    console.log('These dev dependencies should not be in production builds.');
    console.log('Check your vite.config.ts and ensure mode === "production"');
    console.log();
    process.exit(1);
  }
}

// Run verification
verifyProductionBuild();

