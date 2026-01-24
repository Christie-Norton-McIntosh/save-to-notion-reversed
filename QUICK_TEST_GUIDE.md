# Quick Test Guide: Custom Site Selectors

## Quick Test (5 minutes)

### Step 1: Configure a Selector

1. Open the extension in Chrome
2. Press **Cmd+Shift+C** (Mac) or **Ctrl+Shift+C** (Windows/Linux)
3. Add a test selector:
   - **Domain:** `developer.mozilla.org`
   - **Selector:** `article` (or `.main-page-content` for MDN)
4. Click **"Save"**
5. Click **"Test"** button to verify it saved

### Step 2: Test on a Real Page

1. Go to: https://developer.mozilla.org/en-US/docs/Web/API
2. **Reload the page** (Cmd/Ctrl+R) ← Important!
3. Open browser DevTools (F12) → Console tab
4. Click the extension icon → "Save Webpage Content"
5. Hover over the page content

### Step 3: Verify in Console

You should see these logs:

```
[getCustomSelectorForCurrentDomain] Current domain: developer.mozilla.org
[getCustomSelectorForCurrentDomain] All saved selectors: {developer.mozilla.org: "article"}
[getCustomSelectorForCurrentDomain] Found selector for developer.mozilla.org: article
[extractContentData] Starting extraction with custom selector: article
[extractContentData] Trying custom selector: article
[extractContentData] Custom selector result: Found
```

### Expected Result

✓ Content extraction uses the custom selector
✓ The selected area highlights correctly
✓ Console shows "Custom selector result: Found"

## Testing Different Selectors

### Test Case 1: Class Selector

```
Domain: github.com
Selector: .markdown-body
```

Visit: https://github.com/any-repo/README.md

### Test Case 2: ID Selector

```
Domain: stackoverflow.com
Selector: #question, #answers
```

Visit: Any StackOverflow question page

### Test Case 3: Complex Selector

```
Domain: medium.com
Selector: article[data-post-id]
```

Visit: Any Medium article

## Troubleshooting

### Problem: "Not found" in console

**Solution:**

- Verify the selector exists on the page
- Try simpler selectors (e.g., `article`, `.main`, `#content`)
- Check inspector (F12) to find the right selector

### Problem: No logs appear

**Solution:**

- Did you reload the page after saving?
- Check domain normalization (remove www, https://, etc.)
- Verify selector is saved: `chrome.storage.local.get(['customSiteSelectors'], console.log)`

### Problem: Wrong content selected

**Solution:**

- Selector might be too broad (e.g., `div` matches too many)
- Make it more specific (add classes, IDs, or attributes)
- Test in DevTools: `document.querySelector('your-selector')`

## Pro Tips

1. **Find the Right Selector:**
   - Right-click element → Inspect
   - In DevTools, right-click element → Copy → Copy selector
   - Simplify the selector (remove unnecessary parts)

2. **Test Selectors First:**
   - Open DevTools Console
   - Type: `document.querySelector('.your-selector')`
   - Should highlight the correct element

3. **Domain Matching:**
   - Always use base domain (no www, no https://)
   - Example: `example.com` NOT `www.example.com` or `https://example.com`

4. **Multiple Selectors:**
   - You can save different selectors for different sites
   - Each domain can have ONE selector
   - Update by saving again with same domain

## Success Criteria

✅ Selector saves successfully (shows in Test button output)
✅ Console logs show custom selector is found
✅ Content extraction works on target site
✅ Falls back to 'article' on sites without custom selector

## Need Help?

Check the console logs - they show each step:

1. Domain detection
2. Selector lookup
3. Selector application
4. Fallback behavior (if needed)
