import os
import re

search_terms = ['CyberAudioDSPEngine', 'applyVoicePreset', 'window.cyberAudioDsp', 'voiceMask', 'voicePreset', 'window.NexSteganoVoice', 'encodeSteganoAudio', 'decodeSteganoAudio']

for root, dirs, files in os.walk(r"c:\Users\USER\Desktop\NEXCHAT-main"):
    if any(x in root for x in ['node_modules', 'dist', '.git', '.gemini', 'android']):
        continue
    for f in files:
        if f.endswith(('.js', '.html')):
            fpath = os.path.join(root, f)
            with open(fpath, 'r', encoding='utf-8', errors='ignore') as fp:
                for idx, line in enumerate(fp, 1):
                    for st in search_terms:
                        if st.lower() in line.lower():
                            rel = os.path.relpath(fpath, r"c:\Users\USER\Desktop\NEXCHAT-main")
                            print(f"{rel}:{idx}: {line.strip()[:140]}")
