# Image Handling in Save-to-Notion Extension

## ✅ Markdown Images ARE Compatible with Notion (via this extension)

### How It Works

1. **Markdown Generation** (`main.js` - table processing):
   - Images are extracted as markdown: `![alt](url)`
   - This includes both regular extracted images and preserved inline images
   - Example: `"![Image description](https://example.com/image.jpg)"`

2. **Markdown to Notion Blocks** (`options.js` - `vC` function, line 23580):
   - The markdown string is parsed using a markdown parser
   - Images with `![...](...)`syntax are converted to image blocks
   - Images are tracked in `urlToUploadsMap` for uploading

3. **Image Block Creation** (`options.js` - `gC` function, line 23333):
   - Creates Notion image block structure:

   ```javascript
   {
     type: "image",
     properties: { source: [[imageUrl]] },
     format: { block_alignment: "left", block_width: width, ... }
   }
   ```

4. **File Upload** (`serviceWorker.js` - `Or` function / `uploadFile`):
   - Images marked with `needtouploadfile` are downloaded
   - Converted to base64 dataURLs
   - Uploaded to Notion's S3 bucket via `/getUploadFileUrl` API
   - Attached to blocks via `file_ids`

### Why Markdown Syntax is Used

- **Universal format**: Markdown is parsed consistently across the extension
- **Easy to generate**: Simple string concatenation from image elements
- **Notion API compatible**: Extension handles the conversion transparently
- **URL preservation**: Chrome extension URLs are fixed automatically (line 23630)

### Evidence from Codebase

**Existing markdown image generation** (line 91380):

```javascript
imagesInCell.forEach(function (item) {
  fallbackContent += "![" + item.alt + "](" + item.src + ")\n\n";
});
```

**Existing extraction logic** (line 91511):

```javascript
extractedImages.push("![" + alt + "](" + src + titlePart + ")");
```

**URL fixing** (options.js line 23630):

```javascript
e.replace(
  /!\[(.*?)\]\(chrome-extension:\/\/(.*?)\)/g,
  (e, t, n) => `![${t}](https://${n})`,
);
```

## ✅ The v5.0.7 Implementation is Correct

The preserved image extraction code I added follows the exact same pattern as existing code:

```javascript
var imageMarkdown = "![" + alt + "](" + src + ")";
imagesMarkdown += "\n\n" + imageMarkdown;
```

This is **identical** to how other images are handled throughout the codebase.

## Conclusion

**Markdown images ARE the correct format for this extension.** They are:

1. Generated as markdown strings in `main.js`
2. Parsed and converted to Notion blocks in `options.js`
3. Uploaded to Notion via the custom API in `serviceWorker.js`

The extension abstracts away the complexity of Notion's upload API and provides a developer-friendly markdown interface for content generation.
