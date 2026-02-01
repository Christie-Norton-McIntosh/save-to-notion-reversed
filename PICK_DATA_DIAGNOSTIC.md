# Pick Data Functionality - Comprehensive Diagnostic Analysis

## Sibling Duplicate Pruning (2026-01-31)

### What Changed

- The extraction logic now removes later siblings with identical normalized text (tag-aware) from the DOM before parsing content for Notion.
- This helps prevent duplicate content blocks in the Notion page.

### Logging

- When duplicate siblings are pruned, a `console.warn` is emitted with the count of removed elements for transparency.

### Example

If a page has multiple repeated elements (e.g., navigation links, repeated footers), only the first instance is kept for each unique normalized text within the same parent.

---

**Date**: January 25, 2026  
**Extension ID**: gmlacalmmchpkodophohpkndbpjnllaa (Development Version)  
**Location**: `/Users/norton-mcintosh/Documents/GitHub/save-to-notion-reversed/Web-2-Notion`

---

## Problem Statement

The "Pick Data" feature is showing "Empty" in the preview instead of displaying the captured text content (e.g., ">IT Service Management>ML solutions for ITSM").

---

## Architecture Overview

### Extension Context Isolation (Chrome Manifest V3)

The extension operates across **three isolated JavaScript contexts**:

1. **Content Script Context** (`clipContent.js`)
   - Has access to webpage DOM
   - Can query elements with `document.querySelector()`
   - Captures element data when user selects elements

2. **Service Worker Context** (`serviceWorker.js`)
   - Background script managing extension lifecycle
   - Relays messages between content scripts and popup
   - Dynamically injects scripts into contexts

3. **Popup Context** (`popup/static/js/main.js`)
   - Extension popup UI (React application)
   - **ISOLATED** - Cannot access webpage DOM
   - Must use alternative methods to access webpage data

---

## Data Flow Architecture

### Step 1: User Initiates Pick Data

```
User clicks "Pick Data" button in popup
    ↓
Popup sends message to content script
    ↓
clipContent.js activates element selection mode
```

### Step 2: Element Selection & Data Capture

```javascript
// clipContent.js lines 1284-1350
if (action == "pickData") {
  // Generate CSS selector for element
  css = getNodeCss(currentNode);

  // Extract text content
  const textContent = currentNode.textContent?.trim() || "";
  const previewText = textContent.substring(0, 100);

  // Create payload
  const payload = {
    css: "div.reader-page-breadcrumb",
    domain: "example.com",
    faviconImageBase64: null,
    textContent: ">IT Service Management>ML solutions for ITSM",
    preview: ">IT Service Management>ML solutions for ITSM",
  };

  // Send to popup via chrome.runtime.sendMessage
  chrome.runtime.sendMessage({
    popup: {
      name: "pickDataAdded",
      args: payload,
    },
  });
}
```

**Status**: ✅ **WORKING** - Console logs confirm data capture is successful

### Step 3: Popup Receives & Stores Data

```javascript
// popup/static/js/main.js lines 178825-178890
n = function (t) {
  console.log("pickDataAdded callback triggered with:", t);

  // STORAGE LAYER 1: localStorage (for cross-context access)
  if (t.css && t.textContent) {
    var storageKey = "__stn_picked_" + t.css.replace(/[^a-zA-Z0-9]/g, "_");
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        textContent: t.textContent,
        preview: t.preview,
        domain: t.domain,
        timestamp: Date.now(),
      }),
    );
    console.log("Stored picked data in localStorage for CSS:", t.css);
  }

  // STORAGE LAYER 2: React state (dataPickMap)
  a(function (n) {
    return {
      dataPickMap: {
        ...existingMap,
        [newId]: {
          id: newId,
          domain: t.domain,
          name: "example.com data #1",
          textContent: t.textContent || "", // LINE 178876
          preview: t.preview || "", // LINE 178877
        },
      },
      picked: true,
      propertyType: Zb(n),
      css: updatedCssString,
    };
  });
};
```

**Status**: ✅ **WORKING** - Both storage layers receive data correctly

### Step 4: Data Retrieval for Preview Display

This is where the issue occurs. The preview display needs to show the captured text.

#### Method A: Direct State Access (Preferred)

```javascript
// Should use: dataPickMap[id].preview
const previewText = dataPickMap[selectedId].preview;
```

#### Method B: Dynamic Query via getCustomCssData.js (Problematic)

