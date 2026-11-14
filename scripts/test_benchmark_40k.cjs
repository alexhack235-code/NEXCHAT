const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

async function runBenchmark() {
  console.log('Testing Multilingual Dictionary & Modular Languages...');
  const langDir = path.join(__dirname, '..', 'src', 'js', 'languages');
  const files = fs.readdirSync(langDir).filter(f => f.endsWith('.js'));
  let totalEntries = 0;
  let totalLines = 0;
  console.log('Checking modular language files in src/js/languages/:');
  for (const f of files) {
    const content = fs.readFileSync(path.join(langDir, f), 'utf8');
    const lines = content.split('\n').length;
    totalLines += lines;
    console.log(`  - ${f.padEnd(25)} ${lines} lines`);
  }
  console.log(`Total modular language code lines: ${totalLines.toLocaleString()}`);

  // Dynamic import of ESM module
  const { fastTranslateSync } = await import('../src/js/fast-translator-core.js');

  const testCasesHit = [
    { text: 'hello', lang: 'ro', expected: 'salut' },
    { text: 'hello', lang: 'ur', expected: 'سلام' },
    { text: 'thank you', lang: 'id', expected: 'terima kasih' },
    { text: 'thank you', lang: 'ms', expected: 'terima kasih' },
    { text: 'good morning', lang: 'de', expected: 'Guten Morgen' },
    { text: 'hello', lang: 'es', expected: 'hola' },
    { text: 'where is the file', lang: 'ro', expected: 'unde este fișier' }
  ];

  console.log('Testing direct translation across requested modules:');
  for (const tc of testCasesHit) {
    const res = fastTranslateSync(tc.text, tc.lang);
    console.log(`  [${tc.lang.toUpperCase()}] "${tc.text}" => "${res}" (Expected: "${tc.expected}")`);
  }

  const testCasesMiss = [
    { text: 'Supercalifragilisticexpialidocious quantum entanglement', lang: 'es' },
    { text: 'This specific conversational string is definitely not in dictionary', lang: 'fr' },
    { text: 'Random hash ' + Math.random().toString(36), lang: 'de' }
  ];

  // Warmup
  for (let i = 0; i < 1000; i++) {
    fastTranslateSync('hello', 'es');
    fastTranslateSync('unmatched-random-token-xyz', 'es');
  }

  // 1. Benchmark Cache / Dictionary Hits
  const HIT_ITERATIONS = 50000;
  const startHit = performance.now();
  for (let i = 0; i < HIT_ITERATIONS; i++) {
    const tc = testCasesHit[i % testCasesHit.length];
    fastTranslateSync(tc.text, tc.lang);
  }
  const totalHitMs = performance.now() - startHit;
  const avgHitSec = (totalHitMs / HIT_ITERATIONS) / 1000;

  // 2. Benchmark Dictionary Miss / Fallback Decision Latency
  const MISS_ITERATIONS = 50000;
  const startMiss = performance.now();
  for (let i = 0; i < MISS_ITERATIONS; i++) {
    const tc = testCasesMiss[i % testCasesMiss.length];
    fastTranslateSync(tc.text, tc.lang);
  }
  const totalMissMs = performance.now() - startMiss;
  const avgMissSec = (totalMissMs / MISS_ITERATIONS) / 1000;

  console.log('----------------------------------------------------');
  console.log(`Average Dictionary HIT Latency:      ${avgHitSec.toFixed(8)} seconds (${(avgHitSec * 1000000).toFixed(2)} microseconds)`);
  console.log(`Average Dictionary MISS / Fallback:  ${avgMissSec.toFixed(8)} seconds (${(avgMissSec * 1000000).toFixed(2)} microseconds)`);
  console.log(`User Requirement Target:             <= 0.00010000 seconds (100 microseconds)`);
  console.log(`Target Met:                          ${avgMissSec <= 0.0001 ? 'YES (PASS - EXTREMELY FAST)' : 'NO'}`);
  console.log('----------------------------------------------------');
}

runBenchmark().catch(err => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
