#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${1:-docker-compose.dev.yml}"

echo "Resetting database using $COMPOSE_FILE..."
podman compose -f "$COMPOSE_FILE" down -v
podman compose -f "$COMPOSE_FILE" up -d db
echo "Waiting for database to be ready..."
sleep 5
podman compose -f "$COMPOSE_FILE" run --rm migrate
echo "Database reset complete."
