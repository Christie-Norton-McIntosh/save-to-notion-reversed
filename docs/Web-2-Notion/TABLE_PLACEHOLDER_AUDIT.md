# Table image placeholder audit — diagnosis, fixes, and recommendations

Status: draft ✅ — created to capture the investigation, the temporary fixes already applied, and the recommended permanent cleanup.

Summary

- Problem: image alt-text placeholders were being removed from table cells, causing table cell text to run together (e.g. "Enhance the service experienceAutomate support...").
- Root cause: multiple independent code paths insert different placeholder formats (bracketed `[alt]`, plain `alt`, and bullet-style `• alt •`). The paragraph post-processor (`SN`) removes bracketed placeholders when it classifies a paragraph as "figure-only". Table flows sometimes produced bracketed placeholders (or lost the table-origin marker), so placeholders got removed.
- Fix strategy: canonicalize table placeholders (single format + single producer), ensure table-origin markers exist, and make SN conservative about removing placeholders.

What this document contains

- Inventory of all placeholder producers
- Which producers are required for table flows
- Fixes applied in this workspace (so far)
- Recommended final cleanup (minimal-risk plan)
- How to reproduce and verify locally (commands & console logs)
- Tests added and how to run them

Inventory — where placeholders are produced

1. `Web-2-Notion/options.js` (content script) — _table sanitizeCell_

- What: Replaces images in table cells with a placeholder and preserves a hidden `<img>` for later extraction. Emits an `XCELLIDX` marker and stores original cell text in `window.__TABLE_CELL_CONTENT_MAP__`.
- Format historically: `[alt]` (legacy); canonicalized to `• alt •` for table flows.
- Table relevance: REQUIRED (canonical producer for table placeholders).
- Action: keep and harden (only produce canonical placeholder, always emit XCELLIDX when images present).

2. `Web-2-Notion/popup/static/js/main.js` — `tableToList` (popup-side table rule)

- What: Converts table → list/markdown, extracts images and (historically) injected placeholders into the cloned cell text.
- Problem: duplicated placeholder insertion (sometimes bracketed), causing SN to mis-handle and/or duplicate placeholders.
- Table relevance: primary converter, but its placeholder insertion is redundant if the content script already produced the canonical placeholder + marker.
- Action: remove redundant placeholder insertion; accept XCELLIDX when present. (Applied: now inserts bullet placeholder and deduplicates adjacent legacy placeholders.)

3. `Web-2-Notion/popup/static/js/main.js` — `CN` image case (inline-image conversion)

- What: Converts image nodes into inline alt-text rich-text (returns `"[alt]"` in CN). Correct for inline images in normal paragraphs.
- Table relevance: NOT required for tables and can _hurt_ table flows because SN filters bracketed placeholders.
- Action: keep for inline paragraphs but ensure CN output is ignored or normalized for table-origin content.

4. `Web-2-Notion/popup/static/js/main.js` — `SN` paragraph post-processor

- What: Detects paragraphs that contain only link-wrapped images and removes bracketed alt placeholders (intended for figure-only images).
- Problem: ran on table-derived paragraphs when the table-origin marker was absent or placeholders were bracketed.
- Action: made SN more conservative (preserve when `XCELLIDX` present, preserve when inline content contains real links, and avoid stripping bullet-style placeholders).

5. Legacy / scattered producers (tests, helpers, older code paths)

- What: multiple helpers/tests and some older inline flows still emit bracketed `[alt]` placeholders.
- Table relevance: generally NOT required for table flows and are a source of duplication.
- Action: normalize or guard these producers so they don't run for table cells.

Canonical decision (recommended)

- Canonical placeholder for table cells: `• ALT •` (bullet-style). Rationale: does not match SN's bracket-regex, visually distinct, preserves spacing.
- Canonical producer for table placeholders: **content-script** (`options.js`) — it runs in the page and can preserve link/DOM context and insert `XCELLIDX` markers.
- Popup (`tableToList`) should _not_ inject placeholders when `XCELLIDX` is present; only act as a fallback when no marker exists.

## Placeholder inventory — canonical names, locations and how to refer to them in chat

To avoid confusion in reviews and chat, use the canonical short names in the "Chat ref" column below. These names are concise, unambiguous, and map to a single behaviour (producer + consumer).

