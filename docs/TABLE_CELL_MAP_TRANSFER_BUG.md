# Table Cell Map Transfer Bug

## Problem

Table content is not appearing in Notion output - only horizontal divider lines are shown.

## Root Cause

The `tableCellMap` created in the content script (scanWebpage.js) is not being transferred to `window.__TABLE_CELL_CONTENT_MAP__` in the popup context before the HTML-to-markdown conversion happens.

### Flow Analysis

1. **Content Script (scanWebpage.js)**:
   - Creates `window.__TABLE_CELL_CONTENT_MAP__` with cell content
   - Line 16666: Stores structured payloads: `{paragraphs: [...], images: [...]}`
   - Line 15275: Returns it as `tableCellMap` in scan result

2. **Popup Context (main.js)**:
   - Receives scan result with `tableCellMap` property
   - **BUG**: Never assigns `tableCellMap` to `window.__TABLE_CELL_CONTENT_MAP__`
   - Calls `JZ()` (Turndown conversion) at line 99391

3. **Turndown Conversion (JZ function, line 91536)**:
   - Lines 91651-91665: Diagnostic code checks if `window.__TABLE_CELL_CONTENT_MAP__` exists
   - Finds XCELLIDX markers in HTML but no matching entries in the map
   - Outputs XCELLIDX markers as-is in markdown

4. **Markdown-to-Blocks Conversion (line 99032)**:
   - Lines 99032-99080: Code attempts to expand XCELLIDX markers
   - Looks up markers in `window.__TABLE_CELL_CONTENT_MAP__`
   - **Map is empty**, so markers don't get expanded
   - Only `---` dividers convert to blocks (line 92712)

## Evidence from Log 015

```
scanWebpage.js:33 [scanWebpage/tableCell] Stored XCELLIDX payload: {cellId: 'CELL_x4iymmla', paragraphCount: 0, imageCount: 1, hasDataUrls: true}
...
[JZ/Turndown] __TABLE_CELL_CONTENT_MAP__ keys (count=0):[]
[JZ/Turndown] ⚠️ Found XCELLIDX marker CELL_x4iymmla but no matching entry present in window.__TABLE_CELL_CONTENT_MAP__
```

This shows:

- Content script successfully created XCELLIDX payloads
- Popup's `__TABLE_CELL_CONTENT_MAP__` is empty (0 keys)
- Markers found but no map entries to expand them

## Solution

Need to assign `scanResult.tableCellMap` to `window.__TABLE_CELL_CONTENT_MAP__` in the popup before calling `JZ()` for HTML-to-markdown conversion.

### Where to Fix

The fix needs to be applied wherever scan result content is being converted. Looking at line 99391 where `JZ` is called:

```javascript
// Current code (line 99391):
r = JZ(t, iB);

// Need to add BEFORE this line:
if (scanResult && scanResult.tableCellMap) {
  window.__TABLE_CELL_CONTENT_MAP__ = scanResult.tableCellMap;
  console.log(
    "[Fix] Assigned tableCellMap with",
    Object.keys(scanResult.tableCellMap).length,
    "entries",
  );
}
```

The challenge is that the code is minified, so we need to find where the scan result is being used to call `JZ` or `aB`.

### Alternative Approach

Since the code is bundled/minified, we could also modify the `JZ` function itself to accept an options parameter that includes the tableCellMap:

```javascript
function JZ(e, t, tableCellMap) {
  // Add at the beginning of the function (after line 91536):
  if (tableCellMap) {
    window.__TABLE_CELL_CONTENT_MAP__ = tableCellMap;
    console.log(
      "[JZ] Assigned tableCellMap with",
      Object.keys(tableCellMap).length,
      "entries",
    );
  }

  var n = new zZ({ hr: "---" });
  // ... rest of function
}
```

Then modify callers to pass the tableCellMap parameter.

## Files to Modify

1. **Web-2-Notion/popup/static/js/main.js**:
   - Add tableCellMap assignment before JZ calls (around line 99391, 102141)
   - OR modify JZ function signature to accept tableCellMap

2. **Verification**:
   - Check console logs show "Assigned tableCellMap with X entries"
   - Check XCELLIDX markers are being expanded (no warnings about missing map entries)
   - Check Notion output contains text blocks, not just dividers

## Testing

After fix, should see in console:

```
[Fix] Assigned tableCellMap with 10 entries
[JZ/Turndown] __TABLE_CELL_CONTENT_MAP__ keys (count=10): [...]
[JZ/Turndown] ✓ All XCELLIDX markers have matching map entries
```

And in Notion output:

- Text blocks with paragraph content
- Image blocks
- Horizontal dividers between rows
- NO raw XCELLIDX markers
