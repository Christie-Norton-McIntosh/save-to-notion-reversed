# Custom Site Selectors Guide (2026 Update)

## What's New

- **Custom Formatting Rules:**
  - NEW: Transform specific HTML elements with custom formatting (e.g., convert `<span class="ph uicontrol">` to bold text)
  - Intelligently handles both inline elements (full replacement) and block elements (content wrapping)
  - UI for managing rules with selector, replacement tag, and description
  - Supports: `strong`, `em`, `code`, `mark`, `u`, `del`, `b`, `i`
  - See "Custom Formatting Rules" section below for details
- **Duplicate Detection & Pruning:**
  - When combining results from multiple selectors, the extension now removes duplicate elements by signature (images, tables, etc.) and by containment (nested/overlapping elements).
  - Console logs indicate how many duplicates were removed. Enable debug mode with `window.__STN_DEBUG_DEDUP = true` for detailed logs.
- **Fallback Logic:**
  - If a custom selector matches no elements, the extension falls back to searching for `<article>` elements, then to extracting from the selected element itself.
  - The minimum text length threshold for fallback extraction is now 10 characters (was 100), so small content blocks are accepted.
- **Selector Validation:**
  - Invalid or malformed selectors are caught and logged as errors. The extension attempts to clean selectors before use and logs the result.
- **Shadow DOM Search:**
  - The extension searches up to 20 levels deep in shadow DOMs for custom selectors. If not found in the regular DOM, it will search recursively in all shadow roots.
- **Console Logging:**
  - Detailed logs are emitted for selector cleaning, duplicate removal, fallback triggers, and extraction results.
  - Debug mode (`window.__STN_DEBUG_DEDUP = true`) provides more granular logs for troubleshooting.

## Quick Reference

| Domain           | Selector(s)                                          | What It Captures                        | Shadow DOM     | Notes                            |
| ---------------- | ---------------------------------------------------- | --------------------------------------- | -------------- | -------------------------------- |
| `servicenow.com` | `#current-page-title`<br>`.body`<br>`.related-links` | Page title, main article, related links | ✅ (20 levels) | Custom heading for related links |

## How It Works

### Multiple Selectors (One Per Entry)

You can specify **multiple CSS selectors, each as its own selector entry** in the UI (add more rows for the same domain). When editing raw storage or importing, you can also list selectors one-per-line. The extension will:

1. Search for all elements matching each selector
2. Combine them in the order they appear in the DOM
3. Create a single content capture containing all matched elements

**Example (UI rows):**

```
#current-page-title    <-- row 1 (same domain)
.body                  <-- row 2 (same domain)
.related-links         <-- row 3 (same domain, gets custom heading)
```

**Example (raw storage / multi-line):**

```
#current-page-title
.body
.related-links
```

- The `.related-links` section will be labeled with a custom heading "Related Links" in the output.

### Shadow DOM Support

The extension automatically searches through:

- Regular DOM elements (`document.querySelectorAll`)
- Shadow DOM trees (recursively, up to 20 levels deep)
- Multiple nested shadow roots

## Current Configured Sites

### ServiceNow Documentation

**Domain:** `servicenow.com`  
**Selectors:**

```
#current-page-title
.body
.related-links
```

**Explanation:**

- `#current-page-title` - Current page title (for navigation and context)
- `.body` - Main article body content (concept/procedural documentation)
- `.related-links` - Related links navigation section

**Shadow DOM Depth:** 20 levels deep in `FT-READER-TOPIC-CONTENT` component

## Custom Formatting Rules

### Overview

The Custom Formatting Rules feature allows you to transform specific HTML elements into formatted text in Notion. For example, you can convert `<span class="ph uicontrol">` elements to **bold** text by replacing them with `<strong>` tags.

### How It Works

**For Inline Elements** (like `span`, `a`, `code`):

- The entire element is replaced with the formatting tag
- Example: `<span class="keyword">text</span>` → `<strong>text</strong>`

**For Block → Inline** (like `div` → `em`):

- The container is preserved, but child content is wrapped with the formatting tag
- Example: `<div class="note">text</div>` → `<div class="note"><em>text</em></div>`
- This prevents invalid HTML structure (block elements inside inline tags)

