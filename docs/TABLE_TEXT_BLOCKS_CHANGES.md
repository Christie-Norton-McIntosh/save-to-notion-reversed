# Table Conversion Changes - Text Blocks Instead of Bullets

## Date

February 10, 2026

## Summary

Modified table conversion to create **plain text blocks** instead of bullet list items. Each `<p>` tag in a table cell now becomes a separate Notion text block. Horizontal dividers (`---`) between rows are preserved.

## Changes Made

### 1. Removed Bullet Placeholders

**Before:** Images were replaced with `• alt text •` placeholders
**After:** Images are removed cleanly without adding placeholder text

### 2. Files Modified

#### `/Web-2-Notion/popup/lib/table-to-list-utils.js`

- **Line ~31-45**: Removed bullet placeholder insertion for images inside `<p>` tags
- **Line ~54-60**: Removed bullet placeholder for images outside `<p>` tags
- **Line ~29-38**: Added processing for direct child images (not inside `<p>`) when cell has paragraphs

#### `/Web-2-Notion/popup/static/js/main.js`

- **Line ~91085-91100**: Removed bullet placeholder for images in paragraph-aware processing
- **Line ~91467-91482**: Removed bullet placeholder for images in non-paragraph cells
- **Line ~91420-91437**: Removed bullet placeholder for images in legacy single-block cells
- **Line ~91086-91094**: Added processing for direct child images when cell has paragraphs

### 3. Behavior Changes

#### Image Handling

- **Old behavior**: `<img alt="Icon" src="...">` → `• Icon • ` (visible bullet placeholder)
- **New behavior**: `<img alt="Icon" src="...">` → (removed, only markdown `![Icon](...)` in output)

#### Paragraph Processing

Each `<p>` tag in a table cell becomes a separate text block in Notion:

```html
<td>
  <p>First paragraph</p>
  <p>Second paragraph</p>
</td>
```

Converts to markdown:

```
First paragraph

Second paragraph
```

Which creates two separate Notion text blocks.

#### Row Separators

Horizontal dividers (`---`) between table rows are **preserved**, creating visual separation in Notion.

### 4. Test Coverage

Created comprehensive test: `tests/test-table-text-blocks.js`

Tests verify:

- ✅ Multiple `<p>` tags create separate blocks
- ✅ No bullet placeholders for images
- ✅ Images generate markdown without placeholders
- ✅ XCELLIDX markers are preserved
- ✅ Empty cells handled correctly
- ✅ Mixed content (images + text) processed correctly

All tests passing.

## Expected Notion Output

**Table with:**

```html
<table>
  <tr>
    <td>
      <img src="..." alt="Icon" />
      <p>Text 1</p>
      <p>Text 2</p>
    </td>
  </tr>
  <tr>
    <td><p>Row 2 content</p></td>
  </tr>
</table>
```

**Converts to Notion blocks:**

1. Image block (Icon)
2. Text block (Text 1)
3. Text block (Text 2)
4. Divider
5. Text block (Row 2 content)

## Benefits

1. **Cleaner text**: No bullet symbols (•) cluttering the text
2. **Better structure**: Each HTML paragraph becomes a distinct Notion block
3. **Proper spacing**: Content flows naturally with dividers between rows
4. **Images preserved**: Images still converted to markdown and uploaded to Notion
5. **Backwards compatible**: XCELLIDX markers and preserved images still work

## Testing

Run the test suite:

```bash
node tests/test-table-text-blocks.js
```

## Notes

- The `---` horizontal dividers between rows are intentionally kept to provide visual separation between table rows in the Notion output
- Images are still extracted and converted to Notion image blocks, just without visible bullet placeholders in the text
- This change only affects the table-to-list conversion; other conversion paths remain unchanged
