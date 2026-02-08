# abbr Spacing Fix - Regression Prevention

## Issue Summary

Spaces around special characters (>, <, &, |) inside inline elements like `<abbr>` were being removed during HTML processing, causing text like "Workspaces > Service Operations Workspace" to become "Workspaces>Service Operations Workspace".

## Root Causes (2 locations fixed)

### 1. stripMultispaces function (scanWebpage.js ~line 12023)

**Fixed in:** Version 5.0.4

**Problem:** Global whitespace replacement was collapsing spaces inside inline elements.

**Solution:** Added protection for spaces in inline elements containing special characters:

```javascript
var stripMultispaces = (str) => {
  // Protect spaces in inline elements with special chars
  var protected = str.replace(
    /<(abbr|span|em|strong|b|i|code)[^>]*>\s*([^<]*?)\s*<\/\1>/gi,
    function (match, tag, content) {
      if (/\s+[<>&|]\s+/.test(content)) {
        return match.replace(/\s+/g, "\u00A0"); // Use non-breaking space as placeholder
      }
      return match;
    },
  );
  var result = protected.replace(WS_REGEXP, " ").trim();
  return result.replace(/\u00A0/g, " "); // Restore spaces
};
```

### 2. applyCustomFormatting whitespace cleanup (scanWebpage.js ~line 14851)

**Fixed in:** Version 5.0.5

**Problem:** TreeWalker traversing text nodes in block elements was removing leading/trailing spaces from text nodes with no siblings (like text inside abbr tags).

For the text node `>` inside `<abbr title="and then"> &gt; </abbr>`:

- `previousSibling === null` (first child) → removes leading whitespace
- `nextSibling === null` (last child) → removes trailing whitespace
- Result: `>` became `>`

**Solution:** Skip whitespace normalization for inline elements with special characters:

```javascript
const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
let node;
while ((node = walker.nextNode())) {
  if (node.nodeType === Node.TEXT_NODE) {
    // Skip text nodes inside inline elements with special characters
    const parent = node.parentElement;
    if (parent) {
      const inlineElements = ["ABBR", "SPAN", "EM", "STRONG", "B", "I", "CODE"];
      const isInInlineElement = inlineElements.includes(parent.tagName);
      const hasSpecialChars = /[<>&|]/.test(node.textContent);
      if (isInInlineElement && hasSpecialChars) {
        continue; // Skip whitespace normalization
      }
    }
    // ... rest of whitespace cleanup logic
  }
}
```

## Test Coverage

### Unit Tests

- `test/test-scanwebpage-abbr-spacing.js` - Tests stripMultispaces function
- `test/test-applyCustomFormatting-abbr-spacing.js` - Tests applyCustomFormatting whitespace cleanup

### Test Cases Covered

1. ✅ ServiceNow menucascade with abbr > (HTML entity)
2. ✅ abbr with > (decoded)
3. ✅ abbr with pipe separator (|)
4. ✅ Multiple abbr in sequence
5. ✅ abbr with < character
6. ✅ abbr with & character
7. ✅ Regular text whitespace still collapsed
8. ✅ abbr without special chars - whitespace trimmed normally
9. ✅ span with special char preserves spaces
10. ✅ strong with special char preserves spaces
11. ✅ em with special char preserves spaces
12. ✅ code with special char preserves spaces
13. ✅ Nested structures with multiple levels

### Browser Diagnostic

`DIAGNOSTIC_MENUCASCADE_SPACING.js` - Run in browser console to verify fix in live DOM

## Inline Elements Protected

The fix applies to these inline elements when they contain special characters:

- `ABBR`
- `SPAN`
- `EM`
- `STRONG`
- `B`
- `I`
- `CODE`

## Special Characters Protected

- `>` (greater than)
- `<` (less than)
- `&` (ampersand)
- `|` (pipe)

## How to Verify Fix

### 1. Run Unit Tests

```bash
node test/test-scanwebpage-abbr-spacing.js
node test/test-applyCustomFormatting-abbr-spacing.js
```

### 2. Test in Browser

1. Load extension in Chrome
2. Navigate to ServiceNow documentation page with breadcrumbs
3. Open browser console
4. Run the diagnostic script from `DIAGNOSTIC_MENUCASCADE_SPACING.js`
5. Verify abbr elements show spaces: `>` not `>`

### 3. Expected Results

- Console logs should show: `<abbr title="and then"> &gt; </abbr>` (WITH spaces)
- Display should show: "Workspaces > Service Operations Workspace" (WITH spaces)
- NOT: "Workspaces>Service Operations Workspace" (spaces removed)

## Regression Prevention Checklist

Before making changes to whitespace handling code:

- [ ] Run `test/test-scanwebpage-abbr-spacing.js`
- [ ] Run `test/test-applyCustomFormatting-abbr-spacing.js`
- [ ] Test with actual ServiceNow page
- [ ] Check console logs for abbr innerHTML patterns
- [ ] Verify both `stripMultispaces` and `applyCustomFormatting` preserve spaces
- [ ] Ensure regular whitespace collapsing still works for normal content

## Related Files

- `scanWebpage.js` - Contains both fixes
- `manifest.json` - Version tracking
- `test/test-scanwebpage-abbr-spacing.js` - stripMultispaces tests
- `test/test-applyCustomFormatting-abbr-spacing.js` - applyCustomFormatting tests
- `DIAGNOSTIC_MENUCASCADE_SPACING.js` - Browser diagnostic tool

## Version History

- **5.0.2** - Initial bug report
- **5.0.3** - Investigation phase
- **5.0.4** - Fixed stripMultispaces function
- **5.0.5** - Fixed applyCustomFormatting whitespace cleanup (COMPLETE FIX)
