import os
import re

patterns = [
    r'encrypted voice',
    r'voice.*encrypt',
    r'encrypt.*voice',
    r'alien',
    r'robot',
    r'voice.*mask',
    r'stegano.*voice'
]

compiled = [re.compile(p, re.IGNORECASE) for p in patterns]
matches = []

skip = {'node_modules', 'dist', 'android', 'Library', 'Builds', 'Canada', 'Packages', 'ProjectSettings', 'UserSettings'}

for root, dirs, files in os.walk(r"c:\Users\USER\Desktop\NEXCHAT-main"):
    dirs[:] = [d for d in dirs if not d.startswith('.') and not d.startswith('chrome') and d not in skip]
    for f in files:
        if f.endswith(('.js', '.html')):
            fpath = os.path.join(root, f)
            try:
                with open(fpath, 'r', encoding='utf-8', errors='ignore') as fp:
                    for idx, line in enumerate(fp, 1):
                        for pat in compiled:
                            if pat.search(line):
                                rel = os.path.relpath(fpath, r"c:\Users\USER\Desktop\NEXCHAT-main")
                                matches.append((rel, idx, line.strip()))
                                break
            except Exception:
                pass

print(f"Total matches: {len(matches)}")
with open(r"c:\Users\USER\Desktop\NEXCHAT-main\scripts\search_results.txt", "w", encoding="utf-8") as out:
    for m in matches:
        out.write(f"{m[0]}:{m[1]}: {m[2]}\n")

for m in matches[:25]:
    print(f"{m[0]}:{m[1]}: {m[2][:120]}")
