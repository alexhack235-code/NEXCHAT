import os
import re

patterns = [
    r'encrypted voice',
    r'voice.*encrypt',
    r'encrypt.*voice',
    r'quantum.*voice',
    r'voice.*scrambl',
    r'alien',
    r'modulat',
    r'robot',
    r'carrier.*freq',
    r'voice.*mask',
    r'stegano.*voice'
]

compiled = [re.compile(p, re.IGNORECASE) for p in patterns]

matches = []

for root, dirs, files in os.walk(r"c:\Users\USER\Desktop\NEXCHAT-main"):
    if any(x in root for x in ['node_modules', 'dist', '.git', '.gemini', 'android', 'chrome_test_profile']):
        continue
    for f in files:
        if f.endswith(('.js', '.html')):
            fpath = os.path.join(root, f)
            with open(fpath, 'r', encoding='utf-8', errors='ignore') as fp:
                for idx, line in enumerate(fp, 1):
                    for pat in compiled:
                        if pat.search(line):
                            rel = os.path.relpath(fpath, r"c:\Users\USER\Desktop\NEXCHAT-main")
                            matches.append((rel, idx, line.strip()))
                            break

print(f"Total matches: {len(matches)}")
for m in matches[:50]:
    print(f"{m[0]}:{m[1]}: {m[2][:120]}")
