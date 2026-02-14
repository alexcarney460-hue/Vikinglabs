const sharp = require('sharp');

async function main() {
  const input = 'public/logo-primary-original.png';
  const output = 'public/logo-primary.png';
  const trimTop = 80; // increased trim to remove more of the glass cap

  try {
    const meta = await sharp(input).metadata();
    const height = meta.height ?? 0;
    const width = meta.width ?? 0;

    if (!height || !width) {
      throw new Error('Could not read logo dimensions.');
    }

    const newHeight = height - trimTop;
    if (newHeight <= 0) {
      throw new Error('Trim amount exceeds logo height.');
    }

    await sharp(input)
      .extract({ left: 0, top: trimTop, width, height: newHeight })
      .toFile(output);

    console.log(`Trimmed ${trimTop}px from top. New size: ${width}x${newHeight}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
