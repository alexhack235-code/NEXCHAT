# -*- coding: utf-8 -*-
"""
fix_all_syntax_errors.py
"""

import os
import glob

def fix_aurora_mat(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    orig = content

    content = content.replace(
        "const auroraMat = new THREE.MeshBasicMaterial({\n      color: 0x00ffaa,",
        "const auroraCurtainMat = new THREE.MeshBasicMaterial({\n      color: 0x00ffaa,"
    )
    content = content.replace(
        "auroraCurtainMesh = new THREE.Mesh(auroraCurtainGeo, auroraMat);",
        "auroraCurtainMesh = new THREE.Mesh(auroraCurtainGeo, auroraCurtainMat);"
    )

    if content != orig:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[AURORA FIXED] {filepath}")

def main():
    targets = [
        'Canada/province-northwest-territories.html',
        'Canada/province-nunavut.html',
        'province-northwest-territories.html',
        'province-nunavut.html'
    ]
    for t in targets:
        if os.path.exists(t):
            fix_aurora_mat(t)

if __name__ == '__main__':
    main()
