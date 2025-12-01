/**
 * PWA Icon Generator Script
 * 
 * This script generates placeholder PWA icons for development.
 * For production, replace these with actual branded icons.
 * 
 * Usage: node scripts/generate-pwa-icons.js
 * 
 * Requirements: Install sharp package
 * npm install --save-dev sharp
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
// eslint-disable-next-line no-redeclare
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-redeclare
const __dirname = path.dirname(__filename);

const iconsDir = path.join(__dirname, '../public/icons');
const splashDir = path.join(__dirname, '../public/splash');
const screenshotsDir = path.join(__dirname, '../public/screenshots');

// Create directories if they don't exist
[iconsDir, splashDir, screenshotsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Icon sizes
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Brand color
const brandColor = '#10b981'; // Emerald-500

// Generate a simple SVG icon
const generateSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${brandColor}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="white"/>
  <path d="M ${size/2 - size/6} ${size/2} L ${size/2} ${size/2 - size/6} L ${size/2 + size/6} ${size/2} Z" fill="${brandColor}"/>
</svg>
`;

// Generate icons
async function generateIcons() {
  // Check if sharp is available
  let sharp;
  try {
    const sharpModule = await import('sharp');
    sharp = sharpModule.default;
  } catch {
    console.log(' Sharp package not found. Install it with: npm install --save-dev sharp');
    console.log(' For now, you can use online tools to generate icons:');
    console.log('   - https://realfavicongenerator.net/');
    console.log('   - https://www.pwabuilder.com/imageGenerator');
    console.log('   - https://maskable.app/');
    process.exit(0);
  }
  console.log(' Generating PWA icons...');
  
  for (const size of iconSizes) {
    const svg = generateSVG(size);
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(Buffer.from(svg))
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(` Generated icon-${size}x${size}.png`);
    } catch (error) {
      console.error(` Error generating icon-${size}x${size}.png:`, error.message);
    }
  }
  
  // Generate shortcut icons
  const shortcutIcons = [
    { name: 'shortcut-booking.png', emoji: '📅' },
    { name: 'shortcut-dashboard.png', emoji: '📊' }
  ];
  
  for (const icon of shortcutIcons) {
    const svg = generateSVG(96);
    const outputPath = path.join(iconsDir, icon.name);
    
    try {
      await sharp(Buffer.from(svg))
        .resize(96, 96)
        .png()
        .toFile(outputPath);
      
      console.log(` Generated ${icon.name}`);
    } catch (error) {
      console.error(` Error generating ${icon.name}:`, error.message);
    }
  }
  
  console.log(' Icon generation complete!');
  console.log(' Note: These are placeholder icons. Replace with branded icons for production.');
}

// Run the generator
generateIcons().catch(console.error);
