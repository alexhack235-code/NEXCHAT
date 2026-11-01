with open(r"c:\Users\USER\Desktop\NEXCHAT-main\src\js\quantum-stegano-voice.js", "r", encoding="utf-8", errors="ignore") as f:
    for i, line in enumerate(f, 1):
        if any(k in line.lower() for k in ['generatecover', 'coversynth', 'carrier', 'alien', 'oscillator', 'lo-fi', 'deep space']):
            print(f"quantum-stegano-voice.js:{i}: {line.strip()[:140]}")
