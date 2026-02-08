# Data URL Image Placeholder Implementation

## Version: 5.2.16

## Overview

This version implements a **two-stage approach** for handling data: URL images (base64-encoded inline images):

1. **Stage 1 - Page Creation**: Replace data: URLs with visible placeholder text blocks
2. **Stage 2 - Post-Save**: Replace placeholder blocks with actual uploaded images

## Why This Approach?

Notion's File Upload API requires an existing block ID to upload files. We cannot upload images before the page exists. Previous attempts to create blocks with `needToUploadFile` flags failed because that structure doesn't match Notion's API expectations.

The placeholder approach solves this by:

- Creating the page with text placeholders (which Notion accepts)
- After the page exists, finding those placeholder blocks
- Uploading images and replacing the placeholder blocks with image blocks

## Implementation Details

### 1. Markdown Processing (`main.js` - `tB` function)

When processing markdown:

```javascript
// Extract data: URLs
const dataUrlRegex = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/g;

// Create unique placeholders
const placeholderId = `DATA_IMAGE_${Date.now()}_${index}`;
const placeholderText = `[🖼️ Image placeholder: ${alt || "embedded image"}]`;

// Store mapping
window.__dataUrlPlaceholders[placeholderId] = {
  dataUrl: item.dataUrl,
  alt: item.alt,
  placeholderText: placeholderText,
};

// Replace in markdown
cleanedMarkdown = cleanedMarkdown.replace(item.fullMatch, placeholderText);
```

The placeholders are stored in `window.__dataUrlPlaceholders` for access after page creation.

### 2. Global Trigger Function (`main.js`)

A global function is exposed to trigger the replacement:

```javascript
window.processDataUrlPlaceholders = async function (pageId, spaceId) {
  // Send message to service worker
  const response = await chrome.runtime.sendMessage({
    action: "replaceDataUrlPlaceholders",
    pageId: pageId,
    spaceId: spaceId,
    placeholderMap: window.__dataUrlPlaceholders,
  });
};
```

### 3. Service Worker Handler (`serviceWorker.js`)

The service worker handles the replacement:

```javascript
replaceDataUrlPlaceholders: async (e, t) => {
  // 1. Get Notion client
  const notionClient = new ce({
    token: plClient.authToken,
    activeUserId: plClient.agent.activeUserId,
  });

  // 2. Load page blocks
  const pageData = await notionClient.post("/loadPageChunk", {
    pageId: e.pageId,
    limit: 100,
    // ...
  });

  // 3. Find placeholder text blocks
  for (const blockId in blocks) {
    const block = blocks[blockId].value;
    if (block.type === "text" && block.properties?.title) {
      const blockText = block.properties.title[0]?.[0];
      // Match against placeholder text
    }
  }

  // 4. Upload images and replace blocks
  for (const replacement of replacements) {
    // Upload file
    const uploadResult = await notionClient.custom.uploadFile({
      imageBase64: replacement.dataUrl,
      record: {
        id: replacement.blockId,
        table: "block",
        spaceId: e.spaceId,
      },
    });

    // Update block type from text to image
    await notionClient.post("/submitTransaction", {
      transactions: [
        {
          operations: [
            {
              id: replacement.blockId,
              command: "update",
              args: {
                type: "image",
                properties: {
                  source: [[uploadResult.url]],
                  ...(replacement.alt && { caption: [[replacement.alt]] }),
                },
              },
            },
          ],
        },
      ],
    });
  }
};
```

## Usage

### Automatic (Future Enhancement)

To make this automatic, we need to hook into the save completion callback:

1. Find where the page save completes with the page ID and space ID
2. Check if `window.__dataUrlPlaceholders` exists
3. If yes, automatically call `window.processDataUrlPlaceholders(pageId, spaceId)`

**Challenge**: The save flow in `main.js` is complex and minified. We need to find the right callback point.

### Manual (Current Implementation)

After saving a page to Notion:

1. Open browser console (F12)
2. Find the page ID from the Notion URL or internal state
3. Find the space ID (workspace ID)
4. Run:

```javascript
window.processDataUrlPlaceholders("YOUR_PAGE_ID", "YOUR_SPACE_ID");
```

Example:

```javascript
// Page URL: https://www.notion.so/workspace/Test-Page-abc123def456
const pageId = "abc123def456"; // Extract from URL
const spaceId = "xyz789"; // Get from Notion workspace settings

window.processDataUrlPlaceholders(pageId, spaceId);
```

## Testing

Use the `DATA_URL_PLACEHOLDER_TEST.html` file:

