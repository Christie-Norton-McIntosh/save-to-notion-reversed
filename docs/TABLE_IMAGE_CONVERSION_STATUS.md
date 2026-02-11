# Table with Images Conversion - Status Document

**Date:** February 10, 2026  
**Branch:** `fix/table-to-list-restore`  
**Issue:** Tables with images converting to only horizontal divider lines, no text or images

---

## Current Status: IN PROGRESS

The table conversion system has been redesigned and is now in the final stages of implementation. The core architecture is in place but requires testing to confirm full functionality.

---

## Problem Summary

**Original Issue:**

- Tables with images were converting to only horizontal divider lines (`---`)
- No text content appearing
- No images appearing
- Only row separators visible in final Notion output

**User Requirements:**

1. Remove bullet placeholders (• text •) from output
2. Convert table cells to plain text blocks (not bullets)
3. Keep HTML blocks together as single Notion blocks
4. Preserve horizontal dividers between rows (`---`)
5. Handle images properly (both inline and data URLs)

---

## Architecture Design: XCELLIDX Marker System

### Overview

A two-phase system for preserving table cell content through the conversion pipeline:

**Phase 1: Content Script (scanWebpage.js)**

- Scan table cells and extract structured content
- Create unique cell IDs
- Store content payloads in a map
- Insert markers into HTML

**Phase 2: Popup (main.js)**

- Transfer content map from content script to popup context
- Preserve markers through Turndown HTML→Markdown conversion
- Expand markers in markdown by replacing with actual content

### Data Flow

```
1. scanWebpage.js (content script context)
   ↓ Scans <table> → Processes <td>/<th>
   ↓ Creates XCELLIDX payloads
   ↓ Stores in window.__TABLE_CELL_CONTENT_MAP__
   ↓ Inserts <span data-xcellidx="CELL_xxx"></span> markers
   ↓
2. Message passing (Chrome extension API)
   ↓ Scan result with .content (HTML) and .tableCellMap
   ↓
3. main.js (popup context)
   ↓ BB function receives HTML and tableCellMap
   ↓ Passes to aB → sB
   ↓ sB assigns tableCellMap to window.__TABLE_CELL_CONTENT_MAP__
   ↓
4. JZ/Turndown conversion
   ↓ Custom rule converts <span data-xcellidx="..."> → XCELLIDXCELL_xxxXCELLIDX
   ↓ Preserves markers in markdown output
   ↓
5. XCELLIDX expansion
   ↓ Regex finds XCELLIDXCELL_xxxXCELLIDX markers
   ↓ Looks up payload in window.__TABLE_CELL_CONTENT_MAP__
   ↓ Replaces marker with paragraphs + images
   ↓ Separates with double newlines for separate Notion blocks
```

---

## What's Working ✅

### 1. Bullet Placeholder Removal

**Status:** ✅ COMPLETE

- Removed `• ` and ` •` patterns from `processCellForTableToList`
- All unit tests passing
- Code verified in both source and built files

**Files Modified:**

- `/Web-2-Notion/popup/lib/table-to-list-utils.js` (lines 26-29)
- `/Web-2-Notion/popup/static/js/main.js` (lines ~91113-91125)

### 2. XCELLIDX Payload Creation

**Status:** ✅ COMPLETE

- Content script correctly creates payloads for each table cell
- Captures paragraphs and images (including data URLs)
- Generates unique cell IDs (format: `CELL_xxxxxxxx`)
- Stores in `window.__TABLE_CELL_CONTENT_MAP__` (content script context)

**Evidence from Logs:**

```
scanWebpage.js:33 [scanWebpage/tableCell] Stored XCELLIDX payload:
  {cellId: 'CELL_wp08ua0y', paragraphCount: 0, imageCount: 1, hasDataUrls: true}
scanWebpage.js:33 [scanWebpage/tableCell] Stored XCELLIDX payload:
  {cellId: 'CELL_z30kfef9', paragraphCount: 2, imageCount: 0, hasDataUrls: false}
...
[scanWebpage] Including table cell map with 10 entries
```

**Files:**

- `/Web-2-Notion/scanWebpage.js` (lines ~16400-16730)

### 3. Marker Insertion

**Status:** ✅ COMPLETE

- Markers inserted as `<span data-xcellidx="CELL_xxx"></span>` at start of cell HTML
- Format chosen to survive Turndown conversion
- Skip check prevents double-processing

**Files:**

- `/Web-2-Notion/scanWebpage.js` (line 16727)

### 4. Data Transfer to Popup

**Status:** ✅ COMPLETE

- Scan result includes `tableCellMap` property
- BB function receives both HTML and tableCellMap
- BB passes tableCellMap to aB/sB in options object

