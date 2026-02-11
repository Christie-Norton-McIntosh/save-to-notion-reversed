# Auto-Pagination Visual Guide

## UI Components

```
┌─────────────────────────────────────────────────────────┐
│              Extension Popup (index.html)                │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         [Save Page to Notion Button]           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │      ⚡ Auto-Pagination      │ Running (Page 5) │    │
│  │  [Click to open settings]    │   [Status]      │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
                       │
                       │ Click ⚡ button or press Ctrl+Shift+P
                       ▼
┌─────────────────────────────────────────────────────────┐
│          Auto-Pagination Settings (New Tab)              │
│                                                          │
│  Current Status                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Pages saved: 5                                   │   │
│  │ ● Running (Page 5)                               │   │
│  │ [▶️ Start] [⏹️ Stop] [🔄 Reset Counter]          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  Next Button CSS Selector *                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ft-tooltip > button                              │   │
│  └─────────────────────────────────────────────────┘   │
│  CSS selector for the "next page" button                │
│                                                          │
│  Delay Before Next Page (ms)                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 2000                                             │   │
│  └─────────────────────────────────────────────────┘   │
│  Time to wait after saving before clicking next         │
│                                                          │
│  Maximum Pages (optional)                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 50                                               │   │
│  └─────────────────────────────────────────────────┘   │
│  Stop after saving this many pages                      │
│                                                          │
│  [💾 Save Configuration]                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Automation Flow

```
START
  │
  ├─► 1. User configures auto-pagination
  │      - Enter CSS selector: "ft-tooltip > button"
  │      - Set delay: 2000ms
  │      - Set max: 50 pages
  │      - Click "Start"
  │
  ├─► 2. User navigates to first page
  │      - Content script auto-injected
  │      - State: running = true, pageCount = 0
  │
  ├─► 3. User clicks "Save Page" in popup
  │      - Extension saves page content
  │      - Sends to Notion
  │      - pageCount++ (now 1)
  │
  ├─► 4. Save completes
  │      - Service worker notifies content script
  │      - Toast: "Auto-pagination active (Page 1)"
  │
  ├─► 5. Content script waits
  │      - setTimeout(2000ms)
  │      - Shows countdown in console
  │
  ├─► 6. Find next button
  │      - Search regular DOM
  │      - If not found → search shadow DOMs
  │      - Validate: not disabled, not hidden
  │
  ├─► 7. Click next button
  │      - button.click()
  │      - Page navigates
  │
  ├─► 8. New page loads
  │      - Content script re-runs
  │      - State persists (running=true, pageCount=1)
  │      - Waits for next save...
  │
  └─► 9. Repeat steps 3-8 until:
         - pageCount reaches max (50)
         - Next button not found
         - Next button disabled
         - User clicks "Stop"
         - Toast: "Auto-pagination stopped"
```

## Shadow DOM Search

```
Document
  │
  ├─► querySelector("ft-tooltip > button")
  │   └─► Not found ❌
  │
  └─► querySelectorAll("*")  // Get all elements
       │
       ├─► <div> (no shadowRoot)
       │
       ├─► <my-component> (has shadowRoot)
       │     │
       │     └─► shadowRoot.querySelector("ft-tooltip > button")
       │          └─► Not found ❌
       │
       ├─► <ft-reader-topic-content> (has shadowRoot) ← DEPTH 1
       │     │
       │     └─► shadowRoot
       │           │
       │           ├─► querySelector("ft-tooltip > button")
       │           │   └─► Not found ❌
       │           │
       │           └─► querySelectorAll("*")
       │                 │
       │                 ├─► <div> (no shadowRoot)
       │                 │
       │                 ├─► <another-component> (shadowRoot) ← DEPTH 2
       │                 │     │
       │                 │     └─► shadowRoot...
       │                 │
       │                 └─► <ft-tooltip> (has shadowRoot) ← DEPTH 6
       │                       │
       │                       └─► shadowRoot.querySelector("button")
       │                            └─► FOUND! ✅
       │                                 │
       │                                 └─► Return <button> element
       │
       └─► <other-element>...
```

## Message Flow Diagram

```
┌──────────┐       ┌───────────────┐       ┌──────────────┐
│  Popup   │       │ Service Worker│       │Content Script│
└────┬─────┘       └───────┬───────┘       └──────┬───────┘
     │                     │                       │
     │  1. injectAutoPagination                   │
     ├────────────────────►│                       │
     │                     │                       │
     │                     │  2. ze("autoPagination.js")
     │                     ├──────────────────────►│
     │                     │                       │
     │                     │                  3. Script loads
     │                     │                  State: running=true
     │                     │                       │
     │  4. User clicks "Save Page"                │
     │  (Extension saves content)                 │
     │                     │                       │
     │  5. notifySaveComplete                     │
     ├────────────────────►│                       │
     │                     │                       │
     │                     │  6. saveComplete      │
     │                     ├──────────────────────►│
     │                     │                       │
     │                     │              7. Wait delay (2s)
     │                     │                       │
     │                     │              8. Find next button
     │                     │                       │
     │                     │              9. Click button
     │                     │                 (Page navigates)
     │                     │                       │
     │                     │          10. New page loads
     │                     │           Script re-runs
     │                     │              Waits for save...
     │                     │                       │
     │  11. User clicks "Save Page" again         │
     │  (Loop continues)                          │
     │                     │                       │
```

## Configuration Storage

```
Page's localStorage
  │
  ├─► __stn_auto_pagination
  │     {
  │       "nextButtonSelector": "ft-tooltip > button",
  │       "delayBeforeNext": 2000,
  │       "maxPages": 50
  │     }
  │
  └─► __stn_auto_pagination_state
        {
          "running": true,
          "pageCount": 5
        }

