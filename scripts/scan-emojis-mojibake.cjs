const fs = require('fs');
const path = require('path');

const EMOJI_REGEX = /[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{200D}\u{FE0E}\u{FE0F}]/u;
const MOJIBAKE_REGEX = /(?:â~|â€™|âœ…|âœ•|â Œ|âš |ðŸ|ï¸|Ã[^\s]|Â[^\s])/;

const IGNORE_DIRS = new Set(['.git', 'node_modules', 'dist', '.vite', '.system_generated']);
const BINARY_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.mp4', '.mp3', '.wav', '.webp', '.pdf', '.woff', '.woff2', '.ttf', '.eot']);

const matches = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        scanDir(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!BINARY_EXTS.has(ext)) {
        scanFile(fullPath);
      }
    }
  }
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const hasEmoji = EMOJI_REGEX.test(line);
      const hasMojibake = MOJIBAKE_REGEX.test(line);
      if (hasEmoji || hasMojibake) {
        matches.push({
          file: path.relative(path.join(__dirname, '..'), filePath),
          line: idx + 1,
          type: hasEmoji && hasMojibake ? 'EMOJI+MOJIBAKE' : (hasEmoji ? 'EMOJI' : 'MOJIBAKE'),
          content: line.trim()
        });
      }
    });
  } catch (err) {
    // Ignore unreadable
  }
}

scanDir(path.join(__dirname, '..'));

console.log(`Scan completed. Found ${matches.length} lines with emoji or mojibake.`);
const filesSummary = {};
matches.forEach(m => {
  filesSummary[m.file] = (filesSummary[m.file] || 0) + 1;
});

console.log('\nAffected files:');
Object.entries(filesSummary).forEach(([f, count]) => {
  console.log(` - ${f} (${count} lines)`);
});

fs.writeFileSync(path.join(__dirname, 'scan-report.json'), JSON.stringify(matches, null, 2));
