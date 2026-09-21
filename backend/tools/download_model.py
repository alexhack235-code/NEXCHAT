#!/usr/bin/env python3
"""
Download a model file (e.g., a GGML .bin) from Hugging Face using huggingface_hub.
Usage:
  python download_model.py --repo-id <owner/model-repo> --filename <ggml-file-name> --dest models/

You must be logged in (`huggingface-cli login`) or set HF_TOKEN env var.
"""
import argparse
import os
from huggingface_hub import hf_hub_download


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-id", required=True, help="Hugging Face repo id (owner/model)")
    parser.add_argument("--filename", required=True, help="File name inside the repo (e.g. ggml-model-q4_0.bin)")
    parser.add_argument("--dest", default="models", help="Destination folder")
    args = parser.parse_args()

    repo_id = args.repo_id
    filename = args.filename
    dest = args.dest
    os.makedirs(dest, exist_ok=True)

    print(f"Downloading {filename} from {repo_id}...")
    try:
        path = hf_hub_download(repo_id=repo_id, filename=filename)
        # hf_hub_download may already cache and return a path; copy to dest
        dst_path = os.path.join(dest, os.path.basename(path))
        if os.path.abspath(path) != os.path.abspath(dst_path):
            with open(path, "rb") as rf, open(dst_path, "wb") as wf:
                wf.write(rf.read())
        print("Saved to:", dst_path)
    except Exception as e:
        print("Failed to download:", e)
        print("Make sure you've accepted the model license on huggingface.co and run `huggingface-cli login`.")


if __name__ == "__main__":
    main()
