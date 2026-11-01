import os

path = r"c:\Users\USER\Desktop\NEXCHAT-main\messaging-features.js"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
for idx, l in enumerate(lines[:60]):
    if 'new Audio' in l:
        print(f"Found line {idx}: {repr(l)}")

new_lines = []
for l in lines:
    new_lines.append(l)
    if 'const audio = new Audio(url);' in l:
        new_lines.append('    audio.preservesPitch = true;\n')
        new_lines.append('    if (\'webkitPreservesPitch\' in audio) audio.webkitPreservesPitch = true;\n')
        new_lines.append('    if (\'mozPreservesPitch\' in audio) audio.mozPreservesPitch = true;\n')
        new_lines.append('    if (url && (String(url).includes(\'QUANTUM_STEG\') || String(url).includes(\'.wav\') || String(url).startsWith(\'blob:\') || String(url).startsWith(\'data:\'))) {\n')
        new_lines.append('      if (typeof window.decodeSteganoAudio === \'function\') {\n')
        new_lines.append('        window.decodeSteganoAudio(url, \'\').then(res => {\n')
        new_lines.append('          if (res && res.decryptedBlob && res.coverType !== \'direct\') {\n')
        new_lines.append('            audio.src = URL.createObjectURL(res.decryptedBlob);\n')
        new_lines.append('          }\n')
        new_lines.append('        }).catch(() => {});\n')
        new_lines.append('      }\n')
        new_lines.append('    }\n')
    elif 'audio.playbackRate = targetSpeed;' in l:
        new_lines.append('      audio.preservesPitch = true;\n')
        new_lines.append('      if (\'webkitPreservesPitch\' in audio) audio.webkitPreservesPitch = true;\n')
        new_lines.append('      if (\'mozPreservesPitch\' in audio) audio.mozPreservesPitch = true;\n')

with open(path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("Updated messaging-features.js successfully!")
