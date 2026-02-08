# Image Replacement Test Guide

## Quick Start

1. **Reload the Extension**
   - Open Chrome Extensions page: `chrome://extensions`
   - Find "Web-2-Notion"
   - Click the reload button (circular arrow icon)

2. **Open the Test Page**
   - Navigate to: `file:///path/to/tests/test-image-replacement.html`
   - Or double-click `tests/test-image-replacement.html` to open in Chrome

3. **Get Required IDs**

   **Page ID:**
   - Create a test page in Notion
   - Copy the page URL, it looks like: `https://notion.so/workspace/Page-Name-abc123def456...`
   - The page ID is the 32-character hex string (remove dashes if present)
   - Example: `https://notion.so/.../f6c30c3ad4584ee4a93609be47d7481e` → Page ID: `f6c30c3ad4584ee4a93609be47d7481e`

   **Space ID:**
   - Open the extension popup
   - Go to Settings
   - Find your workspace/space ID
   - Example: `1934a47f-12df-4293-bdae-bbc3308daada`

4. **Run the Test**
   - Paste the Page ID and Space ID into the test form
   - Click "Start Test"
   - Watch the log for detailed output
   - The test will automatically retry up to 5 times if it fails

## What the Test Does

1. **Extracts 3 test images** from the test page (data: URLs)
2. **Creates placeholder map** with unique IDs like `__IMG1234567890_0__`
3. **Sends message to service worker** with type `replaceDataUrlPlaceholders`
4. **Service worker logs** every step:
   - Receiving the message
   - Getting Notion client
   - Fetching page blocks
   - Searching each block for placeholders
   - Uploading images
   - Replacing text blocks with image blocks
5. **Reports success/failure** with detailed metrics

## Debugging Steps

### If the test fails immediately:

- Check that the extension is loaded
- Verify Page ID and Space ID are correct
- Check browser console for errors

### If service worker doesn't log anything:

- The message might not be reaching the service worker
- Check that `type: 'replaceDataUrlPlaceholders'` is in the message (not `action`)
- Open service worker console: Extensions page → Service Worker → "inspect"

### If service worker logs but finds no blocks:

- The page might not have been saved yet
- Wait 2-3 seconds after saving before running the test
- Check that child blocks were actually created in Notion

### If blocks are found but not replaced:

- Check the service worker logs for upload errors
- Verify Space ID is correct
- Check Notion API permissions

## Expected Console Output

### Service Worker Console:

```
========================================
[ServiceWorker] replaceDataUrlPlaceholders CALLED
[ServiceWorker] Message object: {...}
========================================
[ServiceWorker] Page ID: f6c30c3ad4584ee4a93609be47d7481e
[ServiceWorker] Space ID: 1934a47f-12df-4293-bdae-bbc3308daada
[ServiceWorker] Placeholder count: 3
[ServiceWorker] Placeholder keys: ["__IMG1707328800000_0__", "__IMG1707328800000_1__", "__IMG1707328800000_2__"]
[ServiceWorker] Step 1: Getting Notion client...
[ServiceWorker] ✓ Notion client obtained
[ServiceWorker] ✓ Notion client instance created
[ServiceWorker] Step 2: Fetching page blocks...
[ServiceWorker] ✓ Page blocks loaded: 15 blocks
[ServiceWorker] Step 3: Searching for placeholder blocks...
[ServiceWorker] Searching 15 blocks for placeholders
[ServiceWorker]   Block 1: abc123... type=text text="Some paragraph"
[ServiceWorker]   Block 2: def456... type=text text="__IMG1707328800000_0__"
[ServiceWorker]     Comparing "__IMG1707328800000_0__" === "__IMG1707328800000_0__"
[ServiceWorker] ✓✓✓ FOUND MATCH! Block: def456... uniqueId: __IMG1707328800000_0__ alt: Red pixel
...
[ServiceWorker] ✓ Search complete. Found 3 placeholder blocks to replace
[ServiceWorker] Step 4: Uploading and replacing images...
[ServiceWorker] Processing block: def456...
[ServiceWorker]   Uploading image...
[ServiceWorker]   ✓ Upload successful: https://s3.amazonaws.com/...
[ServiceWorker]   Updating block type to 'image'...
[ServiceWorker]   ✓ Replaced placeholder with image: def456...
...
========================================
[ServiceWorker] ✓✓✓ ALL DONE! Replaced 3 images
========================================
```

### Test Page Console:

```
[INFO] Test page loaded and ready
[INFO] Starting automated test...
[INFO] Step 1: Extracting images from test content...
[SUCCESS] Found 3 images
[INFO] Step 2: Creating placeholder map...
[SUCCESS] Created 3 placeholders
[INFO] Step 3: Sending message to service worker...
[INFO] Step 4: Processing response...
[SUCCESS] ✓ SUCCESS: Replaced 3 images!
[INFO] Step 5: Verifying replacements...
```

## Version History

- **v5.2.22** - Added comprehensive logging to service worker for debugging
- **v5.2.21** - Fixed message format (`action` → `type`)
- **v5.2.20** - Added detailed logging to track child block creation

## Troubleshooting

### Message not reaching service worker

**Problem:** Test logs show message sent but service worker never logs "CALLED"
**Solution:**

- Verify message uses `type` not `action`
- Check service worker is running (green circle in extensions page)
- Inspect service worker console for any startup errors

### Placeholder blocks not found

**Problem:** Service worker logs show searching but finds 0 matches
**Solution:**

- The page might not have the child blocks yet
- Check the actual Notion page - do you see `__IMG123__` text blocks?
- Try running the test 2-3 seconds after saving the page
- Verify the placeholder IDs in the test match what's in Notion

### Upload fails

**Problem:** Service worker finds blocks but upload fails
**Solution:**

- Check Space ID is correct
- Verify you're logged into Notion
- Check data: URL is valid (should start with `data:image/`)
- Try with a smaller/simpler image

### Test page won't load

**Problem:** Test HTML file doesn't open or shows blank
**Solution:**

- Make sure you're opening it in Chrome (not another browser)
- Check the file path is correct
- Look for JavaScript errors in browser console

## Contact

If you continue to have issues, provide:

1. Full service worker console output
2. Full test page console output
3. Screenshot of the Notion page showing the `__IMG123__` blocks
4. Extension version number
