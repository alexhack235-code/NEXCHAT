"""
Build script for NEXIUM Rust Core.
Generates Windows import libraries directly from system DLLs using lld-link,
and builds the nexium_core cdylib using cargo and rust-lld.
Completely offline, self-contained, no Visual Studio installation required.
"""

import os
import sys
import struct
import subprocess
import shutil

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
RUST_DIR = os.path.join(BACKEND_DIR, "rust_core")
LIBS_DIR = os.path.join(RUST_DIR, ".win_libs")

def get_rustup_bin():
    rustc_res = subprocess.run(["rustc", "--print", "sysroot"], capture_output=True, text=True, check=True)
    sysroot = rustc_res.stdout.strip()
    lld_link = os.path.join(sysroot, "lib", "rustlib", "x86_64-pc-windows-msvc", "bin", "gcc-ld", "lld-link.exe")
    if not os.path.exists(lld_link):
        lld_link = os.path.join(sysroot, "bin", "rust-lld.exe")
    return lld_link

def extract_exports(dll_path):
    with open(dll_path, 'rb') as f:
        data = f.read()
    pe_offset = struct.unpack_from('<I', data, 0x3c)[0]
    if data[pe_offset:pe_offset+4] != b'PE\x00\x00':
        return []
    magic = struct.unpack_from('<H', data, pe_offset + 24)[0]
    if magic == 0x20b: # PE32+ (64-bit)
        export_rva = struct.unpack_from('<I', data, pe_offset + 24 + 112)[0]
    else:
        export_rva = struct.unpack_from('<I', data, pe_offset + 24 + 96)[0]
    if export_rva == 0:
        return []
    num_sections = struct.unpack_from('<H', data, pe_offset + 6)[0]
    opt_header_size = struct.unpack_from('<H', data, pe_offset + 20)[0]
    section_offset = pe_offset + 24 + opt_header_size
    sec_raw = None
    sec_va = None
    for i in range(num_sections):
        s_va, s_raw_size, s_raw = struct.unpack_from('<IIII', data, section_offset + i * 40 + 12)[:3]
        s_vsize = struct.unpack_from('<I', data, section_offset + i * 40 + 8)[0]
        if s_va <= export_rva < s_va + s_vsize:
            sec_raw = s_raw
            sec_va = s_va
            break
    if sec_raw is None:
        return []
    def rva_to_offset(rva):
        return rva - sec_va + sec_raw
    exp_off = rva_to_offset(export_rva)
    num_names = struct.unpack_from('<I', data, exp_off + 24)[0]
    names_rva = struct.unpack_from('<I', data, exp_off + 32)[0]
    names_off = rva_to_offset(names_rva)
    names = []
    for i in range(num_names):
        name_rva = struct.unpack_from('<I', data, names_off + i * 4)[0]
        name_off = rva_to_offset(name_rva)
        end = data.find(b'\x00', name_off)
        names.append(data[name_off:end].decode('ascii', errors='ignore'))
    return names

def generate_win_libs(lld_link_path):
    os.makedirs(LIBS_DIR, exist_ok=True)
    dlls = ['kernel32.dll', 'ntdll.dll', 'userenv.dll', 'ws2_32.dll', 'dbghelp.dll', 'msvcrt.dll']
    system32 = os.path.join(os.environ.get("SystemRoot", "C:\\Windows"), "System32")
    
    for dll in dlls:
        dll_path = os.path.join(system32, dll)
        if not os.path.exists(dll_path):
            continue
        base = os.path.splitext(dll)[0]
        lib_path = os.path.join(LIBS_DIR, base + '.lib')
        if os.path.exists(lib_path):
            continue
        exports = extract_exports(dll_path)
        def_path = os.path.join(LIBS_DIR, base + '.def')
        with open(def_path, 'w') as f:
            f.write(f"LIBRARY {dll}\nEXPORTS\n")
            for exp in exports:
                f.write(f"    {exp}\n")
        cmd = [lld_link_path, f"/def:{def_path}", f"/out:{lib_path}", "/machine:x64"]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if os.path.exists(def_path):
            os.remove(def_path)
    print("[NEXIUM] Windows import libraries generated successfully.")

def build_rust_core():
    print("[NEXIUM] Preparing build environment...")
    lld = get_rustup_bin()
    generate_win_libs(lld)

    # Set up cargo environment
    cargo_env = os.environ.copy()
    libs_escaped = LIBS_DIR.replace("\\", "/")
    cargo_env["RUSTFLAGS"] = f"-C linker=rust-lld -C link-arg=/ENTRY:DllMain -L native={libs_escaped}"

    print("[NEXIUM] Compiling nexium_core in release mode...")
    cmd = ["cargo", "build", "--release", "--offline"]
    subprocess.run(cmd, cwd=RUST_DIR, env=cargo_env, check=True)

    release_dll = os.path.join(RUST_DIR, "target", "release", "nexium_core.dll")
    target_dll = os.path.join(BACKEND_DIR, "nexium_core.dll")

    if os.path.exists(release_dll):
        shutil.copy2(release_dll, target_dll)
        print(f"[NEXIUM] SUCCESS: Compiled and copied {target_dll} ({os.path.getsize(target_dll)} bytes)")
        return True
    else:
        print(f"[NEXIUM] ERROR: Expected {release_dll} was not found.")
        return False

if __name__ == "__main__":
    success = build_rust_core()
    sys.exit(0 if success else 1)
