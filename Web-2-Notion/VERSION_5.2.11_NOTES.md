# Version 5.2.11 - Fixed Alt Text Inheriting Parent Link URL

## Problem

When inline images were wrapped in links (markdown pattern: `[![alt](img-url)](link-url)`), the alt text `[Home icon]` was inheriting the parent link's URL, resulting in:

```
[Home icon](https://www.servicenow.com/docs/viewer/attachment/...)
```

This made the alt text a clickable link instead of plain text, which was unexpected behavior.

## Root Cause

The `CN` function processes markdown nodes recursively, passing context down through the tree:

1. Link node sets `r.url = "https://..."`
2. Link processes its children, including image node
3. Image case in CN creates alt text with `dN("[Home icon]", r)`
4. Because `r.url` is set, the alt text becomes a link

## Solution

Modified the `CN` function's image case to create a fresh context without inheriting the parent link URL:

```javascript
case "image":
  console.log("[CN/Image] Processing inline image:", e.alt || e.url);
  // Create fresh context without URL to avoid making alt text a link
  var imageContext = {
    annotations: r.annotations,
    url: undefined // Don't inherit parent link URL
  };
  return e.alt ? [dN("[" + e.alt + "]", imageContext)] : [];
```

This preserves text styling (bold, italic, etc.) but prevents the alt text from becoming a link.

## Expected Behavior

### Before (v5.2.10):

```
In ... workspace, you can access the landing page by selecting the home icon ([Home icon](https://...)) from...
```

- Alt text was a clickable link ❌
- Looked confusing/cluttered

### After (v5.2.11):

```
In ... workspace, you can access the landing page by selecting the home icon ([Home icon]) from...
  └─ Image block (actual Home icon image)
```

- Alt text is plain text reference ✅
- Image appears as indented child block ✅
- Clean, readable layout

## Changes Made

### main.js - CN Function (lines ~91862-91868)

**Modified**: Image case to use fresh context without parent URL

**Impact**:

- Inline image alt text no longer inherits parent link URLs
- Alt text displays as plain text `[Home icon]` instead of link
- Preserves text formatting (bold, italic) if present

## Testing Steps

1. Reload extension in Chrome
2. Save ServiceNow page with inline images in links
3. Check Notion output:
   - Alt text should appear as `[Home icon]` (plain text, not link)
   - Actual image should appear as indented child block below
4. Verify console logs:
   - `[jN] Creating image block for data: URL` ✅
   - `[SN/Paragraph] Adding X inline images as children` ✅
   - `[CN/Image] Processing inline image: Home icon` ✅

## Technical Notes

- **Context Inheritance**: The fix creates a new context object instead of passing `r` directly
- **Preserved Properties**: Annotations (bold, italic, etc.) are still inherited
- **Blocked Property**: `url` is explicitly set to `undefined` to prevent link creation
- **Side Effects**: None - only affects inline images within links

## Related Versions

- v5.2.8: Added inline alt text display
- v5.2.9: Added children array to paragraph blocks
- v5.2.10: Fixed image block creation for data: URLs
- v5.2.11: Fixed alt text inheriting parent link URL (THIS VERSION)
