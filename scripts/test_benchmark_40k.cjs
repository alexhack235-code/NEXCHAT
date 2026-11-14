const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

async function runBenchmark() {
  console.log('Testing Multilingual Dictionary & Fallback Latency...');
  const dictPath = path.join(__dirname, '..', 'src', 'js', 'multilingual-dictionary.js');
  const fileContent = fs.readFileSync(dictPath, 'utf8');
  const lineCount = fileContent.split('\n').length;
  console.log(`Loaded dictionary lines: ${lineCount}`);

  // Dynamic import of ESM module
  const { fastTranslateSync } = await import('../src/js/fast-translator-core.js');

  const testCasesHit = [
    { text: 'hello', lang: 'es', expected: '¡Hola!' },
    { text: 'thank you', lang: 'fr', expected: 'Merci' },
    { text: 'good morning', lang: 'de', expected: 'Guten Morgen' },
    { text: 'how are you', lang: 'yo', expected: 'Bawo ni o se wa?' },
    { text: 'where is the file', lang: 'es', expected: '¿dónde está el archivo' }
  ];

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
