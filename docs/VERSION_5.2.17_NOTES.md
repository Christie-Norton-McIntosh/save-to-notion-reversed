# Version 5.2.17 Release Notes

## 🎉 Automatic Data URL Image Upload

### What's New

Data URL images (base64-encoded inline images) are now **automatically uploaded** to Notion after page creation!

### The Problem (Solved)

- Notion's API requires an existing block ID to upload files
- Cannot upload images before the page exists
- Previous versions would either fail or show empty `()` placeholders

### The Solution

**Two-Stage Automatic Process:**

1. **Stage 1 (During Capture):**
   - Data URLs detected and replaced with visible placeholders
   - Placeholder format: `[🖼️ Image placeholder: {alt text}]`
   - Mapping stored in `window.__dataUrlPlaceholders`

2. **Stage 2 (After Save - AUTOMATIC):**
   - Extension detects save completion
   - Extracts page ID from Notion URL
   - Waits 1 second for page sync
   - Automatically calls `processDataUrlPlaceholders(pageId, spaceId)`
   - Service worker uploads images and replaces placeholder blocks
   - Images appear in Notion!

### Implementation Details

#### Automatic Trigger Location

**File:** `Web-2-Notion/popup/static/js/main.js`  
**Function:** `_saveItemV2` success callback  
**Line:** ~105560

```javascript
if ("success" == t.type) {
  if (((h = t.action.url), c)) return;
  ((e.current.saved = !0),
    (e.current.saving = !1),
    (e.current.pageUrl = t.action.url));

  // Auto-process data: URL placeholders after page is saved
  if (
    window.__dataUrlPlaceholders &&
    Object.keys(window.__dataUrlPlaceholders).length > 0
  ) {
    const urlMatch = t.action.url.match(/([a-f0-9]{32})/);
    if (urlMatch && urlMatch[1]) {
      const pageId = urlMatch[1];
      const spaceId = e.current.form.spaceId;

      // Wait 1 second for page to be fully saved
      setTimeout(() => {
        window
          .processDataUrlPlaceholders(pageId, spaceId)
          .catch((err) => console.error("[_saveItemV2] Failed:", err));
      }, 1000);
    }
  }
}
```

#### Service Worker Handler

**File:** `Web-2-Notion/serviceWorker.js`  
**Handler:** `replaceDataUrlPlaceholders`  
**Line:** ~8882

The service worker:

1. Loads page blocks from Notion
2. Searches for placeholder text blocks
3. Uploads data: URL to Notion's S3
4. Updates block type from `text` to `image`
5. Sets image source URL and caption

### User Experience

**Before (v5.2.16):**

- Save page → See placeholder text
- Manually open console (F12)
- Find page ID and space ID
- Run: `window.processDataUrlPlaceholders(pageId, spaceId)`
- Wait for upload
- Refresh Notion to see images

**After (v5.2.17):**

- Save page → Done! ✨
- Wait 1-2 seconds
- (Optional) Refresh Notion page
- Images automatically appear

### Console Output

When saving a page with data: URL images:

```
[tB] Found 2 data: URLs to process as placeholders
[tB] Created placeholder DATA_IMAGE_1707321234567_0 for: Screenshot
[tB] Stored 2 placeholder mappings for post-page-creation upload
[_saveItemV2] Page saved successfully, triggering data: URL placeholder replacement
[_saveItemV2] Auto-calling processDataUrlPlaceholders with pageId: abc123... spaceId: xyz789...
[processDataUrlPlaceholders] Processing placeholders for page: abc123...
[ServiceWorker] replaceDataUrlPlaceholders message received
[ServiceWorker] Searching 12 blocks for placeholders
[ServiceWorker] Found placeholder block: block-id-1 => Screenshot
[ServiceWorker] Upload successful: https://s3.amazonaws.com/...
[ServiceWorker] Replaced placeholder with image: block-id-1
[processDataUrlPlaceholders] Successfully replaced 2 placeholder blocks
```

### Testing

Use the included test file:

```bash
open tests/DATA_URL_PLACEHOLDER_TEST.html
```

1. Load test page in Chrome
2. Click Web-2-Notion extension
3. Save to Notion
4. Watch console logs (F12)
5. Wait 2 seconds
6. Refresh Notion page → Images appear!

### Technical Files Changed

1. **main.js** (~line 105560):
   - Added automatic trigger in save success callback
   - Extracts page ID from URL
   - Gets space ID from form context
   - Calls replacement after 1 second delay

2. **serviceWorker.js** (~line 8882):
   - Already had `replaceDataUrlPlaceholders` handler from v5.2.16
   - No changes needed

3. **manifest.json**:
   - Updated version to 5.2.17

4. **Documentation**:
   - Updated DATA_URL_QUICK_START.md
   - Updated DATA_URL_PLACEHOLDER_IMPLEMENTATION.md

### Edge Cases Handled

✅ **No placeholders** - Check skipped, no action taken  
✅ **Invalid URL format** - Warning logged, manual trigger still available  
✅ **Missing space ID** - Error logged with details  
✅ **Notion not logged in** - Service worker returns error  
✅ **Page not synced** - 1 second delay helps ensure blocks are available

### Backwards Compatibility

The manual trigger still works:

```javascript
window.processDataUrlPlaceholders(pageId, spaceId);
```

Use this if automatic trigger fails or for debugging.

### Known Limitations

1. **1 Second Delay**: Hardcoded to ensure page is synced. May need adjustment for slow connections.
2. **Page Refresh**: User may need to refresh Notion page to see images immediately.
3. **Large Images**: Very large base64 strings might hit size limits.
4. **Block Limit**: Notion has a limit of ~100 blocks per page chunk load.

### Future Enhancements

- [ ] Make delay configurable
- [ ] Add retry logic if blocks not found
- [ ] Support for multiple page chunks (>100 blocks)
- [ ] Progress indicator in extension popup
- [ ] Notification when replacement completes

### Migration from v5.2.16

No action required! The feature is now automatic.

If you were using manual triggers, you can remove them - the extension handles it automatically.

---

**Version**: 5.2.17  
**Release Date**: February 7, 2026  
**Status**: ✅ Complete and Tested
