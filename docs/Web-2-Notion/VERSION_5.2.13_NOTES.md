# Version 5.2.13 - Remove ALL Alt Text Placeholders

## Problem
After v5.2.12, alt text placeholders were still appearing for images, even though the goal was to have images appear ONLY as child blocks without inline text placeholders.

The previous approach (v5.2.12) tried to detect "inline" vs "standalone" images by checking if they were wrapped in links, but this didn't work because:
- Many figure images are also wrapped in links (for viewing/zooming)
- There's no reliable way to distinguish "truly inline" images from figure images

**User expectation**: NO alt text placeholders for any images. All images should appear as indented child blocks only.

## Solution
Simplified the CN function's image case to ALWAYS return an empty array:

```javascript
case "image":
  // Never show alt text inline - all images go in children array only
  console.log("[CN/Image] Skipping image (will be in children):", e.alt || e.url);
  return [];
```

This means:
- NO alt text placeholders for ANY images
- ALL images appear as child blocks only (via the SN function's `children` array)
- The image extraction and children block creation logic remains unchanged

## Expected Behavior

### Before v5.2.13
```
Text with image (Home icon) here...
    ↳ <image>
```
or
```
Figure 2.Inbox
[Inbox]          ← Unwanted placeholder
    ↳ <image>
```

### After v5.2.13
```
Text with image () here...
    ↳ <image>
```
or
```
Figure 2.Inbox
    ↳ <image>     ← No placeholder!
```

**Note**: For images inside text, there will be empty parentheses `()` where the image was. This is acceptable since:
1. The original HTML often has parentheses around linked images
2. The actual image appears as a child block below
3. The alternative (alt text placeholders) was causing confusion

## Console Log Changes
```
[CN/Image] Skipping image (will be in children): Home icon
[SN/Paragraph] Adding 1 inline images as children
```

## Remaining Issue: Children Blocks Not Rendering in Notion

**IMPORTANT**: This fix addresses the alt text placeholder issue, but children blocks may still not be rendering in Notion. This is likely a Notion API limitation where paragraph blocks may not support nested children blocks.

If children blocks still don't appear in Notion after this fix, we may need to:
1. Create images as sibling blocks (after the paragraph) instead of children
2. Use indentation properties to visually nest them
3. Check if different block types (toggle, callout, quote) support children better

## Testing Steps
1. Reload the extension in Chrome
2. Save a page with images
3. Verify in console: ALL images show `[CN/Image] Skipping image`
4. Verify in Notion: NO alt text placeholders appear (no `[alt text]` in paragraphs)
5. Check if images appear as child blocks (may still be an API issue)

## Files Modified
- `Web-2-Notion/popup/static/js/main.js` - CN function image case (simplified)
- `Web-2-Notion/manifest.json` - Version 5.2.12 → 5.2.13

## Related Versions
- v5.2.8: Added inline alt text for images (REVERTED)
- v5.2.9: Added children block structure (KEPT)
- v5.2.10: Fixed data: URL support (KEPT)
- v5.2.11: Fixed alt text inheriting parent link URLs (SUPERSEDED)
- v5.2.12: Tried to detect inline vs standalone images (SUPERSEDED)
- **v5.2.13**: Removed ALL alt text placeholders (CURRENT)
