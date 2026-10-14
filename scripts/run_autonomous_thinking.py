# -*- coding: utf-8 -*-
"""
NEXIUM Autonomous Thinking & Self-Improvement Runner.
Allows NEXIUM to run continuous cognitive thinking loops in the background or terminal:
- Metacognitive self-assessment
- Inner monologue stream generation
- Self-directed goal creation and progress tracking
- Proactive knowledge base expansion

Usage:
    python scripts/run_autonomous_thinking.py --cycles 10
    python scripts/run_autonomous_thinking.py --continuous --interval 5
"""

import os
import sys
import time
import argparse
from datetime import datetime

# Configure UTF-8 stdout
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

from backend.autonomous_mind import autonomous_mind
from backend.rust_engine import engine as rust_core

def print_banner():
    print("=" * 75)
    print("    NEXIUM AUTONOMOUS THINKING ENGINE (ATE) - COGNITIVE RUNNER")
    print("    Inner Monologue | Metacognition | Self-Directed Goals | Learning")
    print(f"    Native Rust Core : {rust_core.get_version()} (Native: {rust_core.is_native})")
    print("=" * 75)

def run_cycle(cycle_num: int):
    res = autonomous_mind.think()
    thought = res["thought"]
    awareness = res["self_awareness"]
    
    print(f"\n[CYCLE #{res['cycle']:03d}] at {datetime.now().strftime('%H:%M:%S')} (Latency: {res['latency_ms']}ms)")
    print(f"  🧠 Thought : {thought['text']}")
    print(f"  🎯 Goals   : {res['active_goals']} active / {res['total_goals']} total")
    print(f"  📊 Metacog : Avg Confidence {awareness['average_confidence']:.1%} | Assessments: {awareness['total_assessments']}")
    if awareness['detected_blind_spots']:
        print(f"  🔍 Gaps    : {', '.join(awareness['detected_blind_spots'][-3:])}")
    print("-" * 75)

def main():
    parser = argparse.ArgumentParser(description="NEXIUM Autonomous Thinking Runner")
    parser.add_argument("--cycles", type=int, default=5, help="Number of thinking cycles to run")
    parser.add_argument("--continuous", action="store_true", help="Run indefinitely in continuous background thinking loop")
    parser.add_argument("--interval", type=int, default=5, help="Seconds to sleep between continuous thinking cycles")
    args = parser.parse_args()

    print_banner()

    if args.continuous:
        print(f"[*] Starting continuous autonomous thinking loop (Interval: {args.interval}s). Press Ctrl+C to stop.\n")
        cycle = 1
        try:
            while True:
                run_cycle(cycle)
                cycle += 1
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\n[!] Autonomous thinking loop paused.")
    else:
        print(f"[*] Executing {args.cycles} autonomous thinking cycles...\n")
        for i in range(1, args.cycles + 1):
            run_cycle(i)
            if i < args.cycles:
                time.sleep(1)

    print("\n" + "=" * 75)
    print(" [✓] Autonomous thinking session completed.")
    mind_state = autonomous_mind.get_mind_state()
    print(f" Total Autonomous Thoughts: {mind_state['thought_stream']['total_thoughts']}")
    print(f" Total Active Goals:       {len(mind_state['active_goals'])}")
    print("=" * 75)

if __name__ == "__main__":
    main()
