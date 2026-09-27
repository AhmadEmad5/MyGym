import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

function createPng(width, height, drawFn) {
  // RGBA buffer: height rows, each with 1 filter byte (0) + width * 4 bytes
  const rowStride = 1 + width * 4;
  const raw = Buffer.alloc(height * rowStride);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    raw[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = a;
    }
  }

  const idatData = zlib.deflateSync(raw);

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crc ^ buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace (none)

  const ihdr = chunk('IHDR', ihdrData);
  const idat = chunk('IDAT', idatData);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

function gymIconDrawer(x, y, w, h) {
  // Normalize coords to 0..1
  const nx = x / w;
  const ny = y / h;

  // Rounded rectangle background (radius ~ 22%)
  const r = 0.22;
  const cx = Math.min(Math.max(nx, r), 1 - r);
  const cy = Math.min(Math.max(ny, r), 1 - r);
  const dist = Math.hypot(nx - cx, ny - cy);

  if (dist > r) {
    return [0, 0, 0, 0]; // transparent
  }

  // Dark modern slate background gradient
  const bgR = Math.round(15 + 10 * ny);
  const bgG = Math.round(23 + 12 * ny);
  const bgB = Math.round(42 + 20 * ny);

  // Draw Barbell:
  // Central bar: ny between 0.47 and 0.53, nx between 0.28 and 0.72
  if (ny >= 0.47 && ny <= 0.53 && nx >= 0.28 && nx <= 0.72) {
    // Bar gradient (cyan to purple)
    const t = (nx - 0.28) / (0.72 - 0.28);
    const cr = Math.round(67 * (1 - t) + 133 * t);
    const cg = Math.round(220 * (1 - t) + 92 * t);
    const cb = Math.round(255);
    return [cr, cg, cb, 255];
  }

  // Inner big plates: nx in [0.26, 0.34], ny in [0.28, 0.72] and nx in [0.66, 0.74]
  const inPlate1 = (nx >= 0.26 && nx <= 0.34 && ny >= 0.28 && ny <= 0.72);
  const inPlate2 = (nx >= 0.66 && nx <= 0.74 && ny >= 0.28 && ny <= 0.72);
  if (inPlate1 || inPlate2) {
    return [67, 220, 255, 255]; // bright cyan
  }

  // Outer small plates: nx in [0.17, 0.23], ny in [0.36, 0.64] and nx in [0.77, 0.83]
  const inOuter1 = (nx >= 0.17 && nx <= 0.23 && ny >= 0.36 && ny <= 0.64);
  const inOuter2 = (nx >= 0.77 && nx <= 0.83 && ny >= 0.36 && ny <= 0.64);
  if (inOuter1 || inOuter2) {
    return [133, 92, 255, 255]; // neon purple
  }

  // Bar collars: nx in [0.345, 0.365] and [0.635, 0.655], ny in [0.44, 0.56]
  const inCollar1 = (nx >= 0.345 && nx <= 0.365 && ny >= 0.44 && ny <= 0.56);
  const inCollar2 = (nx >= 0.635 && nx <= 0.655 && ny >= 0.44 && ny <= 0.56);
  if (inCollar1 || inCollar2) {
    return [255, 255, 255, 220];
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve('public');
const pwa192 = createPng(192, 192, gymIconDrawer);
const pwa512 = createPng(512, 512, gymIconDrawer);
const appleIcon = createPng(180, 180, gymIconDrawer);

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);

console.log('Successfully generated pwa-192x192.png, pwa-512x512.png, and apple-touch-icon.png in /public');
