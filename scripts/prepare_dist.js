import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copy root static folders
const folders = ['public', 'assets', 'src', 'favicons', 'js', 'css', 'styles', 'Builds', 'Canada'];
for (const folder of folders) {
  const srcPath = path.resolve(folder);
  if (fs.existsSync(srcPath)) {
    if (folder === 'public') {
      // Copy contents of public directly into dist
      for (const child of fs.readdirSync(srcPath)) {
        copyRecursive(path.join(srcPath, child), path.join(distDir, child));
      }
    } else {
      copyRecursive(srcPath, path.join(distDir, folder));
    }
    console.log(`[prepare_dist.js] Synced folder: ${folder}`);
  }
}

// Copy root web files (e.g. gaminghub.js, sw.js) missed by Vite bundler
const rootFileExtensions = ['.js', '.css', '.json', '.svg', '.ico', '.png', '.jpg', '.webp', '.html'];
const rootFiles = fs.readdirSync('.').filter(file => {
  const ext = path.extname(file).toLowerCase();
  return rootFileExtensions.includes(ext) && !file.startsWith('.') && file !== 'vite.config.js';
});

for (const file of rootFiles) {
  const destPath = path.join(distDir, file);
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(path.resolve(file), destPath);
    console.log(`[prepare_dist.js] Synced root asset: ${file}`);
  }
}

console.log('[prepare_dist.js] Successfully prepared dist output.');
