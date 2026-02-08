#!/bin/bash

# Comprehensive test script to verify the fixes

echo "🔬 Comprehensive Fix Verification"
echo "=================================="
echo ""

# Test 1: Check that code changes are present
echo "1️⃣  Checking code changes in popup/main.js..."
if grep -q "data-stn-preserve" Web-2-Notion/popup/static/js/main.js; then
  echo "   ✅ Found data-stn-preserve attribute code"
else
  echo "   ❌ Missing data-stn-preserve attribute code"
fi

if grep -q "Use anchor href even if it's a viewer page" Web-2-Notion/popup/static/js/main.js; then
  echo "   ✅ Found viewer page comment (new behavior)"
else
  echo "   ⚠️  Old comment still present or missing"
fi

# Test 2: Check options.js
echo ""
echo "2️⃣  Checking code changes in options.js..."
if grep -q "data-stn-preserve" Web-2-Notion/options.js; then
  echo "   ✅ Found data-stn-preserve attribute code"
else
  echo "   ❌ Missing data-stn-preserve attribute code"
fi

if grep -q "ServiceNow.*viewer/attachment.*valid" Web-2-Notion/options.js; then
  echo "   ✅ Found ServiceNow viewer comment (new behavior)"
else
  echo "   ⚠️  May still have restrictive viewer check"
fi

# Count occurrences of the old bad pattern
echo ""
echo "3️⃣  Checking for old problematic patterns..."
OLD_PATTERN_COUNT=$(grep -c "parentAnchor\.replaceWith(replacement)" Web-2-Notion/popup/static/js/main.js 2>/dev/null || echo "0")
echo "   Found $OLD_PATTERN_COUNT occurrences of 'parentAnchor.replaceWith(replacement)'"
if [ "$OLD_PATTERN_COUNT" -eq "0" ]; then
  echo "   ✅ No old pattern found (good!)"
else
  echo "   ⚠️  Still has $OLD_PATTERN_COUNT occurrences - may be in else branches"
fi

# Test 4: Run all unit tests
echo ""
echo "4️⃣  Running unit tests..."
cd Web-2-Notion
npm test 2>&1 | tail -5

# Test 5: Check git status
echo ""
echo "5️⃣  Git status..."
cd ..
UNCOMMITTED=$(git status --porcelain | wc -l)
if [ "$UNCOMMITTED" -gt "0" ]; then
  echo "   ⚠️  $UNCOMMITTED uncommitted changes"
  echo "   Run: git status"
else
  echo "   ✅ All changes committed"
fi

UNPUSHED=$(git log origin/$(git branch --show-current)..HEAD --oneline | wc -l)
if [ "$UNPUSHED" -gt "0" ]; then
  echo "   ⚠️  $UNPUSHED unpushed commits"
  echo "   Run: git push"
else
  echo "   ✅ All changes pushed"
fi

echo ""
echo "=================================="
echo "📋 SUMMARY & NEXT STEPS:"
echo ""
echo "If all checks pass above, the code is correct."
echo "If the issue persists in the extension:"
echo ""
echo "1. Unload the extension completely:"
echo "   - Go to chrome://extensions/"
echo "   - Click 'Remove' on Save to Notion"
echo ""
echo "2. Reload from disk:"
echo "   - Click 'Load unpacked'"
echo "   - Select: $(pwd)/Web-2-Notion"
echo ""
echo "3. Verify in browser console:"
echo "   - Open ServiceNow page"
echo "   - Press F12, go to Console tab"
echo "   - Paste and run: $(pwd)/Web-2-Notion/DIAGNOSTIC_BROWSER_CONSOLE.js"
echo ""
echo "4. Test the save:"
echo "   - Click extension icon"
echo "   - Click 'Save to Notion'"
echo "   - Check the preview in popup"
echo "   - Verify spacing and images"
echo ""
echo "=================================="
