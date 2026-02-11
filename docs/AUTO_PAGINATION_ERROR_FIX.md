# Auto-Pagination "Could not establish connection" Error Fix

## Problem

When clicking "Start Auto-Extract" button in the popup, the error appeared:

```
Error starting Auto-Extract: Could not establish connection.
Receiving end does not exist.
Make sure you are on a webpage and have configured the CSS selector.
```

## Root Cause

The popup was trying to send a message to `autoPagination.js` content script, but:

1. **Script was not injected**: `autoPagination.js` was not automatically loaded into web pages
2. **Script couldn't be injected**: The file was not listed in `web_accessible_resources` in manifest.json
3. **No message receiver**: Without the script loaded, there was no listener for the `startAutoPagination` message

## Solution

### 1. Added `autoPagination.js` to manifest.json

**File**: `manifest.json`

Added `autoPagination.js` to the `web_accessible_resources` array so it can be injected via `chrome.scripting.executeScript()`:

```json
"web_accessible_resources": [
  {
    "resources": [
      "popup/index.html",
      "modal/modal.html",
      "toast/toast.html",
      "highlightTooltip/highlightTooltip.html",
      "restricted_popup/index.html",
      "restricted_popup/script.js",
      "onboarding_guide_popup/index.html",
      "onboarding_guide_popup/script.js",
      "welcome/welcome.html",
      "site-selectors.html",
      "autoPagination.html",
      "autoPagination.js",  // ← ADDED THIS
      "autoPaginationUI.js",
      "assets/*.js",
      "assets/*.png"
    ],
    "matches": ["<all_urls>"]
  }
]
```

### 2. Updated popup to inject script before sending message

**File**: `popup/static/js/main.js` (line ~165419)

Modified the `onOpenChangelogCTA` function (which handles the "Start Auto-Extract" button) to:

1. **Inject the script** using `chrome.scripting.executeScript()`
2. **Wait for initialization** (100ms delay)
3. **Then send the message** to start auto-pagination

```javascript
// Inject autoPagination.js into the page before sending the message
await chrome.scripting.executeScript({
  target: { tabId: tab.id },
  files: ["autoPagination.js"],
});

// Wait a moment for the script to initialize
await new Promise((resolve) => setTimeout(resolve, 100));

// Now send the message
await chrome.tabs.sendMessage(tab.id, {
  action: "startAutoPagination",
});
```

## How It Works Now

1. User clicks "Start Auto-Extract" button in popup
2. Popup checks configuration exists
3. Popup injects `autoPagination.js` into the active tab
4. Script initializes and sets up message listener
5. Popup sends `startAutoPagination` message
6. Script receives message and shows "Save & Next" button
7. User can now use auto-pagination!

## Testing

To test the fix:

1. **Reload the extension** in Chrome (chrome://extensions → click reload button)
2. **Configure Auto-Pagination**:
   - Click "Configure Auto-Extract" button
   - Set a CSS selector (e.g., `.next-btn`)
   - Save settings
3. **Navigate to a webpage** with a next button
4. **Click "Start Auto-Extract"** in the popup
5. **Verify**: The purple "Save & Next" button should appear in the bottom-right corner

## Additional Notes

- The script injection happens automatically when the button is clicked
- The script prevents duplicate injection using `window.__stnAutoPaginationLoaded` flag
- The 100ms delay ensures the script has time to initialize before receiving messages
- The error handling will catch any injection failures and show a user-friendly message

## Related Files

- `Web-2-Notion/manifest.json` - Added autoPagination.js to web_accessible_resources
- `Web-2-Notion/popup/static/js/main.js` - Added script injection before message sending
- `Web-2-Notion/autoPagination.js` - The content script that gets injected
