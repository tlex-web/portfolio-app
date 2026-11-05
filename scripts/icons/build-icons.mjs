#!/usr/bin/env node
/**
 * Builds the raster browser icons from app/icon.svg, the one source of the mark:
 * the summit's lit (firn-50) and shaded (glacier-400) faces on a night-950 ground.
 * Those colours are tokens.hex values in data/generated/tokens.ts; an SVG cannot
 * import them, so change them here and in the tokens together.
 *
 *   app/favicon.ico     16, 32 and 48 px, each stored as a PNG inside the ICO
 *   app/apple-icon.png  180 px, square and opaque: iOS applies its own mask
 *
 * Next.js writes the head links for all three from their file names. Run with
 * `npm run icons:build` after editing app/icon.svg, and commit the outputs.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SOURCE = new URL('../../app/icon.svg', import.meta.url);
const FAVICON = new URL('../../app/favicon.ico', import.meta.url);
const APPLE_ICON = new URL('../../app/apple-icon.png', import.meta.url);

const ICO_SIZES = [16, 32, 48];
const APPLE_SIZE = 180;
/** Rasterise well above the largest output, then downscale, so edges stay clean. */
const DENSITY = 600;

const ICO_HEADER_BYTES = 6;
const ICO_ENTRY_BYTES = 16;

function render(svg, size) {
  return sharp(Buffer.from(svg), { density: DENSITY }).resize(size, size);
}

/** An ICO that stores each size as a PNG, which every browser in support reads. */
function encodeIco(images) {
  const header = Buffer.alloc(ICO_HEADER_BYTES);
  header.writeUInt16LE(1, 2); // image type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = ICO_HEADER_BYTES + ICO_ENTRY_BYTES * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(ICO_ENTRY_BYTES);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}

const svg = await readFile(SOURCE, 'utf8');

const squareSvg = svg.replace(/ rx="[^"]*"/, '');
if (squareSvg === svg) {
  throw new Error('app/icon.svg: no rx on the ground rect, so the apple icon would keep its corners');
}

const images = await Promise.all(
  ICO_SIZES.map(async (size) => ({
    size,
    png: await render(svg, size).png({ compressionLevel: 9 }).toBuffer(),
  })),
);
await writeFile(FAVICON, encodeIco(images));

await render(squareSvg, APPLE_SIZE)
  .removeAlpha()
  .png({ compressionLevel: 9 })
  .toFile(fileURLToPath(APPLE_ICON));

console.log(`icons: wrote app/favicon.ico (${ICO_SIZES.join(', ')} px) and app/apple-icon.png (${APPLE_SIZE} px)`);
