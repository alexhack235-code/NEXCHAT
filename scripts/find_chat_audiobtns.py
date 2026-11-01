with open(r"c:\Users\USER\Desktop\NEXCHAT-main\chat.js", "r", encoding="utf-8", errors="ignore") as f:
    for i, line in enumerate(f, 1):
        if 'audio-send-btn' in line or 'audio-record-btn' in line or 'recordbtn' in line.lower():
            print(f"chat.js:{i}: {line.strip()[:140]}")
