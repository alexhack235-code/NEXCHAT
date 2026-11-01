import os
import json
import hashlib
from PIL import Image

BASE_WALLPAPER_DIR = r"C:\Users\USER\Desktop\Wallpaper"
SOURCE_DIR = os.path.join(BASE_WALLPAPER_DIR, "Wallpaper")
CLASSIFICATION_FILE = os.path.join(BASE_WALLPAPER_DIR, "classification_results.json")
THUMBNAIL_DIR = os.path.join(BASE_WALLPAPER_DIR, "thumbnails")

CDN_BASE = "https://cdn.jsdelivr.net/gh/alexhack235-code/nexchat-wallpapers@main"

def calculate_hash(filepath):
    hasher = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()[:8]

def clean_slug(filename):
    base = os.path.splitext(filename)[0]
    base = base.replace("-unsplash", "").strip()
    return base

def run():
    if not os.path.exists(CLASSIFICATION_FILE):
        print(f"Classification file not found: {CLASSIFICATION_FILE}")
        return

    with open(CLASSIFICATION_FILE, "r", encoding="utf-8") as f:
        classifications = json.load(f)

    print(f"Processing {len(classifications)} wallpapers into organized genres + thumbnails...")

    manifest = {
        "version": "1.0.0",
        "cdn_base_url": CDN_BASE,
        "genres": {},
        "total_wallpapers": 0
    }

    processed_count = 0
    total_orig_size = 0
    total_opt_size = 0
    total_thumb_size = 0

    for item in classifications:
        fname = item["file"]
        genre = item["genre"]
        src_path = os.path.join(SOURCE_DIR, fname)
        if not os.path.exists(src_path):
            continue

        orig_size = os.path.getsize(src_path)
        total_orig_size += orig_size

        genre_dir = os.path.join(BASE_WALLPAPER_DIR, genre)
        os.makedirs(genre_dir, exist_ok=True)

        genre_thumb_dir = os.path.join(THUMBNAIL_DIR, genre)
        os.makedirs(genre_thumb_dir, exist_ok=True)

        slug = clean_slug(fname)
        dest_filename = f"{slug}.webp"
        dest_path = os.path.join(genre_dir, dest_filename)
        thumb_path = os.path.join(genre_thumb_dir, dest_filename)

        with Image.open(src_path) as img:
            rgb_img = img.convert("RGB")
            w, h = rgb_img.size

            # 1. Full-Resolution (Max dimension 2560px for crisp 2K display)
            max_dim = 2560
            if max(w, h) > max_dim:
                scale = max_dim / max(w, h)
                target_size = (int(w * scale), int(h * scale))
                full_img = rgb_img.resize(target_size, Image.Resampling.LANCZOS)
            else:
                full_img = rgb_img

            full_img.save(dest_path, "WEBP", quality=90, method=4)
            opt_size = os.path.getsize(dest_path)
            total_opt_size += opt_size

            # 2. Thumbnail (Max dimension 420px for instant gallery loading)
            thumb_max_dim = 420
            scale_t = thumb_max_dim / max(w, h)
            thumb_size = (int(w * scale_t), int(h * scale_t))
            thumb_img = rgb_img.resize(thumb_size, Image.Resampling.BILINEAR)
            thumb_img.save(thumb_path, "WEBP", quality=80, method=4)
            t_size = os.path.getsize(thumb_path)
            total_thumb_size += t_size

        if genre not in manifest["genres"]:
            manifest["genres"][genre] = []

        item_hash = calculate_hash(dest_path)
        manifest["genres"][genre].append({
            "id": f"{genre}_{slug}_{item_hash}",
            "name": slug.replace("-", " ").title(),
            "genre": genre,
            "filename": dest_filename,
            "path": f"{genre}/{dest_filename}",
            "cdn_url": f"{CDN_BASE}/{genre}/{dest_filename}",
            "thumbnail_url": f"{CDN_BASE}/thumbnails/{genre}/{dest_filename}",
            "width": full_img.size[0],
            "height": full_img.size[1],
            "size_kb": round(opt_size / 1024, 1),
            "thumb_size_kb": round(t_size / 1024, 1)
        })

        processed_count += 1
        if processed_count % 10 == 0 or processed_count == len(classifications):
            print(f"Processed [{processed_count}/{len(classifications)}] wallpapers...")

    manifest["total_wallpapers"] = processed_count

    manifest_path = os.path.join(BASE_WALLPAPER_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    # Clean up empty .gitkeep files where images now reside
    for genre in manifest["genres"].keys():
        gkeep = os.path.join(BASE_WALLPAPER_DIR, genre, ".gitkeep")
        if os.path.exists(gkeep):
            os.remove(gkeep)

    print("\n--- WALLPAPER PROCESSING COMPLETE ---")
    print(f"Total Wallpapers Processed: {processed_count}")
    print(f"Original Raw Size: {total_orig_size / (1024*1024):.2f} MB")
    print(f"Optimized WebP Size: {total_opt_size / (1024*1024):.2f} MB")
    print(f"Thumbnails Size: {total_thumb_size / (1024*1024):.2f} MB")
    savings = (1 - (total_opt_size / total_orig_size)) * 100
    print(f"Bandwidth & Storage Savings: {savings:.1f}%")
    print(f"Manifest created at: {manifest_path}")

if __name__ == "__main__":
    run()
