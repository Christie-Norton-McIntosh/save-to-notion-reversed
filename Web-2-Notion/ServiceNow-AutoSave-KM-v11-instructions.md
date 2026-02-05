ServiceNow — Keyboard Maestro v11 macro (coordinate-based)

Files included:

- ServiceNow-AutoSave-KM-v11.xml — importable macro (placeholders for coordinates)

## Overview

This Keyboard Maestro macro automates the save->next cycle for ServiceNow pages by:

1. Calling the Tampermonkey page API: `window.__stn_signalSave()`
2. Waiting for the page to show the `#km-save-indicator`
3. Activating Google Chrome and triggering the extension via the keystroke Option+Shift+E
4. Clicking the Save button in the extension popup (image-recognition first, coordinate fallback)
5. Waiting for the indicator to disappear, then calling `window.__stn_nextPage()`

## Converting XML to .kmmacros Format

Keyboard Maestro's `.kmmacros` files are actually **XML files with a specific structure**. However, you cannot simply convert arbitrary XML into a working macro file — it must follow KM's exact schema.

### Understanding .kmmacros File Structure

A `.kmmacros` file is a **plist** (property list) XML file containing:

- **Root element**: `<plist version="1.0">`
- **Array of macros**: Each macro is a dictionary with specific keys
- **Actions array**: Each action within a macro has its own structure
- **Metadata**: UUIDs, creation dates, trigger configurations

Example structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<array>
  <dict>
    <key>Activate</key>
    <string>Normal</string>
    <key>CreationDate</key>
    <real>730000000.0</real>
    <key>Macros</key>
    <array>
      <dict>
        <key>Actions</key>
        <array>
          <!-- Action definitions here -->
        </array>
        <key>IsActive</key>
        <true/>
        <key>Name</key>
        <string>My Macro Name</string>
        <key>Triggers</key>
        <array>
          <!-- Trigger definitions here -->
        </array>
        <key>UID</key>
        <string>UNIQUE-UUID-HERE</string>
      </dict>
    </array>
    <key>Name</key>
    <string>Macro Group Name</string>
    <key>UID</key>
    <string>GROUP-UUID-HERE</string>
  </dict>
</array>
</plist>
```

### Can You Convert XML to .kmmacros?

**Short answer**: Only if your XML already follows Keyboard Maestro's specific plist schema.

**If you have KM-compatible XML:**

1. Ensure it has the correct plist structure shown above
2. Save the file with a `.kmmacros` extension
3. Import it into Keyboard Maestro normally

**If you have arbitrary XML or want to generate macros programmatically:**

- You'll need to construct the XML following KM's exact schema
- Each action type has specific required keys and value types
- UUIDs must be unique (use standard UUID v4 format)
- Dates are in Apple's NSDate format (seconds since 1 January 2001)

### Tools and Methods

**Method 1: Manual creation**

- Create a simple macro in KM Editor
- Export it as `.kmmacros`
- Open in a text editor to see the XML structure
- Use this as a template for your own XML generation

**Method 2: Scripting with JXA or AppleScript**

- Use Keyboard Maestro's scripting interface to create macros programmatically
- This is safer than manual XML generation
- Example JXA snippet:

```javascript
const app = Application("Keyboard Maestro Engine");
const editor = Application("Keyboard Maestro");

