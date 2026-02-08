# Version 5.2.8 - Inline Image Fix

## Problem Summary

Inline images within text were disappearing, leaving only the surrounding text. For example:

```
"...by selecting the home icon () from..."
```

The image between the parentheses was missing.

## Root Cause

The markdown parser was **extracting inline images and placing them as separate blocks** instead of keeping them inline as part of the rich text.

### Code Analysis

**Function: `SN` (lines 91894-91927)** - Handles paragraph parsing:

- Line 91918: `"image" === e.type ? n.push(jN(e, t))`
- Images were extracted into separate array `n`
- Line 91926: `r.length ? [fN(r.flat())].concat(n) : n`
- Images placed AFTER paragraph as separate blocks

**Function: `CN` (lines 91797-91890)** - Handles inline content:

- Had cases for text, links, emphasis, etc.
- **No case for "image"** - images returned empty array `[]`
- Line 91865: `default: return [];`

## The Fix

### 1. Added Image Case to CN Function (line 91862+)

```javascript
case "image":
  // Handle inline images - convert to alt text since Notion doesn't support inline images
  console.log("[CN/Image] Processing inline image:", e.alt || e.url);
  return e.alt ? [dN("[" + e.alt + "]", r)] : [];
```

**Why alt text?** Notion's rich text API doesn't support embedded images within paragraphs. The alternatives are:

- ✅ Use alt text: `[Home icon]`
- ❌ Extract as separate block (was breaking inline placement)
- ❌ Leave empty (creates confusing `()` gaps)

### 2. Modified SN Function to NOT Extract Inline Images (lines 91909-91927)

```javascript
function i(e) {
  // Don't extract inline images - let them stay in the rich text
  if (e.children) {
    e.children.forEach(function (e) {
      i(e);
    });
  }
}
return (
  e.children.forEach(function (e) {
    if ((i(e), "image" !== e.type)) {
      var t = CN(e);
      t.length && r.push(t);
    } else {
      // Handle inline image - convert using CN
      var t = CN(e);
      t.length && r.push(t);
    }
  }),
  r.length ? [fN(r.flat())].concat(n) : n
);
```

## Expected Behavior After Fix

**Before (v5.2.7)**:

```
"...by selecting the home icon () from..."
```

Image disappeared, leaving empty space.

**After (v5.2.8)**:

```
"...by selecting the home icon ([Home icon]) from..."
```

Alt text preserved inline.

## Testing Instructions

1. Reload extension in Chrome
2. Open ServiceNow page
3. Save to Notion
4. Check paragraph with inline image
5. Verify alt text appears: `([Home icon])`

## Known Limitation

Notion's API doesn't support actual image rendering within rich text blocks. This is a Notion API limitation, not an extension bug.

**Workaround Options:**

1. **Current solution** (v5.2.8): Show alt text inline ✅
2. Future option: Extract images to separate blocks with context
3. Future option: Use emoji placeholder (🖼️) instead of text

## Files Modified

- `Web-2-Notion/popup/static/js/main.js` (2 changes)
  - Line 91862+: Added image case to CN function
  - Lines 91909-91927: Modified SN function
- `Web-2-Notion/manifest.json`
  - Version: 5.2.7 → 5.2.8

## Related Issues

- Table images should also benefit from this fix
- Block-level images (standalone) continue to work normally
