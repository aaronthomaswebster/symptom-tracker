#!/usr/bin/env bash
set -euo pipefail

echo "Building and starting production environment..."
podman compose -f docker-compose.yml up --build -d

echo ""
echo "Waiting for services to start..."
sleep 5

echo "Running database migration..."
podman compose -f docker-compose.yml run --rm migrate

echo ""
echo "Production environment is running!"
echo "  Frontend: http://localhost"
echo "  API:      http://localhost:3000"
