#!/usr/bin/env bash
# Robust Multi-Core Parallel Job Executor with Signal Interception
# Module: parallel_job_worker_13_085654 | Concurrency Slots: 70
set -euo pipefail

MAX_JOBS=70
CURRENT_JOBS=0

cleanup() {
    echo "[!] Trapped interrupt signal. Terminating child worker processes..."
    kill -TERM 0 || true
    wait
    exit 1
}
trap cleanup SIGINT SIGTERM

run_task() {
    local task_id="$1"
    echo "[+] Worker processing task $task_id..."
    sleep 0.01
}

for i in $(seq 1 100); do
    run_task "$i" &
    CURRENT_JOBS=$((CURRENT_JOBS + 1))
    if [ "$CURRENT_JOBS" -ge "$MAX_JOBS" ]; then
        wait -n
        CURRENT_JOBS=$((CURRENT_JOBS - 1))
    fi
done
wait
echo "[*] All parallel jobs finished successfully."
