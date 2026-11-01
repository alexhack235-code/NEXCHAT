import os

wallpaper_sub = r"C:\Users\USER\Desktop\Wallpaper\Wallpaper"
if os.path.exists(wallpaper_sub):
    files = [f for f in os.listdir(wallpaper_sub) if os.path.isfile(os.path.join(wallpaper_sub, f))]
    print(f"Total files in {wallpaper_sub}: {len(files)}")
    total_size = sum(os.path.getsize(os.path.join(wallpaper_sub, f)) for f in files)
    print(f"Total size: {total_size / (1024*1024):.2f} MB")
    for idx, f in enumerate(files, 1):
        print(f"{idx}. {f} ({os.path.getsize(os.path.join(wallpaper_sub, f)) / (1024*1024):.2f} MB)")
else:
    print("Folder does not exist")