// Create macro via scripting
editor.make({
  new: "macro",
  withProperties: {
    name: "Generated Macro",
  },
});
```

**Method 3: Third-party tools**

- Some developers have created Python or JavaScript libraries for generating KM macros
- Search for "Keyboard Maestro macro generator" on GitHub
- These handle the XML structure complexity for you

### Important Warnings

- **Schema validation**: KM is strict about XML structure — incorrect formatting will fail silently or crash
- **Action IDs**: Each action type has a specific string identifier (e.g., "Type a Keystroke")
- **No documentation**: Keyboard Maestro's XML schema is not officially documented — reverse engineering is required
- **Version changes**: XML structure may change between KM versions

### Recommended Approach

Rather than converting external XML to `.kmmacros`, consider:

1. **Build macros in KM Editor** and export them
2. **Use KM's scripting interface** if you need programmatic creation
3. **Study exported macros** to understand the structure if you must generate XML manually
4. **Test thoroughly** — invalid XML can cause KM to behave unpredictably

If you have a specific XML format you're trying to convert, you'll need to write a custom parser that maps your XML structure to KM's plist schema — this is a non-trivial programming task.

Why coordinates?

- Coordinates are extremely reliable when your browser window is positioned consistently.
- After import you run KM's "Get Mouse Location" once to capture the exact points.

## Before you import

- Ensure Keyboard Maestro v11 has Accessibility permission (System Settings → Privacy & Security).
- Install and enable the Tampermonkey userscript `servicenow-automation.user.js` on ServiceNow pages.
- Open a ServiceNow page and open the extension popup so you can capture coordinates.

## Import + configure (quick)

1. In Keyboard Maestro: File → Import Macros... → select `ServiceNow-AutoSave-KM-v11.xml`.
2. Open the imported macro and configure the extension trigger and Save action:

- Extension trigger: the macro now sends the keystroke **Option+Shift+E** to open the Web-2-Notion popup — no toolbar coordinates required.
- Save action (image + fallback): add the Save-button image resource (name it **save-button.png**) and, optionally, replace `SAVE_BTN_X` / `SAVE_BTN_Y` with coordinates captured from your machine as a fallback.

### Quick embed (one command)

If you have the Save-button PNG locally you can embed it directly into the `.kmmacros` file so the import is plug-and-play. From the repository root run:

```bash
node ./Web-2-Notion/scripts/embed-kmm-image.js \
  ./Web-2-Notion/ServiceNow-AutoSave-KM-v11.kmmacros \
  /path/to/save-button.png \
  ./Web-2-Notion/ServiceNow-AutoSave-KM-v11.kmmacros
```

This replaces the placeholder inside the `.kmmacros` with the base64 image data (Keyboard Maestro stores images inline). After that you can import the `.kmmacros` directly.

### Add the Save-button image resource

1. Open the Web-2-Notion popup and take a tight screenshot of the **Save Page** button (you can use the attached sample image).
2. In Keyboard Maestro, open the imported macro, go to **Images** (Resources) and **Add Image** → name it **save-button.png**.
3. Optionally capture coordinates with **Get Mouse Location** (hover over Save in the popup) and paste into `SAVE_BTN_X` / `SAVE_BTN_Y`.

## How to get coordinates (one-time, optional fallback)

1. In KM, add an action **Interface Control → Get Mouse Location** and run it while your mouse is over the Save button in the open popup.
2. Copy the X/Y values into the macro's `SAVE_BTN_X` / `SAVE_BTN_Y` fields.
3. Remove or disable the temporary Get Mouse Location actions when finished.

## Optional: page-initiated synthetic keystroke

The userscript includes a best-effort option `trySyntheticKeystroke` that will attempt to synthesize Option+Shift+E when you click "Signal Save". Most browsers/extensions ignore synthetic keyboard events — prefer sending the keystroke from Keyboard Maestro. To enable from KM or the console:

- In KM (Execute JavaScript in Google Chrome): `window.__stn_setOption('trySyntheticKeystroke', true);`
- In the console: `window.__stn_setOption('trySyntheticKeystroke', true);`

Leave this disabled by default; KM's native keystroke is far more reliable.

## Testing

- Load a ServiceNow page.
- In the Tampermonkey panel, click "Signal Save" — you should see a red dot at top-left.
- Run the macro once (use `Try` in KM) — it should:
  - Activate Chrome
  - Send the keystroke Option+Shift+E to open the extension popup
  - Click the Save button (image-recognition preferred; coordinate fallback used if image not found)
  - Wait for the red dot to disappear
  - Trigger the page to navigate next

## Tuning

- If the popup is slow, increase the short pauses (0.5s → 1.0s).
- If the save takes longer, increase the PauseUntil timeout (30s by default).

## If import fails

Keyboard Maestro's XML format can be picky between versions. If import doesn't work, follow the step-by-step actions in the macro and recreate them manually in KM using the exact JavaScript strings below.

## JavaScript snippets (copy into KM actions)

- Signal save: window.\_\_stn_signalSave();
- Poll for indicator present: return document.querySelector('#km-save-indicator') !== null;
- Poll for indicator gone: return document.querySelector('#km-save-indicator') === null;
- Trigger next page: window.\_\_stn_nextPage();

Want me to also generate:

- (A) An image-based KM macro XML (I will include sample screenshots you must replace)
- (B) A ready-to-import KM macro with placeholder coordinates filled with values I pick from a sample window (you will still need to adjust)

Which of A/B (or neither)?
