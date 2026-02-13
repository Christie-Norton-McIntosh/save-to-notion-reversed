# Table Image Placeholder Fix - Final Solution

## Problem

When saving ServiceNow documentation pages with inline images in tables to Notion, the final Notion pages were showing:

- `[Red dot]` - text placeholders instead of images
- `[Clear triangle]` - text placeholders instead of images
- `()` - empty parentheses where images used to be

## Root Cause

The issue involved multiple processing stages:

1. **Table Processing** (`table-to-list-utils.js`):
   - Table cells with images were converted to markdown: `![Red dot](data:image/png;base64,...)`
   - This was correct behavior

2. **Data URL Extraction** (`main.js` line 98620):
   - ALL markdown images with data URLs were being extracted
   - They were replaced with text placeholders: `[Red dot]`
   - Intention was to upload them and replace placeholders later
   - But replacement wasn't happening, leaving `[Red dot]` in final Notion page

3. **Empty Parentheses**:
   - Original HTML: `A red dot (<img alt="Red dot" />) is next to...`
   - After image extraction: `A red dot () is next to...`
   - Empty parens weren't being cleaned up

## Solution Implemented

### 1. Marker System for Table Images

Added `<<stn-table-img>>` metadata marker to images from tables:

**File: `Web-2-Notion/popup/lib/table-to-list-utils.js`**

- Line ~332: Added marker to direct child images
- Line ~344: Added marker to paragraph images
- Line ~366: Added marker to fallback images

Result: `![Red dot](data:...)<<stn-table-img>>`

### 2. Skip Data URL Extraction for Table Images

Modified data URL extraction to skip marked images:

**File: `Web-2-Notion/popup/static/js/main.js`**

- Line ~98620: Updated regex to detect marker
- Line ~98625: Skip images with `<<stn-table-img>>` marker
- Line ~98707: Clean up markers after processing

Result: Table images stay as markdown, never become text placeholders

### 3. Enhanced Placeholder Removal

Improved the `stripLegacyBracketedPlaceholders()` function:

**File: `Web-2-Notion/popup/lib/table-to-list-utils.js`**

- Line ~27: Added bullet-format regex detection `• alt •`
- Line ~43: Check for both bracket and bullet formats
- Line ~73-83: Added parent sibling checking for wrapped placeholders
- Line ~295: Remove bullet placeholders in early return path

Result: Removes both old bracketed `[alt]` and bullet `• alt •` placeholders

## Testing

Created comprehensive test suite:

1. **`test-processCellForTableToList.js`** - Core cell processing ✅
2. **`test-bracketed-placeholder-fix.js`** - 8 tests for placeholder removal ✅
3. **`test-table-image-marker.js`** - Verifies marker system ✅
4. **`test-fixtures-live.js`** - Tests actual HTML fixtures ✅

All tests passing.

## Fixtures Tested

- ✅ `inline-image-in-paragraph.html` - No issues
- ✅ `table-with-images-indv-cells.html` - No issues
- ✅ `table-w-inline.html` - No issues (was showing `[Red dot]`, `[Clear triangle]`, `()` - now fixed)

## Key Files Changed

1. `Web-2-Notion/popup/lib/table-to-list-utils.js`
   - Added `<<stn-table-img>>` markers to all image-to-markdown conversions
   - Enhanced bracketed placeholder removal
   - Added bullet-format placeholder removal

2. `Web-2-Notion/popup/static/js/main.js`
   - Modified data URL extraction to skip table images
   - Added marker cleanup

## Benefits

1. **Preserves Inline Images**: ServiceNow documentation images stay as markdown
2. **No Text Artifacts**: Removes `[alt]` and `()` that were appearing in Notion
3. **Maintains Legitimate Text**: Preserves actual user text like `[DRAFT]`
4. **Backward Compatible**: Doesn't break existing image handling

## How It Works

```
Before:
Table HTML → Markdown ![img](data:...) → Extract data URL → Replace with [alt] → ❌ Text in Notion

After:
Table HTML → Markdown ![img](data:...)<<marker>> → Skip extraction → Clean marker → ✅ Image in Notion
```

The marker acts as a "do not extract" flag, allowing table images to bypass the data URL extraction system that was intended for different types of images.
