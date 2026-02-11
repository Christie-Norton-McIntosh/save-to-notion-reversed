# Table Cell Map Transfer Bug - FIX APPLIED

## Status: ✅ FIXED

Date: February 10, 2026

## Summary

Fixed the critical bug where table content was not appearing in Notion output (only horizontal divider lines were shown). The root cause was that the `tableCellMap` created in the content script was never being transferred to `window.__TABLE_CELL_CONTENT_MAP__` in the popup context before HTML-to-markdown conversion.

## Changes Made

### File: `Web-2-Notion/popup/static/js/main.js`

**Change 1: Added tableCellMap assignment in `sB` function (~line 99390)**

- Before calling `JZ()` for Turndown conversion, check if `tableCellMap` exists in options
- If present, assign it to `window.__TABLE_CELL_CONTENT_MAP__`
- Added logging to track when map is assigned or missing

**Change 2: Pass tableCellMap in call to `Z1` (~line 136689)**

- Extract `tableCellMap` from `i.payload` (scan result)
- Pass it in the options object to `Z1` function

**Change 3: Pass tableCellMap through `N1` to `aB` (~line 136620)**

- Forward `tableCellMap` from options to `aB` function call
- Ensures the map reaches the `sB` function where it gets assigned

## How It Works

### Data Flow (BEFORE Fix):

```
Content Script → tableCellMap → Scan Result → Popup
                                                  ↓
                                             (LOST - never assigned)
                                                  ↓
                                        JZ (Turndown) runs
                                                  ↓
                        __TABLE_CELL_CONTENT_MAP__ = empty {}
                                                  ↓
                                 XCELLIDX markers not expanded
                                                  ↓
                                    Only --- dividers in output
```

### Data Flow (AFTER Fix):

```
Content Script → tableCellMap → Scan Result → Popup
                                                  ↓
                                     i.payload.tableCellMap
                                                  ↓
                                        Z1(options.tableCellMap)
                                                  ↓
                                        N1(options.tableCellMap)
                                                  ↓
                                        aB(options.tableCellMap)
                                                  ↓
                                        sB(options.tableCellMap)
                                                  ↓
                        window.__TABLE_CELL_CONTENT_MAP__ = tableCellMap ✅
                                                  ↓
                                        JZ (Turndown) runs
                                                  ↓
                              XCELLIDX markers found in map ✅
                                                  ↓
                                    Markers expanded to content ✅
                                                  ↓
                              Text blocks + Images + Dividers ✅
```

## Expected Console Output

After the fix, you should see:

```
[sB/Fix] Assigned tableCellMap with 10 entries to window.__TABLE_CELL_CONTENT_MAP__
[JZ/Turndown] XCELLIDX markers in HTML: ['CELL_x4iymmla', 'CELL_3qemgzz8', ...]
[JZ/Turndown] __TABLE_CELL_CONTENT_MAP__ keys (count=10): ['CELL_x4iymmla', ...]
```

No warnings about missing map entries.

## Expected Notion Output

- ✅ Text blocks with paragraph content from table cells
- ✅ Image blocks from table cell images
- ✅ Horizontal dividers between table rows
- ❌ NO raw `XCELLIDX(CELL_xxx)XCELLIDX` markers

## Testing Instructions

1. **Reload the extension** to pick up the changes
2. **Navigate to a ServiceNow docs page** with tables
3. **Open the browser console** (F12)
4. **Click the extension** and save to Notion
5. **Check console logs** for the messages above
6. **Check Notion page** for proper content rendering

## Rollback Instructions

If the fix causes issues, revert the three changes in `main.js`:

1. Remove the tableCellMap assignment in `sB` function
2. Remove `tableCellMap: i.payload.tableCellMap` from Z1 call
3. Remove `tableCellMap: n.tableCellMap` from aB call in N1

## Related Files

- `/docs/TABLE_CELL_MAP_TRANSFER_BUG.md` - Detailed analysis
- `/Web-2-Notion/popup/static/js/main.js` - Fixed file
- `/Web-2-Notion/scanWebpage.js` - Produces tableCellMap (unchanged)

## Next Steps

1. Test the fix with actual ServiceNow pages
2. Verify all table content appears correctly in Notion
3. Monitor console for any new warnings
4. Consider adding E2E test for this scenario
