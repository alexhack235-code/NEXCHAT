import os

for root, dirs, files in os.walk(r"c:\Users\USER\Desktop\NEXCHAT-main"):
    if any(x in root for x in ['node_modules', 'dist', '.git', '.gemini', 'android', 'chrome_test_profile']):
        continue
    for f in files:
        if f.endswith('.js'):
            fpath = os.path.join(root, f)
            with open(fpath, 'r', encoding='utf-8', errors='ignore') as fp:
                for idx, line in enumerate(fp, 1):
                    if 'createaudioplayerelement' in line.lower():
                        rel = os.path.relpath(fpath, r"c:\Users\USER\Desktop\NEXCHAT-main")
                        print(f"{rel}:{idx}: {line.strip()[:140]}")
