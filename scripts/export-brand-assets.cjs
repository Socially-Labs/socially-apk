// Reproducible format conversion and vector tracing of the EXISTING logo.
// No image generation, app dependencies, or launcher assets are changed.
// Tool setup and invocation: assets/images/branding/exports/README.md
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const sharp = require('sharp');
const { Potrace } = require('potrace');
const { Resvg } = require('@resvg/resvg-js');

const images = path.resolve(__dirname, '../assets/images');
const output = path.join(images, 'branding/exports');
const write = (name, data) => fs.writeFileSync(path.join(output, name), data);
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');
const trace = (buffer, options = {}) => new Promise((resolve, reject) => {
  const tracer = new Potrace({ turdSize: 2, optTolerance: 0.15, ...options });
  tracer.loadImage(buffer, (error) => error ? reject(error) : resolve(tracer));
});
const svgDocument = (title, description, body) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1024" height="1024" viewBox="0 0 1024 1024" role="img" aria-labelledby="title description">
<title id="title">${title}</title>
<desc id="description">${description}</desc>
${body}
</svg>\n`;
const exactSvg = (bytes, title) => svgDocument(title,
  'Exact original PNG embedded losslessly in a self-contained SVG. This preserves the source image; it is not editable vector geometry.',
  `<image width="1024" height="1024" xlink:href="data:image/png;base64,${bytes.toString('base64')}"/>`);

async function vectorize(source) {
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  assert.equal(width, 1024);
  assert.equal(height, 1024);
  const gray = Buffer.alloc(width * height);
  const alpha = Buffer.alloc(width * height);
  const bins = Array.from({ length: 256 }, () => ({ count: 0, sum: [0, 0, 0] }));
  for (let pixel = 0; pixel < width * height; pixel++) {
    const i = pixel * 4;
    const level = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
    gray[pixel] = data[i + 3] > 0 ? level : 255;
    // The cutout has very dark RGB values in partially transparent perimeter
    // pixels. Extending those colors into overlapping traced contours creates
    // a false dark outline. Continue the nearest interior shade to the edge;
    // the separately traced alpha mask supplies its antialiasing.
    if (data[i + 3] > 0 && data[i + 3] < 250) {
      const x = pixel % width, y = Math.floor(pixel / width);
      const dx = width / 2 - x, dy = height / 2 - y;
      const distance = Math.hypot(dx, dy);
      for (let step = 1; step < distance; step++) {
        const sampleX = Math.round(x + dx * step / distance);
        const sampleY = Math.round(y + dy * step / distance);
        const sample = (sampleY * width + sampleX) * 4;
        if (data[sample + 3] >= 250) {
          gray[pixel] = Math.round((data[sample] + data[sample + 1] + data[sample + 2]) / 3);
          break;
        }
      }
    }
    alpha[pixel] = 255 - data[i + 3];
    if (data[i + 3] > 240) {
      bins[level].count++;
      for (let c = 0; c < 3; c++) bins[level].sum[c] += data[i + c];
    }
  }
  const raw = { width, height, channels: 1 };
  // A subpixel blur avoids tracing single-pixel texture noise as hard corners.
  const colors = await trace(await sharp(gray, { raw }).blur(0.4).png().toBuffer());
  const silhouette = await trace(await sharp(alpha, { raw }).png().toBuffer(), {
    turdSize: 0, optTolerance: 0.1,
  });
  const mask = [];
  for (let low = 1; low <= 249; low += 8) {
    silhouette.setParameters({ threshold: 255 - low });
    const value = (low === 249 ? 253 : low + 3).toString(16).padStart(2, '0');
    mask.push(silhouette.getPathTag(`#${value}${value}${value}`));
  }
  const layers = [];
  for (let high = 255; high >= 0; high -= 2) {
    let count = 0;
    const sum = [0, 0, 0];
    for (let k = Math.max(0, high - 1); k <= high; k++) {
      count += bins[k].count;
      for (let c = 0; c < 3; c++) sum[c] += bins[k].sum[c];
    }
    if (!count) continue;
    const color = '#' + sum.map((v) => Math.round(v / count).toString(16).padStart(2, '0')).join('');
    colors.setParameters({ threshold: high, color });
    layers.push(`<g id="shade-${high}">${colors.getPathTag(color)}</g>`);
  }
  const body = `<defs><mask id="tile-alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">${mask.join('\n')}</mask></defs>
<g mask="url(#tile-alpha)">${layers.join('\n')}</g>`;
  return svgDocument('Socially — silver-blue pirate logo',
    'Pure vector contours traced directly from splash-icon.png. The pirate, three candlesticks, and rounded tile retain their source positions. Sampled shading and antialiased contours approximate the raster texture; this is not pixel-identical. No embedded bitmap, external resources, or fonts.', body);
}

