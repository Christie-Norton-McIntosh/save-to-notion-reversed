# Fix: Custom Site Selectors Not Being Used in Save Webpage Content

## Problem

The saved selectors from the "Custom Site Selectors" modal were not being used when extracting content via the "Save Webpage Content" feature. The code was hardcoded to only look for `<article>` elements.

## Root Cause

1. Custom selectors were being saved to Chrome storage (`chrome.storage.local.customSiteSelectors`)
2. The `extractContentData()` function was hardcoded to search for `article` elements only
3. It never checked or loaded the custom selectors from storage

## Solution Implemented

### Changes Made

#### 1. Added Helper Functions (in both `Web-2-Notion/clipContent.js` and `temp_unzip/clipContent.js`)

**`normalizeDomain(domain)`**

- Normalizes domain names (removes protocol, www, ports, paths)
- Ensures consistent domain matching with how selectors are saved

**`getCustomSelectorForCurrentDomain()`**

- Loads custom selectors from Chrome storage
- Returns the saved selector for the current domain
- Returns null if no custom selector exists

#### 2. Updated `extractContentData()` Function

- Added `customSelector` parameter (defaults to null)
- Now tries custom selector first before falling back to 'article'
- Added console logging for debugging
- Gracefully handles invalid selectors

**Before:**

```javascript
function extractContentData(rootElement) {
  const article =
    rootElement.closest("article") ||
    document.querySelector("article") ||
    rootElement.querySelector("article");
  // ...
}
```

**After:**

```javascript
function extractContentData(rootElement, customSelector = null) {
  let article = null;

  if (customSelector) {
    try {
      article =
        rootElement.closest(customSelector) ||
        document.querySelector(customSelector) ||
        rootElement.querySelector(customSelector);
    } catch (e) {
      console.error("Invalid custom selector:", customSelector, e);
    }
  }

  if (!article) {
    article =
      rootElement.closest("article") ||
      document.querySelector("article") ||
      rootElement.querySelector("article");
  }
  // ...
}
```

#### 3. Updated Method Calls

- `startContentConfirmSelection()` - Now async, loads custom selector before extraction
- `extractContent()` - Loads custom selector before calling `extractContentData()`

## How It Works Now

1. User opens "Custom Site Selectors" modal (Cmd/Ctrl+Shift+C)
2. User adds domain and CSS selector (e.g., `example.com` → `.main-content`)
3. User clicks "Save"
4. When user visits that domain and uses "Save Webpage Content":
   - Extension loads custom selector from storage
   - `extractContentData()` tries the custom selector first
   - Falls back to 'article' if custom selector doesn't work
   - Extracts content using the matching element

## Testing Instructions

### 1. Configure Custom Selector

```
1. Press Cmd+Shift+C (Mac) or Ctrl+Shift+C (Windows/Linux)
2. Add a selector:
   - Domain: example.com (without www or https://)
   - Selector: .content, article.main, #main-content, etc.
3. Click "Save"
4. Click "Test" button to verify it's saved
```

### 2. Test Content Extraction

```
1. Navigate to the configured website
2. RELOAD the page (Cmd/Ctrl+R) - Important!
3. Open extension popup
4. Click "Save Webpage Content"
5. Select the area you want to extract
6. Check browser console (F12) for debug logs:
   - "[getCustomSelectorForCurrentDomain] Current domain: ..."
   - "[getCustomSelectorForCurrentDomain] Found selector for ..."
   - "[extractContentData] Starting extraction with custom selector: ..."
   - "[extractContentData] Custom selector result: Found/Not found"
```

### 3. Verify Console Logs

Open browser DevTools (F12) → Console tab:

```
✓ Should see: "Found selector for example.com: .your-selector"
✓ Should see: "Custom selector result: Found"
✓ Content should be extracted from custom selector element
✗ If "Not found": Check selector validity
✗ If no logs: Check domain normalization (remove www, protocol, etc.)
```

## Debug Tips

If custom selectors aren't working:

1. **Check Domain Normalization**
   - Domains are automatically normalized (www removed, lowercase)
   - "www.Example.COM" → "example.com"
2. **Verify Selector Syntax**
   - Valid: `.class`, `#id`, `article.main`, `div[data-content]`
   - Invalid: Malformed CSS (missing dots, invalid characters)

3. **Check Storage**

   ```javascript
   // In browser console:
   chrome.storage.local.get(["customSiteSelectors"], console.log);
   ```

4. **Reload Page**
   - Changes take effect after page reload
   - Extension loads selectors on page load

5. **Console Logs**
   - All operations are logged to browser console
   - Look for "[getCustomSelectorForCurrentDomain]" and "[extractContentData]" prefixes

## Files Modified

1. `Web-2-Notion/clipContent.js` (production version)
2. `temp_unzip/clipContent.js` (unpacked version)

Both files received identical changes to ensure consistency.

## Backward Compatibility

✓ If no custom selector is saved, falls back to 'article' (original behavior)
✓ If custom selector is invalid, falls back to 'article'
✓ Existing functionality unchanged
✓ Auto-save selector feature still works

## Additional Notes

- Custom selectors are domain-specific
- Multiple selectors can be saved for different domains
- Selectors can be updated/removed via the configuration modal
- The "Test" button in the modal shows all saved configurations
