#!/usr/bin/env bash
set -euo pipefail

echo "Stopping development environment..."
podman compose -f docker-compose.dev.yml down
