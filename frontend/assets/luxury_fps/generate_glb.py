# -*- coding: utf-8 -*-
"""
High-Luxury FPS Game Asset - Procedural Binary GLB Generator (glTF 2.0)
Generates AAA-grade luxury 3D game models using pure Python standard library.
1. luxury_plasma_railgun.glb (24k Gold, Damascus Titanium, Holographic Scope, Plasma Core)
2. combat_target_drone.glb (Luxury floating target drone with golden shield rings)
"""

import os
import json
import struct
import math

def create_box_mesh(dx, dy, dz, offset=(0, 0, 0)):
    """Generates vertex positions, normals, and indices for a 3D box."""
    hx, hy, hz = dx / 2.0, dy / 2.0, dz / 2.0
    ox, oy, oz = offset

    # 6 faces * 4 vertices = 24 vertices
    # Each vertex: x, y, z, nx, ny, nz
    faces = [
        # +Z Front
        ((-hx, -hy,  hz), ( hx, -hy,  hz), ( hx,  hy,  hz), (-hx,  hy,  hz), (0, 0, 1)),
        # -Z Back
        (( hx, -hy, -hz), (-hx, -hy, -hz), (-hx,  hy, -hz), ( hx,  hy, -hz), (0, 0, -1)),
        # +Y Top
        ((-hx,  hy,  hz), ( hx,  hy,  hz), ( hx,  hy, -hz), (-hx,  hy, -hz), (0, 1, 0)),
        # -Y Bottom
        ((-hx, -hy, -hz), ( hx, -hy, -hz), ( hx, -hy,  hz), (-hx, -hy,  hz), (0, -1, 0)),
        # +X Right
        (( hx, -hy,  hz), ( hx, -hy, -hz), ( hx,  hy, -hz), ( hx,  hy,  hz), (1, 0, 0)),
        # -X Left
        ((-hx, -hy, -hz), (-hx, -hy,  hz), (-hx,  hy,  hz), (-hx,  hy, -hz), (-1, 0, 0))
    ]

    vertices = []
    normals = []
    indices = []

    v_idx = 0
    for face in faces:
        v0, v1, v2, v3, norm = face
        for v in (v0, v1, v2, v3):
            vertices.append((v[0] + ox, v[1] + oy, v[2] + oz))
            normals.append(norm)
        # Two triangles per face
        indices.extend([v_idx, v_idx + 1, v_idx + 2, v_idx, v_idx + 2, v_idx + 3])
        v_idx += 4

    return vertices, normals, indices

def create_cylinder_mesh(radius, length, segments=16, axis='z', offset=(0,0,0)):
    """Generates vertex positions, normals, and indices for a cylinder."""
    ox, oy, oz = offset
    hl = length / 2.0
    vertices = []
    normals = []
    indices = []

    base_idx = 0
    # Side vertices
    for i in range(segments + 1):
        angle = (2.0 * math.pi * i) / segments
        cos_a = math.cos(angle)
        sin_a = math.sin(angle)

        if axis == 'z':
            norm = (cos_a, sin_a, 0.0)
            vertices.append((radius * cos_a + ox, radius * sin_a + oy, -hl + oz))
            normals.append(norm)
            vertices.append((radius * cos_a + ox, radius * sin_a + oy,  hl + oz))
            normals.append(norm)
        elif axis == 'y':
            norm = (cos_a, 0.0, sin_a)
            vertices.append((radius * cos_a + ox, -hl + oy, radius * sin_a + oz))
            normals.append(norm)
            vertices.append((radius * cos_a + ox,  hl + oy, radius * sin_a + oz))
            normals.append(norm)

    for i in range(segments):
        idx0 = 2 * i
        idx1 = idx0 + 1
        idx2 = 2 * (i + 1)
        idx3 = idx2 + 1
        indices.extend([idx0, idx1, idx2, idx1, idx3, idx2])

    return vertices, normals, indices

