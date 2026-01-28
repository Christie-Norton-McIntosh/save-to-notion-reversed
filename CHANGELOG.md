# Changelog

All notable changes to this project are documented in this file.

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
