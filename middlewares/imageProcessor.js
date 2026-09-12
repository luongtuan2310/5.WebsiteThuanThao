const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const UPLOAD_BASE = path.join(__dirname, '../public/uploads');

// Config per image type
const imageConfig = {
  banners: {
    full: { width: 1920, height: 700, quality: 85 },
    thumb: { width: 800, height: 300, quality: 80 }
  },
  packages: {
    full: { width: 800, height: 600, quality: 80 },
    thumb: { width: 400, height: 300, quality: 80 }
  },
  doctors: {
    full: { width: 600, height: 800, quality: 80 },
    thumb: { width: 300, height: 400, quality: 80 }
  },
  specialties: {
    full: { width: 600, height: 400, quality: 80 },
    thumb: { width: 300, height: 200, quality: 80 }
  },
  avatars: {
    full: { width: 400, height: 400, quality: 85 },
    thumb: { width: 150, height: 150, quality: 80 }
  },
  news: {
    full: { width: 1200, height: 630, quality: 82 },
    thumb: { width: 400, height: 210, quality: 82 }
  }
};

async function processImage(tmpFilePath, type, filename) {
  const config = imageConfig[type] || imageConfig.packages;
  const baseName = path.parse(filename).name;
  const outputDir = path.join(UPLOAD_BASE, type);

  // Ensure output dir exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fullPath = path.join(outputDir, `${baseName}.webp`);
  const thumbPath = path.join(outputDir, `${baseName}_thumb.webp`);

  // Process full image
  if (type === 'packages') {
    // Keep 100% full original dimensions and aspect ratio (up to 2560px max width for long tables/tall infographics)
    await sharp(tmpFilePath)
      .resize({ width: 2560, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toFile(fullPath);
  } else {
    await sharp(tmpFilePath)
      .resize(config.full.width, config.full.height, {
        fit: 'cover',
        position: 'centre'
      })
      .webp({ quality: config.full.quality })
      .toFile(fullPath);
  }

  // Process thumbnail
  if (type === 'packages') {
    await sharp(tmpFilePath)
      .resize({ width: 600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(thumbPath);
  } else {
    await sharp(tmpFilePath)
      .resize(config.thumb.width, config.thumb.height, {
        fit: 'cover',
        position: 'centre'
      })
      .webp({ quality: config.thumb.quality })
      .toFile(thumbPath);
  }

  // Delete temp file
  fs.unlink(tmpFilePath, () => {});

  return {
    full: `/uploads/${type}/${baseName}.webp`,
    thumb: `/uploads/${type}/${baseName}_thumb.webp`
  };
}

module.exports = { processImage };
