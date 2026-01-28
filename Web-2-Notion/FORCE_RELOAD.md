# Force Reload Extension - Troubleshooting Steps

If changes are not appearing after editing the extension files, follow these steps:

## Step 1: Remove and Reload Extension (Recommended)

1. Go to `chrome://extensions/`
2. Find "Web-2-Notion"
3. Click **"Remove"** button (yes, completely remove it)
4. Click **"Load unpacked"** button
5. Select the `Web-2-Notion` folder
6. The extension will be freshly loaded with all new code

## Step 2: Alternative - Hard Reload

If you don't want to remove the extension:

1. Go to `chrome://extensions/`
2. **Toggle OFF** the Web-2-Notion extension
3. Close ALL Chrome windows (completely quit Chrome)
4. Reopen Chrome
5. Go to `chrome://extensions/`
6. **Toggle ON** the Web-2-Notion extension

## Step 3: Clear Extension Data

If still not working:

1. Open Chrome DevTools Console (F12)
2. Run these commands:

```javascript
// Clear localStorage
localStorage.clear();

// Clear all extension data
chrome.storage.local.clear();
chrome.storage.sync.clear();
```

## Step 4: Verify Files Were Updated

Check file timestamps to ensure they were saved:

```bash
ls -la /path/to/Web-2-Notion/content/content.js
ls -la /path/to/Web-2-Notion/autoPagination.js
```

## Step 5: Check for Syntax Errors

Open DevTools and check:

- Console tab for any syntax errors
- Background Service Worker console (click "service worker" link in chrome://extensions)

## Common Issues

### "Identifier already declared" Error

- This means scripts are being injected multiple times
- The guards we added should prevent this
- Make sure you've done a full reload (Steps 1 or 2)

### Changes Not Appearing

- Browser is caching old files
- Do Step 1 (Remove and reload extension)
- Close all tabs with the extension active

### Button Text Didn't Change

- The `options.js` file is a React bundle
- Needs full extension reload
- Try Step 1 (complete remove and reload)

## Quick Test

After reloading, open console and type:

```javascript
window.__stnContentLoaded;
window.__stnAutoPaginationLoaded;
```

These should be `undefined` on a fresh page load, then become `true` after scripts load.
