#!/usr/bin/env bash
# Claude Code PreToolUse hook (configured in .claude/settings.json).
#
# Reads the tool-call JSON on stdin. If the Bash command being attempted is a
# `git push`, it runs the coverage gate and blocks the push (exit 2) when
# coverage is below 80%. Any other command is allowed through (exit 0).
input="$(cat)"

# Extract the command from the tool input (best-effort; empty if not Bash).
cmd="$(printf '%s' "$input" | python3 -c \
  'import sys,json;
d=json.load(sys.stdin) if sys.stdin else {};
print(d.get("tool_input",{}).get("command",""))' 2>/dev/null || echo "")"

case "$cmd" in
  *"git push"*)
    DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
    if "$DIR/scripts/check_coverage.sh" >/tmp/coverage-gate.log 2>&1; then
      exit 0  # coverage OK -> allow the push
    fi
    echo "Coverage gate failed (<80%). Push blocked. See /tmp/coverage-gate.log" >&2
    exit 2  # block the tool call
    ;;
  *)
    exit 0  # not a git push -> nothing to gate
    ;;
esac
