# Popup Formatting Shim Implementation Summary

## Overview

This implementation adds formatting functionality to the Web-2-Notion Chrome extension's popup UI using a **shim-based approach** that respects repository conventions:

✅ **No edits to bundled/minified files** (`popup/static/js/main.js` remains untouched)  
✅ **No frameworks or build tools** (pure JavaScript, no React/TypeScript/webpack)  
✅ **Uses localStorage** for cross-context coordination (keys prefixed with `__stn_`)  
✅ **External JavaScript files only** (no inline scripts, per Chrome CSP requirements)

## Architecture

### Script Loading Order

The popup HTML loads scripts in a specific sequence:

```html
<!-- 1. PRELOAD: Intercept localStorage before main bundle reads it -->
<script src="./shim/preload-format.js"></script>

<!-- 2. MAIN BUNDLE: Original minified popup code (React app) -->
<script defer="defer" src="./static/js/main.js"></script>

<!-- 3. UI AUGMENTATION: Inject formatting controls after bundle initializes -->
<script defer="defer" src="./shim/ui-augment.js"></script>
```

**Why this order matters:**
1. `preload-format.js` must run **first** to intercept `Storage.prototype.getItem` before the main bundle reads localStorage
2. `ui-augment.js` must run **last** (with `defer`) to inject UI after React renders the `#root` element

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Content Script (clipContent.js)                                  │
│ ↓ Scrapes webpage data                                           │
│ ↓ Stores to: localStorage.__stn_scraped_content                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Preload Shim (preload-format.js)                                 │
│ ↓ Intercepts: localStorage.getItem('__stn_scraped_content')      │
│ ↓ Reads format mode from: localStorage.__stn_format_mode         │
│ ↓ Applies formatting: plain / singleLine / bullets               │
│ ↓ Returns formatted data (transparent to main bundle)            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Main Bundle (main.js)                                             │
│ ↓ Reads localStorage (gets formatted data via interceptor)       │
│ ↓ Renders popup UI with formatted content                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ UI Augmentation (ui-augment.js)                                   │
│ ↓ Injects formatting controls into #root                          │
│ ↓ Dropdown: Plain | Single line | Bullets                         │
│ ↓ Persists selection to: localStorage.__stn_format_mode          │
│ ↓ Apply button: Reloads popup to re-trigger formatting           │
└─────────────────────────────────────────────────────────────────┘
```

## localStorage Keys

All shim-related keys use the `__stn_` prefix per repository conventions:

| Key | Purpose | Set By | Read By |
|-----|---------|--------|---------|
| `__stn_scraped_content` | Raw scraped webpage data | Content script | Preload shim |
| `__stn_formatted_content` | Formatted copy (debug) | Preload shim | (optional) |
| `__stn_format_mode` | Selected format mode | UI augment | Preload shim |

### Important Note: Storage API Choice

**Repository Convention:** The custom instructions specify using `localStorage` with `__stn_` prefix for cross-context data transfer.

**Current Implementation:** The extension's minified bundle currently uses `chrome.storage.local` API for some data persistence.

**Shim Approach:** This shim establishes the localStorage-based pattern. If content scripts currently use `chrome.storage.local`, they should be updated to also write to localStorage for the shim to intercept the data. Alternatively, a `chrome.storage` interceptor could be added.

### Discovering Actual Keys

The extension may use different localStorage keys. To discover them:

1. Open the popup
2. Open DevTools (right-click → Inspect)
3. Console → Run:
   ```javascript
   Object.keys(localStorage).filter(k => k.includes('__stn_')).sort()
   ```
4. Update `KEYS.scraped` in `preload-format.js` if needed

## Formatting Modes

### Plain
Normalizes text without changing structure:
- Removes zero-width Unicode characters (`\u200B`, `\u200C`, `\u200D`, `\uFEFF`)
- Normalizes line endings (`\r\n` → `\n`)
- Trims leading/trailing whitespace

**Example:**
```
Input:  "  Line\u200Bone  \n  Line two  "
Output: "Line one\nLine two"
```

### Single Line
Collapses all whitespace into single spaces:
- All plain mode transformations
- Plus: `\s+` → ` ` (single space)

**Example:**
```
Input:  "Line one\n  Line two\n\nLine three"
Output: "Line one Line two Line three"
```

### Bullets
Converts lines into a bullet-point list:
- Splits on newlines
- Filters empty lines
- Adds `• ` prefix to each line

**Example:**
```
Input:  "Line one\nLine two\n\nLine three"
Output: "• Line one\n• Line two\n• Line three"
```

## Data Structure

The shim handles two data formats:

### JSON Payload (Common)
```javascript
{
  "text": "Scraped content here...",
  "content": "Alternative field name",
  "url": "https://example.com",
  "metadata": { /* ... */ }
}
```

**Formatting applied to:** `parsed.text || parsed.content || parsed.value`

### Plain String (Fallback)
```javascript
"Raw text content"
```

**Formatting applied to:** Entire string

## UI Components

### Format Selector
Injected at the top of the popup (`#root`):

