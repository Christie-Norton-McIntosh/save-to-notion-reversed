# Debugging ItemGroup Code Block Issue

## Changes Made

### 1. Moved Custom Formatting to Run BEFORE Markdown Conversion

**File**: `scanWebpage.js`

**Problem**: The original code applied custom formatting AFTER Turndown had already converted HTML to Markdown. By that time, problematic structures like `<div class="itemgroup info">` were already converted to code blocks.

**Solution**: Added `applyCustomFormatting()` call BEFORE the Readability/markdown conversion step:

```javascript
content = execPreParser(content, links);

// NEW: Apply custom formatting BEFORE markdown conversion
content = content ? applyCustomFormatting(content) : null;

content = await extractWithReadability(content, bestUrl);

// EXISTING: Still apply after as well (catches any remaining issues)
content = content ? applyCustomFormatting(content) : null;
```

### 2. Added Debug Logging

Enhanced logging in `applyCustomFormatting()` to show:

- Input HTML length and sample
- Which elements are being matched
- What transformations are being applied
- The tag name, classes, and text content of each element

## How to Debug

1. **Open Chrome DevTools Console** (F12 or Cmd+Option+I)

2. **Enable verbose logging**:

   ```javascript
   window.__STN_DEBUG = true;
   ```

3. **Extract the page** with your custom selectors configured

4. **Look for these log messages**:

   ```
   [applyCustomFormatting] Input HTML sample: ...
   [applyCustomFormatting] Using format rules: ...
   [applyCustomFormatting] Found X elements matching "div.p" ...
   [applyCustomFormatting] Processing element: DIV p The licenses are listed...
   [applyCustomFormatting] Replacing DIV container with <p>
   ```

5. **Check if your rules are matching**:
   - If you see "Found 0 elements" - your selector isn't matching anything
   - If you see "Found X elements" but no transformation - check the replacement logic
   - If you see transformations but still get code blocks - the issue is elsewhere

## Troubleshooting Steps

### Issue: Rules not matching

**Check 1**: Are your custom selectors saved?

```javascript
// In console:
chrome.storage.local.get("customFormatRules", (result) => {
  console.log("Saved rules:", result.customFormatRules);
});
```

**Check 2**: Reload the ServiceNow page after saving rules

**Check 3**: Check selector specificity

- `div.p` matches `<div class="p">`
- `div.itemgroup.info` matches `<div class="itemgroup info">`
- `.p` matches any element with class "p"

### Issue: Transformations happening but still getting code blocks

**Possibility 1**: The itemgroup content is being preserved but then Turndown is seeing a different pattern

**Solution**: Add a rule to completely unwrap/remove the itemgroup:

```
Selector: div.itemgroup.info
Replacement: div
Description: Normalize itemgroup containers
```

**Possibility 2**: CSS styling on the page is setting `white-space: pre` or `font-family: monospace`

**Check**: Inspect the element in DevTools and look at the Computed styles

**Possibility 3**: The content has excessive indentation or whitespace

**Check**: Look at the HTML in the debug logs - if you see lots of `\n` and spaces, that might trigger code formatting

### Issue: Custom formatting not running at all

**Check**: Look for this log message:

```
[parseFromHtml] After applyCustomFormatting (pre-markdown):
```

If you don't see it, the code isn't being called.

**Solution**: Make sure you reloaded the extension after editing scanWebpage.js

## Recommended Setup

Based on your ServiceNow structure, add these rules **in this order**:

1. **Inline elements first**:

   ```
   Selector: span.ph.uicontrol
   Replacement: strong
   Description: Bold UI control text
   ```

2. **Note containers**:

   ```
   Selector: div:has(> .note__title, > .note__body)
   Replacement: blockquote
   Description: Note blocks
   ```

3. **Problem wrapper**:

   ```
   Selector: div.p
   Replacement: p
   Description: Convert div.p to proper paragraphs
   ```

4. **Outer container**:
   ```
   Selector: div.itemgroup.info
   Replacement: div
   Description: Normalize itemgroup containers
   ```

## What to Look For in Logs

### Successful transformation:

```
[applyCustomFormatting] Found 1 elements matching "div.p"
[applyCustomFormatting] Processing element: DIV p <div class="note note note_note">...
[applyCustomFormatting] Replacing DIV container with <p>
[applyCustomFormatting] ✓ Applied 1 custom formatting transformations
```

### Failed transformation:

```
[applyCustomFormatting] Found 0 elements matching "div.p"
[applyCustomFormatting] No matching elements found for any rules
```

### Check the result:

```
[parseFromHtml] After applyCustomFormatting (pre-markdown): <div class="itemgroup info"><p><blockquote>...
```

Look for your replacements (e.g., `<p>` instead of `<div class="p">`)

## Alternative: Use Ignore Selector

If the custom formatting still doesn't work, you can try using an **Ignore Selector** instead:

1. Add `.itemgroup.info` to the Ignore Selectors list
2. This will completely remove itemgroup elements from extraction
3. Only use this if you don't need that content at all

## Next Steps

1. **Reload the extension**
2. **Open DevTools console**
3. **Navigate to your ServiceNow page**
4. **Extract the content**
5. **Check the logs** for the debug messages above
6. **Share the logs** if you're still seeing code blocks

The debug logs will tell us exactly what's happening!
