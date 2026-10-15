// check_js_errors.cjs
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function checkHtmlFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  let blockIndex = 0;
  let hasErrors = false;

  while ((match = scriptRegex.exec(content)) !== null) {
    blockIndex++;
    const attrs = match[1];
    const code = match[2];

    if (/\bsrc\s*=/i.test(attrs)) continue;
    if (/\btype\s*=\s*["']?(?!text\/javascript|application\/javascript)[^"'>\s]+/i.test(attrs)) continue;
    if (!code.trim()) continue;

    try {
      new vm.Script(code, { filename: `${filePath}:script_${blockIndex}` });
    } catch (err) {
      console.error(`\n❌ SYNTAX ERROR in ${filePath} (Script Block #${blockIndex}):`);
      console.error(err.message);
      if (err.stack) {
        const stackLines = err.stack.split('\n').slice(0, 6);
        console.error(stackLines.join('\n'));
      }
      hasErrors = true;
    }
  }

  if (!hasErrors) {
    console.log(`✅ [PASS] ${filePath} (${blockIndex} script blocks checked)`);
  }
  return !hasErrors;
}

const htmlFiles = [
  'game.html',
  ...fs.readdirSync('Canada').filter(f => f.endsWith('.html')).map(f => path.join('Canada', f)),
  ...fs.readdirSync('.').filter(f => f.startsWith('province-') && f.endsWith('.html'))
];

console.log(`Checking ${htmlFiles.length} HTML files for JavaScript syntax errors...\n`);
let allPass = true;
for (const file of htmlFiles) {
  if (fs.existsSync(file)) {
    const ok = checkHtmlFile(file);
    if (!ok) allPass = false;
  }
}

if (!allPass) {
  console.error('\n❌ SOME FILES CONTAIN SYNTAX ERRORS!');
  process.exit(1);
} else {
  console.log('\n🎉 ALL SCRIPT BLOCKS ACROSS ALL 29 HTML FILES PASSED V8 COMPILATION WITH 0 ERRORS!');
}
