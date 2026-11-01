import re

with open(r"c:\Users\USER\Desktop\NEXCHAT-main\chat.js", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if any(k in line.lower() for k in ['mediarecorder', 'recordvoice', 'voicenote', 'audioblob', 'startrecording', 'stoprecording']):
        print(f"chat.js:{i}: {line.strip()[:140]}")