| Chat ref            |                         Visible form (example) | Code location (primary)                                                                                                                       | Producer (primary)                            | Affects / intent                                                                                           | Notes / migration status                                                                                                         |
| ------------------- | ---------------------------------------------: | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| TABLE:bullet        |                        • Automate IT service • | `Web-2-Notion/options.js` — sanitizeCell (tableWith/WithoutHeading)<br>`Web-2-Notion/popup/static/js/main.js` — tableToList (fallback/dedupe) | content-script (canonical); popup (fallback)  | Table-cell visible placeholder; spacing separator; clickable when wrapped by anchor                        | Canonical table placeholder — normalized across flows. Use this name in PRs/chat when discussing table placeholders.             |
| TABLE:bullet-linked |               <a> • Automate IT service • </a> | `Web-2-Notion/options.js` — sanitizeCell (wraps placeholder in anchor when imageLink present)                                                 | content-script                                | Clickable placeholder for linked images in table cells                                                     | Same visual token as TABLE:bullet but preserves anchor href. Refer to as TABLE:bullet-linked when link affinity matters.         |
| LEGACY:bracketed    |                          [Automate IT service] | `Web-2-Notion/popup/static/js/main.js` — CN(image) & other legacy inline flows                                                                | popup / legacy CN                             | Older inline placeholder; targeted by SN's figure-only removal rule                                        | SHOULD NOT be produced for table flows. CI asserts prevent bracketed placeholders in table output. Refer to as LEGACY:bracketed. |
| LEGACY:plain-alt    |       Automate IT service (plain text sibling) | various (anchor-to-text, list conversions in `main.js`)                                                                                       | multiple legacy producers                     | Occurs when alt/anchor text is left in DOM as plain text (can cause duplicates)                            | Not a separator — avoid relying on this for spacing. Chat ref: LEGACY:plain-alt.                                                 |
| MARKER:XCELLIDX     |  (invisible marker) `XCELLIDXCELL_xxxXCELLIDX` | `Web-2-Notion/options.js` — sanitizeCell (emits)<br>`Web-2-Notion/popup/static/js/main.js` — XCELLIDX expansion                               | content-script (emits marker)                 | Transports original cell content to popup; signals "from a table" to SN and prevents placeholder stripping | Primary mechanism to preserve provenance. Always reference MARKER:XCELLIDX when debugging end-to-end.                            |
| DATA:IMAGE          |    DATA_IMAGE_1707321234567_0 (placeholder id) | `Web-2-Notion/popup/static/js/main.js` — `processDataUrlPlaceholders`<br>`Web-2-Notion/tB()` (capture)                                        | capture/tB + popup.processDataUrlPlaceholders | Placeholder for data: URL images used during upload-replace workflow                                       | Part of data:URL upload lifecycle (`window.__dataUrlPlaceholders`). Chat ref: DATA:IMAGE.                                        |
| PRESERVE:IMG        | hidden <img data-stn-preserve="1"> (invisible) | `Web-2-Notion/options.js` — sanitizeCell (preservedImg)                                                                                       | content-script                                | Keeps an image node for later extraction while removing alt to avoid polluting textContent                 | Not visible to users — refer to as PRESERVE:IMG when talking about hidden preserved images.                                      |
| MD:IMAGE            |                 ![alt](https://...) (markdown) | `Web-2-Notion/popup/static/js/main.js` — image extraction / tableToList                                                                       | popup (converter)                             | Markdown representation of an extracted image (used when rendering after table)                            | Not a placeholder but important in image-extraction flows. Chat ref: MD:IMAGE.                                                   |

Best-practice shorthand (use these in chat and PRs)

- TABLE:bullet — canonical visible placeholder for table cells (use this when you mean the bullet-style placeholder)
- MARKER:XCELLIDX — use this when discussing provenance/why SN should preserve a paragraph
- DATA:IMAGE — use this when discussing data: URL placeholder/upload flows
- LEGACY:bracketed / LEGACY:plain-alt — call out as legacy when triaging regressions

Why this mapping matters

- Single source of truth: `TABLE:bullet` is the canonical placeholder for table flows and should be produced by `options.js` whenever possible.
- Disambiguation: talk about `MARKER:XCELLIDX` (not the visible placeholder) when you mean "this paragraph came from a table cell" — SN's behavior depends on that marker, not on the visible token alone.
- CI will block regressions that reintroduce `LEGACY:bracketed` into table outputs.

How to find these in the codebase

- To find the canonical producer: search for `XCELLIDX` or `data-stn-preserve` (content-script).
- To find popup-side handling: search `tableToList`, `processDataUrlPlaceholders`, or the `SN` paragraph processor in `popup/static/js/main.js`.

Quick debugging checklist

1. If a visible placeholder is missing, check `window.__TABLE_CELL_CONTENT_MAP__` for MARKER:XCELLIDX entries in the popup console. If present, the content-script did its job.
2. If MARKER:XCELLIDX is missing, inspect the content-script sanitize path (`options.js`) for the TD in question — ensure `data-stn-preserve` and canonical placeholder insertion ran.
3. If bracketed placeholders appear in table output, grep for `\[.*\]` producers (legacy paths) and prefer replacing them with TABLE:bullet.

Fixes applied in this branch / workspace

- Normalized table placeholders to `• ALT •` (content script + popup table flow).
- Added logic in `options.js` sanitizeCell to:
  - always generate a canonical placeholder for table cells with images,
  - store original cell text in `window.__TABLE_CELL_CONTENT_MAP__` and return an `XCELLIDX` marker,
  - normalize any pre-existing bracketed placeholders inside table cells to the bullet format.
- Modified `popup/static/js/main.js` (tableToList + SN):
  - tableToList: now inserts the bullet placeholder (and deduplicates nearby legacy placeholders); prefers anchor `href` only when it looks like a real image URL; respects `XCELLIDX`.
  - SN: will skip removal when `XCELLIDX` present, is more conservative about viewer/attachment links, and preserves inline content that contains real links.
- Added unit/regression test: `tests/test-servicenow-table-placeholder.js` (reproduces the ServiceNow table-cell case you provided).

Why duplicates happened (short)

- Multiple code paths intended for different contexts (inline vs table) produced placeholders with different formats.
- SN’s removal rule targets bracketed placeholders; if any flow produced `[alt]` for a table-origin paragraph, SN could eliminate it.
- The content script and popup both tried to be helpful; without a single canonical producer + marker, the flows conflicted.

How to reproduce locally (quick)

- Minimal reproduction (from repo root):
  - node tests/test-servicenow-table-placeholder.js
- Manual (browser):
  1. Open target ServiceNow page.
  2. Open DevTools (page console) and run the selector you supplied to get the TD innerHTML.
     - JS path (example):
       document.querySelector("#designed-reader-content").shadowRoot.querySelector("#iip26w")...querySelector("tr:nth-child(1)").innerHTML
  3. Clip the page with the extension and open the extension popup console. Check for these logs (they should appear in this sequence):
     - `[tableToList] Processing table image:`
     - `[tableToList] ✓ Added image markdown:`
     - `[tableToList] Inserting placeholder for image:` (should show the bullet placeholder)
     - _SN should NOT remove the placeholder for table-origin paragraphs._ If SN still logs the removal, check whether `XCELLIDX` is present.
  4. In popup console, run: `Object.keys(window.__TABLE_CELL_CONTENT_MAP__ || {}).slice(0,5)` — if present, print a stored cell: `window.__TABLE_CELL_CONTENT_MAP__[KEY]`.

What to look for in logs (diagnostic)

- Good: `XCELLIDX` marker present in the paragraph -> SN will preserve placeholder.
- Bad: any `[SN/Paragraph] Paragraph has only link-wrapped images ...` followed immediately by a removal of a bullet-style placeholder (that means SN is still over-aggressive).
- Sources: look for any `[...]` bracketed placeholder generation logs — that indicates a non-table path produced the bracketed form.

Tests added

- `tests/test-servicenow-table-placeholder.js` — reproduces the exact ServiceNow `<tr>` you supplied and asserts:
  - the canonical placeholder appears (`• Automate IT service •`), and
  - cell text does not run together (spacing preserved).
- Existing inline-image tests remain unchanged (CN image case still covered).

How to run tests locally

- node tests/test-servicenow-table-placeholder.js
- (run the inline-image suite if you want broader coverage) — see `tests/test-inline-images.js`.

Quick remediation options (pick one)

- A — Canonicalize content-script (recommended): keep `options.js` as the single producer for table placeholders; remove placeholder insertion from `tableToList` (popup) except as a fallback. (Low-risk; implemented in this branch.)
- B — SN guard-only (quick): make SN preserve any placeholder if the paragraph contains any link or if it came from a table. (Quicker but broader — may leave stray placeholders in non-table contexts.)
- C — CN refactor (larger): add a `fromTable` context flag to CN so callers explicitly request bracketed vs canonical placeholders. (More invasive.)

Planned next steps / PR checklist (recommended)

- [x] Add regression test for ServiceNow table cell (done).
- [x] Canonicalize table placeholders to bullet-style in `options.js` and `tableToList` (done).
- [x] Make SN conservative for table-origin paragraphs (done).
- [ ] Add an explicit unit test to assert SN does not remove bullet placeholders in table flows (I can add this next).
- [ ] Remove any remaining legacy bracketed placeholder insertion paths for table flows.
- [ ] Add CI assertion preventing regressions (no bracketed placeholders in table output).

If you want me to open a PR I will

- include the regression tests added here,
- include a short description and the risk/rollback notes,
- and assign reviewers. I can also include a single commit that removes redundant placeholder producers (preferred small PR).

Files you may want to review (quick links)

- `Web-2-Notion/options.js` — table sanitizer (canonical placeholder, XCELLIDX insertion)
- `Web-2-Notion/popup/static/js/main.js` — `tableToList`, `CN`, `SN` (paragraph logic)
- `tests/test-servicenow-table-placeholder.js` — new regression test

If you'd like I can now:

- (1) open a PR with the canonicalization + tests (recommended), or
- (2) add an extra SN-preserve test and harden the popup-side guards further, or
- (3) revert any changes and try a different canonical placeholder format.

Tell me which next step you want and I will implement it (PR + tests ready on request).
