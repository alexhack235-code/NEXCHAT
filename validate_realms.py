# -*- coding: utf-8 -*-
"""
validate_realms.py
Validates bracket balance, script tags, colliders, and integrity across
game.html and all 14 province realm pages using a robust JS lexer.
"""

import glob
import re
import sys

def strip_js_literals_and_comments(code):
    out = []
    i = 0
    n = len(code)
    in_single = False
    in_double = False
    in_backtick = False
    in_line_comment = False
    in_block_comment = False

    while i < n:
        ch = code[i]
        nxt = code[i+1] if i + 1 < n else ''

        if in_line_comment:
            if ch == '\n':
                in_line_comment = False
                out.append(ch)
            i += 1
            continue
        if in_block_comment:
            if ch == '*' and nxt == '/':
                in_block_comment = False
                i += 2
            else:
                if ch == '\n':
                    out.append(ch)
                i += 1
            continue
        if in_single:
            if ch == '\\':
                i += 2
                continue
            elif ch == "'":
                in_single = False
            i += 1
            continue
        if in_double:
            if ch == '\\':
                i += 2
                continue
            elif ch == '"':
                in_double = False
            i += 1
            continue
        if in_backtick:
            if ch == '\\':
                i += 2
                continue
            elif ch == '`':
                in_backtick = False
            i += 1
            continue

        if ch == '/' and nxt == '/':
            in_line_comment = True
            i += 2
            continue
        if ch == '/' and nxt == '*':
            in_block_comment = True
            i += 2
            continue
        if ch == "'":
            in_single = True
            i += 1
            continue
        if ch == '"':
            in_double = True
            i += 1
            continue
        if ch == '`':
            in_backtick = True
            i += 1
            continue

        out.append(ch)
        i += 1

    return ''.join(out)


def check_brackets(js_code):
    cleaned = strip_js_literals_and_comments(js_code)
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    lines = cleaned.split('\n')
    for line_num, line in enumerate(lines, 1):
        for ch in line:
            if ch in '([{':
                stack.append((ch, line_num))
            elif ch in ')]}':
                if not stack:
                    return False, f"Unexpected closing '{ch}' at line {line_num}"
                top, top_line = stack.pop()
                if pairs[ch] != top:
                    return False, f"Mismatched bracket '{ch}' at line {line_num}, expected match for '{top}' from line {top_line}"

    if stack:
        top, top_line = stack.pop()
        return False, f"Unclosed bracket '{top}' opened at line {top_line}"
    return True, "All brackets balanced"


def validate_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract all script tags
    scripts = re.findall(r'<script\b[^>]*>(.*?)</script>', content, flags=re.DOTALL | re.IGNORECASE)
    for idx, s in enumerate(scripts):
        if not s.strip():
            continue
        ok, msg = check_brackets(s)
        if not ok:
            return False, f"Script block {idx+1}: {msg}"

    # Check colliders and regional scenery in realm files
    if 'province-' in filepath:
        coll_match = re.search(r'const WORLD_COLLIDERS = \[(.*?)\];', content, re.DOTALL)
        if not coll_match:
            return False, "Missing WORLD_COLLIDERS"
        entries = re.findall(r'\{\s*x:\s*([-\d\.]+),\s*z:\s*([-\d\.]+),\s*r:\s*([-\d\.]+)\s*\}', coll_match.group(1))
        if len(entries) < 7:
            return False, f"Suspiciously few colliders: {len(entries)}"

        if 'buildRegionalEnvironment' not in content:
            return False, "Missing buildRegionalEnvironment function"

    return True, f"Verified OK ({len(entries) if 'province-' in filepath else 'Metropolis'} colliders)"


def main():
    files = sorted(glob.glob('province-*.html')) + ['game.html']
    all_ok = True
    print(f"Validating {len(files)} files...")
    for f in files:
        ok, msg = validate_file(f)
        status = "PASS" if ok else "FAIL"
        print(f"[{status}] {f:35} - {msg}")
        if not ok:
            all_ok = False

    if not all_ok:
        sys.exit(1)
    print("\nALL 15 FILES (CENTRAL METROPOLIS + 14 PROVINCES) PASSED SYNTAX & STRUCTURE VALIDATION!")

if __name__ == '__main__':
    main()
