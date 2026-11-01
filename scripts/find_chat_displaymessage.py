with open(r"c:\Users\USER\Desktop\NEXCHAT-main\chat.js", "r", encoding="utf-8", errors="ignore") as f:
    for i, line in enumerate(f, 1):
        if 'displaymessage' in line.lower() or 'createmessageelement' in line.lower() or 'appendlocalsentmessage' in line.lower() or 'renderwaveform' in line.lower() or 'playaudiomessage' in line.lower():
            print(f"chat.js:{i}: {line.strip()[:140]}")
