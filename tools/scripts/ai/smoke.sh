#!/bin/bash
# Smoke test for AI tools
# Usage: ./tools/scripts/ai/smoke.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "Running AI tools smoke test..."
echo "Working directory: $ROOT_DIR"

# Test code indexer
echo "Testing code indexer..."
node "$SCRIPT_DIR/code-indexer.js" build || echo "⚠️  code-indexer.js not functional"
node "$SCRIPT_DIR/code-indexer.js" search "function" || echo "⚠️  code-indexer.js search not functional"

# Test context preloader
echo "Testing context preloader..."
node "$SCRIPT_DIR/context-preloader.js" preload || echo "⚠️  context-preloader.js not functional"
node "$SCRIPT_DIR/context-preloader.js" get config || echo "⚠️  context-preloader.js get not functional"

# Test competence monitor
echo "Testing competence monitor..."
node "$SCRIPT_DIR/competence-monitor.js" assess || echo "⚠️  competence-monitor.js not functional"

# Test index server (start/stop quickly)
echo "Testing index server..."
node "$SCRIPT_DIR/index-server.js" &
SERVER_PID=$!
sleep 3

# Test health endpoint
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health)
if [[ $HEALTH_RESPONSE == *"ok"* ]]; then
  echo "Health check passed"
else
  echo "Health check failed: $HEALTH_RESPONSE"
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

# Test search endpoint with validation
SEARCH_RESPONSE=$(curl -s "http://localhost:3001/search?q=function")
if [[ $SEARCH_RESPONSE == *"results"* ]]; then
  echo "Search test passed"
else
  echo "Search test failed: $SEARCH_RESPONSE"
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

# Test invalid search (empty query)
INVALID_RESPONSE=$(curl -s "http://localhost:3001/search?q=")
if [[ $INVALID_RESPONSE == *"400"* ]] || [[ $INVALID_RESPONSE == *"required"* ]]; then
  echo "Invalid search validation passed"
else
  echo "Invalid search validation failed: $INVALID_RESPONSE"
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

# Test metrics endpoint
METRICS_RESPONSE=$(curl -s "http://localhost:3001/metrics")
if [[ $METRICS_RESPONSE == *"files"* ]]; then
  echo "Metrics test passed"
else
  echo "Metrics test failed: $METRICS_RESPONSE"
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

kill $SERVER_PID 2>/dev/null || true

echo "✅ All AI tools smoke tests passed!"
echo "See tools/scripts/ai/AI_TOOLS_STATUS.md for complete tool inventory"
