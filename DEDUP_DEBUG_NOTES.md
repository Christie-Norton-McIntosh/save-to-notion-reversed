# Deduplication Debugging Notes

## Session Objective

Eliminate nested/root duplicate content blocks in captured content from ServiceNow documentation pages.

## Changes Made in This Session (to scanWebpage.js)

### 1. Load Marker & Entry Logging (lines ~8-19, ~14500-14504)

- Added IIFE load marker with timestamp, href, extensionId (stringified)
- Added scanWebpage() entry log with stringified href
- **Purpose**: Confirm script loads and executes
- **Status**: Working - logs appear in console

### 2. Multi-Selector Support Restoration (lines ~70-132)

- Added `normalizeSelectorEntries()` helper function
- Handles string, array, or object selector configs
- Splits comma-separated selectors
- Added `findFirstMatch()` helper to search all normalized selectors
- **Purpose**: Fix selector config array format incompatibility
- **Status**: Working - multi-selector configs load properly

### 3. Wrapper Pruning Pass (lines ~14842-14895)

- Added `pruneRedundantWrappers()` function
- Removes parent elements when child has ≥90% text overlap
- Runs pre-parse on htmlToProcess DOM
- **Purpose**: Remove nested wrapper duplicates
- **Status**: Working - removes 3 wrappers per console log
- **Result**: Logs "Pruned 3 redundant wrapper elements before parsing"

### 4. Sibling Duplicate Removal (lines ~14897-14936)

- Added `removeDuplicateSiblings()` function
- Tag-aware: only compares siblings with same nodeName
- Removes later siblings with identical normalized text
- Runs pre-parse on htmlToProcess DOM
- **Purpose**: Remove duplicate sibling blocks
- **Status**: Working but finds nothing - logs "nothing to remove"

### 5. Post-Parse Aggressive Dedup (lines ~14411-14449)

- Added in `parseFromHtml()` after cleanify
- Queries div/section/article/p/table/ul/ol in final HTML
- Tracks normalized text ≥80 chars in Set
- Removes exact duplicate text blocks
- **Purpose**: Catch remaining duplicates after parsing
- **Status**: Working - checked 46 elements, skipped 19 short, removed 0 duplicates, kept 27 unique
- **Result**: No exact text matches found

### 6. Logging Improvements

- Stringified metadata objects with JSON.stringify
- Added try-catch with error logging to dedup passes
- Added detailed diagnostics (candidate count, skipped count, removed count)
- **Purpose**: Make debug output visible and detailed
- **Status**: Working - all logs appear correctly

## Test Results (ServiceNow docs page)

```
[scanWebpage] Loaded content script { "ts": "...", "href": "...", "extensionId": "..." }
[scanWebpage] scanWebpage() invoked { "href": "..." }
[scanWebpage] Prune pass starting (nesting dedup)
[scanWebpage] Pruned 3 redundant wrapper elements before parsing
[scanWebpage] Duplicate sibling pass: nothing to remove
[scanWebpage] Post-parse dedup starting...
[scanWebpage] Post-parse dedup found 46 candidates to check
[scanWebpage] Post-parse dedup: checked 46 elements, skipped 19 short, removed 0 duplicates, kept 27 unique
```

## Current Status

- ✅ All three dedup passes running and logging
- ✅ Wrapper prune removes 3 elements
- ❌ Sibling dedup finds nothing
- ❌ Post-parse dedup finds no exact duplicates
- ❌ User still sees duplicates in captured content (per screenshot)

## Hypothesis - UPDATED

**Primary suspect: clipContent.js `buildContentFromSelectors()`**

The duplicates may be caused by:

1. **Multiple selector matches** - If the selector config has multiple entries, each one extracts content and they're combined with header markers
2. **Selector overlap** - Different selectors may match overlapping content regions
3. **Two-stage extraction** - clipContent.js does initial extraction with dedup, then scanWebpage.js processes it again
4. **Embedded format handling** - The `embeddedPostFormat` flag adds formatting/wrappers that might duplicate structure

**Test needed:**

- Check if ServiceNow page has multiple selectors configured
- Enable clipContent.js debug mode: `window.__STN_DEBUG_DEDUP = true` in console
- Compare clipContent.js dedup logs with scanWebpage.js dedup logs
- Check if duplicates are coming from selector combination vs. actual nested content

**Alternative rollback points:**

- Commit **8b7ebba**: "Enhance custom site selector handling" (major/v5.0.0-update)
  - This is where selector format changes were introduced
  - May be the source of duplication issues
- Commit **45b001a**: Merge feature/site-selectors-button
- Commit **4b999ee**: Merge branch 'major/v5.0.0-update'

Remaining duplicates likely have **text variations** (whitespace, metadata, nested content) that prevent exact matching. Need either:

1. Fuzzy matching (Levenshtein distance, similarity threshold)
2. Substring/prefix detection
3. Different element selection strategy
4. **OR investigate other files** - serviceWorker.js may be involved in content flow

## Git History Context

