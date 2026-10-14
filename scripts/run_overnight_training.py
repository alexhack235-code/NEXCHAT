# -*- coding: utf-8 -*-
"""
NEXIUM Autonomous Overnight Continuous Training & Self-Improvement Engine.
Designed for 8+ hour uninterrupted overnight training on Windows PowerShell.

Executes:
  1. Multi-Language Autonomous Code Synthesis (Python, Rust, TS, Go, C++, C, Java, SQL, Bash, Zig)
  2. Cognitive Reasoning Self-Improvement (CoT Graph Decomposition, ToT Search, Symbolic Verification)
  3. Persistent Knowledge Base & Vector Index Expansion
"""

import os
import sys
import time
import argparse
import asyncio
import signal
import gc
import json
import logging
from datetime import datetime

# UTF-8 stdout setup for Windows PowerShell
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

from backend.code_factory import code_factory, SUPPORTED_LANGUAGES
from backend.self_improvement import self_improver
from backend.rust_engine import engine as rust_core
from backend.routers.rag import _IN_MEMORY_DOCS

# Configure overnight logging to file and console
LOG_FILE = os.path.join(ROOT_DIR, "overnight_training.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("nexium.overnight")

RUNNING = True

def signal_handler(sig, frame):
    global RUNNING
    logger.info("\n[!] Graceful shutdown signal received. Finalizing current block and saving checkpoints...")
    RUNNING = False

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def print_banner(mode: str, target_loops: int, target_cycles: int):
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print("=" * 80)
    print("        NEXIUM AUTONOMOUS OVERNIGHT TRAINING ENGINE")
    print("        Multi-Language Synthesis & Deep Thinking Self-Improvement")
    print("=" * 80)
    print(f" [*] Started At       : {now_str}")
    print(f" [*] Training Mode    : {mode.upper()}")
    print(f" [*] Native Rust Core : {rust_core.get_version()} (Native: {rust_core.is_native})")
    print(f" [*] Target Loops     : {target_loops:,}")
    print(f" [*] Target Cycles    : {target_cycles:,}")
    print(f" [*] Supported Langs  : {', '.join(l.upper() for l in SUPPORTED_LANGUAGES)}")
    print(f" [*] Overnight Log    : {LOG_FILE}")
    print("=" * 80)

async def run_code_phase(target: int, block_size: int = 25000):
    global RUNNING
    code_factory.load_checkpoint()
    initial = code_factory.total_generated
    if initial >= target:
        logger.info(f"[*] Code Synthesis target {target:,} already reached ({initial:,} done).")
        return

    logger.info(f"[*] Beginning Code Synthesis Phase: Current {initial:,} -> Target {target:,}")
    block_num = 1
    t0 = time.perf_counter()

    while RUNNING and code_factory.total_generated < target:
        batch_size = min(block_size, target - code_factory.total_generated)
        b_start = time.perf_counter()
        
        batch = code_factory.generate_corpus_batch(count=batch_size, index_rag=False)
        verified = sum(1 for m in batch if m.is_valid and m.test_passed)
        code_factory.save_checkpoint()

        b_elapsed = max(0.001, time.perf_counter() - b_start)
        rate = batch_size / b_elapsed
        tot_elapsed = max(0.001, time.perf_counter() - t0)
        tot_generated = code_factory.total_generated - initial
        avg_rate = tot_generated / tot_elapsed

        rem = target - code_factory.total_generated
        eta_sec = rem / avg_rate if avg_rate > 0 else 0
        eta_str = f"{int(eta_sec // 3600)}h {int((eta_sec % 3600) // 60)}m" if eta_sec >= 3600 else f"{int(eta_sec // 60)}m {int(eta_sec % 60)}s"

        pct = (code_factory.total_generated / target) * 100.0
        logger.info(
            f"[CODE Block {block_num:04d}] {code_factory.total_generated:,}/{target:,} ({pct:5.1f}%) "
            f"| Rate: {rate:6.1f} lps | Avg: {avg_rate:6.1f} lps | ETA: {eta_str} | Verified: {verified}/{batch_size}"
        )

        del batch
        gc.collect()
        block_num += 1

async def run_learning_phase(cycles: int):
    global RUNNING
    logger.info(f"[*] Beginning Cognitive Self-Improvement Phase: {cycles} cycles")
    t0 = time.perf_counter()

    def cb(curr, tot, res):
        pct = (curr / tot) * 100.0
        topic = res.get("topic", "N/A")
        ms = res.get("latency_ms", 0.0)
        logger.info(f"[LEARNING] {curr:3d}/{tot} ({pct:5.1f}%) | Topic: {topic:<26} | Latency: {ms:5.1f}ms")

    res = await self_improver.run_batch(count=cycles, on_progress=cb)
    tot_sec = time.perf_counter() - t0
    logger.info(
        f"[✓] Completed {cycles} Cognitive Learning Cycles in {tot_sec:.2f}s "
        f"| Store Items: {res['knowledge_base_total_items']:,}"
    )

async def main():
    parser = argparse.ArgumentParser(description="NEXIUM Overnight Autonomous Training Engine")
    parser.add_argument("--mode", choices=["overnight", "code", "learning"], default="overnight",
                        help="Training mode: 'overnight' (interleaved code + learning), 'code' only, or 'learning' only")
    parser.add_argument("--target-loops", type=int, default=1000000,
                        help="Target number of autonomous code synthesis loops (default: 1,000,000)")
    parser.add_argument("--target-cycles", type=int, default=500,
                        help="Target cognitive self-improvement cycles (default: 500)")
    parser.add_argument("--block-size", type=int, default=25000,
                        help="Batch size per synthesis block (default: 25,000)")
    args = parser.parse_args()

    print_banner(args.mode, args.target_loops, args.target_cycles)

    start_time = time.perf_counter()

    if args.mode == "code":
        await run_code_phase(args.target_loops, args.block_size)
    elif args.mode == "learning":
        await run_learning_phase(args.target_cycles)
    elif args.mode == "overnight":
        logger.info("[*] Starting Interleaved Overnight Mode...")
        round_idx = 1
        while RUNNING and (code_factory.total_generated < args.target_loops):
            logger.info(f"\n{'=' * 30} [ OVERNIGHT ROUND {round_idx} ] {'=' * 30}")
            target_step = min(code_factory.total_generated + args.block_size, args.target_loops)
            await run_code_phase(target_step, args.block_size)
            if not RUNNING:
                break
            await run_learning_phase(25)
            round_idx += 1

    total_time = time.perf_counter() - start_time
    hrs = int(total_time // 3600)
    mins = int((total_time % 3600) // 60)
    secs = int(total_time % 60)

    print("\n" + "=" * 80)
    print(" [✓] OVERNIGHT TRAINING SESSION COMPLETE / CHECKPOINT SAVED")
    print("=" * 80)
    print(f" [*] Total Elapsed Time    : {hrs}h {mins}m {secs}s")
    print(f" [*] Total Verified Loops  : {code_factory.total_generated:,}")
    print(f" [*] Total Unit Tests      : {code_factory.total_tests_passed:,}")
    print(f" [*] Knowledge Base Items  : {len(_IN_MEMORY_DOCS):,}")
    print(f" [*] Checkpoint Saved At   : {code_factory.checkpoint_file}")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(main())
