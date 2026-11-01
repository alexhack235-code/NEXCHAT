import os

path = r"c:\Users\USER\Desktop\NEXCHAT-main\src\js\quantum-stegano-voice.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

target = """    let steganoArrayBuffer;
    if (typeof Blob !== 'undefined' && steganoBlob instanceof Blob) {
      steganoArrayBuffer = await steganoBlob.arrayBuffer();
    } else if (steganoBlob instanceof ArrayBuffer) {
      steganoArrayBuffer = steganoBlob;
    } else if (ArrayBuffer.isView(steganoBlob)) {
      steganoArrayBuffer = steganoBlob.buffer.slice(steganoBlob.byteOffset, steganoBlob.byteOffset + steganoBlob.byteLength);
    } else {
      throw new Error('Unsupported steganoBlob format');
    }"""

replacement = """    let steganoArrayBuffer;
    if (typeof steganoBlob === 'string') {
      try {
        const resp = await fetch(steganoBlob);
        const b = await resp.blob();
        steganoArrayBuffer = await b.arrayBuffer();
      } catch (fetchErr) {
        throw new Error('Failed to fetch stegano audio URL: ' + fetchErr.message);
      }
    } else if (typeof Blob !== 'undefined' && steganoBlob instanceof Blob) {
      steganoArrayBuffer = await steganoBlob.arrayBuffer();
    } else if (steganoBlob instanceof ArrayBuffer) {
      steganoArrayBuffer = steganoBlob;
    } else if (ArrayBuffer.isView(steganoBlob)) {
      steganoArrayBuffer = steganoBlob.buffer.slice(steganoBlob.byteOffset, steganoBlob.byteOffset + steganoBlob.byteLength);
    } else {
      throw new Error('Unsupported steganoBlob format');
    }"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced target in quantum-stegano-voice.js")
else:
    content_norm = content.replace("\r\n", "\n")
    if target.replace("\r\n", "\n") in content_norm:
        content_norm = content_norm.replace(target.replace("\r\n", "\n"), replacement.replace("\r\n", "\n"))
        content = content_norm.replace("\n", "\r\n")
        print("Replaced with CRLF normalization in quantum-stegano-voice.js")
    else:
        print("Target NOT found in quantum-stegano-voice.js!")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
