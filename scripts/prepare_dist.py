import os, shutil, glob

dist_dir = os.path.abspath('dist')
if os.path.exists(dist_dir):
    shutil.rmtree(dist_dir)
os.makedirs(dist_dir, exist_ok=True)

# Copy root web files
extensions = ['*.html', '*.css', '*.js', '*.json', '*.jpg', '*.png', '*.svg', '*.ico', '*.webp']
copied_count = 0

for ext in extensions:
    for file in glob.glob(ext):
        if os.path.isfile(file):
            shutil.copy2(file, os.path.join(dist_dir, os.path.basename(file)))
            copied_count += 1

# Copy directories: src, assets, favicons, js, css, styles, api if present
for folder in ['src', 'assets', 'favicons', 'js', 'css', 'styles']:
    if os.path.exists(folder) and os.path.isdir(folder):
        shutil.copytree(folder, os.path.join(dist_dir, folder), dirs_exist_ok=True)
        print(f"Copied folder: {folder}")

print(f"Successfully prepared dist/ with {copied_count} root assets and subdirectories.")
