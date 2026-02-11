# Fix for ItemGroup Code Block Issue

## Problem

ServiceNow documentation pages use a structure like this:

```html
<div class="itemgroup info">
  <p class="p">The licenses are listed...</p>
  <div class="p">
    <!-- ← PROBLEMATIC: div with class "p" -->
    <div class="note note note_note">
      <span class="note__title">Note:</span>
      <div class="note__body">In the Software Licenses list...</div>
    </div>
  </div>
</div>
```

The `<div class="p">` wrapper around the note element was causing Turndown to treat the content as a code block instead of regular formatted text.

## Root Cause

1. **Deeply nested DIVs**: Multiple nested `<div>` elements confuse markdown parsers
2. **Semantic mismatch**: `<div class="p">` should be a `<p>` tag
3. **Code detection**: The nested structure triggers code block formatting

## Solution

### Changes Made

1. **Added "p" and "div" to allowed replacement tags** (`site-selectors.js`)
   - Now you can convert `<div class="p">` → `<p>` tags
   - Or normalize `<div class="itemgroup">` → `<div>` to reset classes

2. **Updated block replacement handling** (`scanWebpage.js`)
   - Added "p" to the `isBlockReplacement` array
   - Ensures proper block-to-block transformation

3. **Updated documentation** (`site-selectors.html`)
   - Added examples showing how to use the new options
   - Explained the proper ordering strategy

### How to Use

#### Recommended Rule Order:

Add these custom formatting rules in this specific order:

1. **Inline elements first** (children):

   ```
   Selector: span.ph.uicontrol
   Replacement: strong
   Description: UI control text
   ```

2. **Note containers** (specific parent):

   ```
   Selector: div:has(> .note__title, > .note__body)
   Replacement: blockquote
   Description: Note blocks
   ```

3. **Problem wrappers last** (general parent):
   ```
   Selector: div.p
   Replacement: p
   Description: Convert div.p to proper paragraph tags
   ```

### Why This Order Matters

The rules are processed **top to bottom**. By processing in this order:

1. Child elements (`span.ph.uicontrol`) get formatted first → **bold**
2. Note containers get wrapped in blockquotes → **`<blockquote>`**
3. The problematic `div.p` wrapper gets converted → **`<p>`**

Result:

```html
<!-- Before custom formatting -->
<div class="itemgroup info">
  <div class="p">
    <div class="note">
      <span class="note__title">Note:</span>
      <span class="ph uicontrol">Rights</span>
    </div>
  </div>
</div>

<!-- After custom formatting -->
<div class="itemgroup info">
  <p>
    <blockquote>
      <span class="note__title">Note:</span>
      <strong>Rights</strong>
    </blockquote>
  </p>
</div>
```

Then Turndown converts to clean markdown:

```markdown
> Note: **Rights**
```

### Alternative Approach

If you don't want the `<p>` wrapper, you can convert `div.p` → `div` to just normalize it:

```
Selector: div.p
Replacement: div
Description: Normalize div.p wrappers
```

This removes the problematic class but keeps the structure, letting the inner blockquote work properly.

## Testing

1. **Reload the extension** after making changes
2. **Open Custom Site Selectors** (Ctrl+Shift+C / Cmd+Shift+C)
3. **Add the formatting rules** in the order shown above
4. **Save Settings**
5. **Reload the ServiceNow page** you're extracting from
6. **Extract content** and verify it's no longer a code block

## Files Modified

- `site-selectors.js` - Added "p" and "div" to ALLOWED_REPLACEMENTS
- `site-selectors.html` - Updated documentation and examples
- `scanWebpage.js` - Added "p" to block replacement handling

## Additional Notes

### Why Not Just Use div.itemgroup?

The `.itemgroup` class might be used in many places on ServiceNow pages. Converting it could affect other content. The `div.p` selector is more specific to the problematic pattern.

### What About Other ServiceNow Patterns?

You can add more rules as needed:

- `div.sectiondiv` → `div`
- `div.bodydiv` → `div`
- `span.ph.filepath` → `code`
- `span.keyword` → `em`

### Debugging

Enable debug logging in the browser console:

```javascript
window.__STN_DEBUG = true;
```

Then check the console when extracting content to see:

- Which formatting rules are matching
- How many elements are being transformed
- The order of transformations

Look for messages like:

```
[applyCustomFormatting] Found 3 elements matching "div.p" (Convert div.p to paragraphs)
[applyCustomFormatting] Replacing DIV container with <p>
```