**Evidence from Logs:**

```
[asyncExec] Scan result has tableCellMap? true
[asyncExec] tableCellMap entries: 10
[BB/Fix] Received tableCellMap: {CELL_etsd8nui: {...}, ...}
```

**Files:**

- `/Web-2-Notion/popup/static/js/main.js` (lines 100675-100710, 102104-102115)

### 5. Global Map Assignment

**Status:** ✅ COMPLETE

- sB function receives tableCellMap in options
- Assigns to `window.__TABLE_CELL_CONTENT_MAP__` (popup context)
- Available for XCELLIDX expansion

**Evidence from Logs:**

```
[sB/Debug] n parameter: {tableCellMap: {...}}
[sB/Debug] n.tableCellMap exists? YES
[sB/Fix] Assigned tableCellMap with 10 entries to window.__TABLE_CELL_CONTENT_MAP__
```

**Files:**

- `/Web-2-Notion/popup/static/js/main.js` (lines 99537-99557)

### 6. Turndown Custom Rule

**Status:** ✅ COMPLETE (implementation)

- Custom rule added to preserve XCELLIDX markers
- Converts `<span data-xcellidx="CELL_xxx"></span>` → `XCELLIDXCELL_xxxXCELLIDX`

**Files:**

- `/Web-2-Notion/popup/static/js/main.js` (lines 91557-91571)

### 7. XCELLIDX Expansion Code

**Status:** ✅ COMPLETE (implementation)

- Regex pattern to find markers in markdown
- Replacement function to expand with content
- Generates paragraphs + image markdown
- Separates with `\n\n` for separate Notion blocks

**Files:**

- `/Web-2-Notion/popup/static/js/main.js` (lines 91854-91941)

---

## What's Not Working Yet ⚠️

### 1. Marker Preservation Through Turndown

**Status:** ⚠️ NEEDS TESTING

- Custom rule implemented but not yet confirmed working
- Last log (025) showed: "NO XCELLIDX markers found in markdown"
- HTML has markers, markdown doesn't
- May need rule adjustment

**Evidence from Log 025:**

```
[JZ/Turndown] Found 10 XCELLIDX markers in HTML
[JZ/Turndown/XCELLIDX] Markdown contains 'XCELLIDX'? false
[JZ/Turndown/XCELLIDX] ⚠️ NO XCELLIDX markers found in markdown!
```

**Potential Issues:**

- Turndown rule filter not matching correctly
- Rule execution order (may need to be added earlier)
- Node type mismatch in filter function

### 2. End-to-End Content Flow

**Status:** ⚠️ NEEDS TESTING

- All pieces in place but not verified working together
- Need log 026 to confirm:
  - Markers preserved in markdown
  - Expansion successfully replacing markers
  - Final Notion blocks created correctly

---

## Code Paths Investigated

### Main Save Operation

**Path:** asyncExec completion → BB → aB → sB → JZ (Turndown) → XCELLIDX expansion

- **Entry Point:** Line 102104 in main.js
- **Key Functions:**
  - `BB(html, tableCellMap)` - Line 100693
  - `aB(html, options)` - Line 99544
  - `sB(html, options)` - Line 99546
  - `JZ(html, options)` - Line 91553 (Turndown conversion)

### Custom Zone Selection (Not Used Here)

**Path:** pickCustomZone → D1 → Z1 → N1 → aB → sB

- This path includes tableCellMap pass-through
- Confirmed NOT used for main save operation
- Kept for reference/future use

---

## Key Files Modified

### Content Script

1. **`/Web-2-Notion/scanWebpage.js`**
   - Lines 16400-16730: Table cell processing
   - Line 16727: Marker insertion
   - Lines 15254-15275: tableCellMap in scan result

### Popup Script

2. **`/Web-2-Notion/popup/static/js/main.js`**
   - Lines 91557-91571: Turndown custom rule for XCELLIDX
   - Lines 91854-91941: XCELLIDX expansion code
   - Lines 99537-99557: tableCellMap assignment in sB
   - Lines 100675-100710: BB function (receives tableCellMap)
   - Lines 102104-102115: Call site passing tableCellMap

3. **`/Web-2-Notion/popup/lib/table-to-list-utils.js`**
   - Lines 26-29: Removed bullet placeholders

---

## Testing History

### Log Files Analysis

**Log 018-019:** Discovered sB function not being called

- Found code path issue
- D1→Z1→N1→aB→sB only for custom zone
- Main save bypasses this path

**Log 020:** Found XCELLIDX markers but empty map

- HTML contains "XCELLIDX" string
- Regex found 0 markers (wrong pattern)
- Map had 0 entries (not transferred)

