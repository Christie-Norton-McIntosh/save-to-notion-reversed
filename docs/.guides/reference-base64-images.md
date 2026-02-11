Based on the Notion API documentation, here's how to fill in those missing steps for uploading base64/data:URL images:

### Missing Step 5: Upload the data:URL and get back a real URL

For each data:URL in your `urlToUploadsMap`:

**A. Convert base64 to binary:**[[1]](https://www.notion.so/Untitled-746e10e7cc81451b8b9395c57823295d?pvs=21)

```jsx
// Extract the base64 data from data:URL
const base64Data = dataUrl.split(",")[1];
const mimeType = dataUrl.match(/data:([^;]+);/)[1];
const buffer = Buffer.from(base64Data, "base64");
```

**B. Create a File Upload object:**

```jsx
const createResponse = await fetch("https://api.notion.com/v1/file_uploads", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${notionToken}`,
    "Notion-Version": "2022-06-28",
  },
});
const { id: fileUploadId, upload_url } = await createResponse.json();
```

**C. Send the file content:**[[2]](https://www.notion.so/Image-Test-Page-251a89fedba58020b986d961cef71947?pvs=21)

```jsx
const form = new FormData();
form.append("file", buffer, {
  filename: "image.png", // or extract from context
  contentType: mimeType,
});

await fetch(upload_url, {
  method: "POST",
  body: form,
  headers: {
    Authorization: `Bearer ${notionToken}`,
    "Notion-Version": "2022-06-28",
  },
});
```

### Missing Step 6: Replace data:URL with the file_upload ID

In your image blocks, replace the data:URL with the file upload reference:

```jsx
{
  "type": "image",
  "image": {
    "type": "file_upload",
    "file_upload": {
      "id": fileUploadId  // from step 5B
    },
    "caption": []
  }
}
```

The key is that Notion doesn't accept data:URLs directly—you must use the **File Upload API** to convert them to `file_upload` type blocks with the returned ID.[[1]](https://www.notion.so/Untitled-746e10e7cc81451b8b9395c57823295d?pvs=21)
