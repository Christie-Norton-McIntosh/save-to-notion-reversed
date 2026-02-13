# Save to Notion Reversed

## Major Release (2026-02-13)

### Highlights
- **Placeholder & Parentheses Cleanup**: All legacy and diagnostic placeholder markers are now fully removed from Notion output. Stray empty parentheses `()` left behind after image/placeholder removal are robustly eliminated, including edge cases with zero-width spaces.
- **Regression Guards**: All cleanup helpers (`stripInlinePlaceholderTokens`, `stripEmptyParensFromTitle`, `ensureSegmentSpacing`) are now guarded to prevent accidental removal or regression.
- **Debug Output Removed**: All extra debugging output has been removed for production builds.
- **Extension Folder Slimmed**: Docs, backups, and test files have been moved out of the extension folder to reduce bulk and improve maintainability.

## Folder Structure
- `Web-2-Notion/` — Chrome extension source (minimal, production-ready)
- `docs/` — Documentation and guides
- `tests/` — Automated and manual test scripts
- `dev-tools/` — Development scripts, backups, and utilities

## Usage
- Install as a Chrome extension (see `Web-2-Notion/manifest.json`)
- Run tests with `npm test` or individual scripts in `tests/`

## Contributing
- Please see `docs/` for technical guides and contribution notes.

## License
MIT
