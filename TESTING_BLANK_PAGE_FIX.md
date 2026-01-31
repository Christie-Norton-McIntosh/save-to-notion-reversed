# Testing Instructions - Blank Page Fix

## What Was Fixed

The "pages are blank" issue was caused by THREE bugs:

1. **Undefined variable** on line 1578 (`customSelector` → `selectorEntries`)
2. **No fallback** when custom selectors didn't match (lines 3132-3165)
3. **Too strict validation** - rejected content with < 100 characters (lines 3543-3574)

## Changes Made

### File: `Web-2-Notion/clipContent.js`

#### Change 1: Line 1578

Fixed undefined variable reference.

#### Change 2: Lines 3132-3165

Added fallback logic to `buildContentFromSelectors()` to call `extractContentData(rootElement, null)` when custom selectors don't match.

#### Change 3: Lines 3543-3574

Improved final fallback in `extractContentData()`:

- Lowered text length threshold from 100 → 10 characters
- Added HTML-only extraction for short text content
- Enhanced logging for debugging

## How to Test

### 1. Reload the Extension

1. Open `chrome://extensions`
2. Find "Save to Notion" extension
3. Click the reload button

### 2. Test on a Real Page

1. Navigate to any webpage (e.g., `https://www.servicenow.com`)
2. Click the extension icon
3. Click "Pick Content"
4. Select some content on the page
5. **Check**: Does content appear in the popup preview?

### 3. Check Console for Logs

Open DevTools Console (F12) and look for messages like:

```
[buildContentFromSelectors] Starting with X selector(s)
[extractContentData] Starting extraction...
✓ [extractContentData] Fallback succeeded - found XXX characters
```

### 4. Test Custom Selectors

1. Go to extension Options
2. Add a custom selector for a domain (e.g., `.article` for a test page)
3. Try to clip content from that page
4. **Check**: Does it work even if the selector doesn't match?

## Expected Results

✅ **Content should appear in popup** - no more blank pages  
✅ **Small elements work** - content with just 10+ characters is extracted  
✅ **Fallback works** - even when selectors don't match, default extraction runs  
✅ **Console shows helpful messages** - you can see what's happening

## If It Still Doesn't Work

Please share:

1. The URL you're testing on
2. Console logs from DevTools (F12 → Console tab)
3. Any error messages
4. What content you're trying to select

## Documentation

- `CUSTOM_SELECTOR_FIX_V2.md` - Complete technical details
- `test/custom-selector-test.html` - Test page for custom selector feature