┌───────────────────────────────────┐
│ Why localStorage?                  │
├───────────────────────────────────┤
│ ✅ Persists across page navigations│
│ ✅ Per-site configuration          │
│ ✅ No backend storage needed       │
│ ✅ Fast access                     │
│ ✅ Content script can read directly│
└───────────────────────────────────┘
```

## Button Detection Logic

```
┌─────────────────────────────────────┐
│ findInShadowDOM(selector)           │
└───────────┬─────────────────────────┘
            │
            ├─► Try document.querySelector(selector)
            │     │
            │     ├─► Found? → Return element ✅
            │     └─► Not found? → Continue...
            │
            ├─► Get all elements: document.querySelectorAll("*")
            │
            ├─► Loop through each element:
            │     │
            │     ├─► Has shadowRoot?
            │     │     │
            │     │     ├─► Yes → Try shadowRoot.querySelector(selector)
            │     │     │           │
            │     │     │           ├─► Found? → Return element ✅
            │     │     │           └─► Not found? → Recurse deeper
            │     │     │                 │
            │     │     │                 └─► findInShadowDOM(selector, shadowRoot, depth+1)
            │     │     │                       │
            │     │     │                       ├─► depth > 20? → Stop (return null)
            │     │     │                       └─► Continue searching...
            │     │     │
            │     │     └─► No → Skip
            │     │
            │     └─► Next element...
            │
            └─► Not found in any shadow root → Return null ❌

┌─────────────────────────────────────┐
│ clickNextButton(selector)           │
└───────────┬─────────────────────────┘
            │
            ├─► button = findInShadowDOM(selector)
            │
            ├─► Button found?
            │     │
            │     ├─► No → Log error, return false ❌
            │     │
            │     └─► Yes → Continue...
            │
            ├─► Is button disabled?
            │     │
            │     └─► Yes → Log "reached end", return false ⚠️
            │
            ├─► Is button hidden?
            │     │
            │     └─► Yes → Log "reached end", return false ⚠️
            │
            └─► button.click() → return true ✅
```

## Example: ServiceNow Docs

```
Page Structure:
https://docs.servicenow.com/...
  │
  └─► <body>
        │
        ├─► <div class="content">
        │     └─► <article>...</article>
        │
        └─► <ft-reader-topic-content>  ← Web Component
              │
              └─► #shadow-root (open)    ← DEPTH 1
                    │
                    ├─► <div class="topic-body">...</div>
                    │
                    ├─► <ft-pagination>  ← Web Component
                    │     │
                    │     └─► #shadow-root (open)  ← DEPTH 2
                    │           │
                    │           └─► <div class="navigation">
                    │                 │
                    │                 └─► <ft-tooltip>  ← Web Component
                    │                       │
                    │                       └─► #shadow-root (open)  ← DEPTH 3
                    │                             │
                    │                             └─► <button>Next</button>  ← TARGET!
                    │                                   │
                    │                                   └─► Selector: "ft-tooltip > button"
                    │                                       (But must search shadow roots!)
                    │
                    └─► <div class="footer">...</div>

Auto-pagination finds this button by:
1. Search document → Not found
2. Search all shadow roots recursively
3. Find ft-tooltip shadow root at depth 3
4. querySelector("button") inside that shadow root
5. ✅ Found! Click it!
```

## Toast Notifications

```
┌─────────────────────────────────────┐
│ Toast: Auto-pagination active (Page 1) │  ← Top-right corner
└─────────────────────────────────────┘
         │
         ├─► Green background (#4CAF50)
         ├─► White text
         ├─► Fade in animation (slideIn)
         ├─► Display for 3 seconds
         └─► Fade out animation (slideOut)

Events that trigger toasts:
✅ "Auto-pagination active (Page N)" - After starting and after each save
⚠️  "Auto-pagination stopped - no more pages" - When next button not found
⚠️  "Auto-pagination stopped" - When user stops manually
✅ "Auto-pagination complete - saved N pages" - When max pages reached
```

## Keyboard Shortcuts

```
┌──────────────────────────────────────────┐
│ Ctrl+Shift+P (Windows/Linux)             │
│ Command+Shift+P (Mac)                    │
│                                          │
│ Opens: autoPagination.html               │
│ Handler: serviceWorker.js → lc()        │
│ Command: "open-auto-pagination"          │
└──────────────────────────────────────────┘
```

## Error Handling

```
Try/Catch Blocks:

1. findInShadowDOM()
   └─► try { querySelector() }
       catch { return null }  // Invalid selector

2. getConfig()
   └─► try { JSON.parse() }
       catch { return null }  // Corrupted data

3. setState()
   └─► try { localStorage.setItem() }
       catch { console.error() }  // Storage full

4. clickNextButton()
   └─► try { button.click() }
       catch { return false }  // Element no longer in DOM

Safety Limits:

1. Shadow DOM depth: max 20 levels
   └─► Prevents infinite loops

2. Max pages: user-configurable
   └─► Prevents runaway automation

3. Button validation
   └─► Checks disabled/hidden state
```

## Performance Profile

```
Memory Usage:
├─► localStorage: ~500 bytes per site
├─► Toast elements: ~1KB (temporary)
└─► State object: ~100 bytes

CPU Usage:
├─► Idle: 0% (waiting for messages)
├─► Finding button: <1% (quick DOM search)
└─► Clicking button: <0.1% (single click)

Network:
└─► 0 requests (all local)

DOM Impact:
├─► 1 <style> element (animations)
└─► 1-2 toast <div>s (temporary)
```

This visual guide provides a comprehensive overview of how the auto-pagination feature works at every level!
