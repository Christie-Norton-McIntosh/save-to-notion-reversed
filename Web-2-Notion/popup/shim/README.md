# Popup Formatting Shim Scripts

This directory contains shim scripts that add formatting functionality to the extension's popup UI without modifying the bundled/minified files.

## Architecture

The shim approach respects repository conventions:
- **No edits to bundled files** (`popup/static/js/main.js` remains untouched)
- **No frameworks or build tools** (pure JavaScript)
- **Uses localStorage** for cross-context data transfer (keys prefixed with `__stn_`)
- **External JavaScript files** (no inline scripts, per Chrome extension requirements)

## Files

### `preload-format.js`
Runs **before** the popup bundle. Intercepts `localStorage.getItem()` and `localStorage.setItem()` to format scraped content on-the-fly based on the selected formatting mode.

**Formatting modes:**
- `plain` - Clean text with zero-width characters removed
- `singleLine` - Collapses whitespace into a single line
- `bullets` - Converts lines into bullet-point list (• prefix)

**localStorage keys:**
- `__stn_scraped_content` - Input: raw scraped content
- `__stn_formatted_content` - Output: formatted copy (for debugging)
- `__stn_format_mode` - Stores the selected formatting mode

### `ui-augment.js`
Runs **after** the popup bundle. Injects a small formatting control UI into the popup:
- Format selector dropdown (Plain / Single line / Bullets)
- Apply button (reloads popup to apply changes)
- Persists selection to localStorage
- Handles React re-renders with MutationObserver

**Styling:** Matches the extension's existing gradient button design.

## Integration

The shim scripts are loaded in `popup/index.html` in this order:

```html
<script src="./shim/preload-format.js"></script>
<script defer="defer" src="./static/js/main.js"></script>
<script defer="defer" src="./shim/ui-augment.js"></script>
```

## Customization

### Updating localStorage Keys

If the actual localStorage key for scraped content differs from `__stn_scraped_content`, update the `KEYS.scraped` value in `preload-format.js`:

```javascript
const KEYS = {
  scraped: "__stn_your_actual_key",  // Update this
  formatted: "__stn_formatted_content",
  formatMode: "__stn_format_mode"
};
```

To discover the actual key, open the popup DevTools console and run:
```javascript
Object.keys(localStorage).filter(k => k.includes("__stn_")).sort()
```

### Adjusting Data Structure

If the scraped payload uses a different JSON schema (e.g., `parsed.blocks` instead of `parsed.text`), update the mapping in `formatRawValue()`:

```javascript
const rawText = parsed.text || parsed.content || parsed.blocks || "";
```

### Adding New Formatters

To add a new formatting mode:

1. Add the formatter function to `preload-format.js`:
```javascript
const formatters = {
  plain: (text) => cleanText(text),
  singleLine: (text) => cleanText(text).replace(/\s+/g, " "),
  bullets: (text) => /* ... */,
  myNewFormatter: (text) => {
    // Your formatting logic here
    return text;
  }
};
```

2. Add the option to `ui-augment.js`:
```javascript
const modes = [
  { value: "plain", label: "Plain" },
  { value: "singleLine", label: "Single line" },
  { value: "bullets", label: "Bullets" },
  { value: "myNewFormatter", label: "My Format" }
];
```

## Testing

1. Load the unpacked extension in Chrome:
   - Navigate to `chrome://extensions`
   - Enable Developer Mode
   - Click "Load unpacked" and select the `Web-2-Notion` directory

2. Visit a target website and use the extension to scrape content

3. Open the popup:
   - Verify the "Format" control appears at the top
   - Change the formatting mode
   - Click "Apply" and confirm the preview updates

4. Debug localStorage keys (if needed):
   - Open popup DevTools → Console
   - Run: `Object.keys(localStorage).filter(k => k.includes("__stn_")).sort()`
   - Update `KEYS.scraped` in `preload-format.js` if necessary

## Notes

- The shim approach is **non-invasive**: removing the shim scripts restores original behavior
- All formatting happens **at read-time** via `localStorage.getItem()` interception
- The UI augmentation uses **MutationObserver** to persist through React re-renders
- Debug mode can be enabled by setting `DEBUG = true` in either shim file

## References

- Chrome Extension Popup Documentation: [developer.chrome.com](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
- Repository conventions: See main README and custom instructions