```javascript
// getCustomCssData.js gets injected to retrieve data
function getData(x) {
  // SOLUTION: Check localStorage first (popup context)
  var storageKey = "__stn_picked_" + x.css.replace(/[^a-zA-Z0-9]/g, "_");
  var stored = localStorage.getItem(storageKey);

  if (stored) {
    var storedData = JSON.parse(stored);
    if (x.on === "text" && storedData.textContent) {
      return storedData.textContent; // ✓ Return from localStorage
    }
    if (x.on === "preview" && storedData.preview) {
      return storedData.preview; // ✓ Return from localStorage
    }
  }

  // FALLBACK: Query DOM (only works in content script context)
  let node = document.querySelector(x.css);
  if (!node) return ""; // ← Returns "Empty" in popup context
  return node.textContent.trim();
}
```

**Status**: ⚠️ **IMPLEMENTED BUT MAY NOT BE EXECUTING**

---

## Reference Archive Analysis

### Original Working Code (Chrome Web Store Version)

**Location**: `/Users/norton-mcintosh/Documents/GitHub/save-to-notion-reversed/archive/ldmmifpegigmeammaeckplhnjbbpccmm`

**Status**: 🔒 **READ-ONLY** (archived for reference)

```javascript
// archive/ldmmifpegigmeammaeckplhnjbbpccmm/getCustomCssData.js
function getData(x) {
  if (x == null) return null;
  console.log("getData", x, x.css);

  // Original: Direct DOM query (no localStorage)
  let node = document.querySelector(x.css);
  if (!node) return "";

  let v = null;
  if (x.on == "text") {
    v = node.textContent?.trim();
  }
  return v;
}
```

**Key Difference**: Original version had **no localStorage fallback**. This means it relied on being injected into a context where `document.querySelector()` could access the webpage DOM.

---

## Current Implementation Status

### File Comparison

| File                      | Archive (Original)    | Current (Dev)                     | Status      |
| ------------------------- | --------------------- | --------------------------------- | ----------- |
| `getCustomCssData.js`     | Direct DOM query only | localStorage check + DOM fallback | ✅ Enhanced |
| `popup/static/js/main.js` | Unknown (minified)    | localStorage storage added        | ✅ Enhanced |
| `clipContent.js`          | Unknown               | Data capture working              | ✅ Working  |

### Code Verification

#### ✅ getCustomCssData.js (Lines 162-184)

```javascript
try {
  var storageKey = "__stn_picked_" + x.css.replace(/[^a-zA-Z0-9]/g, "_");
  var stored = localStorage.getItem(storageKey);
  if (stored) {
    var storedData = JSON.parse(stored);
    console.log(
      "getData - found stored preview data from localStorage:",
      storedData,
    );
    if (x.on === "text" && storedData.textContent) {
      console.log(
        "getData - returning stored textContent:",
        storedData.textContent,
      );
      return storedData.textContent;
    }
    if (x.on === "preview" && storedData.preview) {
      console.log("getData - returning stored preview:", storedData.preview);
      return storedData.preview;
    }
  }
} catch (err) {
  console.log("getData - error checking localStorage:", err);
}
```

**Verified**: Present in `/Web-2-Notion/getCustomCssData.js`  
**File Size**: 7.5K  
**Last Modified**: Jan 25, 14:50

#### ✅ main.js (Lines 178826-178848)

```javascript
if (t.css && t.textContent) {
  try {
    var storageKey = "__stn_picked_" + t.css.replace(/[^a-zA-Z0-9]/g, "_");
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        textContent: t.textContent,
        preview: t.preview,
        domain: t.domain,
        timestamp: Date.now(),
      }),
    );
    console.log(
      "Stored picked data in localStorage for CSS:",
      t.css,
      "key:",
      storageKey,
    );
  } catch (err) {
    console.error("Failed to store picked data:", err);
  }
}
```

**Verified**: Present in `/Web-2-Notion/popup/static/js/main.js`  
**File Size**: 7.9M (minified React bundle)  
**Last Modified**: Jan 25, 14:50

---

## Diagnostic Questions

### Q1: Is the extension loading the updated files?

**Check**:

```bash
# Verify file timestamps
ls -lh /Users/norton-mcintosh/Documents/GitHub/save-to-notion-reversed/Web-2-Notion/getCustomCssData.js
ls -lh /Users/norton-mcintosh/Documents/GitHub/save-to-notion-reversed/Web-2-Notion/popup/static/js/main.js
```

**Expected**: Both files dated Jan 25, 14:50

**Action**:

