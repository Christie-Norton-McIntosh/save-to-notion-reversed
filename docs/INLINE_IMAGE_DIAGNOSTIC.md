# Inline Image Diagnostic Report

## Problem Summary

- **Regular images (block-level)**: Working ✅
- **Inline images (within text)**: Empty parentheses `()` ❌
- **Table images**: Empty parentheses `()` ❌

## Root Cause Analysis

### Evidence from Console Logs (v5.2.7)

```
[JZ/Turndown] Found 5 image markdown patterns in output
[JZ/Turndown] First image markdown: ![Home icon<<{}>>](data:image/png;base64,iVBORw0KG...)
```

**Markdown is generated correctly** with full data: URLs, but final Notion output shows `()`.

### The `<<{}>>` Marker Mystery

The alt text shows `<<{}>>` appended: `![Home icon<<{}>>](data:image/...)`

This marker is NOT in source code, it's added dynamically. Searching for `<<{}>>` in main.js found no matches.

### Block vs Inline Image Handling

**Hypothesis**: The markdown parser treats block-level images differently from inline images.

**Block-level image markdown** (standalone on its own line):

```markdown
![alt text](url)
```

→ Converts to Notion `image` block ✅

**Inline image markdown** (within text):

```markdown
Some text ![alt text](url) more text
```

→ Should stay inline but instead becomes `()` ❌

## Key Code Sections

### 1. Table Image Processing (lines 91080-91110)

```javascript
var markdown = "![" + alt + "](" + src + titlePart + ")";
imageMarkdowns.push(markdown);
// But then:
img.replaceWith(document.createTextNode("[" + alt + "]"));
```

**Issue**: Image is converted to markdown BUT the img element is replaced with `[alt]` text, breaking inline placement.

### 2. Image Block Creation (line 97780+)

```javascript
case "file":
  if ("needtouploadfile" in (a.file || {})) {
    var f,
      v = a.file.src;
    ((t.urlToUploadsMap[v] = ...
```

This handles file uploads for block-level images.

## The Core Problem

**Inline images in markdown** like:

```markdown
selecting the home icon ![Home icon](data:image/...) from
```

Are being parsed, but when converted to Notion blocks, the parser likely:

1. Recognizes the image pattern `![...](...)`
2. Tries to create an image block
3. **But inline images can't be standalone blocks in Notion**
4. Falls back to empty parentheses `()`

## Notion API Limitation

**Notion doesn't support true inline images within text blocks.**

Notion's rich text can contain:

- Text with formatting (bold, italic, code, etc.)
- Links
- Mentions
- Equations

But **NOT embedded images** within a paragraph.

## Solutions

### Option 1: Convert Inline Images to Block-Level

When markdown contains inline images, extract them and place them as separate image blocks after the paragraph.

**Before**:

```markdown
Select the home icon ![icon](url) from the menu
```

**After** (converted):

```
Notion paragraph: "Select the home icon from the menu"
Notion image block: [icon]
```

### Option 2: Convert to Emoji/Symbol Placeholder

Replace inline images with a symbol like 🖼️ or [IMAGE] in the text.

**Before**:

```markdown
Select the home icon ![icon](url) from the menu
```

**After**:

```
Notion paragraph: "Select the home icon 🖼️ from the menu"
Notion image block: [icon]
```

### Option 3: Keep Alt Text Only

Replace inline image markdown with just the alt text.

**Before**:

```markdown
Select the home icon ![Home icon](url) from the menu
```

**After**:

```
Notion paragraph: "Select the home icon [Home icon] from the menu"
```

## Recommended Fix

**Implement Option 1** - Extract inline images and place as separate blocks.

This preserves all images while respecting Notion's block structure limitations.

### Implementation Steps

1. **Detect inline images** in markdown (images not on their own line)
2. **Extract image URLs** and alt text
3. **Remove image syntax** from text, leaving alt text or a marker
4. **Append image blocks** after the paragraph block

## Next Steps

1. Search for markdown parsing function in main.js
2. Find where `![alt](url)` patterns are converted to Notion blocks
3. Add special handling for inline vs block-level images
4. Test with ServiceNow page to verify fix

## Related Files

- `Web-2-Notion/popup/static/js/main.js` (lines 91080-91110, 97780+)
- Markdown parsing logic (need to locate)
- Notion block creation (need to locate)