1. Load the test page in Chrome
2. Use Web-2-Notion extension to capture the page
3. Save to Notion
4. Check console logs for placeholder creation
5. Get page ID and space ID from saved page
6. Run `window.processDataUrlPlaceholders(pageId, spaceId)`
7. Refresh the Notion page to see replaced images

### Expected Console Output

**During page capture:**

```
[tB] Found 2 data: URLs to process as placeholders
[tB] Created placeholder DATA_IMAGE_1707321234567_0 for: Red Square
[tB] Created placeholder DATA_IMAGE_1707321234567_1 for: Blue Square
[tB] Stored 2 placeholder mappings for post-page-creation upload
```

**After calling processDataUrlPlaceholders:**

```
[processDataUrlPlaceholders] Processing placeholders for page: abc123def456
[processDataUrlPlaceholders] Placeholder count: 2
[ServiceWorker] replaceDataUrlPlaceholders message received
[ServiceWorker] Page ID: abc123def456
[ServiceWorker] Placeholder count: 2
[ServiceWorker] Fetching page blocks...
[ServiceWorker] Searching 15 blocks for placeholders
[ServiceWorker] Found placeholder block: block-id-1 => Red Square
[ServiceWorker] Found placeholder block: block-id-2 => Blue Square
[ServiceWorker] Found 2 placeholder blocks to replace
[ServiceWorker] Uploading image for block: block-id-1
[ServiceWorker] Upload successful: https://s3.amazonaws.com/...
[ServiceWorker] Replaced placeholder with image: block-id-1
[ServiceWorker] Uploading image for block: block-id-2
[ServiceWorker] Upload successful: https://s3.amazonaws.com/...
[ServiceWorker] Replaced placeholder with image: block-id-2
[processDataUrlPlaceholders] Successfully replaced 2 placeholder blocks
```

## Next Steps

### To Make It Automatic:

1. **Find save completion point**: Search for where the page is successfully saved and the page ID becomes available
2. **Add auto-trigger**: Call `window.processDataUrlPlaceholders(pageId, spaceId)` at that point
3. **Error handling**: Add retry logic if page blocks aren't immediately available

### Potential Locations to Hook:

- After `_submitTransaction` completes
- In save success callback
- After `notionPage.save()` call
- In React component's save handler (if using React)

### Alternative Approach:

Instead of storing in `window.__dataUrlPlaceholders`, we could:

- Store in Chrome storage API (persists across page reloads)
- Store in localStorage with page ID as key
- Use a service worker variable

This would allow the replacement to happen even if the popup is closed after saving.

## Troubleshooting

### Placeholders Not Found

- Check if page ID and space ID are correct
- Verify placeholders were created (check `window.__dataUrlPlaceholders`)
- Ensure page has finished saving before calling replacement

### Upload Fails

- Check Notion authentication (must be logged in)
- Verify data: URL format is correct
- Check space permissions

### Blocks Not Replaced

- Verify placeholder text matches exactly
- Check if blocks were found (console logs show "Found X placeholder blocks")
- Ensure `submitTransaction` completes successfully

## API Reference

### window.processDataUrlPlaceholders(pageId, spaceId)

Processes all stored data: URL placeholders for a specific page.

**Parameters:**

- `pageId` (string): The Notion page ID (UUID without dashes)
- `spaceId` (string): The Notion workspace/space ID (UUID without dashes)

**Returns:** Promise<void>

**Example:**

```javascript
await window.processDataUrlPlaceholders("abc123", "xyz789");
```

### Chrome Message: replaceDataUrlPlaceholders

Service worker message handler for replacing placeholders.

**Message Format:**

```javascript
{
  action: "replaceDataUrlPlaceholders",
  pageId: "abc123",
  spaceId: "xyz789",
  placeholderMap: {
    "DATA_IMAGE_1707321234567_0": {
      dataUrl: "data:image/png;base64,...",
      alt: "Red Square",
      placeholderText: "[🖼️ Image placeholder: Red Square]",
    },
    // ...
  },
}
```

**Response:**

```javascript
{
  success: true,
  replacedCount: 2,
}
// OR
{
  success: false,
  error: "Error message",
}
```

## File Changes

### Modified Files:

1. `Web-2-Notion/popup/static/js/main.js`
   - Added `window.processDataUrlPlaceholders` function
   - Modified `tB` function to create placeholders instead of removing images

2. `Web-2-Notion/serviceWorker.js`
   - Added `replaceDataUrlPlaceholders` message handler

3. `Web-2-Notion/manifest.json`
   - Updated version to 5.2.16

### New Files:

1. `Web-2-Notion/DATA_URL_PLACEHOLDER_TEST.html`
   - Test page with instructions and examples

2. `Web-2-Notion/DATA_URL_PLACEHOLDER_IMPLEMENTATION.md`
   - This documentation file
