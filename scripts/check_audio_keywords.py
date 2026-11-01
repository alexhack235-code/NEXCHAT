import os
import re
import sys

# Search files
files_to_check = []
for root, dirs, files in os.walk(r"c:\Users\USER\Desktop\NEXCHAT-main\src\js"):
    for f in files:
        if f.endswith('.js'):
            files_to_check.append(os.path.join(root, f))

files_to_check.append(r"c:\Users\USER\Desktop\NEXCHAT-main\chat.js")
files_to_check.append(r"c:\Users\USER\Desktop\NEXCHAT-main\voice-call.js")

target_words = ['alien', 'pitch', 'voice.*filter', 'voice.*effect', 'voice.*mask', 'scramble', 'encryptAudio', 'decryptAudio', 'voice.*crypt', 'voice.*note', 'mediaRecorder']

results = []
for fpath in files_to_check:
    if not os.path.exists(fpath):
        continue
    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    for tw in target_words:
        matches = list(re.finditer(tw, content, re.IGNORECASE))
        if matches:
            results.append((fpath, tw, len(matches)))

for fpath, tw, cnt in results:
    rel = os.path.relpath(fpath, r"c:\Users\USER\Desktop\NEXCHAT-main")
    print(f"{rel}: keyword '{tw}' -> {cnt} matches")
