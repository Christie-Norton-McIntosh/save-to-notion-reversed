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

## One‑click restore (developer convenience)

There is a small helper in the repository to create a lightweight restore point (commit current changes and push an annotated tag). Two one-click options are provided:

- VS Code: open the **Run Task** palette and run **Create restore tag** (task defined in `.vscode/tasks.json`).
- NPM: run the script `npm run restore:tag` (appears with a play button in the NPM Scripts explorer).

Both run the same script: `.vscode/create-restore-tag.sh` — it will commit any workspace changes, push the branch (if needed) and create/push an annotated tag named `restore-YYYY-MM-DD-HHMMSS`.

Important: the script runs local git commands and will push to the configured remote. Review `.vscode/create-restore-tag.sh` before use.
