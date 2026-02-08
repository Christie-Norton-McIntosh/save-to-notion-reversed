# Fix: Blank Pages When Custom Selectors Don't Match

## Problem

Users were getting blank pages when:

1. Custom site selectors were configured but didn't match any elements on the page
2. The configured selectors were invalid or misspelled

The extension would fail to extract any content and show a blank page in Notion.

## Root Cause

In `clipContent.js`, the `buildContentFromSelectors` function was updated to prevent duplicate content by removing the fallback extraction. However, this caused a new issue: when custom selectors didn't match, the function returned `null` with no fallback, resulting in blank pages.

The problematic code (lines 3133-3141):

```javascript
if (results.length === 0) {
  // REMOVED: Fallback extraction that was causing duplicates
  console.warn(...);
  return null; // ❌ No fallback!
}
```

## Solution

Added a proper fallback mechanism that:

1. Attempts extraction with custom selectors first
2. If custom selectors fail or are not configured, falls back to default extraction (without custom selector)
3. Provides clear console logging to help users debug selector issues

### Changes Made

#### 1. Fixed Undefined Variable Bug (Line 1578)

**Before:**

```javascript
console.log(
  "[startContentConfirmSelection] Custom selector loaded:",
  customSelector, // ❌ Undefined variable
);
```

**After:**

```javascript
console.log(
  "[startContentConfirmSelection] Custom selectors loaded:",
  selectorEntries, // ✅ Correct variable
);
```

#### 2. Added Fallback Extraction (Lines 3132-3154)

**Before:**

```javascript
if (results.length === 0) {
  console.warn(...);
  return null; // ❌ No content extracted
}
```

**After:**

```javascript
if (results.length === 0) {
  if (selectorEntries.length === 0) {
    console.log(
      "[buildContentFromSelectors] No custom selectors configured for this domain - using default extraction",
    );
  } else {
    console.warn(
      "[buildContentFromSelectors] No content found for configured selectors:",
      selectorEntries.map((e) => e.selector).join(", "),
      "- Falling back to default extraction",
    );
  }

  // ✅ Fallback: extract content without custom selector
  const fallbackData = extractContentData(rootElement, null);
  if (fallbackData) {
    return {
      ...fallbackData,
      embeddedPostFormat: false,
    };
  }

  console.error(
    "[buildContentFromSelectors] Fallback extraction also failed - no content available",
  );
  return null;
}
```

## How It Works Now

### Scenario 1: No Custom Selectors Configured

1. `getCustomSelectorsForCurrentDomain()` returns empty array `[]`
2. `buildContentFromSelectors` detects empty array
3. Logs: "No custom selectors configured - using default extraction"
4. Falls back to `extractContentData(rootElement, null)`
5. Default extraction finds `<article>` tag and extracts content
6. ✅ Content is extracted successfully

### Scenario 2: Valid Custom Selector Configured

1. `getCustomSelectorsForCurrentDomain()` returns `[{ selector: ".content" }]`
2. `buildContentFromSelectors` calls `extractContentData(rootElement, ".content")`
3. Custom selector matches elements
4. ✅ Content is extracted from matching elements

### Scenario 3: Invalid Custom Selector (No Matches)

1. `getCustomSelectorsForCurrentDomain()` returns `[{ selector: ".nonexistent" }]`
2. `buildContentFromSelectors` calls `extractContentData(rootElement, ".nonexistent")`
3. No elements match the selector
4. Logs: "No content found for configured selectors: .nonexistent - Falling back to default extraction"
5. Falls back to `extractContentData(rootElement, null)`
6. Default extraction finds `<article>` tag and extracts content
7. ✅ Content is extracted successfully

### Scenario 4: Multiple Selectors

1. `getCustomSelectorsForCurrentDomain()` returns multiple entries
2. Each selector is tried in order
3. Results are combined
4. If all fail, falls back to default extraction
5. ✅ Content is extracted successfully

## Testing

A test page is provided: `tests/custom-selector-test.html`

### Test Instructions:

1. **Test 1 - No Custom Selector:**
   - Open the test page
   - Open extension popup
   - Extract content
   - ✅ Should extract the full article

2. **Test 2 - Valid Custom Selector:**
   - Go to Custom Site Selectors settings
   - Add rule for test page domain with selector `.content`
   - Extract content again
   - ✅ Should extract only the `.content` div

3. **Test 3 - Invalid Custom Selector:**
   - Change custom selector to `.nonexistent-class`
   - Extract content again
   - ✅ Should fall back to full article extraction
   - Check console for fallback warning

4. **Test 4 - Multiple Selectors:**
   - Change custom selector to `.content h2, .content p`
   - Extract content again
   - ✅ Should extract all h2 and p elements from `.content`

### Console Logging

The fix adds detailed console logging to help debug selector issues:

```
[getCustomSelectorsForCurrentDomain] Current domain: example.com
[getCustomSelectorsForCurrentDomain] Resolved selectors: [...]
[buildContentFromSelectors] No content found for configured selectors: .nonexistent
[buildContentFromSelectors] Falling back to default extraction
[extractContentData] Starting extraction with custom selector: null
[extractContentData] Falling back to article selector
```

## Benefits

1. ✅ **Never blank pages** - Always falls back to default extraction
2. ✅ **Better debugging** - Clear console messages explain what's happening
3. ✅ **Preserves duplicate prevention** - Still uses the deduplication logic when custom selectors work
4. ✅ **User-friendly** - Works even with invalid selectors
5. ✅ **Backward compatible** - Existing custom selectors continue to work

## Related Files

- `Web-2-Notion/clipContent.js` - Main fix (lines 1578, 3132-3154)
- `Web-2-Notion/tests/custom-selector-test.html` - Test page

## Known Limitations

- If both custom selectors AND default extraction fail (e.g., no `<article>` tag and no matching selectors), the page will still be blank. This is extremely rare and indicates the page has no extractable content.
- The fallback extraction may include more content than intended when custom selectors are misconfigured. Users should verify their selectors are correct.

## Recommendations for Users

1. **Test your custom selectors** - Use the test page or your target page to verify selectors work
2. **Check the console** - Console logs will tell you if selectors are matching
3. **Use specific selectors** - More specific selectors (e.g., `.main-content article`) work better than generic ones
4. **Multiple selectors** - Use comma-separated selectors for flexibility

## Future Improvements

Potential enhancements:

1. Add a "Test Selector" button in the Custom Site Selectors UI
2. Show a warning in the popup if selectors don't match
3. Add selector validation before saving
4. Provide selector suggestions based on page structure
