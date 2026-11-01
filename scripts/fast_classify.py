import os
import colorsys
import json
from PIL import Image

wallpaper_dir = r"C:\Users\USER\Desktop\Wallpaper\Wallpaper"
files = [f for f in os.listdir(wallpaper_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]

results = []

for idx, filename in enumerate(sorted(files), 1):
    path = os.path.join(wallpaper_dir, filename)
    try:
        with Image.open(path) as img:
            img.draft('RGB', (64, 64))
            rgb = img.convert('RGB')
            thumb = rgb.resize((16, 16), Image.Resampling.BOX)
            pixels = list(thumb.getdata())
            n = len(pixels)
            
            total_lum = 0
            black_count = 0
            dark_count = 0
            neon_cyber = 0
            gold_count = 0
            nature_count = 0
            sky_blue_count = 0
            space_dark_count = 0
            
            for r, g, b in pixels:
                lum = 0.299 * r + 0.587 * g + 0.114 * b
                total_lum += lum
                if lum < 18:
                    black_count += 1
                if lum < 45:
                    dark_count += 1
                
                h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
                h_deg = h * 360.0
                
                # Cyberpunk / neon
                if s > 0.45 and v > 0.25 and ((270 <= h_deg <= 350) or (165 <= h_deg <= 205)):
                    neon_cyber += 1
                # Gold / luxury
                if 28 <= h_deg <= 55 and s > 0.35 and v > 0.25:
                    gold_count += 1
                # Nature (greens/earth)
                if 65 <= h_deg <= 160 and s > 0.2:
                    nature_count += 1
                # Sky / ocean blue
                if 195 <= h_deg <= 245 and s > 0.25:
                    sky_blue_count += 1
                # Space indigo / cosmos
                if 220 <= h_deg <= 290 and v < 0.45:
                    space_dark_count += 1

            avg_lum = total_lum / n
            black_ratio = black_count / n
            dark_ratio = dark_count / n
            neon_ratio = neon_cyber / n
            gold_ratio = gold_count / n
            nature_ratio = nature_count / n
            sky_ratio = sky_blue_count / n
            space_ratio = space_dark_count / n
            
            # Classification logic
            # 1. Cosmos: dark overall + space tones or space keywords in filename
            fn_lower = filename.lower()
            if any(k in fn_lower for k in ['cosmic', 'astronomy', 'star', 'galaxy', 'bryan-goff', 'vincentiu-solomon', 'sadovski', 'tcherkasski', 'space', 'nebula']):
                genre = 'cosmos'
            elif black_ratio >= 0.40 and dark_ratio >= 0.70 and neon_ratio < 0.15:
                genre = 'oled_minimal'
            elif neon_ratio >= 0.18 or any(k in fn_lower for k in ['cyber', 'neon', 'tokyo', 'shanghai', 'hong-kong', 'synthwave']):
                genre = 'cyberpunk'
            elif gold_ratio >= 0.25 and dark_ratio >= 0.30:
                genre = 'luxury_gold'
            elif nature_ratio >= 0.22 or (nature_ratio + sky_ratio >= 0.40 and avg_lum > 60):
                genre = 'nature'
            elif any(k in fn_lower for k in ['tactical', 'carbon', 'hex', 'military', 'dark', 'metal', 'grid', 'stealth']):
                genre = 'tactical'
            elif dark_ratio >= 0.55 and (space_ratio >= 0.15 or avg_lum < 40):
                genre = 'cosmos'
            elif avg_lum < 35 and black_ratio >= 0.25:
                genre = 'oled_minimal'
            else:
                genre = 'abstract'
                
            results.append({
                "file": filename,
                "genre": genre,
                "lum": round(avg_lum, 1),
                "black": round(black_ratio, 2),
                "dark": round(dark_ratio, 2),
                "neon": round(neon_ratio, 2),
                "gold": round(gold_ratio, 2),
                "nature": round(nature_ratio, 2),
                "sky": round(sky_ratio, 2)
            })
    except Exception as e:
        print(f"Error {filename}: {e}")

genre_counts = {}
for r in results:
    g = r["genre"]
    genre_counts[g] = genre_counts.get(g, 0) + 1

print(f"Successfully classified {len(results)} images:")
for g, c in sorted(genre_counts.items(), key=lambda x: -x[1]):
    print(f"  {g}: {c}")

with open(r"C:\Users\USER\Desktop\Wallpaper\classification_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)
