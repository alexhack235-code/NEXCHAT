"""
NEXIUM Autonomous Code Factory - Continuous High-Scale Runner.
Executes autonomous code synthesis, verification, unit testing, and RAG indexing.
Supports scaling up to millions of cycles with flat memory usage and live telemetry.

Usage:
    python scripts/run_code_factory.py --count 1000 --index-rag
    python scripts/run_code_factory.py --count 10000
    python scripts/run_code_factory.py --count 1000000
"""

import os
import sys
import time
import argparse
import gc

# Ensure root directory is on Python path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.code_factory import code_factory

def print_banner():
    print("=" * 75)
    print("  NEXIUM AUTONOMOUS CODE FACTORY - CONTINUOUS SYNTHESIS RUNNER")
    print("  Mass-producing production-grade Algorithms, Data Structures & Systems")
    print("=" * 75)

def run_factory(target_count: int, batch_size: int = 1000, index_rag: bool = False):
    print_banner()
    print(f"[*] Target Iterations  : {target_count:,}")
    print(f"[*] Batch Chunk Size   : {batch_size:,}")
    print(f"[*] Catalog Location   : {code_factory.catalog_file}")
    print(f"[*] Vault Directory    : {code_factory.output_dir}")
    print(f"[*] Index into RAG     : {'YES' if index_rag else 'NO'}")
    print("-" * 75)

    start_global = time.perf_counter()
    completed = 0
    batch_idx = 1

    while completed < target_count:
        chunk_size = min(batch_size, target_count - completed)
        t_batch_start = time.perf_counter()

        def progress_callback(step, total, name):
            cur = completed + step
            pct = (cur / target_count) * 100
            print(f"    -> Progress: {cur:,}/{target_count:,} ({pct:5.1f}%) | Active: {name}")

        result = code_factory.generate_and_verify_batch(
            count=chunk_size,
            write_vault_sample=(batch_idx == 1),
            vault_sample_limit=50,
            stream_to_catalog=True,
            on_progress=progress_callback
        )

        completed += chunk_size
        elapsed_batch = time.perf_counter() - t_batch_start
        overall_elapsed = time.perf_counter() - start_global
        overall_rate = completed / max(overall_elapsed, 0.001)

        pct = (completed / target_count) * 100
        print(f"[Batch {batch_idx:04d}] Completed: {completed:,}/{target_count:,} ({pct:5.1f}%) "
              f"| Batch Rate: {chunk_size / max(elapsed_batch, 0.001):.1f} mod/s "
              f"| Avg Rate: {overall_rate:.1f} mod/s "
              f"| Verified: {result['verified_and_tested']:,}")

        batch_idx += 1
        # Memory safety: force garbage collection between large batches
        gc.collect()

    total_time = time.perf_counter() - start_global
    stats = code_factory.get_stats()

    print("=" * 75)
    print("  SYNTHESIS COMPLETE SUMMARY")
    print("=" * 75)
    print(f"Total Iterations Requested : {target_count:,}")
    print(f"Total Modules Verified     : {stats['total_verified']:,}")
    print(f"Total Unit Tests Passed    : {stats['total_tests_passed']:,}")
    print(f"Catalog Total Records      : {stats['catalog_records']:,}")
    print(f"Catalog Size on Disk       : {stats['catalog_size_kb']} KB")
    print(f"Wall Clock Time Elapsed    : {total_time:.2f}s")
    print(f"Average Throughput         : {target_count / max(total_time, 0.001):.1f} modules/second")
    print(f"Domain Distribution        : {stats['domain_distribution']}")

    if index_rag:
        print("-" * 75)
        print("[*] Ingesting verified algorithmic blueprints into RAG Knowledge Base...")
        t_rag = time.perf_counter()
        ingested_count = code_factory.ingest_into_rag()
        print(f"[+] Ingested {ingested_count} semantic code chunks into RAG store in {time.perf_counter() - t_rag:.2f}s!")

    print("=" * 75)
    print("[+] All synthesized code is ready in the Vault and indexed in NEXIUM!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="NEXIUM Autonomous Code Factory Runner")
    parser.add_argument("--count", type=int, default=5000, help="Number of code modules to synthesize and test")
    parser.add_argument("--batch-size", type=int, default=1000, help="Chunk size for micro-batching")
    parser.add_argument("--index-rag", action="store_true", help="Ingest blueprint code into RAG knowledge store")

    args = parser.parse_args()
    run_factory(target_count=args.count, batch_size=args.batch_size, index_rag=args.index_rag)
