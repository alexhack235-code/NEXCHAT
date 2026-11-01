import os

path = r"c:\Users\USER\Desktop\NEXCHAT-main\chat.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

target = """    } else {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.src = url;
      audio.style.cssText = "max-width: 260px; display: block;";
      container.appendChild(audio);
    }"""

replacement = """    } else {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.src = url;
      audio.preservesPitch = true;
      if ('webkitPreservesPitch' in audio) audio.webkitPreservesPitch = true;
      if ('mozPreservesPitch' in audio) audio.mozPreservesPitch = true;
      audio.style.cssText = "max-width: 260px; display: block;";
      container.appendChild(audio);
    }

    // Auto-Decrypt Steganographic / Encrypted Voice Notes (Restore clean human voice)
    const isStegano = attachment.isSteganoVoice || (attachment.fileName && (attachment.fileName.startsWith('QUANTUM_STEG_') || attachment.fileName.includes('_STEG_'))) || (typeof url === 'string' && url.includes('QUANTUM_STEG'));
    if (isStegano && typeof window.decodeSteganoAudio === 'function') {
      window.decodeSteganoAudio(url, '').then(res => {
        if (res && res.decryptedBlob && res.coverType !== 'direct') {
          const clearUrl = URL.createObjectURL(res.decryptedBlob);
          const targetAudio = container.querySelector('audio');
          if (targetAudio) {
            targetAudio.src = clearUrl;
          }
        }
      }).catch(err => {
        console.warn('[Stegano Auto-Decrypt] Notice:', err);
      });
    }"""

content_norm = content.replace("\r\n", "\n")
target_norm = target.replace("\r\n", "\n")
replacement_norm = replacement.replace("\r\n", "\n")

if target_norm in content_norm:
    content_norm = content_norm.replace(target_norm, replacement_norm, 1)
    content = content_norm.replace("\n", "\r\n")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully patched chat.js!")
else:
    print("Target not found in chat.js!")