async function monochromeSvg() {
  const { data, info } = await sharp(path.join(images, 'android-icon-monochrome.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const mask = Buffer.alloc(info.width * info.height);
  for (let p = 0; p < mask.length; p++) mask[p] = 255 - data[p * 4 + 3];
  const tracer = await trace(await sharp(mask, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer(), {
    threshold: 128, turdSize: 2, optTolerance: 0.1,
  });
  return svgDocument('Socially — monochrome emblem',
    'Compact editable silhouette traced from the existing Android monochrome asset. Retains its 1024-square adaptive-icon placement.',
    tracer.getPathTag('currentColor'));
}

async function ico(source) {
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const frames = [];
  for (const size of sizes) {
    const scaled = sharp(source).resize(size, size, { kernel: 'lanczos3' });
    if (size > 48) {
      frames.push(await scaled.png().toBuffer());
      continue;
    }
    // Classic 32-bit bottom-up DIB + 1-bit AND mask for smaller Windows icons.
    const rgba = await scaled.ensureAlpha().raw().toBuffer();
    const stride = Math.ceil(size / 32) * 4;
    const dib = Buffer.alloc(40 + size * size * 4 + stride * size);
    dib.writeUInt32LE(40, 0);
    dib.writeInt32LE(size, 4);
    dib.writeInt32LE(size * 2, 8);
    dib.writeUInt16LE(1, 12);
    dib.writeUInt16LE(32, 14);
    dib.writeUInt32LE(size * size * 4 + stride * size, 20);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const from = (y * size + x) * 4;
      const to = 40 + ((size - 1 - y) * size + x) * 4;
      dib[to] = rgba[from + 2]; dib[to + 1] = rgba[from + 1];
      dib[to + 2] = rgba[from]; dib[to + 3] = rgba[from + 3];
      if (!rgba[from + 3]) dib[40 + size * size * 4 + (size - 1 - y) * stride + (x >> 3)] |= 128 >> (x % 8);
    }
    frames.push(dib);
  }
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, i) => {
    const p = 6 + i * 16;
    header[p] = header[p + 1] = size === 256 ? 0 : size;
    header.writeUInt16LE(1, p + 4); header.writeUInt16LE(32, p + 6);
    header.writeUInt32LE(frames[i].length, p + 8); header.writeUInt32LE(offset, p + 12);
    offset += frames[i].length;
  });
  return Buffer.concat([header, ...frames]);
}

