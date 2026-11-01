import os
import re

patterns = [
    r'\balien\b',
    r'\b(pitch|modulat|scrambl)\b',
    r'voice.*encrypt',
    r'encrypt.*voice',
    r'voice.*filter',
    r'voice.*mask',
    r'voice.*note',
    r'recordVoice',
    r'voiceRecord',
    r'voice_note',
    r'audioContext',
    r'createBiquadFilter',
    r'playbackRate',
    r'audio.*decrypt'
]

compiled = [re.compile(p, re.IGNORECASE) for p in patterns]

matches = []
skip_dirs = {'android', 'node_modules', 'dist', '.git', '.gemini', 'dist-apk', 'build'}

for root, dirs, files in os.walk(r"c:\Users\USER\Desktop\NEXCHAT-main"):
    dirs[:] = [d for d in dirs if d not in skip_dirs]
    for file in files:
        if file.endswith(('.js', '.html', '.ts')):
            fpath = os.path.join(root, file)
            try:
                with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                    lines = f.readlines()
                for i, line in enumerate(lines, 1):
                    for pat in compiled:
                        if pat.search(line):
                            matches.append((fpath, i, line.strip()))
                            break
            except Exception:
                pass

print(f"Total matches found: {len(matches)}")
for m in matches:
    rel = os.path.relpath(m[0], r"c:\Users\USER\Desktop\NEXCHAT-main")
    print(f"{rel}:{m[1]}: {m[2][:120]}")
