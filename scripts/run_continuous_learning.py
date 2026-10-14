"""
CLI Runner to execute NEXIUM's cognitive self-improvement loop 100 times.
"""

import sys
import os
import asyncio
import time

# Reconfigure stdout for utf-8 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure backend is on sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from self_improvement import self_improver
from rust_engine import engine as rust_core

async def main():
    target_cycles = 100
    print("=" * 70)
    print(" [*] NEXIUM AUTONOMOUS SELF-IMPROVEMENT & CONTINUOUS LEARNING ENGINE")
    print(f" Engine: {rust_core.get_version()} (Native: {rust_core.is_native})")
    print(f" Target Cycles: {target_cycles} iterations")
    print("=" * 70)

    start_all = time.perf_counter()

    def progress_callback(current, total, last_result):
        pct = (current / total) * 100
        bar = "=" * int(pct // 5) + "-" * (20 - int(pct // 5))
        topic = last_result.get("topic", "N/A")
        ms = last_result.get("latency_ms", 0.0)
        print(f"[{bar}] {current:3d}/{total} ({pct:5.1f}%) | Last: {topic:<28} | {ms:5.1f}ms")

    summary = await self_improver.run_batch(count=target_cycles, on_progress=progress_callback)

    print("\n" + "=" * 70)
    print(" [SUCCESS] 100 ITERATIONS CONTINUOUS LEARNING COMPLETED")
    print("=" * 70)
    print(f" [✓] Total Iterations Completed:  {summary['total_iterations_run']}")
    print(f" [✓] Successful Verified Cycles:  {summary['successful_cycles']} ({summary['success_rate']})")
    print(f" [✓] Knowledge Chunks Ingested:   {summary['total_knowledge_chunks_ingested']}")
    print(f" [✓] Total Time Elapsed:          {summary['total_elapsed_seconds']} seconds")
    print(f" [✓] Average Latency per Cycle:   {summary['average_ms_per_cycle']} ms/cycle")
    print(f" [✓] Native Rust Core Active:     {summary['rust_accelerated']}")
    print(f" [✓] Total Items in Vector Store: {summary['knowledge_base_total_items']}")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())
