# Version 5.2.12 - Fix Standalone Figure Image Alt Text# Version 5.2.12 - Fix Standalone Image Alt Text

## Problem## Problem

ServiceNow images were ALL wrapped in links, making it impossible to distinguish between:

1. **Inline images**: Small icons within text (e.g., "select the home icon 🏠")Standalone images (not wrapped in links) were showing unwanted alt text placeholders in addition to the image itself:

2. **Figure images**: Standalone illustrations with captions

````

Both were showing alt text placeholders:Figure 2.Inbox

```[Inbox]        ← Unwanted alt text placeholder

Figure 2.Inbox<image>        ← Actual image in children array

[Inbox]        ← Unwanted alt text placeholder for figure image```

<image>

```Expected behavior:



For inline images like:```

```Figure 2.Inbox

...selecting the home icon ([Home icon]) from...<image>        ← Only the image, no alt text

<image>        ← Alt text IS wanted here```

````

## Root Cause

## Root Cause

ALL ServiceNow images are wrapped in `<a>` tags, converting to `[![alt](img)](link)` markdown.The CN (convert node) function was adding `[alt text]` placeholders for ALL images, regardless of whether they were:

Previous v5.2.12 attempt tried to detect inline vs standalone by checking `r.url`, but since ALL images are wrapped in links, this check was always true.1. **Inline images** (wrapped in links): `[![alt](img)](link)` → Should show alt text + image

2. **Standalone images**: `![alt](img)` → Should ONLY show image, no alt text

## New Solution (v5.2.12 Fixed)

Detect figure images by analyzing the **paragraph content**:## Solution

- **Paragraph with text + images** → Inline images → Keep alt text

- **Paragraph with ONLY link-wrapped images** → Figure images → Remove alt textModified CN function's image case to check if the image is inside a link:

### Implementation```javascript

Added logic in SN function AFTER processing paragraph children:case "image":

if (r.url) {

````javascript // Inline image (inside link) - show alt text

// Check if paragraph has text content (not just images)    return e.alt ? [dN("[" + e.alt + "]", imageContext)] : [];

var hasTextContent = false;  } else {

e.children.forEach(function (child) {    // Standalone image - no alt text

  if (child.type === "text" && child.value.trim().length > 0) {    return [];

    hasTextContent = true;  }

  }```

});

**Detection Logic**:

// If NO text content, remove alt text placeholders

if (!hasTextContent && imageAltTextCount > 0) {- When CN is called from SN without context, `r.url` is `undefined` → Standalone image

  r = r.filter(function (item) {- When CN is called recursively from link case with context, `r.url` is set → Inline image

    // Remove items matching pattern [...]

    return !item.every(richText => /^\[.+\]$/.test(richText.text.content));## Expected Behavior After Fix

  });

}### Inline Images (Wrapped in Links)

````

**Markdown**: `[![Home icon](data:image/...)](https://servicenow.com/...)`

## Expected Behavior After Fix

**Notion Output**:

### Inline Images (Icons in Text)

**Markdown**: `You can access lists by selecting the list icon ([![List icon](data:...)](link)).````

...selecting the home icon ([Home icon]) from...

**Paragraph structure**: ↳ <Home icon image>

- Text: "You can access lists by selecting the list icon ("```

- Link with image

- Text: ")."- Alt text appears inline: `[Home icon]`

- Image appears as indented child block

**Notion Output**:

```### Standalone Images

You can access lists by selecting the list icon ([List icon]).

    ↳ <List icon image>**Markdown**: `![Figure 2.Inbox](https://example.com/inbox.png)`

```

✓ Alt text kept because paragraph has surrounding text**Notion Output**:

### Figure Images (Standalone Illustrations)```

**Markdown**: `[![Inbox](https://...)](link)`Figure 2.Inbox

    ↳ <Inbox image>

**Paragraph structure**:```

- Link with image (NO other text)

- NO alt text placeholder

**Notion Output**:- Image appears as indented child block only

```

    ↳ <Inbox image>## Console Log Changes

```

✓ Alt text removed because paragraph has NO text contentBefore:

## Console Log Changes```

````[CN/Image] Processing inline image: Inbox

[CN/Image] Processing image: Home icon hasLinkContext: true```

[SN/Paragraph] Adding 1 inline images as children

[SN/Paragraph] Final paragraph block: {...}  ← Alt text kept (has text)After:



[CN/Image] Processing image: Inbox hasLinkContext: true  ```

[SN/Paragraph] Paragraph has only link-wrapped images (no text) - removing alt text placeholders[CN/Image] Processing inline image (in link): Home icon  ← For inline images

[SN/Paragraph] Adding 1 inline images as children[CN/Image] Skipping standalone image: Inbox             ← For standalone images

[SN/Paragraph] Final paragraph block: {...}  ← Alt text removed (no text)```

````

## Testing Steps

## Testing Steps

1. Reload the extension in Chrome1. Reload the extension in Chrome

2. Save ServiceNow page with both types of images:2. Save a ServiceNow page with:
   - Inline icons within sentences - Inline images (wrapped in links)

   - Standalone figure images - Standalone images (not wrapped in links)

3. Check console for filtering messages3. Verify in Notion:

4. Verify in Notion: - Inline images show `[alt text]` + child image block ✓
   - Inline images: Show `[alt text]` + child image ✓ - Standalone images show ONLY child image block (no alt text) ✓

   - Figure images: Show ONLY child image (no alt text) ✓

## Files Modified

## Files Modified

- `Web-2-Notion/popup/static/js/main.js`:- `Web-2-Notion/popup/static/js/main.js` - CN function image case
  - CN function: Always generate alt text for images- `Web-2-Notion/manifest.json` - Version 5.2.11 → 5.2.12

  - SN function: Filter alt text for image-only paragraphs

- `Web-2-Notion/manifest.json` - Version 5.2.11 → 5.2.12## Related Issues

## Related Issues- v5.2.8: Added inline alt text for images

- v5.2.8: Added inline alt text for images- v5.2.9: Added children block structure

- v5.2.9: Added children block structure - v5.2.10: Fixed data: URL support

- v5.2.10: Fixed data: URL support- v5.2.11: Fixed alt text inheriting parent link URLs

- v5.2.11: Fixed alt text inheriting parent link URLs- **v5.2.12**: Fixed standalone images showing unwanted alt text

- **v5.2.12**: Fixed standalone figure images showing unwanted alt text (paragraph content detection)
