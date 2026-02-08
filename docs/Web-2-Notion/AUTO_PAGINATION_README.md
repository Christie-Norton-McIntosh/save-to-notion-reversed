# Auto-Pagination Feature

## Overview

The Auto-Pagination feature allows you to automatically save multiple pages in sequence by:

1. Saving the current page to Notion
2. Automatically clicking a "next page" button
3. Repeating until all pages are saved or a limit is reached

This is perfect for saving documentation, articles with pagination, or any multi-page content.

## How to Use

### 1. Configure Auto-Pagination

1. Click the **⚡ Auto-Pagination** button in the extension popup
2. Or navigate directly to the auto-pagination settings page
3. Enter the CSS selector for the "next page" button (e.g., `ft-tooltip > button`, `.next-page-btn`, `button[aria-label="Next"]`)
4. Optionally adjust:
   - **Delay Before Next Page**: Time to wait after saving before clicking next (default: 2000ms)
   - **Maximum Pages**: Limit the number of pages to save (leave empty for unlimited)
5. Click **💾 Save Configuration**

### 2. Start Auto-Pagination

1. Click **▶️ Start Auto-Pagination**
2. The status will show "Auto-pagination active"
3. Go back to your page and use the extension popup to click **Save Page**
4. The extension will:
   - Save the current page
   - Wait for the specified delay
   - Click the "next" button
   - The page will navigate to the next page
   - You can click **Save Page** again to continue

### 3. Alternative: Fully Automated Mode

For a fully automated experience:

1. Start auto-pagination as described above
2. The extension will automatically trigger saves and navigation
3. You'll see toast notifications showing progress
4. The feature will stop automatically when:
   - The maximum page limit is reached
   - The "next" button is not found, disabled, or hidden
   - You manually stop it

### 4. Stop or Reset

- **⏹️ Stop**: Click to stop auto-pagination at any time
- **🔄 Reset Counter**: Reset the page counter back to 0

## Finding the CSS Selector

### Method 1: Browser DevTools

1. Open DevTools (F12 or right-click → Inspect)
2. Click the element picker tool (or press Ctrl+Shift+C)
3. Click on the "next page" button
4. In the Elements panel, right-click the highlighted element
5. Select **Copy → Copy selector**

### Method 2: Common Patterns

Try these common selectors:

- `button.next`
- `.pagination .next`
- `a[aria-label="Next"]`
- `button[title="Next page"]`
- `.pager-next`
- `#pagination-next`

### Shadow DOM Support

The extension automatically searches inside Shadow DOMs for elements. If your next button is inside a Web Component (like `ft-tooltip > button`), just use the selector as normal.

## Examples

### ServiceNow Documentation

```
Selector: ft-tooltip > button
Delay: 2000ms
Max Pages: 50
```

### Blog with pagination

```
Selector: .wp-pagenavi .nextpostslink
Delay: 1500ms
Max Pages: (unlimited)
```

### Documentation site

```
Selector: a[rel="next"]
Delay: 2000ms
Max Pages: 20
```

## Status Indicators

- **Green toast**: Auto-pagination is active
- **Red toast**: Auto-pagination stopped (no more pages or error)
- **Page counter**: Shows how many pages have been saved in the current session

## Tips

1. **Test First**: Before starting automation, manually test clicking the next button to ensure navigation works
2. **Adjust Delay**: If saves are failing, increase the delay to give more time
3. **Watch Progress**: Keep the browser tab visible to see the automation in action
4. **Check Notion**: Verify the first few pages save correctly before letting it run unattended
5. **Shadow DOM**: If the selector doesn't work, the button might be in a Shadow DOM - the extension will search there automatically

## Troubleshooting

### Button Not Found

- Double-check the CSS selector using DevTools
- Make sure the button exists on every page
- Try a more specific or less specific selector

### Automation Stops

- Check if the next button is disabled on the last page
- Increase the delay if pages are loading slowly
- Check browser console for error messages

### Pages Not Saving

- Manually test the Save Page feature first
- Ensure Notion is configured correctly
- Check that the page content is being extracted properly

## Technical Details

- **Storage**: Configuration is stored in the page's localStorage
- **State**: Page count and running state persist across page navigations
- **Injection**: The auto-pagination script is injected into each page automatically
- **Communication**: Uses Chrome extension messaging API for coordination

## Files

- `autoPagination.js` - Content script that handles automation
- `autoPagination.html` - Settings UI
- `autoPaginationUI.js` - Settings UI controller
- `autoPaginationShim.js` - Popup integration (adds button to popup)
- Updates to `serviceWorker.js` - Message handlers and script injection
- Updates to `manifest.json` - Added web accessible resources

## Future Enhancements

Potential improvements for future versions:

- Auto-detect pagination buttons
- Save progress/resume capability
- Batch saving (save multiple pages before user interaction)
- Custom selectors per site (automatically remembered)
- Visual picker for selecting next button
