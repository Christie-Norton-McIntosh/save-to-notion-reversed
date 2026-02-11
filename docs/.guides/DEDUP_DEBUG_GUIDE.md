# Deduplication Debug Guide

## ⚠️ CRITICAL: Console Crash Prevention

**The console is crashing because there are 100+ console.log statements in scanWebpage.js!**

### **IMMEDIATE FIX NEEDED**

You need to gate ALL console.log statements behind a debug flag. I've started adding `DEBUG_SCANWEBPAGE` checks, but there are too many to fix manually.

### **Recommended Solution**

Use a find-and-replace regex in your editor:

1. Open `scanWebpage.js` in VS Code
2. Press `Cmd+H` (Mac) or `Ctrl+H` (Windows)
3. Enable regex mode (click the `.*` button)
4. Find: `(\s+)console\.log\(`
5. Replace: `$1if (DEBUG_SCANWEBPAGE) console.log(`
6. Click "Replace All" for lines 14500-15300 (the retry loop section)

This will gate all logs in the retry loop (which runs 60 times!) behind the debug flag.

### Update (fixed in-code)

Important: the extension now ships a safe, built-in log cap to prevent console crashes. Behavior:

- When `window.__STN_DEBUG` (aka `DEBUG_SCANWEBPAGE`) is false (default) non-critical logs are capped to ~300 lines.
- To see full, unthrottled logs enable debug mode (below). This is the supported way to diagnose high-volume issues.

Commands:

- Enable full verbose logs: `window.__STN_DEBUG = true` then reload the page.
- Reset the per-scan log counter (if you need to re-run without reloading): `console.__stn_resetScanLog()`
- If you must see the native logger directly: `console.__stn_originalLog('message')` (use sparingly).

Because of the cap, you should no longer see console crashes. If you still do, enable `window.__STN_DEBUG` and repro so the full logs are available for investigation.

### **Alternative: Disable All Logging**

Add this at the top of the `scanWebpage()` function (around line 14488):

```javascript
// Disable verbose logging to prevent console crash
const originalConsoleLog = console.log;
console.log = () => {}; // Disable all logging

// ... rest of function ...

// Re-enable at the end (around line 15300):
console.log = originalConsoleLog;
```

## Quick Reference

Once logging is properly gated, you'll only see these key lines:```
[scanWebpage:DEDUP] 🔍 Selector: ".body.conbody, .body.refbody..." | Multiple: true
[scanWebpage:DEDUP] 🚀 Starting deduplication for X elements from Y selectors
[scanWebpage:DEDUP] Found: X | Added: Y | Skipped: Z
[scanWebpage:DEDUP] ✓ Removed Z duplicates

```

**That's it!** Just 4 lines total instead of 4000+.

**⚠️ IMPORTANT**: Deduplication only runs when you have **multiple selectors separated by commas**.

## Selector Format Matters!

The deduplication logic **only activates** when your custom selectors contain a comma (`,`).

### ✅ Correct Format (Deduplication WILL Run)

```

.body.conbody, .body.refbody, .related-links

````

The extension will find all elements matching each selector and remove duplicates.

### ❌ Wrong Format (Deduplication WON'T Run)

If you store selectors as separate array entries **without commas**, deduplication won't work:

