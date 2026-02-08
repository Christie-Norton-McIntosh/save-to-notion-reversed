# Custom Selector Fix - Complete

## Problem

Pages were appearing blank when trying to clip content, even after custom selectors were configured.

## Root Causes

### Issue 1: Undefined Variable (Line 1578)

**Bug**: `customSelector` variable was used but never defined  
**Fix**: Changed to `selectorEntries`

### Issue 2: No Fallback When Selectors Fail (Lines 3132-3165)

**Bug**: `buildContentFromSelectors()` returned null when configured selectors didn't match any content  
**Fix**: Added fallback to call `extractContentData(rootElement, null)` with comprehensive logging

### Issue 3: Overly Strict Content Validation (Lines 3543-3574)

**Bug**: `extractContentData()` required > 100 characters to extract content, rejecting valid small elements  
**Fix**:

- Lowered threshold from 100 to 10 characters
- Added HTML-only fallback for elements with minimal text
- Enhanced logging to track extraction flow

## Technical Details

### Fix 1: Variable Name Correction (Line 1578)

```javascript
// BEFORE:
console.log(
  "[startContentConfirmSelection] Custom selector loaded:",
  customSelector,
);

// AFTER:
console.log(
  "[startContentConfirmSelection] Custom selectors loaded:",
  selectorEntries,
);
```

### Fix 2: Fallback Extraction Logic (Lines 3132-3165)

```javascript
if (results.length === 0) {
  if (selectorEntries.length === 0) {
    console.log(
      "[buildContentFromSelectors] No custom selectors configured - using default extraction",
    );
  } else {
    console.warn(
      "[buildContentFromSelectors] No content found for configured selectors:",
      selectorEntries.map((e) => e.selector).join(", "),
      "- Falling back to default extraction",
    );
  }

  const fallbackData = extractContentData(rootElement, null);
  if (fallbackData) {
    return { ...fallbackData, embeddedPostFormat: false };
  }

  console.error(
    "[buildContentFromSelectors] Fallback extraction also failed - no content available",
  );
  return null;
}
```

### Fix 3: Improved Content Extraction (Lines 3543-3574)

```javascript
// Fallback: extract content from the selected element itself
console.log(
  "[extractContentData] Final fallback: extracting from rootElement directly",
);
const text = rootElement.textContent?.trim();
const html = rootElement.outerHTML;

// Accept any element with content (lowered threshold from 100 to 10 characters)
if (text && text.length > 10 && html) {
  console.log(
    `[extractContentData] ✓ Fallback succeeded - found ${text.length} characters of text content`,
  );
  return {
    title: document.title || "Unknown Title",
    content: html,
    textContent: text.replace(/\s+/g, " "),
    url: window.location.href,
    elementCount: 1,
  };
}

// Even if text is short, try to extract HTML if available
if (html && html.length > 50) {
  console.log(
    `[extractContentData] ✓ Fallback using HTML content (${html.length} chars)`,
  );
  return {
    title: document.title || "Unknown Title",
    content: html,
    textContent: text || "(No text content)",
    url: window.location.href,
    elementCount: 1,
  };
}

console.error(
  "[extractContentData] ✗ All extraction strategies failed - no valid content found",
);
return null;
```

## Testing

### Test Case 1: No Custom Selectors

1. Open `tests/custom-selector-test.html` in Chrome
2. Load the extension
3. Click "Pick Content" (without saving selectors first)
4. Select the article
5. **Expected**: Content should appear in popup (using fallback extraction)

### Test Case 2: Invalid Selector

1. Add custom selector `.nonexistent` for the test page domain
2. Try to clip content
3. **Expected**: Fallback extraction should work, content appears in popup

### Test Case 3: Short Content

1. Select a small element (< 100 chars but > 10 chars)
2. **Expected**: Content should be extracted (old bug would reject this)

### Test Case 4: HTML-only Content

1. Select an element with minimal text but substantial HTML (e.g., images, tables)
2. **Expected**: HTML content should be extracted even if text is short

## Console Logging

### Successful Extraction Flow

```
[buildContentFromSelectors] Starting with 2 selector(s)
[extractContentData] Starting extraction with custom selector: .article
[extractContentData] Found article content
✓ Content extracted successfully
```

### Fallback Flow (Selector Doesn't Match)

```
[buildContentFromSelectors] Starting with 1 selector(s)
[extractContentData] Starting extraction with custom selector: .article
[extractContentData] No matches found for custom selector
⚠️ [buildContentFromSelectors] No content found for configured selectors: .article - Falling back to default extraction
[extractContentData] Starting extraction with custom selector: null
[extractContentData] Falling back to article selector
[extractContentData] Final fallback: extracting from rootElement directly
✓ [extractContentData] Fallback succeeded - found 523 characters of text content
```

### Complete Failure (Nothing to Extract)

```
[buildContentFromSelectors] Starting with 0 selector(s)
[extractContentData] Starting extraction with custom selector: null
[extractContentData] Falling back to article selector
[extractContentData] Final fallback: extracting from rootElement directly
✗ [extractContentData] All extraction strategies failed - no valid content found
✗ [buildContentFromSelectors] Fallback extraction also failed - no content available
✗ [clipContent] No content found to extract
```

## Related Files

- `Web-2-Notion/clipContent.js` - Main content script with extraction logic
- `Web-2-Notion/tests/custom-selector-test.html` - Test page for verification

## Impact

These fixes ensure that:

1. Content extraction always has multiple fallback strategies
2. Small but valid content is not rejected
3. Detailed console logging helps debug any remaining issues
4. The extension gracefully handles all edge cases
