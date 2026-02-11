# Inline Image Context Preservation

## Overview

This document describes how inline images (such as icons in parentheses) are now preserved within their parent context when saving content to Notion, while respecting Notion's limitation that it cannot process inline Markdown images within table cells.

## Problem

Previously, when images appeared inside anchor tags with surrounding text, the anchor text was being lost. This caused inline context (like "Open [icon] portal") to be reduced to just the image reference, losing important textual information.

### Example Issue

**Original HTML:**

```html
<td>
  <a href="https://example.com"
    >Open <img src="https://example.com/icon.png" alt="→" /> portal</a
  >
</td>
```

**Previous Output (incorrect):**

```
[→]
```

The "Open" and "portal" text was lost.

**New Output (correct):**

```
Open [→] portal
```

The surrounding text is now preserved along with the image placeholder.

## Solution

Modified the `sanitizeCell` function in `tableWithoutHeading` rule (in `Web-2-Notion/popup/static/js/main.js`) to:

1. **Preserve surrounding text** when images appear inside anchor tags
2. **Replace images with text placeholders** `[alt]` that maintain inline positioning
3. **Extract image markdown separately** for display in a dedicated images section

### How Notion Handles Images

Notion's API does not support inline Markdown images (`![alt](url)`) within table cells. Instead:

- Images are extracted to a separate images array as `![alt](url)` markdown
- Within the cell content, images are replaced with text placeholders `[alt]`
- The extracted images are displayed separately after the table

This approach ensures:

- Cell text remains clean and readable
- Images are still available to the user
- Parent context (surrounding text) is preserved

## Solution

Modified the `sanitizeCell` function in `tableWithoutHeading` rule (in `Web-2-Notion/popup/static/js/main.js`) to:

1. **Use image markdown syntax** (`![alt](url)`) instead of link syntax (`[alt](url)`)
2. **Preserve surrounding text** when images appear inside anchor tags
3. **Maintain inline positioning** so icons remain inline with their context

### Key Changes

#### Before

```javascript
// Images in anchors: surrounding text was lost
if (alt) {
  var linkText = "[" + alt + "](" + src + ")";
  var replacement = document.createTextNode(linkText);
  if (parentAnchor) {
    parentAnchor.replaceWith(replacement); // Lost "Open" and "portal" text
  } else {
    img.replaceWith(replacement);
  }
}
```

#### After

```javascript
// Replace with text placeholder and preserve surrounding text
if (alt) {
  if (parentAnchor) {
    // Preserve textual siblings in the anchor
    var textParts = [];
    Array.from(parentAnchor.childNodes).forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        var txt = node.textContent.trim();
        if (txt) textParts.push(txt);
      } else if (node === img) {
        textParts.push("[" + alt + "]"); // Text placeholder, not markdown
      }
    });

    var combinedContent = textParts.join(" ");
    var replacement = document.createTextNode(combinedContent);
    parentAnchor.replaceWith(replacement); // Preserves "Open [→] portal"
  } else {
    // Just replace with text placeholder
    var replacement = document.createTextNode("[" + alt + "]");
    img.replaceWith(replacement);
  }
}
```

## Test Coverage

Added comprehensive test suite in `tests/test-inline-images.js` covering:

1. ✅ Simple inline icons → `[icon]`
2. ✅ Icons in parentheses with text → `(View details [arrow])`
3. ✅ Multiple inline icons → `Start [icon1] middle [icon2] end`
4. ✅ Icons inside anchors with surrounding text → `Open [arrow] now`
5. ✅ Icons without alt text (removed) → ``
6. ✅ Text before and after icons → `Click here [click icon] to continue`

Run tests with:

```bash
npm run test-inline-images
```

## Impact

### What Changed

- Images in table cells now use text placeholder `[alt]` format within cell content
- Surrounding text in anchors is now preserved alongside image placeholders
- Images are extracted separately as `![alt](url)` for the images section
- Inline positioning is maintained in parent context

### What Didn't Change

- Image source extraction logic (still checks data-original-src, data-src, srcset, etc.)
- Base64 image handling
- Invalid image removal logic
- Image extraction to separate array for display outside tables

## Examples

### Example 1: Status Icons

**Input:**

```html
<td>Complete <img src="https://cdn.example.com/check.png" alt="✓" /></td>
```

**Cell Output:**

```
Complete [✓]
```

**Extracted Image:**

```markdown
![✓](https://cdn.example.com/check.png)
```

### Example 2: Icons in Parentheses

**Input:**

```html
<td>(View details <img src="https://cdn.example.com/arrow.png" alt="→" />)</td>
```

**Cell Output:**

```
(View details [→])
```

**Extracted Image:**

```markdown
![→](https://cdn.example.com/arrow.png)
```

### Example 3: Anchor with Image and Text

**Input:**

```html
<td>
  <a href="https://example.com"
    >Open <img src="https://cdn.example.com/icon.png" alt="→" /> portal</a
  >
</td>
```

**Previous Output (incorrect):**

```
[→]
```

**New Output (correct):**

```
Open [→] portal
```

**Extracted Image:**

```markdown
![→](https://cdn.example.com/icon.png)
```

## Backward Compatibility

This change improves the handling of images in table cells by preserving surrounding text that was previously being lost. The text placeholder format `[alt]` is clean and readable, while the actual images are still available in the extracted images section.

**Why Text Placeholders Instead of Inline Images?**

Notion's API does not support inline Markdown images (`![alt](url)`) within table cell content. The extension follows the same pattern as the `tableWithHeading` rule:

- Extract images as `![alt](url)` for separate display
- Replace with text placeholders `[alt]` in cell content
- Preserve parent context and surrounding text

This approach ensures compatibility with Notion while maintaining readability and context.

## Related Files

- `Web-2-Notion/popup/static/js/main.js` - Main implementation
  `tests/test-inline-images.js` - Test suite
- `Web-2-Notion/package.json` - Test scripts

## Future Considerations

- The `tableWithHeading` rule already uses standard Turndown image handling, which produces `![alt](url)` format
- Consider unifying both table handling approaches for consistency
- May want to add size/dimension preservation for inline icons in the future
