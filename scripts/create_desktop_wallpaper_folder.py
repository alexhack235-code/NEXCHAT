import os
import sys

desktop_dir = r"C:\Users\USER\Desktop"
wallpaper_dir = os.path.join(desktop_dir, "Wallpaper")

genres = [
    "cyberpunk",
    "cosmos",
    "oled_minimal",
    "nature",
    "tactical",
    "anime_art",
    "luxury_gold",
    "abstract"
]

os.makedirs(wallpaper_dir, exist_ok=True)

for genre in genres:
    genre_path = os.path.join(wallpaper_dir, genre)
    os.makedirs(genre_path, exist_ok=True)
    # Create a .gitkeep so empty folders are preserved in git
    gitkeep = os.path.join(genre_path, ".gitkeep")
    if not os.path.exists(gitkeep):
        with open(gitkeep, "w", encoding="utf-8") as f:
            f.write("")

# Create README.md
readme_content = """# NEXCHAT High-Definition Wallpapers Repository

Welcome to the official NEXCHAT Wallpaper Asset Library.

## Folder Organization (Genres)
Drop your high-definition wallpaper images (.jpg, .jpeg, .png, .webp) into their respective genre folders:
- **cyberpunk/**: Neon lights, futuristic cities, synthwave, cyber-tech aesthetics.
- **cosmos/**: Deep space, nebulas, galaxies, starfields, celestial art.
- **oled_minimal/**: True black (#000000) backgrounds, minimal neon outlines, battery-saving dark themes.
- **nature/**: Mountain ranges, calm oceans, mist forests, auroras, sunsets.
- **tactical/**: Carbon fiber, matte dark hex grids, HUD overlays, military tech motifs.
- **anime_art/**: High-res anime scenery, stylized character art, artistic renders.
- **luxury_gold/**: Black and gold, marble, geometric elegance, platinum accents.
- **abstract/**: 3D fluid renders, glassmorphism waves, chromatic shapes.

## Guidelines
1. Supported formats: .jpg, .jpeg, .png, .webp.
2. Recommended resolution: 1080x2400 (FHD+) or 1440x3200 (QHD+) portrait orientation.
3. Once you have added your images, let Antigravity know! We will run `generate_manifest.py`, verify all dimensions and file sizes, and push to GitHub.
"""

with open(os.path.join(wallpaper_dir, "README.md"), "w", encoding="utf-8") as f:
    f.write(readme_content)

# Create .gitignore
gitignore_content = """Thumbs.db
Desktop.ini
.DS_Store
*.tmp
"""

with open(os.path.join(wallpaper_dir, ".gitignore"), "w", encoding="utf-8") as f:
    f.write(gitignore_content)

# Create generate_manifest.py inside Wallpaper folder
manifest_script_content = '''import os
import json
import hashlib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GENRES = [
    "cyberpunk",
    "cosmos",
    "oled_minimal",
    "nature",
    "tactical",
    "anime_art",
    "luxury_gold",
    "abstract"
]
VALID_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

def calculate_hash(filepath):
    hasher = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()[:10]

def build_manifest():
    manifest = {
        "version": "1.0.0",
        "cdn_base_url": "https://cdn.jsdelivr.net/gh/alexhack235-code/nexchat-wallpapers@main",
        "genres": {},
        "total_wallpapers": 0
    }
    
    total = 0
    for genre in GENRES:
        genre_path = os.path.join(BASE_DIR, genre)
        manifest["genres"][genre] = []
        if not os.path.isdir(genre_path):
            continue
        
        files = sorted(os.listdir(genre_path))
        for filename in files:
            ext = os.path.splitext(filename)[1].lower()
            if ext in VALID_EXTS:
                full_path = os.path.join(genre_path, filename)
                file_size = os.path.getsize(full_path)
                file_hash = calculate_hash(full_path)
                slug = os.path.splitext(filename)[0].lower().replace(" ", "-").replace("_", "-")
                
                manifest["genres"][genre].append({
                    "id": f"{genre}_{slug}_{file_hash}",
                    "name": filename,
                    "genre": genre,
                    "filename": filename,
                    "path": f"{genre}/{filename}",
                    "cdn_url": f"https://cdn.jsdelivr.net/gh/alexhack235-code/nexchat-wallpapers@main/{genre}/{filename}",
                    "size_bytes": file_size,
                    "size_kb": round(file_size / 1024, 1)
                })
                total += 1
                
    manifest["total_wallpapers"] = total
    
    out_file = os.path.join(BASE_DIR, "manifest.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print(f"Generated manifest.json successfully! Total wallpapers indexed: {total}")
    for genre, items in manifest["genres"].items():
        print(f"  - {genre}: {len(items)} items")

if __name__ == "__main__":
    build_manifest()
'''

with open(os.path.join(wallpaper_dir, "generate_manifest.py"), "w", encoding="utf-8") as f:
    f.write(manifest_script_content)

print(f"Successfully created Wallpaper folder at: {wallpaper_dir}")
print(f"Created {len(genres)} genre directories:")
for g in genres:
    print(f"  - {g}")