**For Block → Block** (like `div` → `blockquote`):

- The entire container is replaced while preserving content and classes
- Example: `<div class="note note_note">text</div>` → `<blockquote class="note note_note">text</blockquote>`
- Perfect for converting note containers to semantic blockquotes

### Allowed Replacement Tags

**Inline Formatting:**

- `strong` - Bold text
- `em` - Italic text (semantic emphasis)
- `code` - Monospace/code formatting
- `mark` - Highlighted text
- `u` - Underlined text
- `del` - Strikethrough text
- `b` - Bold (HTML style)
- `i` - Italic (HTML style)

**Block Formatting:**

- `blockquote` - Emphasized block (ideal for notes, callouts)

### Configuration

**Via UI:**

1. Navigate to the Custom Site Selectors settings page
2. Scroll to "Custom Formatting Rules" section
3. Click "Add Formatting Rule"
4. Enter:
   - **Selector:** CSS selector (e.g., `span.ph.uicontrol`)
   - **Replacement:** Choose from dropdown (e.g., `strong`)
   - **Description:** Optional note (e.g., "UI control elements")
5. Click "Save Settings"

**Via Storage:**

```javascript
{
  "customFormatRules": [
    {
      "selector": "span.ph.uicontrol",
      "replacement": "strong",
      "description": "UI control elements (ServiceNow)"
    },
    {
      "selector": ".note__body",
      "replacement": "em",
      "description": "Note body text"
    }
  ]
}
```

### Best Practices

✅ **DO:**

- Target specific inline elements (e.g., `span.keyword`, `.note__body`)
- Use semantic tags when possible (`em` for emphasis, `strong` for importance)
- Test rules on sample pages before saving
- Check browser console for transformation logs

❌ **DON'T:**

- Target large block containers (e.g., `div.page-content`) - wrap inner elements instead
- Use non-allowed tags (security risk)
- Create conflicting rules for the same selector

### Examples

**ServiceNow UI Controls:**

```
Selector: span.ph.uicontrol
Replacement: strong
Result: Menu items and UI buttons appear bold
```

**ServiceNow File Paths:**

```
Selector: span.ph.filepath
Replacement: code
Result: File paths appear in monospace
```

**ServiceNow Note Sections (Recommended Approach):**

```
Selector: div.note.note_note
Replacement: blockquote
Result: Note container becomes a blockquote (emphasized block)

PLUS

Selector: .note__title
Replacement: strong
Result: "Note:" label appears bold

PLUS

Selector: .note__body
Replacement: em
Result: Note body text appears italicized
```

This combination will transform:

```html
<div class="note note note_note">
  <span class="note__title">Note:</span>
  <div class="note__body">Important information</div>
</div>
```

Into:

```html
<blockquote class="note note note_note">
  <strong>Note:</strong>
  <em>Important information</em>
</blockquote>
```

**Keywords:**

```
Selector: span.keyword
Replacement: mark
Result: Keywords appear highlighted
```

### Debugging

Enable detailed logging in the console:

1. Open browser DevTools (F12)
2. Look for `[applyCustomFormatting]` messages
3. Check for:
   - "Using format rules: [...]" - Shows loaded rules
   - "Found X elements matching..." - Shows matched elements
   - "Wrapping children of DIV..." - Block → inline handling
   - "Replacing DIV container with..." - Block → block handling
   - "✓ Applied X transformations" - Success count

### Current Configured Rules

**ServiceNow:**

- `span.ph.uicontrol` → `strong` - UI control elements (buttons, menu items)

**Example Pages:**

- https://www.servicenow.com/docs/r/it-service-management/machine-learning-itsm.html
- Any ServiceNow documentation page with nested Web Components

**Notes:**

- ServiceNow uses heavily nested Web Components (FT-\* custom elements)
- Content is dynamically loaded inside shadow DOMs
- The extension waits up to 30 seconds (60 attempts × 500ms) for content to load
- Navigation monitoring automatically updates content when navigating to other pages on the same domain

## Adding New Custom Selectors

