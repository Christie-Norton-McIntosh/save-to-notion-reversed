# Custom Site Selectors Guide

## Overview

The Web-2-Notion extension supports custom CSS selectors for specific websites. This allows you to capture specific content from sites with complex DOM structures (especially those using Shadow DOM).

## Quick Reference

| Domain           | Selector(s)                                    | What It Captures                     | Shadow DOM    | Notes                           |
| ---------------- | ---------------------------------------------- | ------------------------------------ | ------------- | ------------------------------- |
| `servicenow.com` | `.body.conbody, .body.refbody, .related-links` | Main article content + related links | ✅ (6 levels) | Web Components, dynamic loading |

## How It Works

### Multiple Selectors

You can specify **multiple CSS selectors separated by commas**. The extension will:

1. Search for all elements matching each selector
2. Combine them in the order they appear in the DOM
3. Create a single content capture containing all matched elements

### Shadow DOM Support

The extension automatically searches through:

- Regular DOM elements (`document.querySelectorAll`)
- Shadow DOM trees (recursively, up to 10+ levels deep)
- Multiple nested shadow roots

## Current Configured Sites

### ServiceNow Documentation

**Domain:** `servicenow.com`  
**Selector:** `.body.conbody, .body.refbody, .related-links`

**Explanation:**

- `.body.conbody` - Main article body content (concept/procedural documentation)
- `.body.refbody` - Reference documentation body content
- `.related-links` - Related links navigation section

**Shadow DOM Depth:** 6 levels deep in `FT-READER-TOPIC-CONTENT` component

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
4. Enter CSS selector(s) - use commas for multiple: `.class1, .class2, #id3`
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

### Multiple Selectors

- Comma-separated: `.selector1, .selector2, .selector3`
- All matching elements will be combined

### Examples

```css
/* Single class */
.article-content

/* Multiple classes on same element */
.body.refbody

/* Multiple different selectors */
.main-content, .sidebar-content, .related-links

/* Complex selector */
article.documentation, .body.conbody, nav.related
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

- Check that all desired selectors are included (comma-separated)
- Verify each selector individually in DevTools
- Check console logs to see which elements were found

### Content Not Updating on Navigation

- Verify the domain matches exactly (no `www` vs non-`www` mismatch)
- Check console for `[scanWebpage] Setting up navigation monitor` message
- Navigation monitoring only works on the same domain

## Technical Details

### Code Locations

- **Automatic Scanning:** `scanWebpage.js` (lines ~14640-14750)
  - Pre-scans page when extension loads
  - Monitors navigation and auto-updates
- **Manual Selection:** `clipContent.js` (lines ~3030-3150)
  - Used when user manually selects content
  - Falls back to custom selector if defined

### Search Strategy

For multiple selectors, the extension:

1. Tries `document.querySelectorAll(selector)` first
2. If no matches, searches all shadow DOMs recursively
3. Collects ALL matching elements from ALL shadow roots
4. Creates a container `<div class="combined-scan-results">` or `<div class="combined-content-selection">`
5. Clones each matched element into the container
6. Uses the container as the content source

### Storage Format

```javascript
{
  "customSelectors": {
    "servicenow.com": ".body.conbody, .body.refbody, .related-links",
    "example.com": ".article-body, .sidebar"
  }
}
```

## Version History

- **v4.0.1** - Initial shadow DOM support (PR #1)
- **v4.0.2** - Added navigation monitoring
- **v4.0.3** - Added multiple selector support with querySelectorAll
- **v4.0.4** - Enhanced logging for debugging
- **v4.0.5** - Added individual selector search diagnostics

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
