#!/usr/bin/env bash
set -euo pipefail

echo "Stopping production environment..."
podman compose -f docker-compose.yml down
