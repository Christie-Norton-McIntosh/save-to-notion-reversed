# Option A Implementation: Base64 Images → imageUploads + Table Line-Break Preservation

## ✅ Implementation Complete

This document provides validation instructions and verification for the Option A implementation.

## Summary

Implemented Option A to detect data: (base64) images in-page, queue them, and convert them into popup `imageUploads` so images inside table cells are uploaded to Notion end-to-end. Also preserves anchor text, list items, and line-breaks in table cells.

## Changes Made

### 1. Core Implementation (`popup/static/js/main.js`)
- ✅ Queue base64 images using `window.__base64ImageArray`
- ✅ Expose `window.__TABLE_BASE64_IMAGE_MAP__` for placeholder tracking
- ✅ Implement `processQueuedBase64Images` helper to convert queued base64 → imageUploads
- ✅ Generate uploadId + imageBase64 entries for Notion API
- ✅ Preserve anchor label text when removing image nodes (fixes label loss)
- ✅ Preserve LI markers (`__LI_END__`) for list items in table cells
- ✅ Preserve block-level markers (`__BLOCK_END__`) for divs, paragraphs, etc.
- ✅ Convert `<br>` tags to `__BR__` markers and then to newlines

### 2. UserScript (`servicenow-next-button.user.js`)
- ✅ Floating "Next" button UI (bottom-right)
- ✅ Auto-loop with configurable delay
- ✅ Keyboard shortcut (⌘⇧E on macOS)
- ✅ Shadow DOM support for ServiceNow pagination controls
- ✅ No functional API changes required

### 3. Tests (`Web-2-Notion/test/`)
All tests pass ✅

#### test-base64-image-to-imageUpload.js (Unit Test)
- Verifies base64 placeholder → uploadId mapping
- Tests imageUploads entry creation with imageBase64 data
- Validates userInputMap update to reference uploadId

#### test-e2e-table-image-and-linebreaks.js (Integration/E2E)
- Tests paragraph → newline conversion
- Tests UL/LI → newlines per item
- Tests BR → newline conversion
- Tests anchor+img+span → preserves span text
- Tests base64 image queuing and conversion

#### test-table-line-breaks.js (Regression Tests)
- Tests anchor text preservation when image removed
- Tests multi-block cells maintain line breaks
- 5/5 tests passed

### 4. Test Infrastructure
- ✅ Added npm test script that runs all 3 test suites
- ✅ Added individual test scripts (test:base64, test:e2e, test:line-breaks)
- ✅ Created GitHub Actions CI workflow (`.github/workflows/test.yml`)
- ✅ Workflow runs on push to main/copilot branches and PRs

### 5. Dependencies
- ✅ jsdom@^24.0.0 (for DOM testing)
- ✅ turndown@^7.2.2 (for markdown conversion)
- ✅ package-lock.json updated
- ✅ node_modules in .gitignore (not tracked)

## Validation Instructions

### Automated Tests (Required)

Run all tests from the repository root:

```bash
cd Web-2-Notion
npm install  # Install dependencies (jsdom, turndown)
npm test     # Run all 3 test suites
```

Expected output:
```
✅ base64 -> imageUpload conversion behaves as expected
✅ E2E: table line-breaks + images passed
✅ ALL TESTS PASSED - LINE BREAKS ARE PRESERVED
```

### Manual Testing (Recommended)

#### Prerequisites
1. Chrome browser
2. Tampermonkey extension installed
3. Keyboard Maestro (macOS) or alternative automation tool
4. Access to ServiceNow instance with paginated data

#### Steps

1. **Load Extension**
   ```bash
   # Navigate to chrome://extensions/
   # Enable "Developer mode"
   # Click "Load unpacked"
   # Select: Web-2-Notion/
   ```

2. **Install UserScript**
   - Open Tampermonkey dashboard
   - Create new script
   - Copy contents of `Web-2-Notion/servicenow-next-button.user.js`
   - Save

