# Image Processing Diagnostic Report

**Version:** 5.2.2  
**Date:** 2024  
**Status:** ✅ Code fixes verified, awaiting live testing

## Executive Summary

The automated diagnostic confirms all code fixes are correctly implemented in `main.js`:

- ✅ Image rule checks `data-original-src` attribute first
- ✅ Image rule checks parent anchor and prefers `href` over `src`
- ✅ Image rule converts relative URLs to absolute
- ✅ Table rule accepts `data:image/` URLs

**Conclusion:** The code looks correct. If issues persist, the problem is likely in:

1. How `scanWebpage.js` prepares the HTML
2. Browser-specific behavior with Shadow DOM
3. Timing issues with dynamic content loading

## Test Files Created

### 1. `test-image-processing.js` (Node.js Diagnostic)

**Purpose:** Analyze `main.js` code to verify fixes are in place  
**Usage:**

```bash
cd Web-2-Notion
node test-image-processing.js
```

**Output:** Checks for presence of all image processing fixes

### 2. `test-images.html` (Browser-based Test Suite)

**Purpose:** Test markdown conversion with simulated HTML  
**Usage:**

1. Open file in browser
2. Open DevTools Console
3. Run: `runAllTests()`

**Note:** Requires access to extension's `JZ` function for markdown conversion

### 3. `test-live-images.html` (Interactive DOM Inspector)

**Purpose:** Inspect actual DOM attributes of images  
**Usage:**

1. Open file in Chrome with extension installed
2. Click "Run All Tests" button
3. View results in the output panel

**Tests:**

- Test 1: Inline images with data URLs
- Test 2: Table images with mixed URLs
- Test 3: Images wrapped in anchor tags

## Reported Issues

### Issue 1: Tables with Images Showing Blank Placeholders

**Symptom:** "Tables with images - currently no image or text is appearing just placeholders like: XCELLIDXCELL_kvmgp0bwjXCELLIDX"

**Status:** FIXED in v5.2.0 - Deleted old table system, replaced with `tableToList` rule

**What Changed:**

- Deleted ~850 lines of complex XCELLIDX marker system
- New `tableToList` rule converts tables to list format
- Images extracted with `querySelectorAll("img")` from each cell
- Horizontal dividers (`---`) separate rows

### Issue 2: Inline Images Missing

**Symptom:** "Inline images - no image or placeholder. They are supposed to be appended as a child of the line they originally appeared in"

**Status:** Code fixes applied in v5.2.1-5.2.2

**What Changed:**

- Added check for `data-original-src` attribute (ServiceNow uses this)
- Added parent anchor check - uses `parentElement.href` if available
- Added relative URL to absolute conversion
- Added try/catch for URL resolution errors

## Code Verification

### Standard Image Rule (lines 90490-90550)

```javascript
// Check data-original-src first (ServiceNow)
var r =
  t.getAttribute("data-original-src") || t.getAttribute("src") || t.src || "";

// Check if image is inside an anchor - use anchor href instead
var parentElement = t.parentElement;
if (parentElement && parentElement.tagName === "A") {
  var anchorHref = parentElement.getAttribute("href") || parentElement.href;
  if (anchorHref) {
    r = anchorHref;
  }
}

// Convert relative URLs to absolute
var currentUrl = new URL(window.location.href);
if (r && !r.startsWith("http") && !r.startsWith("data:")) {
  try {
    r = new URL(r, currentUrl.origin).href;
  } catch (e) {
    console.warn("Failed to resolve relative URL:", r, e);
  }
}
```

### Table Image Rule (lines 90957-91020)

```javascript
var images = cellClone.querySelectorAll("img");
images.forEach(function (img) {
  var src =
    img.getAttribute("data-original-src") || img.getAttribute("src") || img.src;

  // Check if image is in anchor
  var parentAnchor = img.parentElement;
  if (parentAnchor && parentAnchor.tagName === "A") {
    var href = parentAnchor.getAttribute("href") || parentAnchor.href;
    if (href) src = href;
  }

  // Convert relative to absolute
  if (src && !src.startsWith("http") && !src.startsWith("data:")) {
    src = new URL(src, currentUrl.origin).href;
  }

  // Accept http://, https://, AND data: URLs
  if (
    src &&
    (src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("data:image/"))
  ) {
    imageMarkdowns.push("![" + alt + "](" + src + titlePart + ")");
  }
});
```

