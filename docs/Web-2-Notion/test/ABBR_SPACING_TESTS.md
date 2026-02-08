# Abbr Spacing Regression Tests - Quick Reference

## Run All Tests

```bash
npm run test-abbr-spacing
```

## Run Individual Tests

```bash
# Test stripMultispaces function (scanWebpage.js line ~12023)
npm run test-abbr-spacing-stripMultispaces

# Test applyCustomFormatting whitespace cleanup (scanWebpage.js line ~14851)
npm run test-abbr-spacing-applyCustomFormatting
```

## What These Tests Protect Against

### Issue

Spaces around special characters (>, <, &, |) in inline elements getting removed:

- ❌ BAD: `Workspaces>Service Operations Workspace`
- ✅ GOOD: `Workspaces > Service Operations Workspace`

### Protected Elements

- `<abbr>` - abbreviations (most common case)
- `<span>` - generic inline containers
- `<em>` - emphasis
- `<strong>` - strong emphasis
- `<b>` - bold
- `<i>` - italic
- `<code>` - code snippets

### Protected Special Characters

- `>` - greater than (breadcrumbs, arrows)
- `<` - less than
- `&` - ampersand
- `|` - pipe (separators)

## When to Run These Tests

✅ **ALWAYS run before committing changes to:**

- `scanWebpage.js` - especially whitespace-related functions
- Any HTML cleaning/sanitization code
- Whitespace normalization logic

✅ **Run as part of CI/CD:**

```bash
npm test  # Includes abbr spacing tests
```

## Test File Locations

`tests/test-scanwebpage-abbr-spacing.js` - 4 test cases
`tests/test-applyCustomFormatting-abbr-spacing.js` - 13 test cases

## Expected Results

Both test files should show:

```
✅ All tests passed!
```

If you see failures, the fix has regressed. Check:

1. `stripMultispaces` function (~line 12023)
2. `applyCustomFormatting` whitespace cleanup (~line 14851)

## Documentation

See `ABBR_SPACING_FIX.md` for complete fix details, root cause analysis, and technical implementation.