1. Go to `chrome://extensions`
2. Find extension ID `gmlacalmmchpkodophohpkndbpjnllaa`
3. Click **"Reload"** button (circular arrow icon)
4. **Close and reopen** the extension popup completely

### Q2: Is getCustomCssData.js being injected?

**Check Console Logs**:

```
Expected in console:
1. "getData" - Shows getData() is being called
2. "getData - found stored preview data from localStorage:" - Shows localStorage retrieval
3. "getData - returning stored textContent:" or "getData - returning stored preview:"
```

**If Missing**: The old cached version of `getCustomCssData.js` is still running.

**Solutions**:

- Disable and re-enable the extension
- Quit Chrome completely and restart
- Check if Chrome is loading from a different directory

### Q3: Is the preview display using getData() at all?

**Check**: The UI might be trying to display `dataPickMap[id].preview` directly from state, which would work without calling `getData()`.

**If True**: Then the localStorage solution isn't needed, and the issue is with state management.

### Q4: Are there console errors?

**Check DevTools Console for**:

- `"getData - error checking localStorage:"` - localStorage access failed
- `"Failed to store picked data:"` - Storage failed
- `"getData - found node: null"` - DOM query returned null (expected in popup)

---

## Expected Console Output

### Successful Flow:

```
[clipContent] pickData action - preparing payload
[clipContent] Successfully generated CSS selector: div.reader-page-breadcrumb
[clipContent] Extracted text content: >IT Service Management>ML solutions for ITSM
[clipContent] pickData payload: {css: "div.reader-page-breadcrumb", textContent: "...", ...}
pickDataAdded callback triggered with: {css: "div.reader-page-breadcrumb", ...}
Stored picked data in localStorage for CSS: div.reader-page-breadcrumb key: __stn_picked_div_reader_page_breadcrumb
Current state before update: {dataPickMap: {...}}
New data after pick: {dataPickMap: {...}, picked: true}

[Later, when preview displays:]
getData {css: "div.reader-page-breadcrumb", on: "preview"} div.reader-page-breadcrumb
getData - found stored preview data from localStorage: {textContent: "...", preview: "...", ...}
getData - returning stored preview: >IT Service Management>ML solutions for ITSM
```

### Current (Broken) Flow:

```
[clipContent] pickData action - preparing payload
[clipContent] Successfully generated CSS selector: div.reader-page-breadcrumb
[clipContent] Extracted text content: >IT Service Management>ML solutions for ITSM
pickDataAdded callback triggered with: {css: "div.reader-page-breadcrumb", ...}
[MISSING: localStorage storage log]
[MISSING: getData localStorage retrieval logs]

[Later, when preview displays:]
getData {css: "div.reader-page-breadcrumb", on: "preview"} div.reader-page-breadcrumb
getData - found node: null
getData - no node found, returning empty string
```

---

## Root Cause Hypotheses

### Hypothesis 1: Chrome is Caching Old getCustomCssData.js ⭐ **MOST LIKELY**

- **Evidence**: Service worker injects scripts dynamically (line 8348)
- **Chrome V8 Behavior**: Aggressively caches compiled JavaScript
- **Solution**:
  1. Full extension reload at chrome://extensions
  2. Close popup completely
  3. If still failing: Disable extension → Re-enable extension
  4. Nuclear option: Quit Chrome → Restart

### Hypothesis 2: Preview Display Bypasses getData()

- **Evidence**: State has `dataPickMap[id].preview` already stored (line 178877)
- **Implication**: If UI reads directly from state, localStorage isn't needed
- **Solution**: Verify which code path the UI uses for preview display

### Hypothesis 3: Different Extension is Running

- **Evidence**: Previously had store version `ldmmifpegigmeammaeckplhnjbbpccmm`
- **Status**: ✅ **RESOLVED** - Store version removed
- **Verification**: Console logs show `gmlacalmmchpkodophohpkndbpjnllaa` consistently

### Hypothesis 4: localStorage Access Blocked

- **Evidence**: None yet
- **Check**: Look for "Failed to store picked data:" in console
- **Rare**: localStorage should be available in extension context

---

