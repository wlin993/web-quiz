#!/usr/bin/env bash
# Start backend and frontend dev servers. Ctrl+C stops both.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Kill any existing instances
for PORT in 8000 5173; do
  PIDS=$(lsof -t -i:$PORT 2>/dev/null)
  if [ -n "$PIDS" ]; then
    echo "Killing existing process on port $PORT (PID $PIDS)"
    kill $PIDS 2>/dev/null
  fi
done
# Wait until ports are actually free
for PORT in 8000 5173; do
  for _ in $(seq 1 10); do
    lsof -i:$PORT &>/dev/null || break
    sleep 0.3
  done
done

(cd backend && VIRTUAL_ENV="" uv run uvicorn main:app --reload --port 8000 2>&1) &
BACKEND_PID=$!

(cd frontend && npm run dev 2>&1) &
FRONTEND_PID=$!

echo "Backend  → http://localhost:8000  (PID $BACKEND_PID)"
echo "Frontend → http://localhost:5173  (PID $FRONTEND_PID)"
echo "Press Ctrl+C to stop."

cleanup() {
  echo "Stopping..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

wait "$BACKEND_PID" "$FRONTEND_PID"
