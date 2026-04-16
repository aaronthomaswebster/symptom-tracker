#!/usr/bin/env bash
set -euo pipefail

echo "Starting development environment..."
podman compose -f docker-compose.dev.yml up --build
