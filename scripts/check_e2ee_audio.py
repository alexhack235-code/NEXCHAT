import re

with open(r"c:\Users\USER\Desktop\NEXCHAT-main\chat.js", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if any(k in line.lower() for k in ['e2ee', 'vault', 'decrypt', 'encryptattachment', 'encryptfile', 'encryptedblob', 'audioattachment']):
        if any(k in line.lower() for k in ['audio', 'attachment', 'voice', 'blob']):
            print(f"chat.js:{i}: {line.strip()[:140]}")
