# Table Conversion Improvements

## Changes Made (January 27, 2026)

Added comprehensive cell sanitization and nested content handling to the table-to-markdown conversion rule to fix "malformed table content" errors in Notion.

### Improvements

1. **Cell Sanitization**
   - Remove `<script>` and `<style>` tags from cells
   - Clone cells before processing to avoid DOM modifications
   - Normalize whitespace (collapse multiple spaces/newlines to single space)
   - Escape special markdown characters: `|` → `\\|`, `` ` `` → ``\\` ``
   - Limit cell length to 500 characters to prevent oversized cells

2. **Nested List Handling**
   - Convert nested `<ul>` and `<ol>` lists to inline comma-separated text
   - Example: `<ul><li>item1</li><li>item2</li></ul>` → `"item1, item2"`
   - Prevents markdown list syntax from breaking table structure

3. **Line Break Handling**
   - Convert `<br>` tags to spaces
   - Prevents newlines from creating malformed table rows

4. **Column Normalization**
   - Ensure all rows have the same column count
   - Pad short rows with empty strings
   - Prevents ragged tables that break markdown parsing

### Example Conversion

**Before (problematic):**

```
| Task | Requirements |
| --- | --- |
| View calendar | itil, rota_manager
Create policies | • Policy A
• Policy B |
```

**After (clean):**

```markdown
| Task            | Requirements       |
| --------------- | ------------------ |
| View calendar   | itil, rota_manager |
| Create policies | Policy A, Policy B |
```

### Files Modified

- `Web-2-Notion/options.js` - Added `sanitizeCell()` helper and improved `tableWithHeading` rule
- `Web-2-Notion/popup/static/js/main.js` - Applied same improvements to bundled version

### Technical Notes

- Applies to tables with explicit headers (`<thead>` or first row with `<th>` elements)
- Tables without headers use existing fallback conversion
- Cell content is processed recursively to handle deeply nested structures
- All whitespace normalization happens after nested element conversion

### Testing Recommendations

1. Test with ServiceNow documentation tables (nested lists, long cells)
2. Verify tables with mixed content (images, links, code)
3. Check tables with uneven column counts
4. Test with tables containing special characters

### Future Enhancements

- Add option to preserve nested lists as sub-bullets (requires multi-line cell support)
- Detect 2-column key/value tables and convert to definition lists
- Support colspan/rowspan attributes
- Add native Notion table block creation for better fidelity
