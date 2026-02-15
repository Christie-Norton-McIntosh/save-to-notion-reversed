# Features Added to the Bundled Extension

This document lists and describes all features that have been added to the bundled version of the extension in this repository. For each feature, a brief description and its purpose are provided.

---

## 1. Table to Bullet List Conversion

**Description:** Automatically converts HTML tables on web pages into Notion-compatible bullet lists when saving content. This improves readability and compatibility with Notion's block structure.

**Notion considerations:**

- Block-based model — tables must be mapped to discrete Notion blocks (we convert rows/cells to nested list blocks).
- Table limitations — merged or complex table structures are flattened or converted to lists to avoid data loss.
- Content-size — large tables are chunked to avoid Notion block/page limits.

## 2. Image Handling Improvements

**Description:** Enhanced support for inline images, including preservation of image order, alt text, and improved handling of data URLs. Ensures images are correctly transferred and displayed in Notion.

**Notion considerations:**

- Image upload requirements — data URLs are converted to uploadable resources or proxied URLs.
- Alt text preservation — mapped into Notion image captions/metadata when possible for accessibility.
- Rate/size limits — large images are sized or deferred to avoid API/upload failures.

## 3. Auto Pagination

**Description:** Automatically detects and follows "next page" links to capture multi-page articles or documents. This feature allows users to save entire articles or threads without manual navigation.

**Notion considerations:**

- Content-size limits — long multi-page articles are chunked into multiple blocks/pages to avoid Notion limits.
- Ordering — pagination preserves original reading order when creating Notion blocks.
- Rate limits — follow/merge operations respect API and UI rate constraints to avoid rejections.

## 4. Custom Selector Support

**Description:** Allows users to specify custom CSS selectors for content extraction, enabling precise control over what content is saved from complex or non-standard web pages.

**Notion considerations:**

- Selector precision — helps avoid importing extraneous DOM nodes that would produce noisy or malformed Notion blocks.
- Shadow DOM — selectors may need to target shadow roots; feature supports that where possible.
- Accessibility — encourage selectors that capture semantic elements (headings, lists) to map cleanly to Notion blocks.

## 5. Shadow DOM Traversal

**Description:** Improved extraction logic to support content within shadow DOM roots, ensuring that modern web components and encapsulated content are accessible to the extension.

**Notion considerations:**

- Shadow DOM visibility — bridge encapsulated content into plain DOM blocks so Notion receives textual content rather than component internals.
- Selector support — traversal augments selector resolution so users can target web-components for clean imports.

## 6. Accessibility Fallbacks

**Description:** When standard text extraction fails, the extension falls back to using `innerText` or ARIA attributes, improving reliability on dynamic or accessibility-focused sites.

**Notion considerations:**

- ARIA/semantics mapping — use ARIA labels and roles to preserve meaning when converting to Notion blocks.
- Fallback priority — prefer semantic content (headings, lists) so Notion receives well-structured blocks.

## 7. Bookmarklet Utilities

**Description:** Provides bookmarklets for quick access to core extension features, such as table-to-list conversion and diagnostics, without needing to open the extension popup.

**Notion considerations:**

- Quick-capture hygiene — bookmarklets expose the same extraction constraints (selectors, chunking) so captured content remains Notion-friendly.
- Minimal payloads — bookmarklets avoid large inline uploads; heavy operations defer to the extension background worker.

## 8. Diagnostics and Debugging Tools

**Description:** Includes tools for logging, diagnostics, and troubleshooting extraction issues, such as detailed error messages and content structure reports.

**Notion considerations:**

- API/error context — diagnostics surface Notion-specific failures (rate limits, malformed blocks) to guide fixes.
- Selector and block previews — show how extracted DOM will map to Notion blocks so users can tune selectors.

## 9. Restore and Recovery Tools

**Description:** Utilities for restoring previous states or recovering from failed saves, including scripts and documentation for manual recovery.

**Notion considerations:**

- Partial-restore limitations — Notion's API/state model may not support atomic rollbacks; recovery tools reconstruct content using saved payloads.
- Idempotence — restore operations are designed to be idempotent to avoid duplicate blocks in Notion.

## 10. Enhanced .gitignore Management

**Description:** Cleaned up and optimized the .gitignore file to prevent repository bloat and improve maintainability.

**Notion considerations:**

- N/A — repository maintenance does not affect Notion import behavior, but keeps developer tooling reliable for extension maintenance.

---

---

# Noteworthy Notion-Specific Considerations

Several features and implementation details were influenced by the unique capabilities and constraints of Notion. Below are some of the most important considerations that shaped the extension:

## Block-Based Content Model

**Consideration:** Notion organizes all content as blocks (paragraphs, lists, images, tables, etc.), which required transforming web content into discrete, compatible blocks. Features like table-to-list conversion and image handling were designed to ensure seamless mapping to Notion's block structure.

## Table and List Limitations

**Consideration:** Notion does not support all HTML table features (e.g., merged cells, complex nesting). The extension flattens or restructures tables and provides fallbacks to bullet lists to maintain readability and avoid data loss.

## Image Upload and Data URLs

**Consideration:** Notion requires images to be uploaded or referenced by URL. The extension converts inline images and data URLs into uploadable formats, and handles alt text to preserve accessibility.

## Pagination and Content Size Limits

**Consideration:** Notion has limits on the size of individual blocks and pages. Auto-pagination and content chunking features were implemented to avoid hitting these limits and to ensure large articles are saved in full.

## Selector Precision and Customization

**Consideration:** Notion's import is sensitive to content structure. Custom selector support and diagnostics were added to help users extract only the relevant content, avoiding unwanted formatting or extraneous elements.

## Accessibility and ARIA

**Consideration:** To ensure content is accessible in Notion, the extension uses ARIA attributes and accessibility fallbacks when extracting text, especially for dynamic or non-standard web pages.

## Shadow DOM and Web Components

**Consideration:** Many modern sites use shadow DOM, which can hide content from standard extraction methods. The extension traverses shadow roots to ensure all visible content can be captured and transferred to Notion.

## Rate Limits and API Constraints

**Consideration:** Notion's API and web interface may enforce rate limits or reject malformed content. The extension includes error handling, retries, and user feedback to address these issues.

---

For more details on each feature and consideration, see the corresponding documentation in the `docs/` folder or the relevant scripts in `dev-tools/`.
