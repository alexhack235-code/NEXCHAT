with open(r"c:\Users\USER\Desktop\NEXCHAT-main\scripts\search_results.txt", "r", encoding="utf-8") as f:
    for line in f:
        line_l = line.lower()
        if any(k in line_l for k in ['stegano', 'encrypt', 'alien', 'mask', 'cipher']) and 'robot' not in line_l:
            print(line.strip()[:140])
