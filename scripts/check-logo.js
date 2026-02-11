const sharp = require('sharp');

async function run() {
  try {
    const meta = await sharp('public/logo-primary.png').metadata();
    console.log(meta);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
