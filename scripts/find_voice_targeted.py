import os
import re

target_dirs = [
    r"c:\Users\USER\Desktop\NEXCHAT-main",
    r"c:\Users\USER\Desktop\NEXCHAT-main\src",
    r"c:\Users\USER\Desktop\NEXCHAT-main\js",
    r"c:\Users\USER\Desktop\NEXCHAT-main\lib",
    r"c:\Users\USER\Desktop\NEXCHAT-main\api"
]

patterns = [
    r'alien',
    r'pitch',
    r'scramble',
    r'voice.*encrypt',
    r'encrypt.*voice',
    r'voice.*filter',
    r'voice.*mask',
    r'voice.*effect',
    r'playbackRate',
    r'createBiquadFilter',
    r'audioContext',
    r'mediaRecorder',
    r'recordAudio',
    r'voiceNote'
]
compiled = [re.compile(p, re.IGNORECASE) for p in patterns]

matches = []

for tdir in target_dirs:
    if not os.path.exists(tdir):
        continue
    for fname in os.listdir(tdir):
        fpath = os.path.join(tdir, fname)
        if os.path.isfile(fpath) and fname.endswith(('.js', '.html')):
            try:
                with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                    for idx, line in enumerate(f, 1):
                        for p in compiled:
                            if p.search(line):
                                matches.append((fpath, idx, line.strip()))
                                break
            except Exception:
                pass

print(f"Total matches in core code: {len(matches)}")
for m in matches:
    rel = os.path.relpath(m[0], r"c:\Users\USER\Desktop\NEXCHAT-main")
    print(f"{rel}:{m[1]}: {m[2][:120]}")
