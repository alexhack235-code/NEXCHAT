import os
from PIL import Image

src = r"C:\Users\USER\Desktop\Wallpaper\Wallpaper\vincentiu-solomon-Z4wF0h47fy8-unsplash.jpg"
dst = r"C:\Users\USER\Desktop\Wallpaper\test_large_opt.webp"

with Image.open(src) as img:
    w, h = img.size
    print(f"Original: {w}x{h}, size={os.path.getsize(src)/(1024*1024):.2f} MB")
    
    max_dim = 2560
    if max(w, h) > max_dim:
        scale = max_dim / max(w, h)
        new_size = (int(w * scale), int(h * scale))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
    
    img.save(dst, "WEBP", quality=90, method=4)
    print(f"Optimized: {img.size}, size={os.path.getsize(dst)/1024:.1f} KB")

if os.path.exists(dst):
    os.remove(dst)
