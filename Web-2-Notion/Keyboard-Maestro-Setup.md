# Keyboard Maestro v11 Setup for ServiceNow Auto-Pagination

This guide shows how to create a Keyboard Maestro v11 macro that works with the Tampermonkey script to automate saving pages to Notion.

## Prerequisites

- Keyboard Maestro v11 installed on macOS
- Web-2-Notion extension installed
- Tampermonkey script installed and running on ServiceNow pages
- Google Chrome (or compatible Chromium browser)

## Macro Overview

The macro will:

1. Monitor for a red indicator circle appearing on the page (added by the script)
2. Click the Web-2-Notion extension icon in the browser toolbar
3. Wait for the popup to appear
4. Click the Save Page button in the popup
5. Wait for the save to complete (indicator disappears)

## Creating the Macro

### Step 1: Create New Macro

1. Open Keyboard Maestro v11
2. Click the **+** button in the Macros pane or use **File → New Macro**
3. Name it "ServiceNow Auto-Save"
4. Set the macro group (create a new group called "Web Automation" if desired)

### Step 2: Configure Trigger

For continuous monitoring, use the "While Logged In" trigger:

1. Click **Add Trigger** → **Login** → **While Logged In**
2. This keeps the macro active during your session

_Alternative: Use a hotkey trigger if you prefer manual activation_

### Step 3: Add Pause Until Condition

Use the improved JavaScript execution in KM v11:

1. Add action: **Control Flow** → **Pause Until**
2. Set **Pause Until**: "The following are true"
3. Add condition: **Execute JavaScript in Google Chrome**
   - **Execute JavaScript**:
     ```javascript
     return document.querySelector("#km-save-indicator") !== null;
     ```
   - **Result**: "is true"
   - **Browser**: "Google Chrome" (or your browser)
   - **Tab**: "Contains URL matching" `servicenow.com`

This reliably detects when the red indicator appears.

### Step 4: Click Extension Icon

Use the enhanced image recognition in KM v11:

1. Add action: **Interface Control** → **Click at Found Image**
2. **Find Image**: Capture screenshot of Web-2-Notion extension icon
   - Click **Take Screenshot** button
   - Position cursor over the extension icon in browser toolbar
   - Adjust **Similarity** to 90-95% for reliability
3. **Click**: "Click at found location"
4. **Search Area**: "Browser Windows" → "Google Chrome"
5. **If not found**: "Try again" (enable retry)

### Step 5: Wait for Popup

Add a brief pause for popup to appear:

1. Add action: **Control Flow** → **Pause**
2. **Pause for**: 0.5-1.0 seconds
3. **Or until conditions are met**: Enable
4. Add condition: **Found Image** → Capture popup appearance

### Step 6: Click Save Button

Use precise image matching for the save button:

1. Add action: **Interface Control** → **Click at Found Image**
2. **Find Image**: Capture screenshot of the Save Page button in popup
   - Open extension popup manually first
   - Click **Take Screenshot** button
   - Select the save button area
   - Set **Similarity** to 95%+
3. **Click**: "Click at found location"
4. **Search Area**: "Screen" (since popup may appear outside browser window)
5. **If not found**: "Try again" with 0.5s delay

### Step 7: Wait for Save Completion

Monitor for indicator removal:

1. Add action: **Control Flow** → **Pause Until**
2. Add condition: **Execute JavaScript in Google Chrome**
   - **Execute JavaScript**:
     ```javascript
     return document.querySelector("#km-save-indicator") === null;
     ```
   - **Result**: "is true"

### Step 8: Optional Safety Delay

1. Add action: **Control Flow** → **Pause**
2. **Pause for**: 1-2 seconds

## Advanced Configuration

### Macro Preferences (Gear icon)

- **Maximum Activation**: Set to reasonable limit (e.g., 1000) to prevent runaway
- **Enabled**: Check
- **Show in menu**: Uncheck (background macro)

### Error Handling

Add error handling for reliability:

1. After image actions, add **Control Flow** → **If Then Else**
2. **If**: "The last action failed"
3. **Then**: Add notification or retry logic

### Performance Optimization

- Use "Browser Windows" search area when possible (faster than full screen)
- Enable "Asynchronous" for non-blocking operations
- Set appropriate timeouts to prevent hanging

## Usage Instructions

1. Load ServiceNow page with pagination
2. Enable "Auto Loop" in Tampermonkey panel
3. Macro automatically triggers when red indicator appears
4. Process repeats: Save → Next → Save → Next...

## Troubleshooting v11 Specific Issues

### Image Recognition Problems

- Use **Image** → **Take Screenshot** for better capture
- Adjust **Color Tolerance** and **Scale Tolerance**
- Enable **Search for Image** → **Allow Scale** if UI scaling varies

### JavaScript Execution

- Ensure "Google Chrome" is selected as browser
- Use "Contains URL" with `servicenow.com` for tab targeting
- Check Console for JavaScript errors

### Timing Issues

- Use **Control Flow** → **Pause** with conditions
- Enable **Asynchronous** for overlapping operations
- Monitor with **Notification** actions for debugging

### Browser Compatibility

- KM v11 has improved Chromium support
- Use "Google Chrome" or "Microsoft Edge" as browser type
- For other browsers, use "Web Browser" generic type

## Alternative: Mouse Coordinate Method (Most Reliable)

For maximum reliability, use fixed coordinates:

1. Position browser window consistently (same size/position)
2. Use **Interface Control** → **Move and Click Mouse**
3. **Click at**: "Coordinates" → Get coordinates using KM's coordinate picker
4. **Relative to**: "Screen"

This method is immune to UI changes but requires consistent window positioning.
