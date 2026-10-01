// Normalize the imagegen cutout into the platform icon assets.
// Usage: node scripts/prepare-app-icons.cjs tile-cutout.png emblem-mask.png
const fs = require('node:fs');
const path = require('node:path');
const Jimp = require('jimp-compact');
const { PNG } = require('pngjs');

const output = path.join(__dirname, '../assets/images');
const [tilePath, emblemPath] = process.argv.slice(2);
if (!tilePath || !emblemPath) throw new Error('Provide the tile cutout and emblem mask.');

async function save(image, name) {
  // Jimp's alpha compositing can round a fully opaque result down to 254.
  // Store and iOS launcher assets must remain fully opaque.
  if (['icon.png', 'ios-icon-light.png', 'ios-icon-dark.png', 'ios-icon-tinted.png', 'android-icon-background.png'].includes(name)) {
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, index) {
      this.bitmap.data[index + 3] = 255;
    });
  }
  await image.writeAsync(path.join(output, name));
}

function centered(image, size, canvasSize = 1024, background = 0x00000000) {
  const resized = image.clone().contain(size, size, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE, Jimp.RESIZE_BICUBIC);
  return new Jimp(canvasSize, canvasSize, background).composite(resized, Math.round((canvasSize - size) / 2), Math.round((canvasSize - size) / 2));
}

async function main() {
  const tile = await Jimp.read(tilePath);
  if (tile.bitmap.width !== 1254 || tile.bitmap.height !== 1254) {
    throw new Error('The traced tile perimeter expects the inspected 1254×1254 master.');
  }
  // The inspected tile occupies this rounded rectangle. Trace its contour rather
  // than retaining the generated alpha flecks or cropping the supplied backdrop.
  const bounds = { x: 140, y: 138, width: 974, height: 986, radius: 248 };
  tile.scan(0, 0, tile.bitmap.width, tile.bitmap.height, function (x, y, index) {
    const qx = Math.abs(x + 0.5 - (bounds.x + bounds.width / 2)) - (bounds.width / 2 - bounds.radius);
    const qy = Math.abs(y + 0.5 - (bounds.y + bounds.height / 2)) - (bounds.height / 2 - bounds.radius);
    const distance = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - bounds.radius;
    this.bitmap.data[index + 3] = Math.round(this.bitmap.data[index + 3] * Math.max(0, Math.min(1, 0.5 - distance)));
  });
  tile.crop(bounds.x, bounds.y, bounds.width, bounds.height);
  const master = centered(tile, 1024);
  await save(master, 'icon-cutout.png');
  await save(master, 'splash-icon.png');
  const light = centered(tile, 1024, 1024, 0xd6e0e8ff);
  await save(light, 'icon.png');
  await save(light, 'ios-icon-light.png');
  await save(light, 'ios-icon-dark.png');
  await save(centered(tile, 64, 64), 'favicon.png');

  // Keep the rounded tile within the circular safe zone, including its bevel.
  await save(centered(tile, 516), 'android-icon-foreground.png');
  await save(new Jimp(1024, 1024, 0xd6e0e8ff), 'android-icon-background.png');

  const emblem = await Jimp.read(emblemPath);
  emblem.autocrop();
  // Normalize the monochrome layer to a true silhouette, retaining edge alpha.
  emblem.scan(0, 0, emblem.bitmap.width, emblem.bitmap.height, function (x, y, index) {
    this.bitmap.data[index] = this.bitmap.data[index + 1] = this.bitmap.data[index + 2] = 0;
  });
  await save(centered(emblem, 512), 'android-icon-monochrome.png');
  const tintedEmblem = emblem.clone();
  tintedEmblem.scan(0, 0, tintedEmblem.bitmap.width, tintedEmblem.bitmap.height, function (x, y, index) {
    this.bitmap.data[index] = this.bitmap.data[index + 1] = this.bitmap.data[index + 2] = 220;
  });
  await save(centered(tintedEmblem, 800, 1024, 0x242424ff), 'ios-icon-tinted.png');

  // One review sheet: transparency, opaque launcher, adaptive circle, themed icon,
  // and the two actual small display sizes.
  const sheet = new Jimp(960, 360, 0xe8edf1ff);
  const adaptive = centered(tile, 516, 1024, 0xd6e0e8ff).crop(171, 171, 682, 682).circle();
  const themed = centered(emblem, 512, 1024, 0xd6e0e8ff).crop(171, 171, 682, 682).circle();
  for (const [index, image] of [master, light, adaptive, themed].entries()) {
    sheet.composite(image.clone().resize(210, 210, Jimp.RESIZE_BICUBIC), 20 + index * 235, 20);
  }
  sheet.composite(master.clone().resize(56, 56, Jimp.RESIZE_BICUBIC), 30, 265);
  sheet.composite(master.clone().resize(32, 32, Jimp.RESIZE_BICUBIC), 115, 277);
  await save(sheet, 'icon-preview.png');

  for (const name of ['icon.png', 'icon-cutout.png', 'splash-icon.png', 'ios-icon-light.png', 'ios-icon-dark.png', 'ios-icon-tinted.png', 'android-icon-foreground.png', 'android-icon-background.png', 'android-icon-monochrome.png', 'favicon.png']) {
    const png = PNG.sync.read(fs.readFileSync(path.join(output, name)));
    console.log(`${name}: ${png.width}×${png.height}`);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
