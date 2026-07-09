#!/usr/bin/env bash
# One-shot demo of the whole system.
#
#   ./demo.sh            start agents + gateway, run the pipeline, open the dashboard
#   ./demo.sh --no-ui    start agents, run the pipeline, print the summary, exit
#
# Agent order and ports come from pipeline-config.json.
# Written for bash 3.2 (the macOS default) — no mapfile / associative arrays.
set -euo pipefail

HW_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HW_DIR"

BACKEND_PORT=8000
FRONTEND_PORT=5173
WITH_UI=1

for arg in "$@"; do
  case "$arg" in
    --no-ui) WITH_UI=0 ;;
    -h|--help)
      sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

if [ -x ".venv/bin/python" ]; then
  PY=".venv/bin/python"
else
  echo "❌ .venv not found. Run:" >&2
  echo "   python3.12 -m venv .venv && .venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi

# ------------------------------------------------------------------ helpers
# Free a port, but only if it is held by one of *our* services. Anything else
# is the user's process — report it and bail rather than killing it.
free_port() {
  port="$1"
  pids="$(lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  [ -z "$pids" ] && return 0
  for pid in $pids; do
    cmd="$(ps -o command= -p "$pid" 2>/dev/null || true)"
    case "$cmd" in
      *uvicorn*|*vite*|*esbuild*)
        kill "$pid" 2>/dev/null || true
        ;;
      *)
        echo "❌ Port $port is held by another process (pid $pid):" >&2
        echo "   $cmd" >&2
        echo "   Free it and re-run." >&2
        exit 1
        ;;
    esac
  done
  sleep 1
}

# Wait until an HTTP endpoint answers (or give up after ~15s).
wait_for() {
  url="$1"; label="$2"
  for _ in $(seq 1 60); do
    if curl -sf "$url" >/dev/null 2>&1; then
      echo "   ✔ $label ready"
      return 0
    fi
    sleep 0.25
  done
  echo "   ✘ $label FAILED to start" >&2
  return 1
}

PIDS=""
ALL_PORTS=""

cleanup() {
  echo ""
  echo "🧹 Stopping services…"
  for pid in $PIDS; do
    kill "$pid" 2>/dev/null || true
  done
  # Safety net: reap anything of ours still holding a port (e.g. npm children).
  for port in $ALL_PORTS; do
    pids="$(lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null || true)"
    for pid in $pids; do
      cmd="$(ps -o command= -p "$pid" 2>/dev/null || true)"
      case "$cmd" in
        *uvicorn*|*vite*|*esbuild*) kill "$pid" 2>/dev/null || true ;;
      esac
    done
  done
  echo "✅ Done."
}
trap cleanup EXIT INT TERM

# ------------------------------------------------------------------- agents
# Agent name|module|port lines, read straight from the config (single source of truth).
AGENT_LINES="$($PY -c '
import json
cfg = json.load(open("pipeline-config.json"))
for a in cfg["agents"]:
    print("%s|%s|%s" % (a["name"], a["module"], a["port"]))
')"

# Collect every port we will use, then make sure they are free.
while IFS="|" read -r name module port; do
  [ -z "$name" ] && continue
  ALL_PORTS="$ALL_PORTS $port"
done <<< "$AGENT_LINES"
if [ "$WITH_UI" -eq 1 ]; then
  ALL_PORTS="$ALL_PORTS $BACKEND_PORT $FRONTEND_PORT"
fi

echo "🔎 Checking ports…"
for port in $ALL_PORTS; do
  free_port "$port"
done

echo ""
echo "🚀 Starting agent microservices…"
while IFS="|" read -r name module port; do
  [ -z "$name" ] && continue
  $PY -m uvicorn "$module" --port "$port" --log-level warning \
      >"/tmp/agent-$name.log" 2>&1 &
  PIDS="$PIDS $!"
  echo "   • $name  →  http://localhost:$port"
done <<< "$AGENT_LINES"

echo ""
echo "⏳ Waiting for agent services…"
while IFS="|" read -r name module port; do
  [ -z "$name" ] && continue
  wait_for "http://localhost:$port/health" "$name" || {
    echo "     see /tmp/agent-$name.log" >&2; exit 1; }
done <<< "$AGENT_LINES"

# ------------------------------------------------------------------ gateway
if [ "$WITH_UI" -eq 1 ]; then
  echo ""
  echo "🌐 Starting API gateway on :$BACKEND_PORT…"
  $PY -m uvicorn backend.api:app --port "$BACKEND_PORT" --log-level warning \
      >/tmp/gateway.log 2>&1 &
  PIDS="$PIDS $!"
  wait_for "http://localhost:$BACKEND_PORT/api/health" "gateway" || {
    echo "     see /tmp/gateway.log" >&2; exit 1; }
fi

# ----------------------------------------------------------------- pipeline
echo ""
echo "▶️  Running the pipeline through the agent services…"
echo ""
$PY orchestrator.py

COUNT="$(ls shared/results/*.json 2>/dev/null | grep -vc _summary || true)"
echo "📄 Results written to shared/results/ (${COUNT:-0} transactions)"

if [ "$WITH_UI" -eq 0 ]; then
  exit 0
fi

# ----------------------------------------------------------------- frontend
if ! command -v npm >/dev/null 2>&1; then
  echo "⚠️  npm not found — skipping the dashboard. Results are in shared/results/." >&2
  exit 0
fi

if [ ! -d "frontend/node_modules" ]; then
  echo ""
  echo "📦 Installing frontend dependencies (first run)…"
  (cd frontend && npm install --silent)
fi

echo ""
echo "🖥️  Starting the dashboard on :$FRONTEND_PORT…"
# `exec` replaces the subshell with vite, so $! is vite's real PID and the
# cleanup trap can actually kill it (running it via `npm` would not).
# --strictPort makes vite fail loudly instead of silently moving to 5174.
( cd frontend && exec node_modules/.bin/vite --port "$FRONTEND_PORT" --strictPort ) \
    >/tmp/frontend.log 2>&1 &
PIDS="$PIDS $!"
wait_for "http://localhost:$FRONTEND_PORT" "dashboard" || {
  echo "     see /tmp/frontend.log" >&2; exit 1; }

# Open the browser (macOS `open`, Linux `xdg-open`).
if command -v open >/dev/null 2>&1; then
  open "http://localhost:$FRONTEND_PORT"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1 || true
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "  ✅ Everything is running"
echo ""
echo "  Dashboard : http://localhost:$FRONTEND_PORT"
echo "  Gateway   : http://localhost:$BACKEND_PORT/api/results"
echo ""
echo "  The pipeline already ran — results are on screen."
echo "  Click ▶ Run Pipeline to run it again through the agents."
echo ""
echo "  Press Ctrl+C to stop everything."
echo "════════════════════════════════════════════════════════"

# Block until the user interrupts; the EXIT trap cleans up.
while true; do sleep 1; done