```
┌─────────────────────────────────────────┐
│ Format: [Plain ▼]  [Apply]               │
│                                           │
│ (Rest of original popup UI)              │
└─────────────────────────────────────────┘
```

**Features:**
- Dropdown with three modes
- Apply button triggers page reload
- Persists selection across popup opens/closes
- Survives React re-renders (MutationObserver)

**Styling:**
- Matches extension's gradient button design
- Purple gradient: `linear-gradient(90deg, #6a5af9, #8b5cf6)`
- Consistent with existing `main.css` styles

## Extension Compatibility

### Chrome Extension Manifest V3
✅ Compatible with manifest_version: 3  
✅ Respects Content Security Policy (`script-src 'self'`)  
✅ No eval() or inline scripts  
✅ External JS files only

### CSP Policy
```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline';"
}
```

The shim scripts satisfy `script-src 'self'` by being:
- Loaded from local files (`./shim/preload-format.js`)
- No eval, new Function(), or inline code

## Debugging

### Enable Debug Mode
Set `DEBUG = true` in either shim file to enable console logging:

**preload-format.js:**
```javascript
const DEBUG = true;  // Change from false
```

**Output example:**
```
[stn-format] getItem formatted { key: "__stn_scraped_content", mode: "bullets" }
[stn-format] saved formatted copy { mode: "bullets" }
```

**ui-augment.js:**
```javascript
const DEBUG = true;  // Change from false
```

**Output example:**
```
[stn-format] mode changed singleLine
[stn-format] controls injected
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Controls not visible | Script load order wrong | Ensure `defer` on ui-augment.js |
| Formatting not applied | Wrong localStorage key | Run key discovery in DevTools |
| CSP violations | Inline scripts | Verify all scripts are external files |
| Dropdown resets | localStorage not persisting | Check browser privacy settings |

## Extending the Shim

### Adding a New Formatter

1. **Add formatter function** in `preload-format.js`:
```javascript
const formatters = {
  plain: (text) => cleanText(text),
  singleLine: (text) => cleanText(text).replace(/\s+/g, " "),
  bullets: (text) => /* ... */,
  numbered: (text) => {
    return cleanText(text)
      .split("\n")
      .map((line, i) => `${i + 1}. ${line.trim()}`)
      .join("\n");
  }
};
```

2. **Add UI option** in `ui-augment.js`:
```javascript
const modes = [
  { value: "plain", label: "Plain" },
  { value: "singleLine", label: "Single line" },
  { value: "bullets", label: "Bullets" },
  { value: "numbered", label: "Numbered list" }
];
```

### Customizing for Different Data Structures

If the extension uses a different JSON schema:

**Example:** Content in `parsed.blocks` array:
```javascript
function formatRawValue(rawValue) {
  if (!rawValue) return rawValue;
  
  const parsed = safeParse(rawValue);
  if (parsed && parsed.blocks && Array.isArray(parsed.blocks)) {
    // Format each block's text field
    parsed.blocks = parsed.blocks.map(block => ({
      ...block,
      text: formatter(block.text || "")
    }));
    return JSON.stringify(parsed);
  }
  
  // ... rest of original logic
}
```

## Files Modified/Created

### Created
- `Web-2-Notion/popup/shim/` (directory)
- `Web-2-Notion/popup/shim/preload-format.js` (2.5 KB)
- `Web-2-Notion/popup/shim/ui-augment.js` (2.7 KB)
- `Web-2-Notion/popup/shim/README.md` (4.4 KB)
- `Web-2-Notion/popup/shim/TESTING.md` (7.0 KB)
- `Web-2-Notion/popup/shim/SUMMARY.md` (this file)

### Modified
- `Web-2-Notion/popup/index.html` (added 3 script tags)

### Untouched
- `Web-2-Notion/popup/static/js/main.js` ✅ (8.3 MB minified bundle)
- All other extension files

## Testing Checklist

- [ ] Extension loads without errors in `chrome://extensions`
- [ ] Popup opens without console errors
- [ ] Format controls appear at top of popup
- [ ] Dropdown shows three modes (Plain / Single line / Bullets)
- [ ] Apply button triggers page reload
- [ ] Format mode persists across popup closes
- [ ] localStorage keys discoverable via DevTools
- [ ] No CSP violations in console
- [ ] No modifications to bundled `main.js`

## Next Steps

1. **Load extension** and verify shim structure works
2. **Discover actual localStorage keys** used by the extension
3. **Update KEYS.scraped** in `preload-format.js` if different
4. **Test with real content** from target websites
5. **Adjust data structure** handling if schema differs
6. **Iterate on formatters** based on user needs

## References

- Repository Conventions: See `.github/copilot-instructions.md`
- Chrome Extension Popup: [developer.chrome.com/docs/extensions/](https://developer.chrome.com/docs/extensions/)
- localStorage API: [developer.mozilla.org/en-US/docs/Web/API/Window/localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- Content Security Policy: [developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#content-security-policy](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#content-security-policy)
