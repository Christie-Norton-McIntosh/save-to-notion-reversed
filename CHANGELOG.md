# Changelog

## [Unreleased] - 2026-02-09

### Changed
- **Major Reorganization**: Reduced Web-2-Notion folder size from ~50MB to 27MB
  - Removed duplicate options.js files (options 2.js through 8.js) - saved ~22MB
  - Removed duplicate package-lock 2.json
  - Moved diagnostic and development files to new `/dev-tools/` directory
  - Moved screenshot images to `/dev-tools/images/`
  - Moved bookmarklets to `/dev-tools/bookmarklets/`
  - Moved scripts to `/dev-tools/scripts/`
  - Moved favicon backup files to `/dev-tools/images/favicon-backup/`
  - Moved ESLint configuration to root level
  - Moved package.json and dependencies to root level for easier management
  - All Chrome extension core functionality remains intact and unchanged

### Added
- Created organized `/dev-tools/` directory structure for development files
- Added README.md in dev-tools to document the structure

## Previous Entries

### Added

- **Sibling Duplicate Pruning**: Added DOM pass to remove later siblings with identical normalized text (tag-aware) from htmlToProcess before parsing
  - Emits `console.warn` with count of removed duplicate siblings for visibility
  - Prevents redundant content from appearing in saved pages

### Fixed

- **🖼️ Inline Image Context Preservation**: Images in table cells now preserve surrounding text in their parent context
  - Fixed loss of anchor text when images appeared inside anchor tags (e.g., `<a>Open <img> portal</a>`)
  - Images replaced with text placeholders `[alt]` in cell content (Notion doesn't support inline Markdown images in cells)
  - Surrounding text now preserved: `Open [→] portal` instead of just `[→]`
  - Images still extracted separately as `![alt](url)` for display in dedicated images section
  - Added comprehensive test suite (`tests/test-inline-images.js`) with 6 test cases
  - See `docs/Web-2-Notion/INLINE_IMAGE_PRESERVATION.md` for detailed documentation

- **�📋 Table Cell List Formatting**: Lists within table cells now preserve line breaks between items
  - Added `__LI_END__` marker handling for list items in both HTML-to-Markdown conversion (`options.js`) and popup processing (`main.js`)
  - Removed automatic comma-join conversion that was replacing list items with comma-separated text
  - List items in table cells now display on separate lines in Notion instead of comma-separated inline text
  - Applies to all three table cell processing paths: sanitizeCell, manual processing, and fallback handling

## [5.1.1] - 2026-01-28

### Fixed

- **🐛 Duplicate Content Detection**: Resolved issues with duplicate images and tables appearing in saved content
  - Images now matched by normalized URL (removes query parameters and hash fragments), alt text, and dimensions
  - Tables now matched by structure (row count × column count), total text length, and first 500 characters of HTML
  - Increased signature comparison length from 200 to 500 characters for all elements
  - Enhanced duplicate detection now properly handles:
    - Same images loaded with different query parameters (e.g., cache-busting params)
    - Tables with similar starting content but different overall structure
    - Content blocks with varying text lengths
  - Applies to both `scanWebpage.js` (auto-extraction) and `clipContent.js` (manual selection)

### Technical Details

- Image signature format: `img:{normalizedURL}:{altText}:{width}x{height}`
- Table signature format: `table:{rows}x{cells}:{textLength}:{first500CharsHTML}`
- Other elements: `{tagName}:{textLength}:{first500CharsHTML}`

---

## [5.1.0] - 2026-01-27

### Added

- **⚡ Auto-Pagination Feature**: Automatically save multiple pages in sequence
  - Configure CSS selector for "next page" button with Shadow DOM support
  - Set adjustable delay between page saves and navigation (default: 2000ms)
  - Optional maximum page limit to prevent runaway automation
  - Real-time page counter showing progress
  - Toast notifications for status updates
  - New auto-pagination button in extension popup (⚡ icon)
  - Dedicated settings page (`autoPagination.html`) with modern gradient UI
  - Keyboard shortcut: `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`) to open settings
  - Comprehensive documentation:
    - `AUTO_PAGINATION_README.md` - Complete user guide
    - `AUTO_PAGINATION_IMPLEMENTATION.md` - Technical documentation
    - `AUTO_PAGINATION_VISUAL_GUIDE.md` - Visual diagrams and flows
    - `AUTO_PAGINATION_QUICK_START.md` - Quick start guide

### Enhanced

- Shadow DOM detection for pagination buttons (recursive search up to 20 levels)
- Per-site configuration storage using localStorage
- State persistence across page navigations
- Smart button validation (checks disabled/hidden state)
- Automatic script injection on-demand

### Files Added

- `autoPagination.js` - Content script for automation logic
- `autoPagination.html` - Settings UI
- `autoPaginationUI.js` - Settings controller
- `popup/autoPaginationShim.js` - Popup integration

### Files Modified

- `manifest.json` - Added web accessible resources and keyboard shortcut
- `serviceWorker.js` - Added message handlers and script injection logic
- `popup/index.html` - Added autoPaginationShim.js script

---

## [4.0.5] - 2026-01-24

### Added

- Documentation for custom site selectors and quick reference table.
- Support for multiple comma-separated selectors for content extraction.

### Changed

- Improved selector logic and debugging output for content capture.
- Enhanced navigation monitoring to auto-update content on same-site navigation.
- UI/UX: Confirmation message in the Custom Site Selectors modal is now repositioned for better visibility after saving settings.

- UI/UX: Updated all primary action buttons ("Save Page", "Save Form", modal buttons) to use a new accent gradient background (linear-gradient(135deg, #667eea 0%, #764ba2 100%)) for a modern look. Applies to popup, modal, and options pages.

### Fixed

- Resolved git rebase conflicts in main extension logic.
- Fixed issue where only one selector was captured; now supports multiple selectors.
- Fixed confirmation text appearing too low in the modal after saving settings.

---

## [4.0.0] - 2025-XX-XX

### Added

- Initial implementation of Web-2-Notion Chrome extension features.
- Basic modal, selector, and screenshot functionality.