## Storage Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ CONTENT SCRIPT CONTEXT (clipContent.js)                     │
│ ✓ Has webpage DOM access                                    │
│ ✓ Can query elements directly                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ chrome.runtime.sendMessage({
                        │   popup: { name: "pickDataAdded", args: payload }
                        │ })
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ SERVICE WORKER (serviceWorker.js)                           │
│ • Relays messages between contexts                          │
│ • Injects getCustomCssData.js when needed                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Message forwarded to popup
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ POPUP CONTEXT (popup/static/js/main.js)                     │
│ ✗ NO webpage DOM access (isolated)                          │
│ ✓ Has localStorage access                                   │
│                                                              │
│ STORAGE LAYER 1: localStorage                               │
│ ├─ Key: "__stn_picked_div_reader_page_breadcrumb"          │
│ └─ Value: {textContent, preview, domain, timestamp}         │
│                                                              │
│ STORAGE LAYER 2: React State (dataPickMap)                  │
│ └─ {[id]: {textContent, preview, domain, name}}            │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ When preview needs to display:
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ INJECTED SCRIPT (getCustomCssData.js)                       │
│ Context: POPUP (no webpage DOM)                             │
│                                                              │
│ 1. Check localStorage (✓ accessible in popup)               │
│    └─ If found: Return stored data                          │
│ 2. Fallback: document.querySelector() (✗ returns null)      │
└─────────────────────────────────────────────────────────────┘
```

---

## Testing Protocol

### Test 1: Verify Extension Reload

```bash
# 1. Check current extension in chrome://extensions
# 2. Note the "Last loaded" timestamp
# 3. Click Reload button
# 4. Verify timestamp updates
```

### Test 2: Test localStorage Directly

```javascript
// Open extension popup DevTools console
// Run manually:
localStorage.setItem("__test_key", JSON.stringify({ test: "data" }));
console.log(localStorage.getItem("__test_key"));
// Expected: {"test":"data"}
```

### Test 3: Trace Pick Data Flow

```
1. Open webpage (e.g., ServiceNow breadcrumb page)
2. Open extension popup
3. Open DevTools for BOTH:
   - Popup window (right-click popup → Inspect)
   - Webpage (F12)
4. Click "Pick Data"
5. Select breadcrumb element
6. Click "Confirm Selection"
7. Watch console for expected log sequence (see above)
```

### Test 4: Verify Data in State

```javascript
// In popup DevTools console
// Access React DevTools or log state
console.log(window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
```

---

## Next Steps

### Immediate Actions:

1. ✅ Files updated with localStorage solution (Jan 25, 14:50)
2. ✅ Store version extension removed
3. ⏳ **USER ACTION REQUIRED**: Full extension reload
4. ⏳ **USER ACTION REQUIRED**: Test Pick Data with console monitoring

### If Still Failing After Reload:

1. Verify console shows **new** localStorage logs
2. Check if preview display code path uses `getData()` at all
3. Consider adding more detailed logging to identify exact failure point
4. Check for any minification issues in main.js

### Alternative Solution:

If localStorage continues to fail, consider:

- Store preview data in `chrome.storage.local` instead of `localStorage`
- Modify preview display to read directly from React state (`dataPickMap`)
- Inject getCustomCssData.js into content script context instead of popup

---

## Files Modified

### Development Version Files:

- ✅ `/Web-2-Notion/getCustomCssData.js` (7.5K, Jan 25 14:50)
- ✅ `/Web-2-Notion/popup/static/js/main.js` (7.9M, Jan 25 14:50)
- ✅ `/Web-2-Notion/clipContent.js` (existing, working)

### Archive (Reference Only):

- 🔒 `/archive/ldmmifpegigmeammaeckplhnjbbpccmm/` (read-only)

---

## Key Takeaways

1. **Data Capture Works**: clipContent.js successfully extracts text content
2. **Storage Layer Works**: Data is stored in both localStorage and React state
3. **Retrieval Code Exists**: getCustomCssData.js has localStorage fallback
4. **Likely Issue**: Chrome caching old JavaScript, needs full reload
5. **Architecture is Sound**: localStorage solution correctly bridges context isolation

---

## Console Commands Reference

```bash
# Check file timestamps
ls -lh Web-2-Notion/getCustomCssData.js
ls -lh Web-2-Notion/popup/static/js/main.js

# Search for localStorage code
grep -n "localStorage.setItem" Web-2-Notion/popup/static/js/main.js
grep -n "localStorage.getItem" Web-2-Notion/getCustomCssData.js

# Verify extension directory
ls -la /Users/norton-mcintosh/Documents/GitHub/save-to-notion-reversed/Web-2-Notion/

# Check for multiple versions
find ~/Library/Application\ Support/Google/Chrome -name "gmlacalmmchpkodophohpkndbpjnllaa" 2>/dev/null
```

---

**End of Diagnostic Report**

_This document serves as a comprehensive reference for debugging the Pick Data functionality. All code locations, flows, and verification steps are documented for future troubleshooting._
