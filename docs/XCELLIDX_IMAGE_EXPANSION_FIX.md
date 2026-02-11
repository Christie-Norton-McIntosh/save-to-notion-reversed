# XCELLIDX Image Expansion Fix

## Issue

Table-to-list conversion was showing only horizontal divider lines (`---`) with no text or images. The XCELLIDX payloads were being created correctly by scanWebpage.js with both `paragraphs` and `images` arrays, but the expansion code in the popup was only handling text paragraphs - completely ignoring the images.

## Root Cause

The XCELLIDX expansion logic at line 99032 (in table cell processing) only expanded text paragraphs from the `paragraphs` array in the payload, but never extracted or processed the `images` array. Even though images were captured as data URLs in scanWebpage.js and stored in the payload, they were never converted into Notion image blocks.

## Solution

Added XCELLIDX marker expansion at the **markdown level** (after Turndown conversion, before markdown-to-blocks parsing). This is cleaner than block-level expansion because:

1. Markdown parsing already handles formatting (`**bold**`, links, etc.)
2. Images can be represented as standard markdown: `![alt](src)`
3. The existing parser creates proper image blocks with upload pipeline flags

### Implementation Location

**File:** `/Web-2-Notion/popup/static/js/main.js`
**Line:** ~91770 (after Turndown markdown conversion, before return)

### Code Changes

```javascript
// [XCELLIDX_MARKDOWN_EXPANSION] Expand XCELLIDX markers in markdown
if (window.__TABLE_CELL_CONTENT_MAP__) {
  var markerRe = /XCELLIDX(CELL_[a-z0-9]+)XCELLIDX/gi;
  markdownResult = markdownResult.replace(markerRe, function (match, cellId) {
    var payload = window.__TABLE_CELL_CONTENT_MAP__[cellId];

    if (!payload || typeof payload !== "object") {
      console.warn("[JZ/Turndown/XCELLIDX] No payload found for", cellId);
      return match; // Keep original marker if no payload
    }

    var expandedMarkdown = [];

    // Add paragraphs (already contain markdown formatting like **bold**)
    if (Array.isArray(payload.paragraphs)) {
      payload.paragraphs.forEach(function (para) {
        if (para && para.trim()) {
          expandedMarkdown.push(para);
        }
      });
    }

    // Add images in markdown format: ![alt](src)
    if (Array.isArray(payload.images)) {
      payload.images.forEach(function (img) {
        if (img && img.src) {
          var alt = img.alt || "image";
          expandedMarkdown.push("![" + alt + "](" + img.src + ")");
        }
      });
    }

    // Join with double newlines to create separate blocks
    return expandedMarkdown.join("\n\n");
  });
}
```

## How It Works

1. **Capture Phase (scanWebpage.js):**
   - Table cells scanned, images extracted as data URLs
   - XCELLIDX payload created: `{ paragraphs: [...], images: [{src, alt, markdown}] }`
   - Marker inserted: `XCELLIDX(CELL_abc123)XCELLIDX`
   - Payload stored in `window.__TABLE_CELL_CONTENT_MAP__`

2. **Transfer Phase (main.js):**
   - tableCellMap passed from sB→aB→Z1→N1 functions
   - Assigned to `window.__TABLE_CELL_CONTENT_MAP__` before conversion

3. **Conversion Phase (main.js JZ/Turndown):**
   - HTML converted to markdown by Turndown
   - **NEW:** XCELLIDX markers expanded in markdown string:
     - Each marker replaced with paragraphs + images
     - Paragraphs: `**Enhance the service**` (markdown formatting preserved)
     - Images: `![Automate IT service](data:image/png;base64,...)`
     - Items joined with `\n\n` for separate blocks

4. **Parsing Phase (main.js markdown-to-blocks):**
   - Expanded markdown parsed into AST
   - Markdown formatting (`**bold**`) → rich text annotations
   - Image markdown (`![alt](src)`) → image blocks with upload flags
   - Horizontal dividers (`---`) → divider blocks

## Expected Output

For a table cell with:

- Paragraph 1: `**Enhance the service experience**`
- Paragraph 2: `Automate support for common requests...`
- Image: `data:image/png;base64,...` with alt "Automate IT service"

The expansion produces:

```markdown
**Enhance the service experience**

Automate support for common requests with virtual agents...

![Automate IT service](data:image/png;base64,...)
```

Which gets parsed into:

1. Paragraph block (with bold annotation)
2. Paragraph block (plain text)
3. Image block (with `needToUploadFile: true` for data URL handling)

## Console Logging

Added detailed logs to track expansion:

- `[JZ/Turndown/XCELLIDX] Expanding marker CELL_xxx`
- `[JZ/Turndown/XCELLIDX] Added image markdown for: <alt>`
- `[JZ/Turndown/XCELLIDX] Expanded CELL_xxx into N items, markdown length: X`

## Testing

### Manual Test

1. Open ServiceNow page with table containing text + images
2. Open browser console
3. Trigger Save-to-Notion extension
4. Check logs:
   - ✅ `[JZ/Turndown/XCELLIDX] Expanding marker CELL_xxx`
   - ✅ `[JZ/Turndown/XCELLIDX] Added image markdown for: <alt>`
   - ✅ Image blocks with `needToUploadFile: true`
5. Verify Notion output:
   - ✅ Text blocks with proper formatting
   - ✅ Image blocks (may show as placeholders during upload)
   - ✅ Horizontal dividers between rows

### Expected Console Output

```
[JZ/Turndown] XCELLIDX markers in HTML: ["CELL_enqz67vb", "CELL_b40g1kbx", ...]
[JZ/Turndown] __TABLE_CELL_CONTENT_MAP__ keys (count= 10 ): ["CELL_enqz67vb", ...]
[JZ/Turndown/XCELLIDX] Expanding marker CELL_enqz67vb payload: {paragraphs: [], images: [{...}]}
[JZ/Turndown/XCELLIDX] Added image markdown for: Automate IT service src length: 4470
[JZ/Turndown/XCELLIDX] Expanded CELL_enqz67vb into 1 items, markdown length: 4523
[JZ/Turndown/XCELLIDX] Expanding marker CELL_b40g1kbx payload: {paragraphs: [2], images: []}
[JZ/Turndown/XCELLIDX] Expanded CELL_b40g1kbx into 2 items, markdown length: 245
[JZ/Turndown/XCELLIDX] After expansion, markdown length: 8934
```

## Related Files

- `/Web-2-Notion/scanWebpage.js` - Creates XCELLIDX payloads (unchanged)
- `/Web-2-Notion/popup/static/js/main.js` - Expands XCELLIDX markers (modified)
- `/docs/TABLE_CELL_MAP_TRANSFER_BUG.md` - Documents tableCellMap transfer fix
- `/docs/TABLE_CELL_MAP_FIX_SUMMARY.md` - Implementation summary for transfer fix

## Compatibility

- Works with tableCellMap transfer fix (3-part fix in main.js)
- Preserves markdown formatting (bold, links, etc.)
- Handles data URLs with upload pipeline flags
- Maintains backward compatibility with text-only payloads

## Date

February 10, 2026
