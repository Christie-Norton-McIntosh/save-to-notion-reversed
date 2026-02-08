# 🚀 Quick Test for Image Replacement

## 1️⃣ Reload Extension

```
chrome://extensions → Find "Web-2-Notion" → Click reload 🔄
```

## 2️⃣ Open Test Page

Double-click: `test-image-replacement.html`

## 3️⃣ Get IDs

### Page ID:

- Create blank Notion page
- Copy URL: `notion.so/.../abc123def456...`
- Extract 32-char hex: `abc123def456...`

### Space ID:

- Extension popup → Settings → Copy workspace ID

## 4️⃣ Run Test

- Paste IDs into form
- Click "Start Test"
- Watch console logs

## 🔍 What to Check

### Service Worker Console

```
Extensions page → "Service worker" link → "inspect"
```

Should see:

```
[ServiceWorker] replaceDataUrlPlaceholders CALLED
[ServiceWorker] ✓ Notion client obtained
[ServiceWorker] ✓ Page blocks loaded: X blocks
[ServiceWorker] ✓✓✓ FOUND MATCH! ...
[ServiceWorker] ✓✓✓ ALL DONE! Replaced X images
```

### Test Page Console

Should see:

```
[SUCCESS] ✓ SUCCESS: Replaced X images!
```

## ⚠️ Common Issues

### No service worker logs?

→ Check message uses `type` not `action`

### Blocks not found?

→ Wait 2-3 seconds after page save before testing

### Upload fails?

→ Verify Space ID is correct

## 📊 Current Version: 5.2.22

Changes in this version:

- Fixed message routing (`action` → `type`)
- Added comprehensive debug logging
- Created automated test harness

Additional automated helper:

- From the extension popup (extension context) you can run the automated tester:
  - In the popup console (or from injected code) call: `runAutomatedReplacementTest(pageId, spaceId)`
  - This runs the in-service-worker unit test then retries live replacement automatically.
