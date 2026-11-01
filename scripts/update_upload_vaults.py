import os

path = r"c:\Users\USER\Desktop\NEXCHAT-main\api\upload.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

target = """const BACKUP_VAULTS = [
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_1', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_2', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_3', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_4', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_5', ''),
];
const PRIVATE_VAULTS = {
  1: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_PRIVATE_1', ''), name: 'PRIVATE VAULT 1' },
  2: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_PRIVATE_2', ''), name: 'PRIVATE VAULT 2' },
};"""

replacement = """const PUBLIC_VAULTS = {
  1: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_PUBLIC_1', ''), name: 'PUBLIC VAULT 1' },
  2: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_PUBLIC_2', ''), name: 'PUBLIC VAULT 2' },
  3: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_PUBLIC_3', ''), name: 'PUBLIC VAULT 3' },
  4: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_PUBLIC_4', ''), name: 'PUBLIC VAULT 4' },
  5: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_PUBLIC_5', ''), name: 'PUBLIC VAULT 5' },
};
const BACKUP_VAULTS = [
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_1', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_2', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_3', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_4', ''),
  readBlobToken('BLOB_READ_WRITE_TOKEN_BACKUP_5', ''),
  ...Object.values(PUBLIC_VAULTS).map(v => v.token),
].filter(Boolean);
const PRIVATE_VAULTS = {
  1: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_PRIVATE_1', ''), name: 'PRIVATE VAULT 1' },
  2: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_PRIVATE_2', ''), name: 'PRIVATE VAULT 2' },
  3: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_PRIVATE_3', ''), name: 'PRIVATE VAULT 3' },
  4: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_PRIVATE_4', ''), name: 'PRIVATE VAULT 4' },
  5: { token: readBlobToken('BLOB_READ_WRITE_TOKEN_PRIVATE_5', ''), name: 'PRIVATE VAULT 5' },
};"""

if target in content:
    content = content.replace(target, replacement)
    print("Found exact target and replaced!")
else:
    # try normalized newlines
    content_norm = content.replace("\r\n", "\n")
    target_norm = target.replace("\r\n", "\n")
    replacement_norm = replacement.replace("\r\n", "\n")
    if target_norm in content_norm:
        content_norm = content_norm.replace(target_norm, replacement_norm)
        content = content_norm.replace("\n", "\r\n")
        print("Replaced with normalized CRLF!")
    else:
        print("Target NOT found!")

# Also update the private upload handling logic so tokensToTry respects accessMode
old_tokens_block = """    if (!token) {
      token = TOKENS.default;
    }
    const tokensToTry = [token, ...BACKUP_VAULTS.filter(t => t && t !== token)].filter(Boolean);"""

new_tokens_block = """    if (!token) {
      token = accessMode === 'private' ? (PRIVATE_VAULTS[1].token || '') : (PUBLIC_VAULTS[1].token || TOKENS.default);
    }
    const tokensToTry = accessMode === 'private'
      ? [token, ...Object.values(PRIVATE_VAULTS).map(v => v.token).filter(t => t && t !== token)].filter(Boolean)
      : [token, ...BACKUP_VAULTS.filter(t => t && t !== token)].filter(Boolean);"""

if old_tokens_block in content:
    content = content.replace(old_tokens_block, new_tokens_block)
    print("Updated tokensToTry block!")
else:
    content_norm = content.replace("\r\n", "\n")
    if old_tokens_block.replace("\r\n", "\n") in content_norm:
        content_norm = content_norm.replace(old_tokens_block.replace("\r\n", "\n"), new_tokens_block.replace("\r\n", "\n"))
        content = content_norm.replace("\n", "\r\n")
        print("Updated tokensToTry with normalized CRLF!")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Saved upload.js")
