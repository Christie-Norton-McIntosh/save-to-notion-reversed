# Fix for Bracketed Placeholder and Empty Parentheses Removal

## Problem

The patch that removes `[alt]` image placeholders and empty `()` parentheses was being too aggressive, removing legitimate user text like `[DRAFT]` that happened to be in cells containing images elsewhere.

## Root Cause

The original logic checked if the entire table cell contained a preserved image OR XCELLIDX marker, and if so, removed ANY bracketed text `[...]` found in the cell. This was too broad because:

1. Large table cells can have images in one section and legitimate bracketed text (like `[DRAFT]`, `[Section 2]`) in another section
2. The code was not checking if the bracketed text was actually **next to** an image (which would indicate it's a placeholder)

## Solution

Made the bracketed text removal more conservative by:

1. **Check direct siblings first**: Only remove bracketed text if it's immediately adjacent to a preserved image or XCELLIDX marker

2. **Check parent element's siblings**: Handle cases like `<img><span>[alt]</span>` where the bracketed text is wrapped in an element that's a sibling of the image

3. **Check parent's children**: Only remove bracketed text if the parent element contains ONLY the bracketed text and an image (with possibly some whitespace/bullets), but NOT if the parent has substantial other text content

## What's Fixed

✅ **Preserved**: Legitimate user text like `[DRAFT]` in table cells, even when the cell contains images elsewhere

✅ **Removed**: Image placeholders like `[alt]` that are:

- Adjacent to preserved images
- Inside elements adjacent to preserved images
- In containers that only have the placeholder + image

✅ **Removed**: Empty parentheses `()` left after image removal

✅ **Converted**: Images correctly converted to Markdown format `![alt](url)`

## Test Results

- ✅ All existing tests in `test-processCellForTableToList.js` pass
- ✅ ServiceNow fixture (`servicenow-r_ITServiceManagement.html`) processes correctly
- ✅ Table with inline images fixture (`table-w-inline.html`) preserves `[DRAFT]` text while removing actual image placeholders

## Files Modified

- `Web-2-Notion/popup/lib/table-to-list-utils.js` - Updated `stripLegacyBracketedPlaceholders` function
- `dev-tools/table-to-list-utils.js` - Synced with popup version

## Testing

Run the test suite:

```bash
node tests/test-processCellForTableToList.js
```

All tests should pass with no errors.