- Current HEAD: 2f87e3b (restore-2026-01-28-234034)
- Earlier rollback point: 69296ea (not visible in recent log)
- Major update branch: major/v5.0.0-update (commit 8b7ebba)
  - Enhanced custom site selector handling
  - Support for both string and object formats
  - Added format metadata for specific domains

## Files to Investigate

### Web-2-Notion/serviceWorker.js

- Line 2265: Comment about "Related Links" heading added in scanWebpage.js
- Line 5950: Injects scanWebpage.js via `mn()` function
- Line 6619: scanWebpage function definition
- Line 6912: Cache check for embedded format metadata
- Line 2265: **DISABLED callout wrapper** for collection pages - "Now that we add a 'Related Links' heading in scanWebpage.js before embedded selector content, we don't need a callout wrapper"

### Web-2-Notion/clipContent.js ⚠️ MAJOR CHANGES

**449 lines added** since commit 69296ea!

Key changes found:

1. **buildContentFromSelectors()** - NEW function that:
   - Processes array of selector entries
   - Extracts content for each selector
   - **Combines multiple selector results** with header markers: `<div data-stn-selector-block>Selector #${idx + 1}</div>`
   - Returns combined content with `embeddedPostFormat` flag

2. **extractContentData() dedup logic** - NEW:
   - Tracks seen elements via signature (getElementSignature)
   - Checks for exact duplicates by signature
   - Checks for nested containment (isContainedInAny)
   - Checks for parent-child relationships (containsAnyAdded)
   - Logs: `[extractContentData:DEDUP] Found: X | Added: Y | Skipped: Z`
   - Has DEBUG_DEDUP flag: `window.__STN_DEBUG_DEDUP = true`

3. **continueWithContentSelection()** - Modified:
   - Now accepts `embeddedPostFormat` parameter
   - Sets `highlightFormat: "callout"` and `calloutIcon: "📎"` when embedded

4. **Selector format support**:
   - Array format: `[{selector: "...", embeddedPostFormat: true}, ...]`
   - String format: `"selector"`
   - Object format: `{selector: "...", embeddedPostFormat: true}`

### Web-2-Notion/parseMetaTags.js

- Not in diff output (no changes since 69296ea)

---

## ROOT CAUSE IDENTIFIED ✅

**File: clipContent.js → `buildContentFromSelectors()` (lines 3118-3175)**

### The Problem:

1. ServiceNow has selector configured: `{ selector: ".related-links", customHeading: "Related Links" }`
2. When content is extracted via `buildContentFromSelectors()`:
   - If `.related-links` is found → extracts only that content
   - If `.related-links` is NOT found → **FALLBACK** extracts entire page with `extractContentData(rootElement, null)`
3. The fallback captures EVERYTHING including:
   - Main article content
   - Related links section (if it exists but wasn't matched)
   - Both together = **duplicates**!

### Code Flow Problem:

```javascript
function buildContentFromSelectors(rootElement, selectorEntries = []) {
  const results = [];

  selectorEntries.forEach((entry) => {
    const data = extractContentData(rootElement, entry.selector);
    if (data) results.push(data);
  });

  // ⚠️ THE PROBLEM:
  if (results.length === 0) {
    const fallback = extractContentData(rootElement, null); // ← Extracts EVERYTHING
    if (fallback) return fallback;  // Including content that might overlap with selectors
  }

  // If multiple selectors found, combines them with headers
  const combinedContent = results.map((item, idx) => {
    const header = results.length > 1
      ? `<div data-stn-selector-block>Selector #${idx + 1}</div>`
      : "";
    return `${header}${item.content}`;
  }).join("\n\n");

  return { content: combinedContent, ... };
}
```

### Solution Options:

**Option A: Remove fallback** (simplest, safest)

- If selector doesn't match, return null instead of extracting everything
- Forces user to fix selector config if it's wrong
- Prevents over-extraction and duplicates

**Option B: Make fallback smarter**

- Exclude already-extracted regions from fallback
- More complex but preserves user experience
- Risk of missing edge cases

**Option C: Add dedup after fallback**

- Keep fallback but remove overlapping content
- Similar to what we tried in scanWebpage.js
- Still risky if text varies slightly

### Recommended Fix: Option A + Diagnostic Logging

1. Add console warning when selector not found
2. Remove the fallback to prevent over-extraction
3. Return null if no selectors match (let user fix config)

---

## Current Status

- ✅ **scanWebpage.js restored** to original state from earlier today
  - All debugging changes safely stashed: `git stash apply stash@{0}` to restore
- ✅ **Root cause identified** in clipContent.js `buildContentFromSelectors()` fallback logic
- ✅ **Selector config found**: ServiceNow uses `.related-links` selector
- ⏳ **Next step:** Fix clipContent.js fallback to prevent duplicate extraction

## Next Steps

1. ~~Check serviceWorker.js for post-processing~~ ✓ Checked - not the issue
2. ~~Review git diff between current and 69296ea~~ ✓ Done - found 449 lines added to clipContent.js
3. **Fix clipContent.js fallback logic** ← Current task
4. Test on ServiceNow page to verify duplicates are gone
