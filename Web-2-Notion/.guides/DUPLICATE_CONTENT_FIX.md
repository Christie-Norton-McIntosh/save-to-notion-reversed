# Duplicate Content Fix (v5.1.1)

## Problem

Users reported duplicate images and tables appearing in saved content when using custom site selectors with multiple selectors.

## Root Cause

The duplicate detection logic in both `scanWebpage.js` and `clipContent.js` used weak signatures to identify duplicate elements:

1. **Images**: Used full `el.src` which includes query parameters
   - Same image with different query params (e.g., `?v=123` vs `?v=456`) would not be detected as duplicate
   - Didn't consider alt text or dimensions

2. **Tables**: Used only first 200 characters of `innerHTML`
   - Not enough to distinguish between similar but different tables
   - Could cause false positives for tables with similar headers

3. **Other Elements**: Also used only 200 characters
   - Insufficient for complex content blocks

## Solution

Enhanced the `getElementSignature()` function in both files to create more robust signatures:

### Images

```javascript
// Before:
return `img:${el.src}`;

// After:
const normalizedSrc = el.src.split("?")[0].split("#")[0];
const altText = el.alt || "";
const dimensions = `${el.width || 0}x${el.height || 0}`;
return `img:${normalizedSrc}:${altText}:${dimensions}`;
```

**Benefits:**

- Removes query parameters and hash fragments from URL
- Includes alt text for better matching
- Includes dimensions to distinguish same image at different sizes

### Tables

```javascript
// Before:
const content = el.innerHTML?.substring(0, 200) || "";
return `${el.tagName.toLowerCase()}:${content}`;

// After:
const textContent = el.textContent?.trim() || "";
const cellCount = el.querySelectorAll("td, th").length;
const rowCount = el.querySelectorAll("tr").length;
const content = el.innerHTML?.substring(0, 500) || "";
return `table:${rowCount}x${cellCount}:${textContent.length}:${content}`;
```

**Benefits:**

- Includes structural information (row count × cell count)
- Includes total text content length
- Increased HTML comparison from 200 to 500 characters
- Tables with same structure and similar content are properly detected

### Other Elements

```javascript
// Before:
const content = el.innerHTML?.substring(0, 200) || "";
return `${el.tagName.toLowerCase()}:${content}`;

// After:
const textLength = el.textContent?.trim().length || 0;
const content = el.innerHTML?.substring(0, 500) || "";
return `${el.tagName.toLowerCase()}:${textLength}:${content}`;
```

**Benefits:**

- Includes text content length for additional uniqueness
- Increased comparison length from 200 to 500 characters

## Files Modified

1. `/Web-2-Notion/scanWebpage.js` - Line ~14884
2. `/Web-2-Notion/clipContent.js` - Line ~3248
3. `/Web-2-Notion/.guides/Custom Site Selectors Guide.md` - Updated "What's New"
4. `/CHANGELOG.md` - Added v5.1.1 entry

## Testing

To verify the fix:

1. Navigate to a page with multiple custom selectors (e.g., ServiceNow docs)
2. Ensure selectors capture overlapping content (e.g., `.body.conbody`, `.body.refbody`)
3. Check browser console for deduplication messages:
   ```
   [scanWebpage] ✓ Deduplicated X duplicate elements
   ```
4. Verify no duplicate images or tables in the final output

## Future Enhancements

Potential improvements:

- Use a proper hash function (e.g., MD5) for content comparison
- Add visual similarity detection for images
- Implement fuzzy matching for tables with minor differences
- Cache signatures to improve performance for large pages
- Add user-configurable deduplication sensitivity

## Related Issues

- Custom Site Selectors Guide: Enhanced duplicate detection documentation
- ServiceNow integration: Works with nested shadow DOM and multiple content selectors
