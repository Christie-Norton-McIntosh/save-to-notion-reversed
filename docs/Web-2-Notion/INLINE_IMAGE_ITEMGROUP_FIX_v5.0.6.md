# Inline Image Preservation & Custom Format Rule Order Fix - Version 5.0.6

## Date

February 6, 2026

## Issues Fixed

### 1. Inline Images Being Removed (Critical Bug)

**Problem:** Images were being preserved with `data-stn-preserve` attribute and wrapped in `span.stn-inline-image`, but then the entire parent anchor was being removed immediately after, causing images to disappear completely.

**Root Cause:**

- Image preservation logic created wrapper correctly ✅
- BUT then removed parent anchor in two scenarios:
  1. When image had no alt text (lines ~91120-91137)
  2. When image had invalid URL (lines ~91140-91160)
- This happened in TWO locations:
  - First table processing instance (tableWithoutHeading)
  - Second table processing instance (tableWithHeading)

**Solution:**
Added check for preserved images before removing anchors:

```javascript
var hasPreservedImage = parentAnchor.querySelector(
  'img[data-stn-preserve="1"], .stn-inline-image',
);
if (!hasPreservedImage) {
  parentAnchor.remove();
}
// If has preserved image, keep the anchor
```

**Files Modified:**

- `Web-2-Notion/popup/static/js/main.js` (4 locations fixed)

### 2. Custom Format Rules Applied After Unwrapping (Critical Bug)**Solution:**

1. Convert `div.itemgroup.info` to `<blockquote>` elements (preserved as callouts in Notion)
2. Keep unwrapping logic for regular `div.itemgroup` (without `.info` class)
3. Use selector `:not(.info)` to exclude info elements from unwrapping

```javascript
// 1. Convert div.itemgroup.info to blockquote
const itemgroupInfoElements = doc.querySelectorAll("div.itemgroup.info");
itemgroupInfoElements.forEach((el) => {
  const blockquote = doc.createElement("blockquote");
  while (el.firstChild) {
    blockquote.appendChild(el.firstChild);
  }
  el.parentNode.replaceChild(blockquote, el);
});

// 2. Unwrap regular itemgroups (not .info)
const itemgroupElements = doc.querySelectorAll("div.itemgroup:not(.info)");
// ... existing unwrap logic
```

**Files Modified:**

- `Web-2-Notion/scanWebpage.js` (lines ~14675-14720)

**Code Markers Added:**

- `⚠️ BUG FIX v5.0.6: itemgroup.info should be preserved as callouts, not unwrapped`

### 3. Custom Format Rules Applied After Unwrapping (Critical Bug)

**Problem:** Custom selector formatting rules (e.g., making `.note__title` bold, `.note__body` italic) were being applied AFTER the elements were unwrapped, so the selectors never matched and formatting was never applied.

**Root Cause:**
The processing order was:

