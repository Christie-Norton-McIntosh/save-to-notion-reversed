# 🧪 Image Replacement Testing

## Quick Start (3 steps)

### 1️⃣ Open Simple Test Page

```
Double-click: simple-test.html
```

### 2️⃣ Load Test Script in Console

- Press `F12` to open DevTools
- Copy all code from `test-in-console.js`
- Paste in Console and press Enter

### 3️⃣ Run Test

```javascript
testImageReplacement("YOUR_PAGE_ID", "YOUR_SPACE_ID");
```

## 📚 Documentation Files

| File                              | Purpose                              |
| --------------------------------- | ------------------------------------ |
| `simple-test.html`                | Friendly test page with instructions |
| `test-in-console.js`              | Console test script (copy & paste)   |
| `CONSOLE_TEST_GUIDE.md`           | Complete step-by-step guide          |
| `QUICK_TEST.md`                   | Quick reference                      |
| `TEST_IMAGE_REPLACEMENT_GUIDE.md` | Detailed documentation               |
| `diagnostic-tool.html`            | System diagnostic checker            |

## ⚡ Why Console Test?

The original `tests/test-image-replacement.html` couldn't access `chrome.runtime.sendMessage` because it's loaded as a regular web page. The console test works because it runs in the context of an already-loaded page where the extension is active.

## 🔍 What Gets Tested

1. ✅ Message routing (type: 'replaceDataUrlPlaceholders')
2. ✅ Service worker receives message
3. ✅ Notion client authentication
4. ✅ Page block fetching
5. ✅ Placeholder matching
6. ✅ Image upload
7. ✅ Block replacement

## 📊 Expected Results

**Browser Console:**

- Shows test progress with emojis
- Reports success/failure clearly
- Provides troubleshooting hints

**Service Worker Console:**

- Detailed step-by-step logging
- Block-by-block search results
- Upload progress
- Final success confirmation

## 🆘 Need Help?

See `CONSOLE_TEST_GUIDE.md` for detailed troubleshooting steps.

---

**Version: 5.2.23**

- Fixed: Message format (action → type)
- Added: Comprehensive logging
- Added: Console-based test system
