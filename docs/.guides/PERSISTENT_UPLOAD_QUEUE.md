Persistent Upload Retry Queue

Overview

- When upload to Notion fails due to transient backend errors (e.g., 503/PgPoolWaitConnectionTimeout) or PUT failures, the extension will enqueue the upload request to chrome.storage.local and retry in background.

Behavior

- Enqueue conditions:
  - getUploadFileUrl failed after configured retries
  - PUT (signed upload) failed
- Enqueued entry fields: id, dataB64, name, record, userId, attempts, createdAt, lastAttemptAt
- Large payloads (>3MB base64) are not enqueued to avoid chrome.storage.local quota issues and will show a toast telling the user to retry manually.

Retry logic

- The service worker runs a processor that attempts queued uploads with a light concurrency (2) and exponential backoff capped at 1 hour.
- Each entry is retried up to 10 attempts; after that it will be dropped and the user will be notified.
- The processor runs at startup, every 5 minutes, and is triggered immediately when a new entry is enqueued.

User experience

- When an upload is enqueued, the user receives a toast notification: "Upload queued for retry (id: ...)"
- When a queued upload succeeds, the embedded block is updated with the uploaded file URL and (if available) the file ID; the user gets a success toast.
- When a queued upload fails permanently, the user gets an error toast.

Notes / Future work

- For very large files consider using IndexedDB or chunking to avoid storage quota issues.
- Add UI in popup/settings to view and manage the queued uploads (retry, cancel, view details).
- Consider using chrome.alarms API to guarantee periodic processing when service worker is inactive.
