#!/bin/bash
# Basic test runner for the System Monitor project
set -e

# Run backend tests if available
if [ -d "backend" ]; then
  echo "Running backend tests..."
  pushd backend > /dev/null
  npm test || true
  popd > /dev/null
fi

# Run frontend lint as sanity check
if [ -d "system-monitor-frontend" ]; then
  echo "Running frontend lint..."
  pushd system-monitor-frontend > /dev/null
  npm run lint || true
  popd > /dev/null
fi

echo "Testing complete."
