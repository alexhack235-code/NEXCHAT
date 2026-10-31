import os, shutil, glob

dist_dir = os.path.abspath('dist')
os.makedirs(dist_dir, exist_ok=True)

# Copy root web files only if missing, preserving Vite's minified production files
extensions = ['*.html', '*.css', '*.js', '*.json', '*.jpg', '*.png', '*.svg', '*.ico', '*.webp']
copied_count = 0

for ext in extensions:
    for file in glob.glob(ext):
        if os.path.isfile(file):
            dest = os.path.join(dist_dir, os.path.basename(file))
            if not os.path.exists(dest):
                shutil.copy2(file, dest)
                copied_count += 1

# Copy directories: src, assets, favicons, js, css, styles, api if present
for folder in ['src', 'assets', 'favicons', 'js', 'css', 'styles']:
    if os.path.exists(folder) and os.path.isdir(folder):
        shutil.copytree(folder, os.path.join(dist_dir, folder), dirs_exist_ok=True)
        print(f"Synced folder: {folder}")

print(f"Successfully prepared dist/ preserving Vite minification and synced {copied_count} supplemental assets.")