1. Unwrap `note__title` and `note__body` (removes the divs with classes) ❌
2. Try to apply format rules to `.note__title` and `.note__body` (but they're gone!) ❌
3. Convert `div.note` to blockquote

**Solution:**
Reordered the processing to apply custom format rules FIRST:

1. ✅ Apply custom format rules (finds `.note__title`, wraps content in `<strong>`)
2. ✅ Unwrap `note__title` and `note__body` (removes divs but keeps `<strong>` and `<em>`)
3. ✅ Convert `div.note` to blockquote (now contains formatted content)

**Result:**

```html
<!-- BEFORE (broken): -->
<blockquote>Important Title This is the body text</blockquote>

<!-- AFTER (fixed): -->
<blockquote>
  <strong>Important Title</strong>
  <em>This is the body text</em>
</blockquote>
```

**Files Modified:**

- `Web-2-Notion/scanWebpage.js` (moved format rule application to BEFORE unwrapping)

**Code Changes:**

- Moved entire format rule loop (~100 lines) to execute before unwrapping
- Added comments: "Step 1: Apply custom format rules FIRST", "Step 2: Unwrap containers AFTER format rules"
- Removed duplicate format rule code that was executing too late

**Code Markers Added:**

- `⚠️ CRITICAL: Apply custom format rules FIRST before unwrapping elements`

## Issues Fixed

### 1. Inline Images Being Removed (Critical Bug)

**Problem:** Images were being preserved with `data-stn-preserve` attribute and wrapped in `span.stn-inline-image`, but then the entire parent anchor was being removed immediately after, causing images to disappear completely.

**Root Cause:**

- Image preservation logic created wrapper correctly ✅
- BUT then removed parent anchor in two scenarios:
  1. When image had no alt text (lines ~91120-91137)
  2. When image had invalid URL (lines ~91140-91160)
- This happened in TWO locations:
  - First table processing instance (tableWithoutHeading)
  - Second table processing instance (tableWithHeading)

**Solution:**
Added check for preserved images before removing anchors:

```javascript
var hasPreservedImage = parentAnchor.querySelector(
  'img[data-stn-preserve="1"], .stn-inline-image',
);
if (!hasPreservedImage) {
  parentAnchor.remove();
}
// If has preserved image, keep the anchor
```

**Files Modified:**

- `Web-2-Notion/popup/static/js/main.js` (4 locations fixed)

### 2. itemgroup.info Flattening Issue

**Problem:** Elements with class `itemgroup info` were being unwrapped (wrapper removed, children moved to parent), but this caused issues:

- Lost semantic meaning of "info" callouts
- Content ordering issues in nested structures
- No visual distinction for important information

**Root Cause:**
The selector `div.itemgroup` matched ALL itemgroups including `.info` ones, which should be treated differently. In documentation systems (like ServiceNow), `.info` classes represent information callouts that should be preserved as distinct blocks.

**Solution:**

1. Convert `div.itemgroup.info` to `<blockquote>` elements (preserved as callouts in Notion)
2. Keep unwrapping logic for regular `div.itemgroup` (without `.info` class)
3. Use selector `:not(.info)` to exclude info elements from unwrapping

```javascript
// 1. Convert div.itemgroup.info to blockquote
const itemgroupInfoElements = doc.querySelectorAll("div.itemgroup.info");
itemgroupInfoElements.forEach((el) => {
  const blockquote = doc.createElement("blockquote");
  while (el.firstChild) {
    blockquote.appendChild(el.firstChild);
  }
  el.parentNode.replaceChild(blockquote, el);
});

// 2. Unwrap regular itemgroups (not .info)
const itemgroupElements = doc.querySelectorAll("div.itemgroup:not(.info)");
// ... existing unwrap logic
```

**Files Modified:**

- `Web-2-Notion/scanWebpage.js` (lines ~14675-14720)

**Code Markers Added:**

- `⚠️ BUG FIX v5.0.6: itemgroup.info should be preserved as callouts, not unwrapped`

## Testing

### Inline Image Tests

Manual testing required:

1. Load extension and test on pages with inline images in anchors
2. Verify images remain as children of anchors
3. Verify `[alt text]` placeholder appears in markdown
4. Verify hidden `img[data-stn-preserve="1"]` remains in DOM

### itemgroup.info Tests

Created: `tests/test-itemgroup-info-blockquote.js`

**Test Results:**

- ✅ TEST 1: itemgroup.info in list becomes blockquote
- ✅ TEST 2: Regular itemgroup unwrapped correctly
- ✅ TEST 3: Both types handled correctly together
- ✅ TEST 4: Nested lists with itemgroup.info preserved

Run with:

```bash
node tests/test-itemgroup-info-blockquote.js
```

### Custom Format Rule Order Tests

Created: `tests/test-note-formatting-order.js`

**Test Results:**

- ✅ Custom format rules applied BEFORE unwrapping
- ✅ note\_\_title wrapped in `<strong>`
- ✅ note\_\_body wrapped in `<em>`
- ✅ Both preserved inside `<blockquote>`
- ✅ Correct order maintained

Run with:

```bash
node tests/test-note-formatting-order.js
```

Output shows:

```html
<blockquote>
  <strong>Important Title</strong>
  <em>This is the body text</em>
</blockquote>
```

## Version Update

- **Previous:** 5.0.5
- **Current:** 5.0.6
- **manifest.json** updated

## Impact Assessment

### Inline Image Fix

**Risk:** Low - Added safety check that prevents removal of anchors with preserved images  
**Breaking:** No - Only prevents incorrect removal, doesn't change happy path  
**Benefit:** Critical - Fixes complete loss of inline images

### itemgroup.info Fix

**Risk:** Low - Changes only `.info` itemgroups, regular ones unchanged  
**Breaking:** Potentially - If users relied on `.info` being unwrapped, they'll now get blockquotes  
**Benefit:** High - Preserves semantic meaning and visual distinction for info callouts

### Custom Format Rule Order Fix

**Risk:** Low - Only changes execution order, same logic runs  
**Breaking:** No - Actually FIXES previously broken behavior  
**Benefit:** Critical - Enables custom selector formatting for note**title, note**body, and similar patterns  
**Impact:** Any custom format rules that target elements that get unwrapped will now work correctly

## Related Files

- `Web-2-Notion/popup/static/js/main.js` - Image preservation logic
- `Web-2-Notion/scanWebpage.js` - HTML formatting, element conversion, and custom format rules
- `Web-2-Notion/manifest.json` - Version number
- `tests/test-itemgroup-info-blockquote.js` - itemgroup.info regression tests
- `tests/test-note-formatting-order.js` - Custom format rule order tests
- `tests/DIAGNOSTIC_ITEMGROUP_UNWRAP.js` - Diagnostic tool

## Next Steps

1. Manual testing of inline images on target sites (e.g., servicenow.com)
2. Verify blockquote rendering in Notion looks correct for info callouts
3. Test custom selector formatting with note**title and note**body
4. Monitor for any edge cases with nested itemgroup structures

## Notes

- All three fixes maintain backward compatibility with previous behavior
- Inline image fix prevents data loss (critical)
- itemgroup.info fix improves semantic preservation (enhancement)
- Custom format rule order fix enables previously broken functionality (critical)
- No conflicts with previous version 5.0.5 changes (abbr spacing fixes)
- Processing order is now: Format Rules → Unwrap → Whitespace Cleanup
