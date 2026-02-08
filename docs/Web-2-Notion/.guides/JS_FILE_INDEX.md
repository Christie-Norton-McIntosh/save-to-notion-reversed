# JavaScript File Index: Web-2-Notion

This document provides an overview of all JavaScript (.js) files in the Web-2-Notion extension, with a brief explanation of each file's purpose.

---

## Root Directory

- **clipContent.js**: Handles capturing and formatting content from web pages for saving to Notion.
- **clipper.js**: Main logic for the extension's clipping functionality, orchestrating content extraction and communication with Notion.
- **displaySnackBar.js**: Displays temporary notification messages (snackbars) to the user.
- **downloadFile.js**: Provides utilities for downloading files (e.g., images, PDFs) from the web.
- **getCustomCssData.js**: Retrieves and manages custom CSS data for user-defined site selectors.
- **getSelectedText.js**: Extracts the currently selected text on a web page.
- **gmailIntegration.js**: Adds support for clipping content from Gmail, handling its unique DOM structure.
- **highlightSelection.js**: Manages highlighting of selected content on the page.
- **highlightTooltip.js**: Controls the tooltip UI for highlighting and annotation features.
- **modal.js**: Controls the modal dialog UI for settings, selectors, and user prompts.
- **modalAddNote.js**: Handles the modal for adding notes to clipped content.
- **options.js**: Manages the options/settings page logic for the extension.
- **parseMetaTags.js**: Extracts metadata (title, description, etc.) from web pages.
- **scanWebpage.js**: Scans the current webpage for content and selectors, including navigation monitoring.
- **screenshot.js**: Captures screenshots of the current page or selected areas.
- **serviceWorker.js**: Background script for handling extension events, messaging, and persistent tasks.
- **site-selectors.js**: Manages custom site selector logic and UI for user-defined extraction rules.
- **toast.js**: Controls toast notification UI and logic.

---

## Subfolders

### assets/
- **modalImageEditor.js**: Provides image editing capabilities within modals (e.g., cropping, annotating images before saving).
- **twitterMonkeyPatch.js**: Applies patches or workarounds for Twitter's DOM to improve content extraction.

### content/
- **content.js**: Content script injected into web pages to facilitate communication and DOM manipulation for the extension.

### onboarding_guide_popup/
- **script.js**: Logic for the onboarding guide popup, helping new users get started with the extension.

### popup/
- **disableLiveReload.js**: Disables live reload in the popup for production builds.

### restricted_popup/
- **script.js**: Handles logic for the restricted popup UI (shown in limited contexts).

---

## Notes
- Some additional JavaScript files may exist in other subfolders (e.g., build output in popup/static/js/), but the above list covers all source and main logic files.
- For more details on custom selectors, see `.guides/Custom Site Selectors Guide.md`.

---

_Last updated: 2026-01-24_