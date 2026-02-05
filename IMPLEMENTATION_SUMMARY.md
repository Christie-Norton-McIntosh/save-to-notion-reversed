# Hotfix: Table Cell Content Recovery - Implementation Summary

## Overview
This hotfix addresses multiple edge-cases that caused table cell text and in-table images to be lost when saving pages to Notion. It ensures XCELL/BASE64 markers do not leak into Notion and provides robust recovery strategies.

## What Was Already Implemented (Found in Codebase)

### 1. Inline Preview Emission ✅
**Location**: `popup/static/js/main.js` lines 90912-90940
- Emits human-readable preview next to XCELL markers
- Fallback strategy when full cell-map is unavailable
- Format: `XCELLIDX{cellId}XCELLIDX ‹stn-preview:{preview}›`
- Preview is extracted from cell textContent, limited to 120 chars
- Special characters are sanitized (›, <, >)

### 2. localStorage Persistence ✅
**Location**: `popup/static/js/main.js` lines 92333-92436
- Function: `persistTableMapEntries()`
- Persists table-cell map fragments to `localStorage["__stn_table_cell_map_v1"]`
- Called when cell content is generated (lines 91270, 91280, 92547)
- Function: `readPersistedTableMapFromPage()` 
- Reads persisted map from page localStorage
- Used as fallback recovery path (line 107235)

### 3. Async Popup↔Page Recovery Handshake ✅
**Location**: `popup/static/js/main.js` lines 91411-91567
- Function: `tryRecoverMapsIfNeeded()`
- Multi-path recovery strategy:
  1. Check if map already exists in memory
  2. Try alternate globals (`__stn_table_cell_map__`, `__stnTableCellMap`)
  3. Execute page-context fetcher (`__stn_pageMapFetcher`)
  4. Use chrome.scripting.executeScript to fetch from active tab
- Function: `window.__stn_attemptRecoverMapsFromPage()`
- Exposed for testing with configurable timeout (default 400ms)
- Handles both TABLE_CELL_CONTENT_MAP__ and TABLE_BASE64_IMAGE_MAP__

### 4. Inline Preview Fallback Recovery ✅
**Location**: `popup/static/js/main.js` lines 107287-107323
- Function: `applyInlinePreviews()`
- Extracts preview text from markers when map is unavailable
- Patterns handled:
  - `XCELLIDX{cellId}XCELLIDX ‹stn-preview:{text}›`
  - `⟦STN_CELL:{cellId}⟧ ‹stn-preview:{text}›`
- Strips preview markers when real content is recovered

### 5. Text Preservation in Anchors ✅
**Location**: `popup/static/js/main.js` lines 91130-91161 (tableWithoutHeading)
**Location**: `popup/static/js/main.js` lines 91782-91850 (tableWithHeading)
- Preserves textual content in anchors when images are removed
- Common ServiceNow pattern: `<a><img/><span>text</span></a>`
- Extracts non-image text nodes and element text
- Replaces anchor with preserved text instead of removing entirely

### 6. Marker Recovery Patterns ✅
**Location**: `popup/static/js/main.js` lines 91583-91616
- Multiple marker formats supported:
  - `XCELLIDX{cellId}XCELLIDX`
  - `⟦STN_CELL:{cellId}⟧`
  - `<!--STN_CELL:{cellId}-->`
  - `<span data-stn-cell="{cellId}"></span>`
- Fallback: literal key replacement for any known CELL_ keys

## What Was Implemented in This PR

### 1. Broadened Image-Src Detection ✨ NEW
**Location**: `popup/static/js/main.js` lines 90988-91033 (tableWithoutHeading)
**Location**: `popup/static/js/main.js` lines 91741-91760 (tableWithHeading)

**Before**: Only checked `data-original-src`, `src` attribute, and `src` property

**After**: Now checks (in priority order):
1. `data-original-src` attribute
2. `data-src` attribute (NEW)
3. `srcset` attribute - extracts first candidate (NEW)
4. `currentSrc` property - for responsive images (NEW)
5. `src` attribute
6. `src` property