function comparison(source, candidate, background = 255) {
  let absolute = 0, squared = 0, max = 0;
  const pixels = source.length / 4;
  for (let p = 0; p < pixels; p++) for (let c = 0; c < 3; c++) {
    const i = p * 4;
    const s = source[i + c] * source[i + 3] / 255 + background * (1 - source[i + 3] / 255);
    const v = candidate[i + c] * candidate[i + 3] / 255 + background * (1 - candidate[i + 3] / 255);
    const error = Math.abs(s - v);
    absolute += error; squared += error * error; max = Math.max(max, error);
  }
  const rmse = Math.sqrt(squared / (pixels * 3));
  return { meanAbsoluteChannelError: absolute / (pixels * 3), rmse, maxChannelError: max, psnrDb: rmse ? 20 * Math.log10(255 / rmse) : null };
}

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const source = fs.readFileSync(path.join(images, 'splash-icon.png'));
  const adaptive = fs.readFileSync(path.join(images, 'android-icon-foreground.png'));
  const original = await sharp(source).ensureAlpha().raw().toBuffer();
  write('logo.png', source);
  write('logo-exact.svg', exactSvg(source, 'Socially — exact original logo'));
  write('android-foreground-exact.svg', exactSvg(adaptive, 'Socially — exact Android foreground'));
  const vector = await vectorize(source);
  assert(!/<image\b|data:image/.test(vector));
  write('logo.svg', vector);
  write('logo.svgz', zlib.gzipSync(vector, { level: 9 }));
  const vectorRender = new Resvg(vector).render().asPng();
  write('logo-vector-preview.png', vectorRender);
  write('emblem-monochrome.svg', await monochromeSvg());
  await sharp(source).webp({ lossless: true, effort: 6 }).toFile(path.join(output, 'logo.webp'));
  await sharp(source).avif({ lossless: true, chromaSubsampling: '4:4:4', effort: 6 }).toFile(path.join(output, 'logo.avif'));
  await sharp(source).flatten({ background: '#D6E0E8' }).jpeg({ quality: 100, chromaSubsampling: '4:4:4' }).toFile(path.join(output, 'logo.jpeg'));
  write('favicon.ico', await ico(source));
  for (const size of [16, 32, 48]) await sharp(source).resize(size).png().toFile(path.join(output, `favicon-${size}.png`));
  for (const [name, size] of [['apple-touch-icon', 180], ['icon-192', 192], ['icon-512', 512]]) {
    await sharp(source).flatten({ background: '#D6E0E8' }).resize(size).png().toFile(path.join(output, `${name}.png`));
  }
  fs.copyFileSync(path.join(images, 'icon.png'), path.join(output, 'app-icon-1024.png'));
  // Keep an exact copy for the preview and verify all lossless representations.
  assert.equal(sha256(fs.readFileSync(path.join(output, 'logo.png'))), sha256(source));
  const encoded = fs.readFileSync(path.join(output, 'logo-exact.svg'), 'utf8').match(/base64,([^\"]+)/)[1];
  assert.equal(sha256(Buffer.from(encoded, 'base64')), sha256(source));
  const rendered = await sharp(vectorRender).ensureAlpha().raw().toBuffer();
  const metrics = {
    source: '../../splash-icon.png', sourceSha256: sha256(source),
    tools: { sharp: sharp.versions.sharp, potrace: require('potrace/package.json').version, resvg: require('@resvg/resvg-js/package.json').version },
    exactPngBytesMatch: true, exactSvgEmbeddedPngBytesMatch: true,
    vectorContainsBitmap: false,
    vectorComparison: { description: '1024×1024 resvg render versus source, RGB composited on white / black. Channel range 0–255. This is an approximation, not a pixel-perfect claim.', white: comparison(original, rendered), black: comparison(original, rendered, 0) },
    losslessFormats: {},
  };
  for (const name of ['logo.webp', 'logo.avif']) {
    const decoded = await sharp(path.join(output, name)).ensureAlpha().raw().toBuffer();
    const result = comparison(original, decoded);
    metrics.losslessFormats[name] = result;
    assert(result.maxChannelError < 0.000001, `${name} differs in visible source pixels`);
  }
  assert(metrics.vectorComparison.white.rmse < 5, 'Vector fidelity regressed');
  assert.equal(sha256(fs.readFileSync(path.join(images, 'splash-icon.png'))), sha256(source));
  write('fidelity-report.json', JSON.stringify(metrics, null, 2) + '\n');
  console.log(JSON.stringify(metrics, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
