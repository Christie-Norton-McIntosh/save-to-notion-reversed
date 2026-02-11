# Extension Reload Checklist

## ✅ Code Verification: PASSED

All critical fixes are present in the code. Now you just need to reload the extension in Chrome.

## 🔄 How to Reload the Extension

### Method 1: Simple Reload (Try this first)

1. **Open Chrome Extensions page:**
   - Type `chrome://extensions` in the address bar
   - Or Menu → Extensions → Manage Extensions

2. **Enable Developer Mode:**
   - Look for the toggle in the top-right corner
   - Turn it ON if it's not already

3. **Find "Web-2-Notion"**
   - Look through the list of installed extensions

4. **Click the Reload button:**
   - Look for the circular arrow icon (↻) on the extension card
   - Click it once

5. **Wait for reload:**
   - The extension will reload in ~1-2 seconds
   - You should see a brief "Reloading..." message

### Method 2: Hard Reload (If Method 1 doesn't work)

1. **Toggle the extension OFF:**
   - Find the blue toggle switch on the extension card
   - Click to disable it

2. **Wait 3 seconds**

3. **Toggle it back ON:**
   - Click the toggle again

4. **Test immediately**

### Method 3: Complete Reinstall (Last resort)

1. **Note the extension path:**

   ```
   /Users/norton-mcintosh/Documents/GitHub/save-to-notion-reversed/Web-2-Notion
   ```

2. **Remove the extension:**
   - Click "Remove" button on the extension card
   - Confirm removal

3. **Load it again:**
   - Click "Load unpacked" button (top-left)
   - Navigate to the path above
   - Select the `Web-2-Notion` folder
   - Click "Select"

## 🧪 Verification After Reload

### Step 1: Test the ServiceNow Page

1. Go back to: `https://www.servicenow.com/docs/r/it-service-management/r_ITServiceManagement.html`
2. Open DevTools Console (F12 or Cmd+Option+J)
3. Click the Web-2-Notion extension icon
4. Trigger the save process

### Step 2: Check Console Logs

Look for these logs **IN THIS EXACT ORDER**:

```
✅ [scanWebpage] Including table cell map with 10 entries
✅ [sB/Fix] Assigned tableCellMap with 10 entries to window.__TABLE_CELL_CONTENT_MAP__
✅ [JZ/Turndown] XCELLIDX markers in HTML: ["CELL_xxx", "CELL_yyy", ...]
✅ [JZ/Turndown] __TABLE_CELL_CONTENT_MAP__ keys (count= 10 )
✅ [JZ/Turndown/XCELLIDX] Expanding marker CELL_xxx payload: {...}
✅ [JZ/Turndown/XCELLIDX] Added image markdown for: Automate IT service
✅ [JZ/Turndown/XCELLIDX] Expanded CELL_xxx into 3 items, markdown length: 4700
```

### Step 3: Key Success Indicators

**The CRITICAL log to look for:**

```
[sB/Fix] Assigned tableCellMap with 10 entries to window.__TABLE_CELL_CONTENT_MAP__
```

**If you see this:** ✅ The fix is active!

**If you DON'T see this:** ❌ Extension didn't reload properly

- Try Method 2 (Hard Reload)
- Or Method 3 (Complete Reinstall)

### Step 4: Expected Output

After all logs appear, you should see:

- **Text blocks** with proper formatting (bold headings)
- **Image blocks** (may show as placeholders during upload)
- **Horizontal dividers** (`---`) between table rows

Example Notion output:

```
**Enhance the service experience**

Automate support for common requests with virtual agents...

[Image: Automate IT service]

---

**Consolidate IT services**

Rapidly consolidate existing tools to a single system...

[Image: Consolidate IT service]

---
```

## 🐛 Troubleshooting

### Issue: Still no [sB/Fix] log after reload

**Possible causes:**

1. Chrome cached the old extension code
2. Multiple extension instances loaded
3. Wrong extension being reloaded

**Solutions:**

- Close ALL Chrome windows
- Reopen Chrome
- Try Method 3 (Complete Reinstall)
- Check there's only ONE "Web-2-Notion" in extensions list

### Issue: [sB/Fix] appears but no expansion

**Check these logs:**

- `[JZ/Turndown] XCELLIDX markers in HTML` - Should show array of cell IDs
- `[JZ/Turndown] __TABLE_CELL_CONTENT_MAP__ keys` - Should match the count

**If markers are found but not expanded:**

- Save a new test log
- Share it for further diagnosis

### Issue: Images still not appearing

**After expansion runs successfully:**

- Images with data URLs need upload pipeline
- They may show as placeholders initially
- Check Notion page after save completes
- Verify images are in the payload: `imageCount: 1, hasDataUrls: true`

## 📝 Save a New Log After Reload

If issues persist:

1. Open Console (F12)
2. Right-click in console → "Save as..."
3. Save as `/tests/log/018`
4. Share the new log

---

**Current Status:** Code is correct, just needs extension reload!
