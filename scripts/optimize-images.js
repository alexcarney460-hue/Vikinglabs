const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public');
const outDir = path.join(publicDir, 'optimized');
const widths = [320, 640, 1024, 1600];
const quality = 75;

function isImage(file) {
  return /\.(png|jpe?g|webp|avif)$/i.test(file);
}

function walk(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const full = path.join(dir, it.name);
    if (it.isDirectory()) {
      files.push(...walk(full));
    } else if (it.isFile() && isImage(it.name)) {
      files.push(full);
    }
  }
  return files;
}

(async () => {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const imgs = walk(publicDir).filter(p => !p.includes(path.join('public','optimized')));
  console.log('Found', imgs.length, 'images');
  for (const img of imgs) {
    try {
      const rel = path.relative(publicDir, img);
      const parsed = path.parse(rel);
      const targetDir = path.join(outDir, parsed.dir);
      fs.mkdirSync(targetDir, { recursive: true });
      const input = img;
      const baseName = parsed.name;
      for (const w of widths) {
        const webpOut = path.join(targetDir, `${baseName}-${w}.webp`);
        const avifOut = path.join(targetDir, `${baseName}-${w}.avif`);
        await sharp(input)
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality })
          .toFile(webpOut);
        await sharp(input)
          .resize({ width: w, withoutEnlargement: true })
          .avif({ quality })
          .toFile(avifOut);
      }
      // also create a small placeholder (20px width) webp
      const placeholder = path.join(targetDir, `${baseName}-placeholder.webp`);
      await sharp(input).resize({ width: 20 }).webp({ quality: 40 }).toFile(placeholder);
      console.log('Optimized', rel);
    } catch (e) {
      console.error('Error optimizing', img, e.message);
    }
  }
  console.log('Done');
})();
