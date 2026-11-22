const fs = require('fs');
const path = require('path');
const set = new Set();
function scan(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'Builds', '.vercel'].includes(f)) scan(full);
    } else if (f.endsWith('.js') || f.endsWith('.html')) {
      const c = fs.readFileSync(full, 'utf8');
      const reg = /(?:collection\s*\(\s*\w+\s*,\s*|\.collection\s*\(\s*)['"]([a-zA-Z0-9_-]+)['"]/g;
      let m;
      while ((m = reg.exec(c)) !== null) {
        set.add(m[1]);
      }
    }
  }
}
scan('.');
console.log('ACTIVE COLLECTIONS COUNT:', set.size);
console.log(Array.from(set).sort().join('\n'));
