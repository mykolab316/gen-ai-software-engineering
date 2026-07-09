#!/usr/bin/env bash
# Enable the coverage-gate pre-push hook for this repository.
#
# Points git's hooksPath at homework-6/.githooks so `git push` runs the
# coverage gate first. Reversible with:  git config --unset core.hooksPath
set -e
HOOKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.githooks"
chmod +x "$HOOKS_DIR/pre-push"
git config core.hooksPath "$HOOKS_DIR"
echo "✅ Coverage-gate pre-push hook enabled (core.hooksPath -> $HOOKS_DIR)"
echo "   Disable with: git config --unset core.hooksPath"
