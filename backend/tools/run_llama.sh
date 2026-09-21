#!/usr/bin/env bash
set -e

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <ggml-model-file> [prompt text]"
  exit 1
fi

MODEL="$1"
shift || true
PROMPT="$*"

if [ ! -f "$MODEL" ]; then
  echo "Model file not found: $MODEL"
  exit 1
fi

# Path to llama.cpp build
LLAMA_BIN=llama.cpp/main
if [ ! -x "$LLAMA_BIN" ]; then
  echo "llama.cpp binary not found or not built. Run backend/tools/setup_llama_cpp.sh first."
  exit 1
fi

if [ -z "$PROMPT" ]; then
  echo "Starting interactive mode. Type prompt and press Ctrl-D to submit."
  cat | $LLAMA_BIN -m "$MODEL"
else
  $LLAMA_BIN -m "$MODEL" -p "$PROMPT" -n 256
fi
