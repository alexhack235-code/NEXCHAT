const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="purpleHex" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9333EA" />
      <stop offset="50%" stop-color="#7C3AED" />
      <stop offset="100%" stop-color="#581C87" />
    </linearGradient>
    <linearGradient id="glowBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C084FC" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#6B21A8" stop-opacity="0.6" />
    </linearGradient>
    <linearGradient id="nGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#EDE9FE" />
    </linearGradient>
    <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Background Hexagon -->
  <polygon 
    points="256,36 446,146 446,366 256,476 66,366 66,146" 
    fill="url(#purpleHex)" 
    stroke="url(#glowBorder)" 
    stroke-width="12" 
    stroke-linejoin="round"
    filter="url(#subtleShadow)"
  />

  <!-- High-Tech Inner Rim -->
  <polygon 
    points="256,56 428,155 428,357 256,456 84,357 84,155" 
    fill="none" 
    stroke="#A855F7" 
    stroke-width="2" 
    stroke-opacity="0.4" 
    stroke-linejoin="round"
  />

  <!-- Bold Geometric 'N' Symbol -->
  <path 
    d="M 166,144 L 216,144 L 216,280 L 298,144 L 348,144 L 348,368 L 298,368 L 298,230 L 216,368 L 166,368 Z" 
    fill="url(#nGrad)" 
    filter="url(#subtleShadow)"
  />
</svg>`;

async function generateFavicons() {
  const dirs = [
    path.join(__dirname, '..', 'public', 'favicons'),
    path.join(__dirname, '..', 'favicons'),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const svgBuffer = Buffer.from(svgLogo);

  // Save SVG
  dirs.forEach(d => fs.writeFileSync(path.join(d, 'logo.svg'), svgLogo));
  dirs.forEach(d => fs.writeFileSync(path.join(d, 'nex-logo.svg'), svgLogo));

  // Generate 512x512 PNG
  const png512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();
  dirs.forEach(d => fs.writeFileSync(path.join(d, 'icon-512.png'), png512));

  // Generate 192x192 PNG
  const png192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
  dirs.forEach(d => fs.writeFileSync(path.join(d, 'icon-192.png'), png192));

  // Generate 180x180 apple-touch-icon.png
  const apple180 = await sharp(svgBuffer).resize(180, 180).png().toBuffer();
  dirs.forEach(d => fs.writeFileSync(path.join(d, 'apple-touch-icon.png'), apple180));

  // Generate 32x32 PNG
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  dirs.forEach(d => fs.writeFileSync(path.join(d, 'favicon-32.png'), png32));

  // Generate standard ICO file embedding 32x32 PNG
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // 1 image

  const icoEntry = Buffer.alloc(16);
  icoEntry.writeUInt8(32, 0); // Width 32
  icoEntry.writeUInt8(32, 1); // Height 32
  icoEntry.writeUInt8(0, 2);  // Colors
  icoEntry.writeUInt8(0, 3);  // Reserved
  icoEntry.writeUInt16LE(1, 4); // Color planes
  icoEntry.writeUInt16LE(32, 6); // Bits per pixel
  icoEntry.writeUInt32LE(png32.length, 8); // PNG size
  icoEntry.writeUInt32LE(22, 12); // Offset (6 + 16 = 22)

  const icoBuffer = Buffer.concat([icoHeader, icoEntry, png32]);
  dirs.forEach(d => fs.writeFileSync(path.join(d, 'favicon.ico'), icoBuffer));

  // Also write to root favicon.ico and public/favicon.ico
  fs.writeFileSync(path.join(__dirname, '..', 'favicon.ico'), icoBuffer);
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

  console.log('[FAVICON SYSTEM] Successfully generated:');
  console.log(' - logo.svg');
  console.log(' - favicon.ico (32x32)');
  console.log(' - icon-192.png (192x192)');
  console.log(' - icon-512.png (512x512)');
  console.log(' - apple-touch-icon.png (180x180)');
}

generateFavicons().catch(err => {
  console.error('[FAVICON GENERATION ERROR]:', err);
  process.exit(1);
});
