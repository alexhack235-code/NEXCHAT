# NEXCHAT Local Autonomous Code Healer & Fixer

The **Local Autonomous Code Healer** is a self-repair and code-fixing engine running directly on your workstation. It analyzes your codebase, identifies runtime exceptions, syntax errors, and logic traps, and synthesizes, tests, and writes verified code patches directly to your files using Gemini and Groq AI models.

---

## Features

- **Offline-First / Local Execution**: Runs directly on your machine via Node.js—no cloud deploy needed.
- **Dual AI Engine**: Uses Google Gemini (`gemini-2.5-flash`, `gemini-2.0-flash`) with automatic fallback to rotating Groq LPU models (`llama-3.3-70b-versatile`).
- **Pre-Execution AST Validation**: Fixes are checked in-memory via Node `vm.Script` syntax parsing before any file is touched.
- **Zero Data Loss & Safe Rollback**: Automatically creates a timestamped `.bak` snapshot in `code-healer/.backups/` before applying modifications.
- **Scan & Repair Workflows**: Scan the whole repository or target individual files with natural language instructions.

---

## Quick Start

### 1. Run Directory Scan
Scans your source files for syntax issues, unhandled rejections, and missing guards:
```bash
npm run heal:scan
# Or:
node code-healer/index.js --scan
```

### 2. Auto-Repair a Specific File
Diagnoses and repairs errors in a file directly:
```bash
node code-healer/index.js path/to/file.js
# Or:
npm run heal -- path/to/file.js
```

### 3. Natural Language Directed Repair
Instruct the AI to fix a specific bug or refactor code:
```bash
node code-healer/index.js --prompt "Add defensive null guards to user session access" auth.js
```

### 4. Dry Run (Preview without writing)
```bash
node code-healer/index.js --dry-run path/to/file.js
```

### 5. Rollback Changes
If you ever want to revert a healed file to its state before the fix:
```bash
node code-healer/index.js --rollback path/to/file.js
```

---

## Architecture

```
[Local File] 
     │
     ▼
[Stage 1: Analyzer] ──> Extracts AST syntax trees, unhandled promises, and syntax bugs
     │
     ▼
[Stage 2: AI Synthesis] ──> Queries Gemini / Groq with targeted fix prompts
     │
     ▼
[Stage 3: AST Safety Gate] ──> Validates code syntax in isolated in-memory VM
     │
     ├──> [PASS] ──> Snapshots backup (.bak) & writes patch to disk
     └──> [FAIL] ──> Rejects invalid code and aborts modification
```
