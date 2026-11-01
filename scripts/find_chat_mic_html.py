import re

with open(r"c:\Users\USER\Desktop\NEXCHAT-main\chat.html", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if any(k in line.lower() for k in ['audio-record', 'audiorecordingui', 'steganovoice', 'neuralvoice', 'voicenote', 'audiocancel', 'audiostop', 'audiosend']):
        print(f"chat.html:{i}: {line.strip()[:140]}")
