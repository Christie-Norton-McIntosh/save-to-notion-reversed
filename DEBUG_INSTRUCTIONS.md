# Debug Instructions - Blank Preview Issue

## ✅ Issue Found and Fixed!

### The Problem

Custom selectors were being saved with **invalid CSS syntax** like:

- `.body.` (trailing dot)
- `#current-page-title,.body.,.related-links` (malformed multi-selector)

This caused `querySelector()` to throw a **SyntaxError**, breaking content extraction entirely.

### The Fix Applied

Added **selector validation and cleaning** in `extractContentData()` (clipContent.js):

- Removes double dots (`..` → `.`)
- Fixes comma-dot patterns (`,. ` → `,`)
- Removes trailing commas
- Tests selector validity before use
- Falls back to article extraction if selector is still invalid

## What You Need to Do Now

### 1. Reload the Extension

- Go to `chrome://extensions`
- Find "Save to Notion"
- Click the reload button (circular arrow icon)

### 2. Clear Bad Selectors (Optional but Recommended)

- Go to extension Options/Settings
- Find "Custom Site Selectors"
- Delete any selectors that look malformed
- **OR** delete all and let the extension auto-save good ones

### 3. Test Again

- Navigate to any website (e.g., servicenow.com docs)
- Click "Save Webpage Content" or "Pick Content"
- Click on some content
- **Should now work!**

## Expected Behavior After Fix

### ✅ What Should Happen:

- Content extraction works even with previously invalid selectors
- Console shows: `[extractContentData] Cleaned selector: ...`
- Falls back to article extraction if selector can't be cleaned
- **Preview shows content in popup** (not blank!)

### Console Messages You'll See:

```
[buildContentFromSelectors] === STARTING ===
[extractContentData] Starting extraction with custom selector: .body.
[extractContentData] Cleaned selector: .body
[extractContentData] Found article content
✓ Content extracted successfully
[clipContent] Sending pickContentAdded payload:
  - Content length: 2456
  - Text length: 523
```

## About Those "getData" Warnings

The warnings like:

```
getData: Element not found with selector: #breadcrumb > div > a
```

These are **harmless** - they're from a different feature ("Pick Data") trying to find specific page elements. The extension tries multiple selectors to extract metadata. You can safely ignore these warnings.

## If It Still Doesn't Work

Please share:

1. Console logs from DevTools (F12 → Console tab)
2. What website you're testing on
3. Any **red error messages** (not orange warnings)
4. Screenshot of the blank popup if possible

## Technical Details

The fix specifically addresses:

- **SyntaxError**: Failed to execute 'querySelector' on 'Document'
- **TypeError**: Cannot read properties of undefined (reading 'id')

Both errors were caused by malformed selectors being passed to DOM query methods.
