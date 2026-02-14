const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function main() {
  const src = path.join(__dirname, '../public/hero-vials.jpg');
  if (!fs.existsSync(src)) {
    throw new Error(`Source hero image not found at ${src}`);
  }

  const outputs = [
    { file: path.join(__dirname, '../public/assets/hero/hero-desktop.webp'), width: 1400, height: 900, format: 'webp' },
    { file: path.join(__dirname, '../public/assets/hero/hero-mobile.webp'), width: 900, height: 900, format: 'webp' },
    { file: path.join(__dirname, '../public/assets/hero/hero-desktop.jpg'), width: 1400, height: 900, format: 'jpeg' },
    { file: path.join(__dirname, '../public/assets/hero/hero-mobile.jpg'), width: 900, height: 900, format: 'jpeg' },
  ];

  for (const out of outputs) {
    fs.mkdirSync(path.dirname(out.file), { recursive: true });
    const pipeline = sharp(src)
      .resize(out.width, out.height, {
        fit: 'cover',
        position: 'center'
      })
      .withMetadata();

    if (out.format === 'webp') {
      pipeline.webp({ quality: 82 });
    } else {
      pipeline.jpeg({ quality: 88 });
    }

    await pipeline.toFile(out.file);
    console.log(`Created ${path.relative(process.cwd(), out.file)} (${out.width}x${out.height})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