**Why**: Many modern websites use lazy-loading with `data-src`, responsive images with `srcset`, or `<picture>` elements with `currentSrc`. Previous implementation missed these sources.

### 2. Test Suite Enhancement ✨ NEW

**Added Tests**:
- `test/test-final-payload-marker-recovery.js` - Already existed, now in npm scripts
- `test/test-broadened-image-src-detection.js` - NEW comprehensive test

**Updated `package.json`**:
```json
"test-marker-recovery": "node test/test-final-payload-marker-recovery.js",
"test-image-src": "node test/test-broadened-image-src-detection.js",
```

**Test Coverage**:
- ✅ Mangled marker recovery
- ✅ Page-fallback recovery via `__stn_pageMapFetcher`
- ✅ Persisted localStorage recovery
- ✅ data-src detection
- ✅ data-original-src priority
- ✅ srcset extraction (first candidate)
- ✅ Priority order verification
- ✅ Fallback to src attribute
- ✅ Empty/missing attribute handling

## Test Results

All 5 test suites pass with 16 total tests:

```
✅ test-line-breaks: 5 tests passed
✅ test-base64-image: 1 test passed
✅ test-e2e: 1 test passed
✅ test-marker-recovery: 3 tests passed
✅ test-image-src: 6 tests passed
```

## Files Modified

1. **Web-2-Notion/popup/static/js/main.js**
   - Enhanced image-src detection in tableWithoutHeading rule
   - Enhanced image-src detection in tableWithHeading rule
   - ~30 lines changed to add comprehensive src attribute detection

2. **Web-2-Notion/package.json**
   - Added test-marker-recovery script
   - Added test-image-src script
   - Updated test script to include new tests

3. **Web-2-Notion/test/test-broadened-image-src-detection.js** (NEW)
   - Comprehensive unit tests for image-src detection
   - Tests priority order and fallback behavior

4. **Web-2-Notion/package-lock.json**
   - Auto-generated by npm install
   - Added "peer": true for peer dependencies (standard npm behavior)

## Risk Assessment

**Low Risk** - All changes are:
- ✅ Defensive and best-effort
- ✅ Non-breaking (only broadens detection, doesn't remove functionality)
- ✅ Backwards compatible (falls back to original behavior)
- ✅ Covered by comprehensive tests
- ✅ Non-blocking (localStorage writes are try-catch wrapped)

## CI/Build Configuration

- ✅ jsdom Turndown tests workflow exists (`.github/workflows/jsdom-turndown-tests.yml`)
- ✅ Configured to run on pull_request to main
- ✅ Runs `npm test` which includes all new tests
- ✅ Node.js 18 environment
- ✅ Caches node_modules for faster builds

## Manual QA Checklist (from Problem Statement)

### Unit/jsdom Tests
- ✅ All new tests pass locally
- ✅ All existing tests pass locally
- ✅ Test suite runs in < 5 seconds

### Manual Testing (ServiceNow)
**To be performed by reviewer**:
1. Load dev build on ServiceNow page with tables
2. Open popup, run Save
3. Verify preview shows table text (no raw XCELL tokens)
4. Test failure scenario: verify inline-preview appears
5. Verify base64 in-table images are queued and converted

### CI Requirements
- ✅ jsdom tests added to npm test script
- ✅ Ready for CI workflow execution
- 📋 Recommend: Make jsdom workflow a required status check

## Conclusion

This implementation completes the hotfix requirements:
- ✅ All core recovery features were already implemented
- ✅ Image-src detection has been broadened (NEW)
- ✅ Comprehensive test suite added/enhanced (NEW)
- ✅ All tests pass
- ✅ Low risk, defensive changes
- ✅ Ready for CI and manual QA

The codebase already had robust marker recovery and persistence mechanisms. This PR adds the final piece: comprehensive image-src detection for modern websites.
