#!/usr/bin/env bash
set -e

# Setup script for llama.cpp on Ubuntu/WSL
# - installs build dependencies
# - clones and builds llama.cpp
# - installs Python deps needed for download_model.py

echo "Updating package lists..."
sudo apt-get update

echo "Installing build tools and python..."
sudo apt-get install -y build-essential cmake git python3 python3-pip curl

# Clone llama.cpp if not present
if [ ! -d "llama.cpp" ]; then
  echo "Cloning llama.cpp..."
  git clone https://github.com/ggerganov/llama.cpp.git
fi

echo "Building llama.cpp..."
cd llama.cpp
make clean || true
make -j$(nproc)
cd ..

echo "Installing Python requirements (huggingface_hub)..."
python3 -m pip install --upgrade pip
python3 -m pip install huggingface_hub

mkdir -p models

echo "Setup complete. To download a GGML model, run (example):"
echo "python3 backend/tools/download_model.py --repo-id TheBloke/Wizard-Vicuna-7B-GGML --filename ggml-wizard-vicuna-7b-q4_0.bin --dest models/"

echo "After downloading, run the model with:"
echo "./llama.cpp/main -m models/<your-ggml-file>.bin -p \"Your prompt here\" -n 128"
