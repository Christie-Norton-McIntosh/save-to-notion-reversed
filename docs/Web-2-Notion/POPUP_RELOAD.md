# Popup Reload Functionality

## Overview

The popup now automatically reloads when the active browser page reloads or navigates to a new URL. This ensures the popup always displays current information about the active page.

## Implementation

### Files Modified/Created

1. **`Web-2-Notion/popup/pageReloadListener.js`** (NEW)
   - Listens for tab updates, replacements, and activations
   - Automatically reloads the popup when page changes are detected
   - Includes debug logging for troubleshooting

2. **`Web-2-Notion/popup/index.html`** (MODIFIED)
   - Added script tag to load `pageReloadListener.js`

3. **`Web-2-Notion/manifest.json`** (MODIFIED)
   - Moved `tabs` permission from `optional_permissions` to `permissions`
   - Required for reliable access to tab events

### How It Works

The `pageReloadListener.js` script:

1. **Captures Initial State**: On popup load, captures the current tab ID and URL
2. **Monitors Tab Updates**: Listens for `chrome.tabs.onUpdated` events
3. **Detects Changes**: Compares new URL with stored URL when page completes loading
4. **Reloads Popup**: Calls `window.location.reload()` when changes are detected

### Events Monitored

- **`chrome.tabs.onUpdated`**: Fires when tab properties change (URL, loading status, etc.)
  - Triggers on: page navigation, page reload, URL changes
  - Only responds when `status === "complete"` for the current tab

- **`chrome.tabs.onReplaced`**: Fires when a tab is replaced (rare edge case)
  - Ensures tab ID stays current during tab replacements

- **`chrome.tabs.onActivated`**: Fires when user switches to a different tab
  - Reloads popup to reflect the newly active tab's data

## Testing

### Test Pages Included

Three test pages are provided in `Web-2-Notion/test/`:

1. **`popup-reload-test-page-1.html`** - Starting page with navigation buttons
2. **`popup-reload-test-page-2.html`** - Destination page to test navigation
3. **`popup-reload-test-page-3.html`** - Auto-reloading page (5-second countdown)

### Manual Testing Steps

1. **Load the Extension**
   - Open Chrome/Edge
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `Web-2-Notion` folder

2. **Open Test Page**
   - Open `popup-reload-test-page-1.html` in a browser tab

3. **Open Extension Popup**
   - Click the extension icon to open the popup
   - Keep the popup open during testing

4. **Test Navigation**
   - Click "Go to Page 2" button in the test page
   - ✅ Popup should reload automatically

5. **Test Page Reload**
   - Press `Cmd+R` (Mac) or `Ctrl+R` (Windows/Linux) to reload the page
   - ✅ Popup should reload automatically

6. **Test Auto-Reload**
   - Navigate to Page 3 (auto-reload test)
   - Watch the countdown timer
   - ✅ Popup should reload each time the page reloads

### Debugging

To view debug messages:

1. Right-click the extension icon
2. Select "Inspect popup"
3. Open the Console tab
4. Look for messages starting with `[PageReloadListener]`

Example debug output:

```
[PageReloadListener] Initialized for tab: 123456789
[PageReloadListener] Page changed: .../page-1.html -> .../page-2.html
[PageReloadListener] Reloading popup due to page change
```

## Use Cases

This functionality improves the user experience by ensuring:

1. **Current Data**: Popup always displays information about the current page
2. **Accurate Metadata**: Title, URL, and other metadata stay in sync
3. **Selector Updates**: Custom selectors reflect the current page structure
4. **State Consistency**: No stale data from previous pages

## Performance

- **Minimal Overhead**: Event listeners are lightweight and only fire on actual page changes
- **Efficient**: Only reloads popup for the active tab, not background tabs
- **Debounced**: Only triggers on `status === "complete"` to avoid multiple reloads during navigation

## Browser Compatibility

- ✅ Chrome (Manifest V3)
- ✅ Edge (Manifest V3)
- ✅ Brave (Manifest V3)
- ⚠️ Firefox (may require Manifest V2 version with slight modifications)

## Troubleshooting

### Popup Doesn't Reload

1. **Check Permissions**: Ensure `tabs` is in the `permissions` array in `manifest.json`
2. **Reload Extension**: Go to `chrome://extensions/` and click the refresh icon
3. **Check Console**: Look for errors in the popup's console
4. **Verify Events**: Add breakpoints in `pageReloadListener.js` to verify events fire

### Popup Reloads Too Often

- This could indicate the URL is changing more frequently than expected
- Check the debug logs to see what URLs are being detected
- May need to add debouncing or URL comparison logic

### Popup Doesn't Update Content

- The reload is working, but content might be cached
- Check if the main popup script properly queries the current tab
- Ensure `chrome.tabs.query({ active: true, currentWindow: true })` is used

## Future Enhancements

Potential improvements:

1. **Smart Reload**: Only reload if significant changes detected (e.g., domain change)
2. **State Preservation**: Save/restore popup UI state across reloads
3. **Configurable**: Add user setting to enable/disable auto-reload
4. **Debouncing**: Add delay to prevent rapid reloads during quick navigation
5. **Visual Indicator**: Show a brief "reloading..." indicator during reload

## Notes

- The popup reload is intentionally simple and aggressive to ensure data freshness
- If users report the reload being disruptive, consider adding a configurable delay or toggle
- Debug logging can be removed in production by removing `console.debug()` calls
