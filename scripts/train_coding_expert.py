"""
CLI Runner to execute 1,000 Coding Training and Ingestion Cycles.
"""

import sys
import os
import time

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from code_trainer import code_trainer
from rust_engine import engine as rust_core

def main():
    target_count = 1000
    print("=" * 70)
    print(" [*] NEXIUM ELITE CODING PATTERN SYNTHESIS & INGESTION (1,000 CYCLES)")
    print(f" Engine: {rust_core.get_version()} (Native: {rust_core.is_native})")
    print("=" * 70)

    def progress(current, total, problem):
        pct = (current / total) * 100
        bar = "=" * int(pct // 5) + "-" * (20 - int(pct // 5))
        topic = problem["title"][:32]
        print(f"[{bar}] {current:4d}/{total} ({pct:5.1f}%) | Indexed: {topic}")

    summary = code_trainer.train_batch(count=target_count, on_progress=progress)

    print("\n" + "=" * 70)
    print(" [SUCCESS] 1,000 EXPERT CODING PATTERNS SYNTHESIZED & INDEXED")
    print("=" * 70)
    print(f" [✓] Total Patterns Generated:     {summary['patterns_synthesized']}")
    print(f" [✓] Total Chunks Created:         {summary['total_chunks_created']}")
    print(f" [✓] Total Knowledge Base Size:    {summary['total_knowledge_store_size']} items")
    print(f" [✓] Time Elapsed:                 {summary['elapsed_seconds']}s ({summary['patterns_per_second']} patterns/sec)")
    print(f" [✓] Native Rust Chunker Active:   {summary['rust_accelerated']}")
    print(f" [✓] Permanent Store File:         {summary['store_path']}")
    print("=" * 70)

if __name__ == "__main__":
    main()
