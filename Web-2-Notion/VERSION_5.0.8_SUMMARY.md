# Version 5.0.8 - Critical Bug Fix: Image Extraction Format

## Issue Fixed

### Critical Bug: DOM Elements Instead of Markdown Strings

**Problem:** The `tableWithoutHeading` rule was storing DOM `<img>` elements in the `extractedImages` array, but then trying to join them as strings, resulting in `"[object HTMLImageElement]"` instead of actual image markdown.

**Root Cause:**

- Line 91060: `extractedImages.push(imgClone)` - pushed a DOM element clone
- Line 91707-91711: Tried to map/join these DOM elements as strings
- Result: Images appeared as `[object HTMLImageElement]` instead of markdown

**Impact:** Images in tables without headers were not being properly converted to markdown format, breaking the upload pipeline.

## Changes Made

### 1. Fixed Image Storage Format ✅

**File:** `Web-2-Notion/popup/static/js/main.js`

**Before (line 91058-91060):**

```javascript
// Store the actual img element for the images section below
var imgClone = img.cloneNode(true);
extractedImages.push(imgClone); // ❌ DOM element
```

**After (line 91058-91062):**

```javascript
// Store markdown string (not DOM element) for the images section below
var titleAttr = img.getAttribute("title") || "";
var titlePart = titleAttr ? ' "' + titleAttr + '"' : "";
var imageMarkdown = "![" + alt + "](" + src + titlePart + ")";
extractedImages.push(imageMarkdown); // ✅ Markdown string
```

### 2. Updated cellImages Structure ✅

**Before (line 91070):**

```javascript
cellImages.push({
  rowIdx: rowIdx,
  cellIdx: cellIdx,
  img: imgClone, // ❌ Referenced non-existent imgClone
  alt: alt,
  src: src,
});
```

**After (line 91069):**

```javascript
cellImages.push({
  rowIdx: rowIdx,
  cellIdx: cellIdx,
  alt: alt,
  src: src,
});
```

### 3. Simplified Image Markdown Join ✅

**Before (line 91707-91712):**

```javascript
var imagesMarkdown = extractedImages.length
  ? extractedImages
      .map(function (img) {
        return img; // ❌ Would return DOM element
      })
      .join("\n\n") + "\n\n"
  : "";
```

**After (line 91707-91709):**

```javascript
var imagesMarkdown = extractedImages.length
  ? extractedImages.join("\n\n") + "\n\n" // ✅ Direct join of markdown strings
  : "";
```

### 4. Version Update ✅

**File:** `Web-2-Notion/manifest.json`

- Updated version from `5.0.7` to `5.0.8`

## Verification

All image references now follow the correct pattern:

| Location   | Type                                   | Status                        |
| ---------- | -------------------------------------- | ----------------------------- |
| Line 90497 | Turndown rule                          | ✅ Markdown string            |
| Line 91062 | tableWithoutHeading                    | ✅ **FIXED: Markdown string** |
| Line 91380 | cellImages fallback                    | ✅ Markdown string            |
| Line 91444 | Preserved images (tableWithoutHeading) | ✅ Markdown string            |
| Line 91517 | tableWithHeading                       | ✅ Markdown string            |
| Line 91740 | Preserved images (tableWithHeading)    | ✅ Markdown string            |
| Line 91902 | Turndown rule                          | ✅ Markdown string            |
| Line 92019 | Turndown rule                          | ✅ Markdown string            |
| Line 98723 | Twitter fix                            | ✅ Markdown string            |

## Testing Recommendations

1. Test tables without headers containing images
2. Verify images appear in final Notion output (not as `[object HTMLImageElement]`)
3. Check that image titles are preserved in markdown
4. Confirm preserved inline images still work correctly

## Related Issues

- Fixes the image extraction inconsistency between `tableWithoutHeading` and `tableWithHeading` rules
- Ensures all images follow the markdown → parse → upload pipeline
- Aligns with the documentation in `IMAGE_HANDLING_EXPLANATION.md`