def export_glb_from_parts(parts, output_filepath):
    """
    Exports multiple textured parts into a single valid binary glTF (.glb) file.
    parts is a list of dicts:
    {
       "name": str,
       "vertices": [(x,y,z), ...],
       "normals": [(nx,ny,nz), ...],
       "indices": [int, ...],
       "color": [r,g,b,a],
       "metallic": float,
       "roughness": float,
       "emissive": [r,g,b]
    }
    """
    binary_data = bytearray()
    accessors = []
    buffer_views = []
    meshes = []
    materials = []
    nodes = []

    for part_idx, part in enumerate(parts):
        v_list = part["vertices"]
        n_list = part["normals"]
        i_list = part["indices"]

        if not v_list or not i_list:
            continue

        # Pack indices (UNSIGNED_SHORT = 5123)
        i_bytes = bytearray()
        for idx in i_list:
            i_bytes.extend(struct.pack("<H", idx))
        while len(i_bytes) % 4 != 0:
            i_bytes.append(0)

        # Pack positions (FLOAT = 5126)
        p_bytes = bytearray()
        min_p = [float("inf")] * 3
        max_p = [float("-inf")] * 3
        for v in v_list:
            p_bytes.extend(struct.pack("<fff", v[0], v[1], v[2]))
            for c in range(3):
                min_p[c] = min(min_p[c], v[c])
                max_p[c] = max(max_p[c], v[c])
        while len(p_bytes) % 4 != 0:
            p_bytes.append(0)

        # Pack normals (FLOAT = 5126)
        n_bytes = bytearray()
        for n in n_list:
            n_bytes.extend(struct.pack("<fff", n[0], n[1], n[2]))
        while len(n_bytes) % 4 != 0:
            n_bytes.append(0)

        # Buffer views
        # Indices view (target 34963 = ELEMENT_ARRAY_BUFFER)
        i_offset = len(binary_data)
        binary_data.extend(i_bytes)
        bv_i = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": i_offset,
            "byteLength": len(i_bytes),
            "target": 34963
        })

        # Positions view (target 34962 = ARRAY_BUFFER)
        p_offset = len(binary_data)
        binary_data.extend(p_bytes)
        bv_p = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": p_offset,
            "byteLength": len(p_bytes),
            "byteStride": 12,
            "target": 34962
        })

        # Normals view (target 34962 = ARRAY_BUFFER)
        n_offset = len(binary_data)
        binary_data.extend(n_bytes)
        bv_n = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": n_offset,
            "byteLength": len(n_bytes),
            "byteStride": 12,
            "target": 34962
        })

        # Accessors
        acc_i = len(accessors)
        accessors.append({
            "bufferView": bv_i,
            "byteOffset": 0,
            "componentType": 5123,  # UNSIGNED_SHORT
            "count": len(i_list),
            "type": "SCALAR"
        })

        acc_p = len(accessors)
        accessors.append({
            "bufferView": bv_p,
            "byteOffset": 0,
            "componentType": 5126,  # FLOAT
            "count": len(v_list),
            "type": "VEC3",
            "max": max_p,
            "min": min_p
        })

        acc_n = len(accessors)
        accessors.append({
            "bufferView": bv_n,
            "byteOffset": 0,
            "componentType": 5126,  # FLOAT
            "count": len(n_list),
            "type": "VEC3"
        })

        # Material
        mat_idx = len(materials)
        mat_def = {
            "name": part.get("name", f"mat_{part_idx}"),
            "pbrMetallicRoughness": {
                "baseColorFactor": part.get("color", [0.8, 0.8, 0.8, 1.0]),
                "metallicFactor": part.get("metallic", 0.9),
                "roughnessFactor": part.get("roughness", 0.2)
            }
        }
        if "emissive" in part:
            mat_def["emissiveFactor"] = part["emissive"]
        materials.append(mat_def)

        # Mesh
        mesh_idx = len(meshes)
        meshes.append({
            "name": part.get("name", f"part_{part_idx}"),
            "primitives": [{
                "attributes": {
                    "POSITION": acc_p,
                    "NORMAL": acc_n
                },
                "indices": acc_i,
                "material": mat_idx
            }]
        })

        # Node
        nodes.append({
            "name": part.get("name", f"node_{part_idx}"),
            "mesh": mesh_idx
        })

    gltf = {
        "asset": {
            "generator": "NEXIUM High-Luxury 3D Asset Forge v3.8",
            "version": "2.0"
        },
        "scene": 0,
        "scenes": [{
            "nodes": list(range(len(nodes)))
        }],
        "nodes": nodes,
        "meshes": meshes,
        "materials": materials,
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": [{
            "byteLength": len(binary_data)
        }]
    }

    json_str = json.dumps(gltf, separators=(',', ':'))
    json_bytes = json_str.encode('utf-8')
    while len(json_bytes) % 4 != 0:
        json_bytes += b' '

    while len(binary_data) % 4 != 0:
        binary_data += b'\x00'

    # GLB Header: magic (4), version (4), total_length (4)
    total_length = 12 + 8 + len(json_bytes) + 8 + len(binary_data)
    header = struct.pack("<4sII", b"glTF", 2, total_length)

    # Chunk 0: JSON
    chunk0_hdr = struct.pack("<II", len(json_bytes), 0x4E4F534A)  # "JSON"
    # Chunk 1: BIN
    chunk1_hdr = struct.pack("<II", len(binary_data), 0x004E4942)  # "BIN\0"

    with open(output_filepath, "wb") as f:
        f.write(header)
        f.write(chunk0_hdr)
        f.write(json_bytes)
        f.write(chunk1_hdr)
        f.write(binary_data)

    print(f"[OK] Generated: {output_filepath} ({total_length} bytes)")

