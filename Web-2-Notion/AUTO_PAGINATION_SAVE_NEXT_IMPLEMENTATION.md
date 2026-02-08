# Auto-Pagination "Save & Next" Button Implementation

## What Was Implemented

A **manual semi-automated** pagination system with a floating "Save & Next" button that appears on pages when auto-pagination is active.

## How It Works

### User Flow

1. **Configure**: User opens Auto-Pagination settings and configures:
   - Next button CSS selector (e.g., `ft-tooltip > button`, `.next-btn`)
   - Delay before clicking next (default: 2000ms)
   - Max pages (optional)

2. **Start**: User sends a `startAutoPagination` message to the active tab
   - A floating purple "Save & Next" button appears in bottom-right corner
   - Button shows current page number

3. **Save & Next Cycle**:
   - User clicks extension icon and saves the page to Notion
   - User clicks the floating "Save & Next" button
   - Button waits 5 seconds (configurable)
   - Button automatically clicks the configured next button
   - Page navigates to next page
   - Button reappears on new page
   - Repeat!

### Key Features

- ✅ **Floating Button**: Always visible in bottom-right corner
- ✅ **Page Counter**: Shows "Page X" to track progress
- ✅ **Status Messages**: Shows what's happening
- ✅ **Disable State**: Button disables during navigation
- ✅ **Persistent**: Button persists across page navigations
- ✅ **Shadow DOM Support**: Finds next buttons even in shadow DOMs
- ✅ **Max Pages Limit**: Stops automatically when limit reached
- ✅ **Visual Feedback**: Hover effects, color changes, status text

## Files Modified

### `autoPagination.js`

Added:

- `createFloatingButton()` - Creates the UI
- `updateButtonCounter()` - Updates page number display
- `showButtonStatus()` - Shows status messages on button
- `disableButton()` - Disables/enables button
- `handleSaveAndNext()` - Main click handler
- `removeFloatingButton()` - Cleanup

Modified:

- `startAutoPagination()` - Now creates floating button instead of auto-triggering
- `stopAutoPagination()` - Now removes floating button
- `checkAutoStart()` - Shows button on page load if automation active

### `autoPagination.html`

Added:

- Clear step-by-step instructions
- Tips about button persistence
- Better visual hierarchy

## How to Use

### Method 1: Via Browser Console (For Testing)

```javascript
// 1. Inject the script
chrome.tabs.query({ active: true }, (tabs) => {
  chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    files: ["autoPagination.js"],
  });
});

// 2. Start auto-pagination
chrome.tabs.query({ active: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { action: "startAutoPagination" });
});
```

### Method 2: Via Extension Popup (Future Enhancement)

The popup integration (`autoPaginationShim.js`) needs to be connected to actually inject the script and start automation when user clicks the "⚡ Auto-Pagination" button.

## Current Limitations

1. **Manual Save Required**: User must manually click "Save Page" in the popup
   - This is intentional for this phase
   - Gives user control over what gets saved
   - Future: Can be automated

2. **Script Injection**: Currently requires manual console command
   - Need to wire up popup button to inject script
   - Need service worker handler

3. **No Save Detection**: System doesn't know when save completes
   - Uses fixed delay (5 seconds default)
   - Future: Listen for save completion event

## What Makes This Work

### State Persistence

Uses `chrome.storage.local` with two keys:

- `__stn_auto_pagination` - Configuration (selector, delays, max pages)
- `__stn_auto_pagination_state` - Runtime state (running, pageCount)

State persists across:

- Page navigations
- Browser restarts
- Tab switches

### Button Persistence

The `checkAutoStart()` function runs on every page load and checks if automation is active. If yes, it recreates the floating button automatically.

### Shadow DOM Support

The `findInShadowDOM()` function recursively searches through shadow roots up to 20 levels deep, which handles sites like ServiceNow that use shadow DOM for their UI.

## Testing

Use the included `AUTO_PAGINATION_QUICK_TEST.html` file:

1. Open the file in browser
2. Follow the on-page instructions
3. Test the Save & Next flow
4. Navigate through pages 1-5

## Next Steps (Future Enhancements)

### Phase 2: Full Automation

- Auto-trigger save action (no manual clicking)
- Detect save completion
- Automatic loop without user clicking button

### Phase 3: Service Worker Integration

- Add proper message handlers
- Wire up popup button
- Keyboard shortcut support
- Automatic script injection

### Phase 4: Advanced Features

- Pause/Resume functionality
- Save queue (batch processing)
- Error recovery
- Progress bar
- Parallel page processing

## Technical Notes

### CSS Styling

The button uses:

- Fixed positioning (bottom-right)
- Purple gradient matching extension theme
- Smooth transitions and hover effects
- High z-index (999999) to stay on top

### Event Handling

- Click handler with debouncing (disabled state)
- Async/await for chrome.storage operations
- setTimeout for delays
- Event cleanup on navigation

### Error Handling

- Checks if config exists before starting
- Validates next button selector
- Handles button not found
- Stops gracefully at max pages
- Shows user-friendly error messages

## Summary

This implementation provides a **working, usable solution** that gives users control while automating the repetitive clicking. It's a practical middle ground between fully manual and fully automatic, and can be enhanced incrementally to add more automation.

The "Save & Next" button makes multi-page saving much easier without requiring complex integration with the existing popup code or service worker.
