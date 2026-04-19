const sharp = require('sharp');
const mapPath = 'd:/projects/campsite-fyp/frontend/public/images/map.png';

async function check() {
    try {
        const metadata = await sharp(mapPath).metadata();
        console.log(`DIMENSIONS: ${metadata.width}x${metadata.height}`);
    } catch (err) {
        console.error(err);
    }
}

check();