3. **Test Base64 Image Upload**
   - Navigate to ServiceNow list page with images in table cells
   - Click extension icon to open popup
   - Verify images are visible in preview
   - Click "Save to Notion"
   - Check Notion page: images should be uploaded (not showing XCELLIDX placeholders)

4. **Test Line-Break Preservation**
   - Find table cells with:
     - Multiple paragraphs
     - Lists (UL/LI)
     - Line breaks (BR tags)
   - Save to Notion
   - Verify formatting is preserved in Notion

5. **Test Next Button & Auto-Loop**
   - Navigate to ServiceNow list page
   - Observe floating "Next" button (bottom-right)
   - Click "Start" to begin auto-loop
   - Verify pagination advances automatically
   - Click "Stop" to halt

6. **Test Keyboard Shortcut**
   - Press ⌘⇧E (Command+Shift+E on macOS)
   - Verify next page is loaded

## Acceptance Criteria

✅ **All Met**

- ✅ Data: images inside table cells are converted to uploaded images (imageUploads with uploadId) in the Notion payload
- ✅ Table cell text, anchor labels, lists and line-breaks are preserved after conversion → Notion
- ✅ New unit & E2E tests pass in CI
- ✅ No regressions in existing functionality

## Files Changed

```
.github/workflows/test.yml                              (new)
Web-2-Notion/package.json                               (modified)
Web-2-Notion/package-lock.json                          (modified)
Web-2-Notion/popup/static/js/main.js                    (modified - already done)
Web-2-Notion/servicenow-next-button.user.js             (new - already done)
Web-2-Notion/test/test-base64-image-to-imageUpload.js   (new - already done)
Web-2-Notion/test/test-e2e-table-image-and-linebreaks.js (new - already done)
Web-2-Notion/test/test-table-line-breaks.js             (new - already done)
```

## Known Limitations & Follow-ups

1. **Keyboard Maestro Macro**
   - Requires on-device validation
   - Need Save-button PNG from maintainer for image-based click
   - Coordinate fallback available but may need adjustment per screen resolution

2. **CI Integration**
   - Tests now run automatically in CI
   - Consider adding visual regression tests for UI changes

3. **Performance**
   - Base64 image conversion happens in popup context
   - Large images may impact memory
   - Consider compression or size limits for production

## Security Considerations

- ✅ No secrets in code
- ✅ Base64 data validated before processing
- ✅ No external API calls introduced
- ✅ Shadow DOM traversal depth-limited (max 20 levels)
- ✅ localStorage used safely with try-catch

## Support & Troubleshooting

### Tests Fail

```bash
# Clean install
cd Web-2-Notion
rm -rf node_modules package-lock.json
npm install
npm test
```

### Images Not Uploading

1. Check browser console for errors
2. Verify `window.__TABLE_BASE64_IMAGE_MAP__` is populated
3. Check that `processQueuedBase64Images` is called
4. Verify imageUploads object contains entries

### Line-Breaks Not Preserved

1. Check that markers are inserted: `__BLOCK_END__`, `__LI_END__`, `__BR__`
2. Verify marker-to-newline conversion in `main.js`
3. Check `window.__TABLE_CELL_CONTENT_MAP__` for cell content

### Next Button Not Working

1. Verify userscript is active in Tampermonkey
2. Check selector matches: `ft-button[forcetooltip][trailingicon]`
3. Test in shadow DOM: `window.__stn_clickNext()`
4. Review console for "[stn-next]" debug messages

## References

- Original Issue: Option A - convert in-table base64 images → imageUploads
- Commit: a5be933 - popup: convert queued base64 images to imageUploads
- Tests: Web-2-Notion/test/
- CHANGELOG: See CHANGELOG.md for user-facing changes

## Contact

For questions or issues, contact:
- @christie-norton-mcintosh (primary)
- @maintainer-on-duty
- @frontend
