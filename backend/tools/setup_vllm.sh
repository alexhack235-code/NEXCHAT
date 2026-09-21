#!/usr/bin/env bash
set -e

echo "Setup script to prepare vLLM environment and download Qwen3.8-27B"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PYENV_DIR="$ROOT_DIR/.venv_vllm"
MODEL_DIR="$ROOT_DIR/models/Qwen3.8-27B"

echo "Root: $ROOT_DIR"

if [ ! -d "$PYENV_DIR" ]; then
  python3 -m venv "$PYENV_DIR"
fi

source "$PYENV_DIR/bin/activate"
pip install --upgrade pip

echo "Installing vllm and huggingface_hub (may require CUDA-capable PyTorch for GPU)"
pip install vllm huggingface_hub

echo "Prepare model directory: $MODEL_DIR"
mkdir -p "$MODEL_DIR"

cat <<'EOF'
Now you can download the model using the huggingface_hub snapshot_download command.
If you are behind a token-protected repo, run `huggingface-cli login` first.

Example to download into the models directory:

python3 - <<'PY'
from huggingface_hub import snapshot_download
snapshot_download(repo_id="Qwen/Qwen3.8-27B", local_dir="backend/models/Qwen3.8-27B")
print('Downloaded to backend/models/Qwen3.8-27B')
PY

After the model downloads, start vllm serving:

vllm serve --model backend/models/Qwen3.8-27B --port 8001

If you have GPU and require a specific PyTorch+CUDA build, install the appropriate torch first per vLLM docs.
EOF

echo "Setup complete. Activate the virtualenv and follow the printed instructions to download and serve the model."