def build_luxury_sniper(out_path):
    """Builds the 24K Gold & Titanium Luxury Plasma Railgun Sniper."""
    parts = []

    # 1. Receiver / Main Body (Damascus Titanium)
    v, n, i = create_box_mesh(0.08, 0.12, 0.42, offset=(0, 0, 0))
    parts.append({
        "name": "Receiver_TitaniumDamascus",
        "vertices": v, "normals": n, "indices": i,
        "color": [0.15, 0.16, 0.18, 1.0],
        "metallic": 0.95,
        "roughness": 0.15
    })

    # 2. Barrel Outer Shroud (24-Karat Polished Gold)
    v, n, i = create_box_mesh(0.06, 0.08, 0.55, offset=(0, 0.02, 0.38))
    parts.append({
        "name": "BarrelShroud_24KGold",
        "vertices": v, "normals": n, "indices": i,
        "color": [1.0, 0.84, 0.0, 1.0],  # 24k Gold
        "metallic": 1.0,
        "roughness": 0.1
    })

    # 3. Inner Plasma Accelerating Barrel (Polished Chrome / Black Obsidian)
    v, n, i = create_cylinder_mesh(0.022, 0.65, segments=18, axis='z', offset=(0, 0.02, 0.44))
    parts.append({
        "name": "AcceleratorBarrel_Obsidian",
        "vertices": v, "normals": n, "indices": i,
        "color": [0.05, 0.05, 0.06, 1.0],
        "metallic": 0.9,
        "roughness": 0.05
    })

    # 4. Muzzle Brake & Heat Compensator (24K Gold Fluted)
    v, n, i = create_box_mesh(0.07, 0.09, 0.12, offset=(0, 0.02, 0.76))
    parts.append({
        "name": "MuzzleBrake_24KGold",
        "vertices": v, "normals": n, "indices": i,
        "color": [1.0, 0.85, 0.1, 1.0],
        "metallic": 1.0,
        "roughness": 0.12
    })

    # 5. Glowing Plasma Energy Core (Cyan Neon Emission)
    v, n, i = create_cylinder_mesh(0.028, 0.22, segments=16, axis='z', offset=(0, 0.01, 0.02))
    parts.append({
        "name": "PlasmaEnergyCore_CyanPulse",
        "vertices": v, "normals": n, "indices": i,
        "color": [0.0, 0.94, 1.0, 1.0],
        "metallic": 0.1,
        "roughness": 0.1,
        "emissive": [0.0, 0.9, 1.0]
    })

    # 6. Upper Holographic Optic Mount & Rail (Gold)
    v, n, i = create_box_mesh(0.04, 0.025, 0.32, offset=(0, 0.08, 0.05))
    parts.append({
        "name": "OpticPicatinnyRail_Gold",
        "vertices": v, "normals": n, "indices": i,
        "color": [0.95, 0.8, 0.15, 1.0],
        "metallic": 0.98,
        "roughness": 0.15
    })

    # 7. Holographic Sight Housing (Matte Obsidian)
    v, n, i = create_box_mesh(0.055, 0.06, 0.16, offset=(0, 0.125, 0.06))
    parts.append({
        "name": "HoloSightHousing_Obsidian",
        "vertices": v, "normals": n, "indices": i,
        "color": [0.08, 0.09, 0.1, 1.0],
        "metallic": 0.85,
        "roughness": 0.25
    })

    # 8. Holographic Lens (Diamond Crystal Emissive Reticle)
    v, n, i = create_box_mesh(0.045, 0.045, 0.01, offset=(0, 0.125, 0.08))
    parts.append({
        "name": "DiamondReticleLens",
        "vertices": v, "normals": n, "indices": i,
        "color": [0.2, 1.0, 0.9, 0.85],
        "metallic": 0.0,
        "roughness": 0.02,
        "emissive": [0.1, 0.8, 0.9]
    })

    # 9. Ergonomic Grip (Perforated Italian Leather / Carbon Black)
    v, n, i = create_box_mesh(0.048, 0.16, 0.08, offset=(0, -0.12, -0.06))
    parts.append({
        "name": "LuxuryGrip_ItalianLeather",
        "vertices": v, "normals": n, "indices": i,
        "color": [0.12, 0.1, 0.09, 1.0],
        "metallic": 0.2,
        "roughness": 0.6
    })

    # 10. Gold Grip Inlay & Trigger Guard
    v, n, i = create_box_mesh(0.052, 0.015, 0.12, offset=(0, -0.07, 0.02))
    parts.append({
        "name": "TriggerGuard_24KGold",
        "vertices": v, "normals": n, "indices": i,
        "color": [1.0, 0.82, 0.1, 1.0],
        "metallic": 1.0,
        "roughness": 0.1
    })

    # 11. Luxury Stock & Cheek Rest (Brushed Titanium with Gold Trim)
    v, n, i = create_box_mesh(0.06, 0.11, 0.24, offset=(0, -0.02, -0.32))
    parts.append({
        "name": "Stock_BrushedTitanium",
        "vertices": v, "normals": n, "indices": i,
        "color": [0.2, 0.22, 0.25, 1.0],
        "metallic": 0.9,
        "roughness": 0.2
    })

    export_glb_from_parts(parts, out_path)

