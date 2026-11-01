with open(r"c:\Users\USER\Desktop\NEXCHAT-main\src\js\cyber-audio-dsp.js", "r", encoding="utf-8", errors="ignore") as f:
    for i, line in enumerate(f, 1):
        if 'localstorage' in line.lower() or 'default' in line.lower() or 'currentpreset' in line.lower():
            print(f"cyber-audio-dsp.js:{i}: {line.strip()[:140]}")
