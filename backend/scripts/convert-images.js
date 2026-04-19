const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sitesDir = 'd:/projects/campsite-fyp/frontend/public/images/sites';

async function convert() {
    const files = fs.readdirSync(sitesDir);
    for (const file of files) {
        if (file.endsWith('.jpg')) {
            const filePath = path.join(sitesDir, file);
            const tempPath = filePath + '.tmp';
            console.log(`Converting ${file}...`);
            try {
                // Read the file (which is currently a PNG masquerading as a JPG)
                // and save it as a real JPEG
                await sharp(filePath)
                    .jpeg({ quality: 85 })
                    .toFile(tempPath);
                
                // Replace the original
                fs.unlinkSync(filePath);
                fs.renameSync(tempPath, filePath);
                console.log(`Successfully converted ${file}`);
            } catch (err) {
                console.error(`Error converting ${file}:`, err);
            }
        }
    }
}

convert();
