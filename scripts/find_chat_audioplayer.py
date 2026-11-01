import re

with open(r"c:\Users\USER\Desktop\NEXCHAT-main\chat.js", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if '<audio' in line.lower() or 'new audio(' in line.lower() or 'audio/webm' in line.lower() or 'playvoice' in line.lower() or 'customaudioplayer' in line.lower():
        print(f"chat.js:{i}: {line.strip()[:140]}")