**Log 021:** Stack trace revealed call site

- JZ called from line 99553 (in sB)
- BB/RB functions identified at line 100687
- Found empty options object `{}`

**Log 022:** Confirmed sB executing but no tableCellMap

- `n parameter: {}` - empty options
- Fixed by updating BB to accept and pass tableCellMap

**Log 023:** Success! Map transferred

- `[sB/Fix] Assigned tableCellMap with 10 entries`
- HTML has markers
- But markers not in markdown (Turndown stripping)

**Log 024:** HTML comment approach failed

- Changed markers to `<!--XCELLIDX...-->`
- Turndown still stripped them

**Log 025:** Span approach implemented

- Changed to `<span data-xcellidx="..."></span>`
- Custom Turndown rule added
- Awaiting test results (log 026)

---

## Next Steps

### Immediate (Awaiting Log 026)

1. ✅ Verify Turndown rule preserves markers in markdown
2. ✅ Verify XCELLIDX expansion executes
3. ✅ Verify final Notion blocks created correctly
4. ✅ Test with actual table content to confirm images and text appear

### If Log 026 Shows Success

1. Clean up debug logging (mark as [DEBUG] for easy removal)
2. Add comprehensive comments explaining the system
3. Update documentation
4. Test edge cases:
   - Empty table cells
   - Cells with only images
   - Cells with only text
   - Large data URL images
   - Multiple paragraphs per cell

### If Log 026 Shows Issues

1. Debug Turndown rule execution
   - Add logging in filter function
   - Verify node types
   - Check rule ordering
2. Consider alternative marker formats:
   - Inline markdown `[XCELLIDX_CELL_xxx]`
   - Zero-width characters
   - Base64 encoded markers
3. Investigate Turndown configuration options

---

## Lessons Learned

### Architecture Insights

1. **Context Isolation:** Content script and popup have separate `window` objects
   - Must transfer data via message passing
   - Can't access each other's global variables

2. **Minified Code:** Production code is heavily minified
   - Variable names like `aB`, `sB`, `N1`, `Z1`, `D1`
   - Generator functions with `p().mark()` and `p().wrap()`
   - Switch/case state machines

3. **Turndown Behavior:**
   - Strips plain text that's not in proper HTML tags
   - Removes HTML comments by default
   - Custom rules needed for special content preservation

### Debugging Techniques

1. Stack traces reveal call chains in minified code
2. Liberal logging at key transition points
3. Parameter inspection to trace data flow
4. Regex pattern testing with actual data samples

### Design Decisions

1. **Marker Format Evolution:**
   - Plain text `XCELLIDX...XCELLIDX` → Lost in Turndown
   - HTML comment `<!--XCELLIDX...-->` → Stripped by Turndown
   - Span with data attribute `<span data-xcellidx="...">` → Current approach

2. **Content Separation:**
   - Using `\n\n` between paragraphs and images
   - Creates separate Notion blocks
   - Preserves structure without bullets

---

## References

### Related Documents

- `/docs/TABLE_TO_BULLET_LIST_FIX.md` - Original table conversion work
- `/docs/DEBUG_INSTRUCTIONS.md` - Debugging guide
- `/tests/verify-extension-loaded.js` - Code verification script

### Test Files

- `/tests/test-full-table-conversion.js` - Unit tests for table processing
- `/tests/table-image-url.html` - Test page with external images
- `/tests/table-image-data.html` - Test page with data URL images

### Key Concepts

- **XCELLIDX:** "eXtended CELL ID eXpansion" - marker system name
- **tableCellMap:** Object mapping cell IDs to content payloads
- **Turndown:** HTML-to-Markdown conversion library (zZ in minified code)
- **Generator Functions:** Async code pattern using `p().mark()` and `p().wrap()`

---

## Status Summary

| Component           | Status      | Notes                           |
| ------------------- | ----------- | ------------------------------- |
| Bullet removal      | ✅ Complete | Tests passing                   |
| Payload creation    | ✅ Complete | 10 cells captured               |
| Marker insertion    | ✅ Complete | Span tags added                 |
| Data transfer       | ✅ Complete | Map reaches popup               |
| Map assignment      | ✅ Complete | Global available                |
| Turndown rule       | ⚠️ Testing  | Implemented, needs verification |
| Marker preservation | ⚠️ Testing  | Log 026 needed                  |
| XCELLIDX expansion  | ⚠️ Testing  | Code ready, needs markers       |
| End-to-end flow     | ⚠️ Testing  | Awaiting confirmation           |

**Overall Progress:** ~85% complete, final testing phase

---

_Last Updated: February 10, 2026_  
_Next Update: After reviewing log 026_
