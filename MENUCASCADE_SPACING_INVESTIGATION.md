# Menucascade Spacing Investigation Summary

## Issue Report

User reported that spaces are being removed from around `>` in `<abbr>` tags within menucascade elements, causing:

- Expected: `"Workspaces > Service Operations Workspace"`
- Actual: `"Workspaces>Service Operations Workspace"`

Example HTML:

```html
<span class="ph menucascade">
  <span class="ph uicontrol">Workspaces</span>
  <abbr title="and then"> &gt; </abbr>
  <span class="ph uicontrol">Service Operations Workspace</span>
</span>
```

## Investigation Results

### Code Analysis

1. **Table Cell Processing** (`popup/static/js/main.js`)
   - Line 92005: Uses `textContent` to extract text from DOM, which correctly preserves spaces
   - Line 92013: Only collapses 3+ consecutive spaces (`/ {3,}/g`), preserving single spaces around `>`
   - Line 91283: Similar processing in `sanitizeCell` with explicit comment about preserving spaces around `>  `

2. **Existing Protection**
   - Lines 91267-91270 contain a comment specifically mentioning the need to preserve spaces around `>  `
   - The regex `/[ \t]{3,}/g` only matches 3 or more spaces/tabs, leaving 1-2 spaces intact

### Test Results

Created comprehensive tests that verify:

- ✅ Inline HTML (no newlines): Spaces preserved
- ✅ Formatted HTML (with newlines): Spaces preserved
- ✅ Multiple spaces: Correctly normalized to single spaces
- ✅ Non-breaking spaces (`&nbsp;`): Correctly handled

All tests in `test/test-menucascade-comprehensive.js` pass successfully.

## Conclusion

The code **IS** correctly preserving spaces around `>` in menucascade elements during table cell processing. The spaces are:

1. Present in the original HTML
2. Extracted correctly via `textContent`
3. Normalized appropriately (collapsing only 3+ spaces)
4. Stored in `__TABLE_CELL_CONTENT_MAP__` with proper spacing

## Possible Causes of User's Issue

Since our tests show the code works correctly, the issue may be:

1. **Display/Preview Issue**: The preview UI might be rendering with CSS that collapses whitespace
2. **Notion API Processing**: Notion's API or rendering might be stripping spaces from rich_text content
3. **Browser-specific**: Different browsers may handle whitespace differently
4. **Specific Page Structure**: The user's specific ServiceNow page might have different HTML structure

## Recommended Next Steps

1. User should run `DIAGNOSTIC_MENUCASCADE_SPACING.js` in browser console on the actual problematic page
2. Check if the issue occurs in the preview or only after sending to Notion
3. Inspect the actual Notion API payload being sent to see if spaces are in the request
4. Test with a different browser to rule out browser-specific issues

## Code Changes Made

- Added clarifying comment in `main.js` at line 92011 to document the intentional preservation of spaces around special characters
- Updated version to 5.0.3 in `manifest.json`
- Created diagnostic and test files for future debugging

## Files Modified

- `/Web-2-Notion/popup/static/js/main.js` (comment clarification)
- `/Web-2-Notion/manifest.json` (version bump)

## Files Created

- `/Web-2-Notion/DIAGNOSTIC_MENUCASCADE_SPACING.js` (browser console diagnostic)
- `/Web-2-Notion/test/test-menucascade-comprehensive.js` (comprehensive test suite)
- `/Web-2-Notion/test/test-menucascade-simple.js` (simple textContent test)
- `/Web-2-Notion/test/test-table-cell-menucascade.js` (table cell simulation)
