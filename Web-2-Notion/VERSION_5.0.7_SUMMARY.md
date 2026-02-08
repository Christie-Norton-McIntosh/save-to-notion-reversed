# Version 5.0.7 Fixes - Summary

## Date

February 6, 2026

## Issues Fixed

### 1. Inline Images Being Removed (Critical Bug) ✅

**Problem:** Images preserved with `data-stn-preserve` were immediately removed when parent anchor was deleted. Additionally, even when preserved, they were never extracted and added to the final markdown output.

**Root Causes:**

1. Parent anchors were being removed without checking for preserved images
2. Preserved images were created but never collected/converted to markdown

**Solution:**

- Check for preserved images before removing anchors (4 locations)
- Extract preserved images after table processing and add to markdown (2 locations)

**Files:** `Web-2-Notion/popup/static/js/main.js` (6 locations total)

### 2. Custom Format Rules Applied Twice (Critical Bug) ✅

**Problem:** `applyCustomFormatting` was being called twice - once before Readability (line 15038) and once after (line 15086). The first call would format and unwrap elements, then the second call would fail because elements were already unwrapped.

**Root Cause:**

- First call: Formatted and unwrapped note**title/note**body before Readability
- Second call: Couldn't find elements to format because already unwrapped
- Result: Format rules not applied, or applied incorrectly

**Solution:** Remove the first call (before Readability). Only apply custom formatting once, after all HTML processing is complete (line 15086).

**Result:**

```html
<blockquote>
  <strong>Important Title</strong>
  <em>This is the body text</em>
</blockquote>
```

**Files:** `Web-2-Notion/scanWebpage.js`

### 3. itemgroup Content Extracted From Lists (Critical Bug) ✅

**Problem:** After unwrapping itemgroups, their block-level children (paragraphs, tables, etc.) were being extracted from list items and moved to the end of the page, breaking semantic structure.

**Root Cause:**

1. itemgroup unwrapping puts block elements (`<p>`, `<table>`) directly in `<li>`
2. Separate code extracts ALL block elements from list items (to prevent code block formatting)
3. This extraction didn't distinguish itemgroup content that should stay nested

**Solution:**

- Mark itemgroup children with `data-itemgroup-content="true"` before unwrapping
- Skip marked elements during block extraction phase
- Content stays properly nested in its parent list item

**Example:**

```html
<!-- BEFORE (broken): -->
<ol>
  <li>Step 9</li>
  <li>Step 10</li>
</ol>
<table>
  ...itemgroup table moved here...
</table>

<!-- AFTER (fixed): -->
<ol>
  <li>
    Step 9
    <p data-itemgroup-content="true">Info text</p>
    <table data-itemgroup-content="true">
      ...stays nested...
    </table>
  </li>
  <li>Step 10</li>
</ol>
```

**Files:** `Web-2-Notion/scanWebpage.js` (unwrapping and extraction logic)

**Test:** `test/test-itemgroup-nesting.js` ✅ PASSING

## Final Processing Order

```
1. Parse HTML with DOMParser
2. Apply custom format rules (bold, italic, etc.)
3. Unwrap problematic containers:
   - ALL div.itemgroup - unwrapped, children MARKED with data-itemgroup-content
   - div.note__body, div.note__title - unwrapped
4. Convert semantic elements:
   - div.note → blockquote
5. Extract block elements from list items (SKIP marked itemgroup content)
6. Clean up whitespace (preserving inline element spacing)
```

## Testing

### Inline Images

Manual testing on target sites required.

### Custom Format Rules

**Test:** `test/test-note-formatting-order.js` ✅ PASSING

Verifies:

- Format rules applied before unwrapping
- note\_\_title wrapped in `<strong>`
- note\_\_body wrapped in `<em>`
- Both preserved in blockquote

### itemgroup Nesting

**Test:** `test/test-itemgroup-nesting.js` ✅ PASSING

Verifies:

- itemgroup children marked with data-itemgroup-content
- Marked elements NOT extracted from list items
- Tables and paragraphs stay nested in correct list item
- Content order preserved

## Version

Manifest version: **5.0.7**

**Changes from 5.0.6:**

- Fixed inline images being removed (4 locations in main.js)
- Fixed custom format rules applied after unwrapping (scanWebpage.js)
- Fixed itemgroup content extracted from lists (scanWebpage.js - marking system)
