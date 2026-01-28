# Auto-Pagination Quick Start

## 🚀 Get Started in 3 Steps

### Step 1: Configure (One Time)

1. Press **`Ctrl+Shift+P`** (Mac: `Cmd+Shift+P`)
2. Enter the CSS selector for your "next" button
   - Example: `ft-tooltip > button`
3. Click **Save Configuration**

### Step 2: Start

1. Click **▶️ Start Auto-Pagination**
2. Navigate to the first page you want to save

### Step 3: Save Pages

1. Click the extension icon
2. Click **Save Page**
3. Watch it work! The extension will:
   - ✅ Save the page
   - ⏱️ Wait 2 seconds
   - 👆 Click "next"
   - 🔄 Repeat

---

## 🎯 Finding the Right Selector

### Easy Method (DevTools)

1. Right-click the "next" button
2. Click **Inspect**
3. Right-click the highlighted code
4. Select **Copy → Copy selector**
5. Paste into auto-pagination settings

### Common Patterns

```
Button with class:     .next-button
Button with ID:        #pagination-next
Link with text:        a:contains("Next")
ARIA label:            button[aria-label="Next"]
Shadow DOM:            ft-tooltip > button
```

---

## 📊 Example: ServiceNow Docs

```
Site: https://docs.servicenow.com/...
Selector: ft-tooltip > button
Delay: 2000ms
Max Pages: 50

Result: Saves 50 documentation pages automatically!
```

---

## ⚙️ Settings Explained

| Setting          | What It Does                              | Recommended                                      |
| ---------------- | ----------------------------------------- | ------------------------------------------------ |
| **CSS Selector** | Identifies the "next" button              | Required - use DevTools to find                  |
| **Delay (ms)**   | Wait time after save before clicking next | 2000 (2 seconds) - increase if pages load slowly |
| **Max Pages**    | Stop after this many pages                | 50 for docs, 20 for blogs, blank for unlimited   |

---

## 🛑 Stopping

Auto-pagination stops automatically when:

- ✅ Max pages reached
- ✅ No more pages (button disabled/hidden)
- ✅ You click **Stop** button

---

## 💡 Pro Tips

### Tip 1: Test First

Before automating 50 pages, test with **Max Pages: 3** to verify it works.

### Tip 2: Watch It Work

Keep the browser tab visible to see the automation in action.

### Tip 3: Shadow DOM

If your selector doesn't work, the button might be in a Shadow DOM. The extension searches there automatically - just use the correct selector!

### Tip 4: Adjust Delay

If saves are failing or pages load slowly, increase the delay to 3000-5000ms.

### Tip 5: Per-Site Config

Each website can have its own selector. The config is saved per-site automatically.

---

## 🔧 Troubleshooting

### "Button not found"

→ Check your selector with DevTools  
→ Make sure the button exists on every page

### "Automation stops after 1 page"

→ Check if the next button is disabled on the last page  
→ Verify the selector matches on the next page too

### "Pages not saving"

→ Test manual save first  
→ Check Notion connection  
→ Verify site selectors are configured

---

## 📱 Quick Reference

| Action        | How                                        |
| ------------- | ------------------------------------------ |
| Open Settings | `Ctrl+Shift+P` or click ⚡ button in popup |
| Start         | Click **▶️ Start** in settings             |
| Save Page     | Click **Save Page** in extension popup     |
| Stop          | Click **⏹️ Stop** in settings              |
| Reset Counter | Click **🔄 Reset** in settings             |
| Check Status  | Look at page counter in settings or popup  |

---

## 🎓 Learn More

For detailed documentation, examples, and troubleshooting:
→ Read `AUTO_PAGINATION_README.md`

For technical details and architecture:
→ Read `AUTO_PAGINATION_IMPLEMENTATION.md`

For visual diagrams and flow charts:
→ Read `AUTO_PAGINATION_VISUAL_GUIDE.md`

---

## 🆘 Need Help?

1. Check the console (F12) for error messages
2. Verify the selector with DevTools
3. Test manual saving first
4. Try with a simpler test case (3-5 pages)
5. Read the full documentation

---

**Happy automating! 🚀**
