# Custom Site Selectors Guide (2026 Update)

## What's New

- **Shadow DOM Support:** Now searches up to 20 levels deep for custom selectors, ensuring robust capture on sites with complex web components.
- **Multiple Selectors:** Specify each selector on a separate line for clarity. All matches are combined in DOM order.
- **Enhanced Duplicate Detection:** Improved detection of duplicate images and tables:
  - Images are matched by normalized URL (without query params), alt text, and dimensions
  - Tables are matched by structure (rows × columns), text length, and content
  - Increased content signature from 200 to 500 characters for better accuracy
- **Auto-Extract Integration:** Custom selectors work seamlessly with the new Auto-Extract feature. When auto-extract is started, the extension uses your custom selectors for content capture and navigation.
- **Storage:** Custom selectors are now stored in `chrome.storage.local` for cross-context reliability.
- **Navigation Monitoring:** Improved detection and auto-update of content when navigating within supported domains.
- **UI Workflow:** After configuring selectors, return to the Settings panel and use "Start Auto-Extract" to begin automated capture.

## Quick Reference

| Domain           | Selector(s)                                            | What It Captures                     | Shadow DOM     | Notes                           |
| ---------------- | ------------------------------------------------------ | ------------------------------------ | -------------- | ------------------------------- |
| `servicenow.com` | `.body.conbody`<br>`.body.refbody`<br>`.related-links` | Main article content + related links | ✅ (20 levels) | Web Components, dynamic loading |

## How It Works

### Multiple Selectors (One Per Entry)

You can specify **multiple CSS selectors, each as its own selector entry** in the UI (add more rows for the same domain). When editing raw storage or importing, you can also list selectors one-per-line. The extension will:

1. Search for all elements matching each selector
2. Combine them in the order they appear in the DOM
3. Create a single content capture containing all matched elements

**Example (UI rows):**

```
.body.conbody       <-- row 1 (same domain)
.body.refbody       <-- row 2 (same domain)
.related-links      <-- row 3 (same domain)
```

**Example (raw storage / multi-line):**

```
.body.conbody
.body.refbody
.related-links
```

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
.body.conbody
.body.refbody
.related-links
```

**Explanation:**

- `.body.conbody` - Main article body content (concept/procedural documentation)
- `.body.refbody` - Reference documentation body content
- `.related-links` - Related links navigation section

**Shadow DOM Depth:** 20 levels deep in `FT-READER-TOPIC-CONTENT` component

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
      ".body.conbody",
      ".body.refbody",
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
