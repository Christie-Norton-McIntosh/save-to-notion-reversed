# Table Line Breaks Test Instructions

## Problem

Line breaks are being lost in table cells when converting to markdown. For example:

```
Enhance the service experienceAutomate support for common requests...
```

Should be:

```
Enhance the service experience
Automate support for common requests...
```

## Automated Test

Run the test to verify the fix:

```bash
cd Web-2-Notion
npm run test-line-breaks
```

The test uses the sample HTML from `tests/table-content-line-breaks.html` and should show:

- ✅ PASSED tests indicate line breaks ARE preserved
- ❌ FAILED tests indicate line breaks are MISSING

## Manual Testing in Extension

1. **Reload the extension** in Chrome:
   - Go to `chrome://extensions/`
   - Find "Save to Notion" extension
   - Click the reload icon (circular arrow)

2. **Open the ServiceNow docs page** with the table

3. **Open browser console** (F12) and look for debug messages:

   ```
   [TABLE CELL] Processing cell, original content: ...
   [TABLE CELL] Found X block elements
   [TABLE CELL] Text before marker replacement: ...
   [TABLE CELL] Final text: ...
   ```

4. **Use the extension** to clip the table

5. **Check the console logs** to see if:
   - The tableCell replacement function is being called
   - Block elements are being found
   - Markers (`__BLOCK_END__`) are present in the text
   - Final text contains line breaks (`\n`)

## Expected Behavior

For a cell with this HTML:

```html
<td>
  Enhance the service experience
  <p>Automate support for common requests...</p>
</td>
```

The console should show:

```
[TABLE CELL] Found 1 block elements
[TABLE CELL] Text before marker replacement: Enhance the service experience__BLOCK_END__Automate support...
[TABLE CELL] Final text: Enhance the service experience
  Automate support...
```

(Note the `  \n` which is two spaces + newline in markdown)

## Troubleshooting

If the line breaks are still missing:

1. **Check console** - Are the `[TABLE CELL]` debug messages appearing?
   - NO → The code isn't running, extension not reloaded properly
   - YES → Continue to next step

2. **Check block element count** - Does it show `Found 0 block elements`?
   - YES → The HTML structure is different than expected
   - NO → Continue to next step

3. **Check markers** - Does "Text before marker replacement" contain `__BLOCK_END__`?
   - NO → The marker insertion isn't working
   - YES → Continue to next step

4. **Check final text** - Does it contain actual line breaks?
   - NO → The marker replacement isn't working
   - YES → The problem is elsewhere (possibly in how markdown is displayed)

## Current Status

The automated test shows the approach WORKS correctly:

- ✅ 5 tests passed (cells with text + `<p>` tags preserve line breaks)
- ❌ 5 tests failed (image-only cells, expected behavior)

This means the logic is correct, but it needs to be executed in the actual extension context.
