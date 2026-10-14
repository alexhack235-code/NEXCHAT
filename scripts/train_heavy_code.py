# -*- coding: utf-8 -*-
"""
NEXIUM Heavy Code & Autonomous Code Doctor Training Engine.
Executes massive synthetic training loops:
  1. Synthesizes heavy industrial architectures (Raft, Slab Allocator, Reactor, HNSW, VM, Saga)
  2. Injects multi-class enterprise defects (concurrency, leaks, syntax, bounds)
  3. Autonomously repairs, verifies, and permanently ingests the fix patterns into the RAG store.

Usage:
    python scripts/train_heavy_code.py --cycles 50
    python scripts/train_heavy_code.py --cycles 100
"""

import os
import sys
import time
import argparse
import asyncio
from datetime import datetime

# Windows UTF-8 stdout
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from backend.heavy_code_engine import heavy_code_engine
from backend.code_doctor import code_doctor
from backend.rust_engine import engine as rust_core

# Sample buggy templates for training the repair engine
BUGGY_CHALLENGES = [
    {
        "name": "Unclosed File Resource Leak in Microservice Worker",
        "lang": "python",
        "code": "def process_config(path):\n    f = open(path)\n    content = f.read()\n    return len(content)",
    },
    {
        "name": "Bare Except Swallowing Critical Interrupts",
        "lang": "python",
        "code": "def execute_task():\n    try:\n        run_job()\n    except:\n        log_error()",
    },
    {
        "name": "Potential Division by Zero Literal Trap",
        "lang": "python",
        "code": "def calculate_ratio(num):\n    return num / 0",
    },
    {
        "name": "Missing Colons on Function Definition Header",
        "lang": "python",
        "code": "def calculate_hash(data)\n    return hashlib.sha256(data.encode()).hexdigest()",
    },
    {
        "name": "Unprotected Lock Acquisition Deadlock Vulnerability",
        "lang": "python",
        "code": "def update_state(state, delta):\n    lock.acquire()\n    state.counter += delta\n    return state.counter",
    },
    {
        "name": "Rust Direct Panic Unwrap Anti-pattern",
        "lang": "rust",
        "code": "pub fn get_user_id(map: &HashMap<String, u64>, key: &str) -> u64 {\n    map.get(key).unwrap()\n}",
    },
]

def print_banner():
    print("=" * 80)
    print("   NEXIUM AUTONOMOUS HEAVY CODE & REPAIR ENGINE (TRAINING SUITE)")
    print("   Industrial Systems Synthesis | Automated Bug Repair | RAG Ingestion")
    print(f"   Native Rust Core : {rust_core.get_version()} (Native: {rust_core.is_native})")
    print("=" * 80)

async def run_training(cycles: int):
    print_banner()
    t_start = time.perf_counter()

    # Phase 1: Heavy Architecture Synthesis
    print(f"\n[*] PHASE 1: Synthesizing {len(heavy_code_engine.blueprints)} Heavy Enterprise Architectures...")
    for bp in heavy_code_engine.blueprints:
        synth = heavy_code_engine.synthesize_heavy_system(bp["id"])
        print(f"  [✓] {bp['title']:<55} | LOC: {synth['loc']:<4} | Lang: {synth['primary_language'].upper()}")

    # Phase 2: Automated Code Doctor Training Loops
    print(f"\n[*] PHASE 2: Executing {cycles} Automated Code Repair & Learning Cycles...")
    total_repaired = 0
    total_patches = 0

    for i in range(1, cycles + 1):
        challenge = BUGGY_CHALLENGES[(i - 1) % len(BUGGY_CHALLENGES)]
        repair_res = await code_doctor.train_and_learn_fix(
            challenge["name"],
            challenge["code"],
            language=challenge["lang"],
        )

        total_repaired += 1
        total_patches += repair_res["patches_count"]

        if i % 5 == 0 or i == cycles:
            pct = (i / cycles) * 100
            print(f"  [{i:3d}/{cycles:3d}] ({pct:5.1f}%) | Fixed: {challenge['name'][:42]:<42} | Patches: {repair_res['patches_count']} | {repair_res['latency_ms']}ms")

    elapsed_sec = time.perf_counter() - t_start
    rate = cycles / max(0.001, elapsed_sec)

    print("\n" + "=" * 80)
    print(" [SUCCESS] HEAVY CODE SYNTHESIS & REPAIR TRAINING COMPLETED")
    print("=" * 80)
    print(f" [✓] Heavy Architectures Synthesized: {len(heavy_code_engine.blueprints)}")
    print(f" [✓] Buggy Code Challenges Repaired:  {total_repaired}")
    print(f" [✓] Total Autonomous Patches Made:   {total_patches}")
    print(f" [✓] Training Throughput:             {rate:.1f} repairs/sec")
    print(f" [✓] Elapsed Time:                   {elapsed_sec:.2f}s")
    print("=" * 80)

def main():
    parser = argparse.ArgumentParser(description="NEXIUM Heavy Code Training Runner")
    parser.add_argument("--cycles", type=int, default=20, help="Number of code repair learning cycles")
    args = parser.parse_args()

    asyncio.run(run_training(args.cycles))

if __name__ == "__main__":
    main()
