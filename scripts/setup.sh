#!/usr/bin/env bash
# Sets up the project from scratch: checks tools, creates .env, starts containers, waits for the API.
set -euo pipefail

cd "$(dirname "$0")/.."

for tool in docker; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "ERROR: '$tool' is not installed." >&2
    exit 1
  fi
done

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

echo "Starting containers..."
docker compose up -d --build

echo -n "Waiting for the API"
for _ in $(seq 1 30); do
  if curl -sf http://localhost:3000/health >/dev/null; then
    echo
    echo "API ready at http://localhost:3000"
    exit 0
  fi
  echo -n "."
  sleep 2
done

echo
echo "The API did not respond in time. Check logs with: docker compose logs api" >&2
exit 1
