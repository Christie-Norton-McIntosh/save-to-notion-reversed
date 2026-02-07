# Testing Instructions for Image Processing (v5.2.3)

## What Changed in v5.2.3

Added detailed **console.debug** logging to track image processing through the entire pipeline:

- `[Image Rule]` - Logs for inline images
- `[tableToList]` - Logs for images in tables

## How to Test

### 1. Reload the Extension

1. Open Chrome: `chrome://extensions`
2. Click "Reload" on Web-2-Notion extension
3. Verify version shows **5.2.3**

### 2. Open a ServiceNow Page with Images

Example: A knowledge base article with tables and inline images

### 3. Open Chrome DevTools

- Press `F12` or `Cmd+Option+I` (Mac)
- Go to **Console** tab
- Click "Default levels" dropdown and ensure **"Verbose"** is checked (to see console.debug logs)

### 4. Trigger the Extension

- Click the Web-2-Notion extension icon, or
- Use keyboard shortcut to clip content

### 5. Watch the Console

You should see logs like:

```
[Image Rule] Processing image: {
  alt: "home icon",
  srcAttr: "https://www.servicenow.com/docs/internal/api/webapp/splash-image?v=05a6891c",
  srcProp: "https://www.servicenow.com/docs/internal/api/webapp/splash-image?v=05a6891c",
  dataOriginalSrc: null,
  finalSrc: "https://www.servicenow.com/docs/internal/api/webapp/splash-image?v=05a6891c",
  parent: "DIV"
}
[Image Rule] Final markdown: ![home icon](https://www.servicenow.com/docs/internal/api/webapp/splash-image?v=05a6891c)
```

For tables:

```
[tableToList] Processing table
[tableToList] Processing table image: {
  srcAttr: "https://example.com/image.png",
  srcProp: "https://example.com/image.png",
  dataOriginalSrc: null,
  alt: "Example",
  initialSrc: "https://example.com/image.png",
  parent: "A"
}
[tableToList] ✓ Added image markdown: ![Example](https://example.com/image.png)
```

### 6. Check for Problems

#### If you see empty markdown:

```
[Image Rule] Final markdown: ![]()
```

**Problem:** Image URL is empty or filtered out

- Check the `finalSrc` value in the first log
- Is it empty? Then the image has no src attribute
- Is it a data: URL but not included? Check browser security policies

#### If you see images skipped:

```
[tableToList] ✗ Skipped image (URL not accepted): /relative/path.png
```

**Problem:** URL didn't pass the http/https/data: filter

- Should have been converted to absolute URL first
- Check if URL conversion code ran (look for "Converted relative URL" log)

#### If you don't see any image logs:

**Problem:** Images not being processed at all

- Check if scanWebpage.js extracted the images from the DOM
- Look for Shadow DOM logs: `[scanWebpage] Has Shadow DOM: true`
- ServiceNow pages need up to 30 seconds to load images in Shadow DOM

### 7. Copy the Logs

When you see the issue:

1. Right-click in Console
2. Select "Save as..."
3. Save the console log file
4. Or copy/paste relevant logs

## What to Look For

### ✅ Success Pattern

```
[Image Rule] Processing image: { ... }
[Image Rule] Final markdown: ![alt](https://full-url.com/image.png)
```

### ❌ Empty Parentheses (Inline Images)

```
[Image Rule] Processing image: { finalSrc: "" }
[Image Rule] Final markdown: ![alt]()
```

→ Image URL is empty or being filtered

### ❌ Skipped Images (Tables)

```
[tableToList] Processing table image: { initialSrc: "..." }
[tableToList] ✗ Skipped image (URL not accepted): ...
```

→ URL doesn't start with http/https/data:

### ❌ No Logs at All

→ Images not being found in DOM, possibly Shadow DOM timing issue

## Next Steps

Based on the console logs, we can identify:

1. **Where** images are being lost (extraction, conversion, or filtering)
2. **Why** they're being filtered (URL format issue)
3. **When** they're disappearing (before or after markdown conversion)

Share the console logs to get targeted fixes!
