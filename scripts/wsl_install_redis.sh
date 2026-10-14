#!/usr/bin/env bash
# Install Redis on WSL/Ubuntu and start the service
set -e
sudo apt-get update
sudo apt-get install -y redis-server
sudo systemctl enable redis-server --now || true
sudo service redis-server start || true

echo "Redis installed and started. You can verify with: redis-cli ping"
