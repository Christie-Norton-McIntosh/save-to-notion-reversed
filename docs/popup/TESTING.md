# Testing Guide: Popup Formatting Shim Scripts

This guide explains how to test the popup formatting shim functionality and troubleshoot common issues.

## Prerequisites

- Chrome browser (or Chromium-based browser)
- Developer mode enabled in `chrome://extensions`
- Basic familiarity with Chrome DevTools

## Step 1: Load the Extension

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `Web-2-Notion` directory from this repository
5. Verify the extension loads without errors:
   - Look for the extension card with "Web-2-Notion" title
   - Check that no red error messages appear
   - Note the extension ID (e.g., `abcdefghijklmnopqrstuvwxyz`)

## Step 2: Verify Shim Scripts Load

1. Click the extension icon in Chrome toolbar to open the popup
2. Right-click inside the popup and select **"Inspect"** to open DevTools
3. Go to the **Console** tab
4. Check for errors related to shim scripts:
   - No "Failed to load resource" errors for `preload-format.js` or `ui-augment.js`
   - No CSP violations
5. Verify the scripts executed:
   ```javascript
   // Check if formatting mode is accessible
   localStorage.getItem('__stn_format_mode')
   // Should return: null (if not set yet) or "plain"/"singleLine"/"bullets"
   ```

## Step 3: Test UI Augmentation

1. With the popup open, look for the **Format control** at the top of the popup:
   - Should see: Label "Format:", dropdown selector, and "Apply" button
   - Dropdown should have three options: "Plain", "Single line", "Bullets"
   - Button should have purple gradient background matching extension style

2. If controls are not visible:
   - Open DevTools Console
   - Check for JavaScript errors
   - Verify `#stn-format-controls` element exists:
     ```javascript
     document.querySelector('#stn-format-controls')
     ```
   - Manually check if the script ran:
     ```javascript
     document.querySelector('#root')  // Should exist for React app
     ```

## Step 4: Test Formatting Modes

Since the extension currently uses `chrome.storage` and message passing rather than `localStorage` for scraped content, you'll need to manually test the formatting logic:

### Manual Test in Console

1. Open popup DevTools → Console
2. Set a test payload in localStorage:
   ```javascript
   // Test with plain text
   localStorage.setItem('__stn_scraped_content', JSON.stringify({
     text: "Line one\nLine two\nLine three",
     content: "Test content"
   }));
   ```

3. Select a formatting mode in the dropdown
4. Click **"Apply"** button (popup will reload)
5. After reload, retrieve the formatted content:
   ```javascript
   // Should show formatted version based on selected mode
   JSON.parse(localStorage.getItem('__stn_scraped_content'))
   ```

### Expected Results by Mode

**Plain mode:**
- Removes zero-width characters
- Normalizes line breaks
- Trims whitespace
- Input: `"  Line\u200Bone  \n  Line two  "`
- Output: `"Line one\nLine two"`

**Single line mode:**
- Same as plain, plus:
- Collapses all whitespace to single spaces
- Input: `"Line one\nLine two"`
- Output: `"Line one Line two"`

**Bullets mode:**
- Splits on newlines
- Adds bullet (•) prefix to each line
- Input: `"Line one\nLine two"`
- Output: `"• Line one\n• Line two"`

## Step 5: Verify Persistence

1. Select a formatting mode (e.g., "Bullets")
2. Close the popup
3. Reopen the popup
4. Verify the dropdown still shows "Bullets" (not reset to "Plain")

This confirms `localStorage.setItem` is working for `__stn_format_mode`.

## Troubleshooting

### Controls Don't Appear

**Symptom:** No "Format" control visible in popup

**Possible Causes:**
1. `ui-augment.js` failed to load
2. React root element (`#root`) doesn't exist yet
3. MutationObserver not triggering

**Debug Steps:**
```javascript
// Check if script loaded
console.log('ui-augment loaded:', document.querySelector('script[src*="ui-augment"]'));

// Check if root exists
console.log('Root element:', document.querySelector('#root'));

// Manually trigger control injection
document.dispatchEvent(new Event('DOMContentLoaded'));
```

### Formatting Not Applied

**Symptom:** Changing mode and clicking "Apply" doesn't change output

**Possible Causes:**
1. Extension doesn't use the `__stn_scraped_content` localStorage key
2. Content is stored in chrome.storage.local instead
3. Data structure doesn't match expected schema

**Debug Steps:**
```javascript
// List all localStorage keys
Object.keys(localStorage).sort()

// Check for __stn_ prefixed keys
Object.keys(localStorage).filter(k => k.includes('__stn_'))

// Check chrome.storage.local instead
chrome.storage.local.get(null, (items) => console.log('chrome.storage:', items))
```

### CSP Errors

**Symptom:** Console shows Content Security Policy violations

**Example Error:**
```
Refused to execute inline script because it violates the following
Content Security Policy directive: "script-src 'self'"
```

**Solution:**
- Verify no inline scripts in HTML (all scripts should be external files)
- Check that script src paths are relative (e.g., `./shim/preload-format.js`)
- Ensure no `onclick` attributes or inline event handlers

## Discovering Actual localStorage Keys

If the extension uses different localStorage keys than `__stn_scraped_content`:

1. Open the popup
2. Open DevTools → Console
3. List all keys:
   ```javascript
   Object.keys(localStorage).sort()
   ```
4. Filter for relevant patterns:
   ```javascript
   Object.keys(localStorage).filter(k => 
     k.includes('content') || 
     k.includes('scraped') || 
     k.includes('clip') ||
     k.includes('__stn_')
   )
   ```
5. Update `KEYS.scraped` in `preload-format.js` with the correct key

## Integration with Actual Extension

To integrate with the extension's real content flow:

1. **Find where content is stored:**
   - Check `clipContent.js` for `localStorage.setItem` or `chrome.storage.local.set`
   - Look for message passing: `chrome.runtime.sendMessage`

2. **Update the shim if needed:**
   - If using chrome.storage, create chrome.storage interceptor instead
   - If using message passing, intercept `chrome.runtime.sendMessage`

3. **Alternative approach (if localStorage not used):**
   - Modify content scripts to store to localStorage before sending messages
   - Keep shim approach but add bridge between storage APIs

## Next Steps

After verifying the shim structure works:

1. Trace actual content flow in the extension
2. Identify real storage keys or message patterns
3. Update shim scripts to intercept correct data paths
4. Test with real scraped content from target websites

## References

- Chrome Extension Storage API: https://developer.chrome.com/docs/extensions/reference/storage/
- Chrome Extension Content Scripts: https://developer.chrome.com/docs/extensions/mv3/content_scripts/
- localStorage API: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
