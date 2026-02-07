#!/usr/bin/env bash
# Simple repository check to ensure the in-service-worker unit test and console helpers exist.
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/.." && pwd)"
sw_file="$repo_root/serviceWorker.js"
console_file="$repo_root/test-in-console.js"
popup_file="$repo_root/popup/static/js/main.js"

echo "Checking service worker for runDataUrlReplacementUnitTest..."
if grep -q "runDataUrlReplacementUnitTest" "$sw_file"; then
  echo "  OK: handler found in serviceWorker.js"
else
  echo "  MISSING: runDataUrlReplacementUnitTest not found in serviceWorker.js" >&2
  exit 2
fi

echo "Checking console test for runReplaceUnitTest/testImageReplacementAuto..."
if grep -q "runReplaceUnitTest" "$console_file" && grep -q "testImageReplacementAuto" "$console_file"; then
  echo "  OK: console helpers present"
else
  echo "  MISSING: console helpers not present in test-in-console.js" >&2
  exit 2
fi

echo "Checking popup for runAutomatedReplacementTest..."
if grep -q "runAutomatedReplacementTest" "$popup_file"; then
  echo "  OK: popup automated runner present"
else
  echo "  MISSING: runAutomatedReplacementTest not present in popup/static/js/main.js" >&2
  exit 2
fi

echo "Checking popup UI shim for one-click button..."
if grep -q "stn-image-replacement-test" "$repo_root/popup/shim/ui-augment.js"; then
  echo "  OK: one-click button present in ui-augment.js"
else
  echo "  MISSING: one-click button not found in ui-augment.js" >&2
  exit 2
fi

echo "All image-replacement automated test hooks are present."
exit 0
