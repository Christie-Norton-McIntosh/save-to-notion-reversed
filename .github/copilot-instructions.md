# Copilot Instructions for AI Coding Agents

## Project Overview

This repository is a Chrome extension for saving web content to Notion. It consists of multiple directories, each representing a build or variant of the extension. The main working directory is `Web-2-Notion`, with a secondary, read-only reference directory `ldmmifpegigmeammaeckplhnjbbpccmm`.

Incrementally update the Version for all changes made to the extension, following semantic versioning principles. The Version is defined in the `manifest.json` file within the `Web-2-Notion` directory and should be updated with each change to reflect the nature of the update (e.g., patch, minor, major).

## Architecture & Data Flow

- **Content Scripts** (`clipContent.js`, `getCustomCssData.js`, etc.): Injected into web pages to extract, process, and send data. Use localStorage for cross-context communication.
- **Popup UI** (`popup/`): Handles user interaction, displays previews, and triggers save actions. Communicates with content scripts via localStorage and Chrome extension messaging.
- **Background/Service Worker** (`serviceWorker.js`): Handles background tasks and persistent extension logic.
- **Assets & Styles**: CSS and images are in `assets/`, `popup/static/css/`, and related folders.
- **Selector Logic**: Uses a custom/finder-based approach for robust CSS selector generation and fallback, including shadow DOM and nth-child handling.

## Developer Workflows

- **Builds**: No explicit build system; source files are edited directly. Bundled/minified files (e.g., `popup/static/js/main.js`) are not to be edited by hand.
- **Testing**: Manual testing is performed by loading the unpacked extension in Chrome and verifying UI/data extraction on target sites (e.g., servicenow.com).
- **Linting**: ESLint is not used (config files have been removed). Do not reintroduce linting configs unless explicitly requested.
- **Read-only Reference**: The `ldmmifpegigmeammaeckplhnjbbpccmm` directory is a read-only snapshot for comparison only—never modify its contents.

## Project Conventions

- **No Frameworks**: Pure JavaScript, CSS, and HTML. No React, TypeScript, or build tools.
- **Storage**: Use localStorage for cross-context data transfer. Keys often prefixed with `__stn_`.
- **Selectors**: Always provide fallback selectors and support for shadow DOM. See `clipContent.js` and `getCustomCssData.js` for patterns.
- **Logging**: Use `console.debug` for non-critical logs to avoid noisy output.
- **Button Styles**: Use gradient backgrounds for key action buttons (see `main.css`).

## Key Files & Directories

- `Web-2-Notion/clipContent.js`: Main content script, selector logic, and UI injection.
- `Web-2-Notion/getCustomCssData.js`: Selector-based data retrieval, shadow DOM support.
- `Web-2-Notion/popup/static/js/main.js`: Popup UI logic (bundled/minified).
- `Web-2-Notion/popup/static/css/main.css`: Popup and button styles.
- `Web-2-Notion/serviceWorker.js`: Background logic.
- `ldmmifpegigmeammaeckplhnjbbpccmm/`: Read-only reference build.

## Integration & External Dependencies

- **Notion API**: Data is formatted for Notion but not sent directly; user copies or triggers save via UI.
- **Chrome Extension APIs**: Use `chrome.*` APIs for messaging and storage.
- **No Node.js/Package Management**: Do not add `node_modules` or package.json files.

## Patterns to Follow

- Always update both selector and plain selector keys in localStorage for reliability.
- When adding new UI elements, match the gradient style and minimalistic design.
- For new data extraction logic, ensure fallback and shadow DOM support.
- Error window logging policy:
  - Show only blocking errors or the 1–3 key lines for the **currently active** debugging issue.
  - Do **not** pipe general warnings/verbose logs into the extension error window—keep them in the console.
  - After the active issue is confirmed fixed, remove those temporary error-window log lines so the UI stays clean.

---

## Image Handling

**Markdown images ARE used as an intermediate format** in this extension. While Notion's API doesn't natively support markdown, this extension uses a multi-stage pipeline:

1. **Content extraction** (`main.js`): Generate markdown syntax `!\[alt\]\(url\)` for all images
2. **Markdown parsing** (`options.js`): Parse markdown and convert to Notion block structures
3. **Upload tracking**: Images are tracked in `urlToUploadsMap` with `needtouploadfile` markers
4. **File upload** (`serviceWorker.js`): Images are downloaded, converted to base64, and uploaded to Notion's S3 via the API

**When working with images:**

- Always generate markdown syntax: `"![" + alt + "](" + src + ")"`
- The system automatically handles conversion and upload
- Images will be tracked and uploaded separately from the markdown content
- See `IMAGE_HANDLING_EXPLANATION.md` for detailed pipeline documentation

The Chrome extension manifest has a limit of 4 keyboard shortcuts in the commands section

For questions about project structure or workflow, review the main scripts in `Web-2-Notion/` and reference the read-only directory for legacy behavior.