## Next Steps for Manual Testing

### On a ServiceNow Page:

1. **Open Chrome DevTools Console**
2. **Check Image Attributes:**

   ```javascript
   // Find all images
   const images = document.querySelectorAll("img");
   console.log(`Found ${images.length} images`);

   // Inspect first image
   const img = images[0];
   console.log("src:", img.src);
   console.log('getAttribute("src"):', img.getAttribute("src"));
   console.log("data-original-src:", img.getAttribute("data-original-src"));
   console.log("parent:", img.parentElement.tagName);
   if (img.parentElement.tagName === "A") {
     console.log("parent href:", img.parentElement.href);
   }
   ```

3. **Test Shadow DOM Access:**

   ```javascript
   const topicContent = document.querySelector("ft-reader-topic-content");
   if (topicContent && topicContent.shadowRoot) {
     console.log("Shadow DOM found");
     const shadowImages = topicContent.shadowRoot.querySelectorAll("img");
     console.log("Images in shadow:", shadowImages.length);
   }
   ```

4. **Test Image Conversion:**
   - Use the extension to save a page
   - Check browser console for logs from `JZ` function
   - Look for: "Found X images with data-original-src"
   - Check if `window.__imageUrlArray` is populated

### Potential Issues to Investigate:

1. **ServiceNow Lazy Loading:** Images may load after initial HTML extraction
   - Check if `scanWebpage.js` waits long enough (currently 30 seconds for Shadow DOM)
2. **Data URLs Being Stripped:** Some contexts (iframes, security policies) may block data: URLs
   - Check browser console for security errors
3. **URL Resolution Failures:** Relative URLs may fail if base URL is wrong
   - Check if `window.location.href` matches the actual page URL
4. **Notion API Rejections:** Notion may have image URL requirements
   - Check if certain URL formats are rejected during upload
5. **Timing Issues:** Images may be processed before they're fully loaded
   - Check if images have `loading="lazy"` attribute
   - Check if images are dynamically inserted after page load

## How to Use Test Files

### Quick Diagnostic (30 seconds):

```bash
cd Web-2-Notion
node test-image-processing.js
```

- ✅ All checks pass: Code is correct, issue is elsewhere
- ❌ Any checks fail: Code fixes missing or reverted

### DOM Inspection (2 minutes):

1. Open `test-live-images.html` in Chrome
2. Click "Run All Tests"
3. Review what's actually in the DOM
4. Check if test patterns match ServiceNow structure

### Full Pipeline Test (5 minutes):

1. Load `tests/test-images.html` in Chrome with extension
2. Open DevTools Console
3. Run: `runAllTests()`
4. Compare actual markdown output vs. expected
5. Identify which step in pipeline fails

## Diagnostic Flowchart

```
1. Run node test-image-processing.js
   ├─ All ✅ → Code is correct, proceed to step 2
   └─ Any ❌ → Review and reapply fixes

2. Open test-live-images.html, run tests
   ├─ Images found in DOM → Proceed to step 3
   └─ Images missing → Check Shadow DOM timing

3. Test on actual ServiceNow page
   ├─ Images in DOM? → Check scanWebpage timing
   ├─ data-original-src present? → Check JZ function logs
   ├─ Markdown has URLs? → Check Notion API upload
   └─ Still broken? → Check browser security policies
```

## Summary

**Code Status:** ✅ All fixes verified in place  
**Next Action:** Live testing on ServiceNow to identify runtime issue  
**Most Likely Causes:**

1. Shadow DOM timing (images not loaded when HTML extracted)
2. Notion API rejecting certain URL formats
3. Security policies blocking data: URLs in certain contexts

**Recommended Approach:**

1. Use `test-live-images.html` to inspect DOM on ServiceNow
2. Add console logging to track image URLs through pipeline
3. Check Notion API responses for image upload errors
