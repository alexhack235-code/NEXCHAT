import os
from PIL import Image, ExifTags

wallpaper_dir = r"C:\Users\USER\Desktop\Wallpaper\Wallpaper"
files = [f for f in os.listdir(wallpaper_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]

print(f"Checking {len(files)} files for EXIF and image statistics...")

for idx, f in enumerate(files[:5], 1):
    path = os.path.join(wallpaper_dir, f)
    with Image.open(path) as img:
        print(f"\n[{idx}] {f}: size={img.size}, mode={img.mode}")
        exif = img.getexif()
        if exif:
            for tag_id, val in exif.items():
                tag = ExifTags.TAGS.get(tag_id, tag_id)
                if tag in ['ImageDescription', 'XPKeywords', 'UserComment', 'Artist', 'Software', 'Make', 'Model']:
                    print(f"    EXIF {tag}: {val}")
