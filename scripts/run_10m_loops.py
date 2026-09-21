"""
NEXIUM 10-Million Loop Autonomous Code Factory Runner.
Executes high-throughput continuous code synthesis across 10 Programming Languages:
Python, Rust, TypeScript, Go, C++, C, Java, SQL, Bash, and Zig.

Usage:
    python scripts/run_10m_loops.py --target 50000
    python scripts/run_10m_loops.py --target 1000000
    python scripts/run_10m_loops.py --target 10000000 --block-size 20000 --resume
"""

import os
import sys
import time
import argparse
import gc

# Ensure root directory is in sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.code_factory import code_factory, SUPPORTED_LANGUAGES

def print_header(target: int, block_size: int, resume: bool):
    print("=" * 80)
    print("       NEXIUM 10-MILLION LOOP AUTONOMOUS CODE SYNTHESIS ENGINE")
    print("       Multi-Language Mastery: Python | Rust | TS | Go | C++ | C | Java | SQL | Bash | Zig")
    print("=" * 80)
    print(f"[*] Target Loops       : {target:,}")
    print(f"[*] Block Size         : {block_size:,}")
    print(f"[*] Resume Mode        : {'ENABLED' if resume else 'FRESH'}")
    print(f"[*] Supported Langs    : {len(SUPPORTED_LANGUAGES)} Languages")
    print(f"[*] Checkpoint Store   : {code_factory.checkpoint_file}")
    print(f"[*] Catalog Location   : {code_factory.catalog_file}")
    print("-" * 80)

def format_eta(seconds: float) -> str:
    if seconds < 60:
        return f"{int(seconds)}s"
    elif seconds < 3600:
        return f"{int(seconds // 60)}m {int(seconds % 60)}s"
    else:
        hrs = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        return f"{hrs}h {mins}m"

def run_10m_loops(target: int = 10000000, block_size: int = 10000, resume: bool = False, index_rag: bool = False):
    if resume:
        code_factory.load_checkpoint()
    
    initial_completed = code_factory.total_generated
    if initial_completed >= target:
        print(f"[!] Target {target:,} already reached or exceeded ({initial_completed:,} completed).")
        return

    print_header(target, block_size, resume)
    start_time = time.perf_counter()
    completed = initial_completed
    block_idx = 1

    try:
        while completed < target:
            current_block = min(block_size, target - completed)
            t_block = time.perf_counter()

            # Execute high-throughput vectorized block
            res = code_factory.generate_vectorized_block(
                block_size=current_block,
                sample_catalog_rate=20 # Stream 1 out of 20 to catalog for optimal disk I/O
            )

            completed += current_block
            elapsed_total = time.perf_counter() - start_time
            loops_since_start = completed - initial_completed
            avg_rate = loops_since_start / max(elapsed_total, 0.0001)

            remaining_loops = target - completed
            eta_sec = remaining_loops / max(avg_rate, 1.0)
            pct = (completed / target) * 100

            print(f"[Block {block_idx:05d}] {completed:,}/{target:,} ({pct:5.2f}%) "
                  f"| Rate: {res['rate']:>7.1f} lps "
                  f"| Avg: {avg_rate:>7.1f} lps "
                  f"| ETA: {format_eta(eta_sec):>7} "
                  f"| Langs: Py:{code_factory.language_counts.get('python',0):,} "
                  f"Rs:{code_factory.language_counts.get('rust',0):,} "
                  f"Go:{code_factory.language_counts.get('golang',0):,} "
                  f"Cpp:{code_factory.language_counts.get('cpp',0):,}")

            block_idx += 1
            if block_idx % 5 == 0:
                gc.collect()

    except KeyboardInterrupt:
        print("\n[!] Gracefully pausing loop execution. Checkpoint preserved.")

    total_time = time.perf_counter() - start_time
    stats = code_factory.get_stats()

    print("=" * 80)
    print("                     SYNTHESIS TELEMETRY SUMMARY")
    print("=" * 80)
    print(f"Total Loops Executed       : {code_factory.total_generated:,}")
    print(f"Total Modules Verified     : {code_factory.total_verified:,}")
    print(f"Total Unit Tests Passed    : {code_factory.total_tests_passed:,}")
    print(f"Total Elapsed Time         : {total_time:.2f} seconds")
    print(f"Sustained Loop Rate        : {(completed - initial_completed) / max(total_time, 0.001):.1f} loops/second")
    print(f"Catalog Size on Disk       : {stats['catalog_size_kb']} KB")
    print(f"Language Distribution:")
    for lang, count in stats["language_distribution"].items():
        print(f"  - {lang.upper():<12}: {count:,} modules")

    if index_rag:
        print("-" * 80)
        print("[*] Ingesting multi-language verified code patterns into RAG store...")
        ingested = code_factory.ingest_into_rag()
        print(f"[+] Ingested {ingested} code chunks across all 10 languages into RAG!")

    print("=" * 80)
    print("[+] NEXIUM Multi-Language Autonomous Code Engine is Active and Ready!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="NEXIUM 10-Million Loop Engine")
    parser.add_argument("--target", type=int, default=100000, help="Target loop iterations (up to 10,000,000)")
    parser.add_argument("--block-size", type=int, default=10000, help="Vectorized chunk size per block")
    parser.add_argument("--resume", action="store_true", help="Resume from last checkpoint")
    parser.add_argument("--index-rag", action="store_true", help="Index blueprints into RAG store")

    args = parser.parse_args()
    run_10m_loops(target=args.target, block_size=args.block_size, resume=args.resume, index_rag=args.index_rag)
