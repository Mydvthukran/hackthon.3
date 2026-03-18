#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Building frontend..."
cd "$SCRIPT_DIR/frontend"
npm install
npm run build

echo "==> Starting backend..."
cd "$SCRIPT_DIR/backend"
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
