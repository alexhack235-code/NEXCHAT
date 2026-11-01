with open(r"c:\Users\USER\Desktop\NEXCHAT-main\chat.js", "r", encoding="utf-8", errors="ignore") as f:
    for i, line in enumerate(f, 1):
        if 'function loadmessages' in line.lower() or 'loadmessages =' in line.lower() or 'async function loadmessages' in line.lower():
            print(f"chat.js:{i}: {line.strip()[:140]}")