### Via Extension UI

1. Click the Web-2-Notion extension icon
2. Click "Custom Site Selectors"
3. Enter the domain (e.g., `example.com`)
4. Enter each CSS selector on a separate line:
   ```
   .class1
   .class2
   #id3
   ```
5. Click "Save"

### Testing Your Selector

1. Open the target website
2. Open Chrome DevTools Console
3. Test your selector:

   ```javascript
   // Test in regular DOM
   document.querySelectorAll(".your-selector");

   // Test in shadow DOM (if needed)
   document
     .querySelector("custom-element")
     .shadowRoot.querySelectorAll(".your-selector");
   ```

4. Verify the correct elements are found

## Selector Syntax

### Basic Selectors

- Class: `.classname`
- ID: `#elementid`
- Element: `div`, `article`, `section`
- Combined: `.class1.class2` (element must have BOTH classes)

### Multiple Selectors (One Per Line)

- Each selector should be on its own line:
  ```
  .selector1
  .selector2
  .selector3
  ```
- All matching elements will be combined

### Examples

```css
/* Single class */
.article-content

/* Multiple classes on same element */
.body.refbody

/* Multiple different selectors (one per entry) */
.main-content
.sidebar-content
.related-links

/* Complex selector */
article.documentation
.body.conbody
nav.related
```

## Troubleshooting

### No Content Captured

1. Open DevTools Console
2. Look for `[scanWebpage]` logs
3. Check which selectors were searched:
   ```
   [scanWebpage] Searching for: ".your-selector"
   [scanWebpage]   Document matches: 0
   [scanWebpage]   Shadow DOM matches: 0
   ```
4. If matches = 0, the selector is incorrect or content hasn't loaded

### Only Some Elements Captured

- Check that all desired selectors are included (one per selector entry / separate row in the UI)
- Verify each selector individually in DevTools
- Check console logs to see which elements were found

### Content Not Updating on Navigation

- Verify the domain matches exactly (no `www` vs non-`www` mismatch)
- Check console for `[scanWebpage] Setting up navigation monitor` message
- Navigation monitoring only works on the same domain

## Technical Details

### Code Locations

- **Automatic Scanning:** `scanWebpage.js` (auto-scanning, navigation monitoring)
- **Manual Selection:** `clipContent.js` (manual selection, fallback to custom selector)

### Search Strategy

For multiple selectors, the extension:

1. Tries `document.querySelectorAll(selector)` for each selector
2. If no matches, searches all shadow DOMs recursively (up to 20 levels)
3. Collects ALL matching elements from ALL shadow roots
4. Creates a container `<div class="combined-scan-results">` or `<div class="combined-content-selection">`
5. Clones each matched element into the container
6. Uses the container as the content source

### Storage Format

```javascript
{
  "customSelectors": {
    "servicenow.com": [
      "#current-page-title",
      ".body",
      ".related-links"
    ],
    "example.com": [
      ".article-body",
      ".sidebar"
    ]
  }
}
```

## Version History

- **v5.0.1** (2026):
  - Shadow DOM search depth increased to 20
  - Auto-Extract feature added
  - Storage migrated to `chrome.storage.local`
  - Improved navigation monitoring
- **v4.0.1–v4.0.5**: See previous versions for details

## Future Enhancements

Potential improvements:

- [ ] UI indicator when content auto-updates after navigation
- [ ] Option to specify order of combined selectors
- [ ] Separate vs combined capture modes
- [ ] Per-domain caching to reduce storage lookups
- [ ] Visual selector picker tool
- [ ] Import/export selector configurations
- [ ] Community-shared selector database

## Contributing

When adding new site selectors, please:

1. Test thoroughly on multiple pages of the target site
2. Document which elements each selector targets
3. Note any shadow DOM depth requirements
4. Include example URLs
5. Update this document with your findings

## Support

If you encounter issues with custom selectors:

1. Check the console logs (`[scanWebpage]` messages)
2. Verify your selector syntax in DevTools
3. Ensure content has finished loading
4. Create an issue with:
   - Target website URL
   - Selector(s) used
   - Console log output
   - Expected vs actual behavior
