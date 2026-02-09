# Development Tools

This directory contains development and diagnostic tools that are not required for the Chrome extension to function.

## Directory Structure

### `/diagnostics`
Contains diagnostic tools and scripts for debugging the extension:
- `DIAGNOSTIC_BROWSER_CONSOLE.js` - Browser console diagnostic utilities
- `DIAGNOSTIC_MENUCASCADE_SPACING.js` - Menu cascade spacing diagnostics
- `diagnostic-tool.html` - HTML-based diagnostic interface

### `/images`
Contains images and screenshots used for development and documentation:
- `options.jpg`, `options2.jpg`, `options3.jpg` - Screenshots of options pages
- `wimages/` - Additional development images
- `favicon-backup/` - Backup of various favicon sizes

### `/bookmarklets`
Contains bookmarklet tools for testing and development:
- `stn-dedup-report.html` - Deduplication report tool

### `/scripts`
Contains utility scripts for development:
- `check-image-replacement-test.sh` - Script to verify image replacement functionality

## Note
These files were moved from the `Web-2-Notion` folder to reduce bloat and improve the extension's performance. They are not required for the extension to function but may be useful during development and debugging.