```javascript
// Storage format - each selector is separate
["body.conbody", ".body.refbody", ".related-links"];
````

The extension joins these with commas internally, so you should see commas in the console log:

```
[scanWebpage] Using selector(s): .body.conbody, .body.refbody, .related-links
```

If you don't see commas in that log, deduplication won't run!

## What the Numbers Mean

- **Found**: Total elements matched by all selectors
- **Added**: Unique elements added to the page
- **Skipped**: Duplicate elements that were removed

## Enable Detailed Logging

If you need to debug duplicate detection issues, enable verbose logging:

1. Open browser console (F12 or Cmd+Option+J)
2. Run this command:
   ```javascript
   window.__STN_DEBUG_DEDUP = true;
   ```
3. Reload the page or trigger content capture again
4. You'll now see detailed logs for each element:

   ```
   [scanWebpage:DEDUP] 🔍 Checking 1.1: DIV.body conbody
   [scanWebpage:DEDUP] ✅ ADD 1.1: DIV (total: 1)
   [scanWebpage:DEDUP] 🔍 Checking 1.2: IMG.
   [scanWebpage:DEDUP] ⚠️ SKIP (signature) 1.2: IMG
   ```

   Note: when automatic deduplication cannot detect duplicates earlier in the pipeline
   we run a final, best-effort pass on the HTML that will be sent to the parser. Look for
   these additional messages when diagnosing:

   ```
   [scanWebpage:DEDUP] Final HTML dedup applied — removed N duplicates
   [scanWebpage:DEDUP] Relaxed dedup removed M elements
   ```

   If you still don't see dedup messages but duplicates appear in the saved content,
   enable full verbose logging and repro so we can capture the element signatures:

   ```
   window.__STN_DEBUG = true;
   window.__STN_DEBUG_DEDUP = true;
   console.__stn_resetScanLog();
   // then trigger the capture
   ```

## Disable Detailed Logging

To go back to minimal logging:

```javascript
window.__STN_DEBUG_DEDUP = false;
```

Or just reload the page (it defaults to `false`).

## Quick: collect a minimal, copy-pasteable dedup report

Use this when duplicates appear but you don't want to paste thousands of console lines.

1. Open the page that reproduces the problem.
2. Open DevTools Console and run one of the following:

- Recommended (runs the built-in instrument and prints a compact JSON block you can paste):

  await window.\_\_stn_collectDedupReport()

- One-liner (copies the same report and prints it between bracketed markers):

  (async()=>{const r=await window.**stn_collectDedupReport(); console.**stn_originalLog(r)})()

3. Copy everything between the markers that look like:

   <<<STN-DEDUP-xxxxxxxx:BEGIN>>>
   { ... JSON ... }
   <<<STN-DEDUP-xxxxxxxx:END>>>

4. Paste that block here — it contains the selectors used, small element samples, and any duplicate signatures found. That is exactly what I need to finish-tune the signatures.

Why use this: the report is intentionally small (samples + signatures) and bypasses the log-cap so you won't hit the console limit.

## Console Log Keys to Look For

When reporting issues, please include these specific console messages:

### Key Messages to Copy

**Main Summary (always shown):**

```
[scanWebpage:DEDUP] Found: X | Added: Y | Skipped: Z
```

**Selector Information:**

```
[scanWebpage] Searching for: ".your-selector"
[scanWebpage]   Document matches: X
[scanWebpage]   Shadow DOM matches: Y
```

**If detailed logging enabled:**

```
[scanWebpage:DEDUP] 🔍 Checking X.Y: TAGNAME.classname
[scanWebpage:DEDUP] ⚠️ SKIP (signature) - duplicate by content
[scanWebpage:DEDUP] ⚠️ SKIP (nested) - contained in parent
[scanWebpage:DEDUP] ⚠️ REPLACE child with parent - parent contains child
[scanWebpage:DEDUP] ✅ ADD - unique element added
```

## Example Good Console Output

```
[scanWebpage] Searching for: ".body.conbody"
[scanWebpage]   Document matches: 0
[scanWebpage]   Shadow DOM matches: 1
[scanWebpage] Searching for: ".body.refbody"
[scanWebpage]   Document matches: 0
[scanWebpage]   Shadow DOM matches: 1
[scanWebpage] Searching for: ".related-links"
[scanWebpage]   Document matches: 0
[scanWebpage]   Shadow DOM matches: 1
[scanWebpage:DEDUP] Found: 3 | Added: 3 | Skipped: 0
```

## Example Output with Duplicates

```
[scanWebpage] Searching for: ".body.conbody"
[scanWebpage]   Document matches: 2
[scanWebpage] Searching for: ".body.refbody"
[scanWebpage]   Document matches: 2
[scanWebpage:DEDUP] Found: 4 | Added: 2 | Skipped: 2
[scanWebpage:DEDUP] ✓ Removed 2 duplicates
```

## Troubleshooting

### "Found: X | Added: X | Skipped: 0" but I still see duplicates

This means:

- The duplicate detection logic isn't finding duplicates
- Elements might have different signatures (content, structure, or attributes)
- Enable detailed logging to see what's being compared

### "Found: X | Added: 0 | Skipped: 0"

This means:

- No content is being captured at all
- Check that your selectors are correct
- Look for earlier console messages about selector searches

### Console still crashing

If even the minimal logging crashes your console:

1. Check how many selectors you have configured
2. Try reducing the number of selectors
3. Check if the page has thousands of matching elements
4. Consider using more specific selectors

## Performance Tips

- Use specific selectors that match fewer elements
- Avoid overly broad selectors like `div` or `.content`
- Combine related selectors when possible
- Test selectors in DevTools before adding them to the extension
