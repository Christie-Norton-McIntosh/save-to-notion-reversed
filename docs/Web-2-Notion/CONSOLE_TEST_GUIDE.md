# 🚀 Quick Start - Image Replacement Test

## The Issue

The `chrome.runtime.sendMessage` API is only available in extension contexts, not on regular web pages opened with `file://` or `http://localhost`.

## ✅ Solution: Console-Based Test

### Step 1: Open the Test Page

Double-click: **`simple-test.html`**

This page has instructions and will help you copy the test command.

### Step 2: Load the Test Script

1. Open Chrome DevTools (`F12` or `Cmd+Option+I`)
2. Go to **Console** tab
3. Open `test-in-console.js` in a text editor
4. Copy **ALL** the code
5. Paste into console and press Enter

You'll see:

```
📋 IMAGE REPLACEMENT TEST LOADED
```

### Step 3: Get Your IDs

**Page ID:**

- Open a Notion page
- Copy URL: `https://notion.so/.../abc123...`
- Extract 32-char hex (no dashes): `abc123...`

**Space ID:**

- Extension popup → Settings → Copy workspace ID

### Step 4: Run the Test

In the console, type:

## Automated helpers

- Quick in-worker unit test (fast, safe — does not touch Notion):
  - In the console run: `runReplaceUnitTest()`
  - This verifies the placeholder -> upload -> submitTransaction logic inside the service worker

- Fully automated E2E runner (unit test + live retries):
  - In the console run: `testImageReplacementAuto(pageId, spaceId)`
  - The runner will:
    1. Execute the fast in-worker unit test
    2. Retry `replaceDataUrlPlaceholders` against the provided page until images are replaced or a max attempt count is reached
  - Useful for unattended verification after fixing code

```javascript
testImageReplacement("YOUR_PAGE_ID", "YOUR_SPACE_ID");
```

Example:

```javascript
testImageReplacement(
  "108718346850495094066d53717ce3fd",
  "2b2a89fedba58033a6aeee258611a908",
);
```

## 📊 What to Expect

### ✅ Success Output (Browser Console):

```
🧪 IMAGE REPLACEMENT TEST STARTING
📝 Step 1: Creating test placeholder map...
✓ Created 3 placeholders
🔌 Step 2: Checking Chrome extension API...
✓ Chrome extension API is available
📨 Step 3: Sending message to service worker...
📬 Response received!
✅ TEST PASSED!
✓ Replaced 3 placeholder blocks
```

### ✅ Success Output (Service Worker Console):

To view service worker console:

1. Go to `chrome://extensions`
2. Find "Web-2-Notion"
3. Click "Service worker" → "inspect"

You should see:

```
[ServiceWorker] replaceDataUrlPlaceholders CALLED
[ServiceWorker] Page ID: 108718346850495094066d53717ce3fd
[ServiceWorker] Space ID: 2b2a89fedba58033a6aeee258611a908
[ServiceWorker] Placeholder count: 3
[ServiceWorker] Step 1: Getting Notion client...
[ServiceWorker] ✓ Notion client obtained
[ServiceWorker] ✓ Notion client instance created
[ServiceWorker] Step 2: Fetching page blocks...
[ServiceWorker] ✓ Page blocks loaded: 15 blocks
[ServiceWorker] Step 3: Searching for placeholder blocks...
[ServiceWorker]   Block 1: abc... type=text text="Some text"
[ServiceWorker]   Block 2: def... type=text text="__IMG1770450096801_0__"
[ServiceWorker]     Comparing "__IMG1770450096801_0__" === "__IMG1770450096801_0__"
[ServiceWorker] ✓✓✓ FOUND MATCH! Block: def... uniqueId: __IMG1770450096801_0__
[ServiceWorker] ✓ Search complete. Found 3 placeholder blocks to replace
[ServiceWorker] Step 4: Uploading and replacing images...
[ServiceWorker] Processing block: def...
[ServiceWorker]   Uploading image...
[ServiceWorker]   ✓ Upload successful: https://s3.amazonaws.com/...
[ServiceWorker]   Updating block type to 'image'...
[ServiceWorker]   ✓ Replaced placeholder with image: def...
[ServiceWorker] ✓✓✓ ALL DONE! Replaced 3 images
```

## ⚠️ Troubleshooting

### "Chrome extension API not available"

**Problem:** Running on wrong page or extension not loaded
**Solution:**

- Make sure you opened DevTools on a page where the extension is active
- Try running on `notion.so` page instead
- Verify extension is loaded at `chrome://extensions`

### "No service worker logs"

**Problem:** Service worker not running or message not reaching it
**Solution:**

- Check service worker is running (green icon in extensions page)
- Reload the extension
- Inspect service worker console for errors

### "No placeholder blocks found"

**Problem:** The test page doesn't have **IMG\*** blocks yet
**Solution:**

- This test is for AFTER you've already saved a page with images
- First, save a real page with images to create the blocks
- Then use the page ID from that page
- OR: Manually create text blocks with **IMG\*** content

### Test fails with "Failed to get Notion client"

**Problem:** Not logged into Notion or credentials expired
**Solution:**

- Make sure you're logged into Notion
- Open the extension popup to verify authentication
- Try saving a normal page first to verify connection

## 🔄 Real-World Test Flow

For a complete end-to-end test:

1. **Save a real page with images** using the extension
2. **Note the page ID** from the URL
3. **Wait 2-3 seconds** for blocks to be created
4. **Run the test** using that page ID
5. **Refresh the Notion page** to see the results
6. **Verify** images appeared and **IMG\*** text is gone

## 📁 File Reference

- **`simple-test.html`** - Friendly UI with instructions
- **`test-in-console.js`** - The actual test script (copy to console)
- **`diagnostic-tool.html`** - Quick diagnostic checks
- **`test-image-replacement.html`** - Original (doesn't work due to API limitations)

## 🆘 Still Not Working?

If the test still fails after following all steps:

1. Share the **full browser console output**
2. Share the **full service worker console output**
3. Verify the **version** (should be 5.2.22)
4. Check if **manual image saving works** (bypass automatic replacement)
5. Try with a **simpler test** - just 1 image instead of 3

## Current Version: 5.2.22

Changes:

- ✅ Fixed message format (`action` → `type`)
- ✅ Added comprehensive debug logging
- ✅ Created console-based test (works in extension context)
