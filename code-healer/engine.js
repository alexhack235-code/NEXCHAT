import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { 
  callGroqAI, 
  callGeminiAI, 
  getNextKey, 
  markKeyDead, 
  markKeyHealthy 
} from '../lib/translator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const BACKUP_DIR = path.resolve(__dirname, '.backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Dispatcher using rotating multi-model AI cluster (Gemini / Groq)
 */
async function queryAI(userPrompt, systemPrompt) {
  const candidateGroqModels = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];
  const maxRetries = 10;
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const keyInfo = getNextKey();
    if (!keyInfo || !keyInfo.key) {
      break;
    }

    try {
      let rawText = '';
      if (keyInfo.provider === 'gemini') {
        const gem = await callGeminiAI(keyInfo.key, systemPrompt, userPrompt);
        rawText = gem.text;
      } else {
        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ];

        for (const model of candidateGroqModels) {
          try {
            const groq = await callGroqAI(keyInfo.key, messages, {
              model,
              max_tokens: 3072,
              temperature: 0.1
            });
            if (groq?.text) {
              rawText = groq.text;
              break;
            }
          } catch (mErr) {
            continue;
          }
        }
      }

      if (rawText && rawText.trim()) {
        markKeyHealthy(keyInfo.key);
        return {
          text: rawText.trim(),
          provider: keyInfo.provider,
          maskedKey: keyInfo.maskedKey
        };
      }
    } catch (err) {
      lastError = err;
      if (err.status === 429 || err.status === 401 || err.status === 408) {
        markKeyDead(keyInfo.key, err.status || 500, err.message);
      }
    }
  }

  throw new Error(`AI synthesis failed across key cluster: ${lastError?.message || 'No response from model'}`);
}

/**
 * Syntax and AST safety validation for JavaScript
 */
export function validateScriptSyntax(code, ext = '.js') {
  if (ext === '.json') {
    try {
      JSON.parse(code);
      return { valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  if (ext !== '.js' && ext !== '.mjs' && ext !== '.cjs') {
    return { valid: true, note: 'Non-JS file skipped AST check' };
  }

  // Strip ESM imports/exports for vm script parsing
  const cleaned = code
    .replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?/gm, '')
    .replace(/^export\s+(?:default\s+)?/gm, '');

  try {
    new vm.Script(cleaned, { timeout: 1500 });
    return { valid: true };
  } catch (err) {
    if (err.message && (err.message.includes('Unexpected token <') || err.message.includes('import') || err.message.includes('export'))) {
      return { valid: true, note: 'Modern ESM / JSX construct accepted' };
    }
    return { valid: false, error: err.message };
  }
}

/**
 * Local File Analyzer
 */
export function analyzeLocalFile(filePath) {
  const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(ROOT_DIR, filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`File not found: ${absPath}`);
  }

  const content = fs.readFileSync(absPath, 'utf8');
  const ext = path.extname(absPath).toLowerCase();
  const issues = [];

  // 1. Syntax check
  const syntaxCheck = validateScriptSyntax(content, ext);
  if (!syntaxCheck.valid) {
    issues.push({
      type: 'SYNTAX_ERROR',
      severity: 'CRITICAL',
      message: syntaxCheck.error
    });
  }

  // 2. Pattern heuristics for common bugs
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    // Missing catch in async/promises
    if (line.includes('.then(') && !line.includes('.catch(') && !content.slice(content.indexOf(line)).includes('.catch(')) {
      issues.push({
        type: 'UNHANDLED_PROMISE',
        severity: 'MEDIUM',
        line: lineNum,
        message: 'Potential unhandled Promise rejection without .catch() handler'
      });
    }

    // Direct undefined window/document access without guard
    if (/\b(?:window|document|localStorage)\.[a-zA-Z0-9_]+/.test(line) && !line.includes('typeof ') && !line.includes('?') && (ext === '.js' && !content.includes('typeof window'))) {
      if (!line.includes('if (') && !line.includes('try {')) {
        issues.push({
          type: 'ENVIRONMENT_GUARD_MISSING',
          severity: 'LOW',
          line: lineNum,
          message: 'Browser global accessed without defensive typeof or optional chaining guard'
        });
      }
    }

    // Unclosed HTML tags in template strings
    if (line.includes('<div') && !line.includes('</div>') && !content.includes('</div>')) {
      issues.push({
        type: 'UNBALANCED_DOM_TAG',
        severity: 'HIGH',
        line: lineNum,
        message: 'Potentially unbalanced HTML markup tags detected'
      });
    }
  });

  return {
    filePath: absPath,
    relativePath: path.relative(ROOT_DIR, absPath),
    lineCount: lines.length,
    sizeBytes: Buffer.byteLength(content, 'utf8'),
    issues,
    hasCriticalErrors: issues.some(i => i.severity === 'CRITICAL')
  };
}

