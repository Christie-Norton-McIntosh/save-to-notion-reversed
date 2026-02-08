# Quick Start: Data URL Image Placeholders

## Version 5.2.17 - AUTOMATIC Two-Stage Image Upload

### What Changed?

Data URL images (base64-encoded) are now handled **AUTOMATICALLY** in two stages:

1. **During capture**: Replaced with placeholder text like `[🖼️ Image placeholder: alt text]`
2. **After save**: Placeholders **automatically** replaced with actual uploaded images (1 second delay)

### Why?

Notion requires an existing block ID to upload files. We can't upload before the page exists.

### How to Use

#### ✅ Automatic (v5.2.17+)

**Just use the extension normally!**

1. Capture a page with data: URL images
2. Save to Notion
3. Wait 1-2 seconds
4. Refresh the Notion page - images will appear!

The extension now automatically:

- Detects when a page is saved
- Extracts the page ID from the Notion URL
- Calls the replacement function after 1 second
- Uploads all data: URL images
- Replaces placeholder text blocks with image blocks

#### Manual Override (if needed)

If automatic replacement fails, you can still trigger manually:

```javascript
// 1. Get page ID from Notion URL
// Example URL: https://www.notion.so/workspace/Page-Title-abc123def456
const pageId = "abc123def456";

// 2. Get space ID from workspace
const spaceId = "your-space-id";

// 3. Trigger replacement
window.processDataUrlPlaceholders(pageId, spaceId);
```

### Testing

1. Open `tests/DATA_URL_PLACEHOLDER_TEST.html` in Chrome
2. Capture with Web-2-Notion extension (v5.2.17+)
3. Save to Notion
4. **Wait 1-2 seconds** (automatic processing happens in background)
5. Open browser console (F12) to see logs
6. Refresh Notion page - images should appear automatically!

### Console Logs

**Automatic success looks like:**

```
[tB] Found 2 data: URLs to process as placeholders
[tB] Created placeholder DATA_IMAGE_1707321234567_0 for: Red Square
[_saveItemV2] Page saved successfully, triggering data: URL placeholder replacement
[_saveItemV2] Auto-calling processDataUrlPlaceholders with pageId: abc123def456 spaceId: xyz789
[processDataUrlPlaceholders] Processing placeholders for page: abc123def456
[ServiceWorker] replaceDataUrlPlaceholders message received
[ServiceWorker] Found 2 placeholder blocks to replace
[ServiceWorker] Upload successful: https://s3.amazonaws.com/...
[ServiceWorker] Replaced placeholder with image: block-id-1
[processDataUrlPlaceholders] Successfully replaced 2 placeholder blocks
```

### Troubleshooting

| Issue                          | Solution                                                |
| ------------------------------ | ------------------------------------------------------- |
| Images don't appear after save | Wait 2-3 seconds, then refresh Notion page              |
| "No placeholders to process"   | Check `window.__dataUrlPlaceholders` exists before save |
| "Failed to get Notion client"  | Ensure logged into Notion                               |
| "Found 0 placeholder blocks"   | Page might not be fully saved yet - try manual trigger  |
| Placeholders not replaced      | Check console for errors, try manual override           |

### Get Page ID

From Notion URL:

```
https://www.notion.so/workspace/Title-{PAGE_ID}
                                      ^^^^^^^^^^^
Example: abc123def456789 (remove dashes if present)
```

Or from console:

```javascript
// If you have the page open in Notion web app:
const url = window.location.href;
const pageId = url.match(/([a-f0-9]{32})/)?.[1];
```

### Get Space ID

From console after saving:

```javascript
// Check the auto-trigger logs - space ID is printed:
// [_saveItemV2] Auto-calling processDataUrlPlaceholders with pageId: xxx spaceId: yyy
```

### What's New in v5.2.17

**Automatic Trigger Added:**

- Save completion now automatically detected in `_saveItemV2` function
- Page ID extracted from Notion URL using regex: `/([a-f0-9]{32})/`
- Space ID retrieved from `e.current.form.spaceId`
- 1 second delay before processing to ensure page is fully saved
- Error handling with try-catch to prevent save failures

**Code Location:**
`main.js` line ~105550 in the success callback of `_saveItemV2` function

**Previous Versions:**

- v5.2.16: Manual trigger only
- v5.2.17: Automatic trigger with manual fallback

### Next Steps

No action needed! The feature is fully automatic.

If you encounter issues:

1. Check console logs for errors
2. Try manual trigger as fallback
3. Verify you're on v5.2.17+ (check manifest.json)

See `DATA_URL_PLACEHOLDER_IMPLEMENTATION.md` for full technical details.
