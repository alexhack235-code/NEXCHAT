import os
import colorsys
from PIL import Image

wallpaper_dir = r"C:\Users\USER\Desktop\Wallpaper\Wallpaper"
files = [f for f in os.listdir(wallpaper_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]

results = []

for idx, filename in enumerate(sorted(files), 1):
    path = os.path.join(wallpaper_dir, filename)
    with Image.open(path) as img:
        img_rgb = img.convert('RGB')
        w, h = img_rgb.size
        
        # Downsample to 64x64 for fast color & feature extraction
        thumb = img_rgb.resize((64, 64), Image.Resampling.BILINEAR)
        pixels = list(thumb.getdata())
        num_pixels = len(pixels)
        
        # Metrics
        black_count = 0        # near black (< 20)
        very_dark_count = 0    # dark (< 40)
        total_lum = 0
        
        # Hue buckets (H: 0..360, S: 0..1, V: 0..1)
        hues = []
        saturations = []
        values = []
        
        neon_cyber_count = 0   # cyan, magenta, neon purple, electric blue with high sat
        gold_count = 0         # yellow-orange (35..55 deg), med-high sat, moderate val
        green_nature_count = 0 # 65..160 deg
        blue_sky_count = 0     # 180..230 deg daylight
        space_deep_count = 0   # deep navy/indigo/purple with low val
        
        for r, g, b in pixels:
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            total_lum += lum
            if lum < 15:
                black_count += 1
            if lum < 40:
                very_dark_count += 1
                
            h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            h_deg = h * 360.0
            hues.append(h_deg)
            saturations.append(s)
            values.append(v)
            
            # Neon / Cyberpunk: Pink/Magenta (280..340), Cyan/Electric blue (170..210) with high sat (>0.6) and high v (>0.4)
            if s > 0.55 and v > 0.35:
                if (280 <= h_deg <= 345) or (170 <= h_deg <= 200):
                    neon_cyber_count += 1
                    
            # Gold / Luxury: 35..55 deg with warm sat and warm lum
            if 30 <= h_deg <= 55 and 0.4 <= s <= 0.95 and 0.3 <= v <= 0.9:
                gold_count += 1
                
            # Green / Nature:
            if 65 <= h_deg <= 165 and s > 0.25 and v > 0.2:
                green_nature_count += 1
                
            # Sky / Ocean blue:
            if 190 <= h_deg <= 240 and s > 0.3 and v > 0.3:
                blue_sky_count += 1
                
        avg_lum = total_lum / num_pixels
        black_ratio = black_count / num_pixels
        dark_ratio = very_dark_count / num_pixels
        avg_sat = sum(saturations) / num_pixels
        avg_val = sum(values) / num_pixels
        
        results.append({
            "filename": filename,
            "width": w,
            "height": h,
            "avg_lum": round(avg_lum, 1),
            "black_ratio": round(black_ratio, 3),
            "dark_ratio": round(dark_ratio, 3),
            "avg_sat": round(avg_sat, 2),
            "neon_ratio": round(neon_cyber_count / num_pixels, 3),
            "gold_ratio": round(gold_count / num_pixels, 3),
            "green_ratio": round(green_nature_count / num_pixels, 3),
            "blue_ratio": round(blue_sky_count / num_pixels, 3),
        })

print(f"Analyzed {len(results)} images.")
for r in results[:15]:
    print(r)