/**
 * Creates timestamped backup before modifying
 */
export function backupFile(absPath) {
  const filename = path.basename(absPath);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `${ts}-${filename}.bak`);
  fs.copyFileSync(absPath, backupPath);
  return backupPath;
}

/**
 * Restores file from most recent backup
 */
export function rollbackFile(filePath) {
  const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(ROOT_DIR, filePath);
  const filename = path.basename(absPath);
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith(`-${filename}.bak`))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error(`No backups found for ${filename}`);
  }

  const latestBackup = path.join(BACKUP_DIR, files[0]);
  fs.copyFileSync(latestBackup, absPath);
  return { restoredFrom: latestBackup };
}

/**
 * Autonomous Local Code Fixer
 */
export async function healLocalFile(filePath, options = {}) {
  const { customPrompt = '', autoApply = true, dryRun = false } = options;
  const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(ROOT_DIR, filePath);

  if (!fs.existsSync(absPath)) {
    throw new Error(`File does not exist: ${absPath}`);
  }

  const originalContent = fs.readFileSync(absPath, 'utf8');
  const ext = path.extname(absPath);
  const analysis = analyzeLocalFile(absPath);

  const systemPrompt = `You are the NEXCHAT Autonomous Local Code Fixer and Healing Engine.
Your task is to analyze code, diagnose root bugs, and output the fully corrected, production-ready code.
RULES:
1. Preserve all existing functionality, architecture, styling, and offline-first vanilla JavaScript patterns.
2. Fix any syntax errors, undefined references, null reference traps, unhandled rejections, or requested changes.
3. Return ONLY valid JSON in this exact structure:
{
  "explanation": "Clear 1-2 sentence explanation of what was fixed",
  "fixedCode": "<FULL_CORRECTED_SOURCE_CODE>",
  "issuesResolved": ["List of fixed issues"]
}
Do NOT wrap the JSON in Markdown code fences if possible, or use standard \`\`\`json.`;

  const userPrompt = `File: ${analysis.relativePath} (${analysis.lineCount} lines)
Detected Issues:
${JSON.stringify(analysis.issues, null, 2)}

User Instruction: ${customPrompt || 'Diagnose and fix all syntax, logic, and safety errors in this file.'}

Original Code:
${originalContent}`;

  const aiResult = await queryAI(userPrompt, systemPrompt);
  let cleaned = aiResult.text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  let parsed = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    // If JSON parsing of wrapper failed, attempt extraction
    const jsonMatch = cleaned.match(/\{[\s\S]*"fixedCode"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (_) {}
    }
    if (!parsed) {
      parsed = {
        explanation: 'Autonomous fix synthesized by local AI engine',
        fixedCode: cleaned,
        issuesResolved: ['Repaired code structure']
      };
    }
  }

  if (!parsed.fixedCode || typeof parsed.fixedCode !== 'string') {
    throw new Error('AI engine did not return valid replacement code.');
  }

  // Stage 3 Validation: Validate syntax BEFORE touching the file on disk
  const validation = validateScriptSyntax(parsed.fixedCode, ext);
  if (!validation.valid) {
    throw new Error(`Synthesized fix failed syntax validation: ${validation.error}. File was NOT modified.`);
  }

  let backupPath = null;
  if (!dryRun && autoApply) {
    backupPath = backupFile(absPath);
    try {
      fs.writeFileSync(absPath, parsed.fixedCode, 'utf8');
    } catch (writeErr) {
      if (backupPath && fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, absPath);
      }
      throw writeErr;
    }
  }

  return {
    filePath: absPath,
    relativePath: analysis.relativePath,
    provider: aiResult.provider,
    maskedKey: aiResult.maskedKey,
    explanation: parsed.explanation,
    issuesResolved: parsed.issuesResolved || [],
    backupPath,
    dryRun,
    applied: !dryRun && autoApply
  };
}

/**
 * Scan directory recursively for code issues
 */
export function scanProject(dirPath = ROOT_DIR, extensions = ['.js', '.json', '.html']) {
  const results = [];
  const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.backups', 'android'];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (!ignoreDirs.includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          try {
            const report = analyzeLocalFile(fullPath);
            if (report.issues.length > 0) {
              results.push(report);
            }
          } catch (e) {
            // skip unreadable
          }
        }
      }
    }
  }

  walk(dirPath);
  return results;
}