def build_combat_drone(out_path):
    """Builds the Gold-Accented Luxury Combat Target Drone."""
    parts = []

    # 1. Drone Central Core (Titanium Sphere/Cylinder)
    v, n, i = create_cylinder_mesh(0.18, 0.16, segments=20, axis='y', offset=(0, 0, 0))
    parts.append({
        "name": "DroneCore_Titanium",
        "vertices": v, "normals": n, "indices": i,
        "color": [0.14, 0.15, 0.18, 1.0],
        "metallic": 0.92,
        "roughness": 0.15
    })

    # 2. Glowing Sensor Eye (Ruby Red / Gold Laser Eye)
    v, n, i = create_box_mesh(0.06, 0.06, 0.04, offset=(0, 0, 0.18))
    parts.append({
        "name": "TargetSensorEye",
        "vertices": v, "normals": n, "indices": i,
        "color": [1.0, 0.1, 0.3, 1.0],
        "metallic": 0.1,
        "roughness": 0.1,
        "emissive": [1.0, 0.1, 0.2]
    })

    # 3. Outer Rotating Shield Ring (24K Gold)
    v, n, i = create_box_mesh(0.52, 0.03, 0.52, offset=(0, 0, 0))
    parts.append({
        "name": "ShieldRing_24KGold",
        "vertices": v, "normals": n, "indices": i,
        "color": [1.0, 0.84, 0.15, 1.0],
        "metallic": 1.0,
        "roughness": 0.08
    })

    # 4. Anti-Gravity Thrusters (4x Gold Pylon Pods)
    for sign_x in (-1, 1):
        for sign_z in (-1, 1):
            px = sign_x * 0.22
            pz = sign_z * 0.22
            v, n, i = create_cylinder_mesh(0.04, 0.12, segments=12, axis='y', offset=(px, -0.06, pz))
            parts.append({
                "name": f"ThrusterPod_{sign_x}_{sign_z}",
                "vertices": v, "normals": n, "indices": i,
                "color": [0.9, 0.75, 0.1, 1.0],
                "metallic": 0.95,
                "roughness": 0.15
            })

    export_glb_from_parts(parts, out_path)

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(out_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    railgun_path = os.path.join(models_dir, "luxury_plasma_railgun.glb")
    drone_path = os.path.join(models_dir, "combat_target_drone.glb")

    print("[NEXIUM] Compiling High-Luxury FPS 3D Game Assets...")
    build_luxury_sniper(railgun_path)
    build_combat_drone(drone_path)
    print("[SUCCESS] All 3D Game Assets generated with glTF 2.0 binary standard.")
