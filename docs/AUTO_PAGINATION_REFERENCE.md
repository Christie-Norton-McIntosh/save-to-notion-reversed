# 🎯 Auto-Pagination Quick Reference Card

## Essential Commands

### Start Automation

```javascript
// From popup: Click "Auto-Pagination" button
// Or send message:
chrome.runtime.sendMessage({
  action: "START_AUTO_PAGINATION",
  selector: ".next-btn",
  maxPages: 10,
  delay: 3000,
});
```

### Stop Automation

```javascript
// From popup: Click "Stop" button
// Or:
localStorage.removeItem("__stn_auto_pagination_active");
location.reload();
```

### Check Status

```javascript
const isActive =
  localStorage.getItem("__stn_auto_pagination_active") === "true";
const currentPage = parseInt(
  localStorage.getItem("__stn_auto_pagination_count") || "0",
);
console.log(`Active: ${isActive}, Page: ${currentPage}`);
```

## Common Selectors by Site Type

| Site Type         | Selector Example          | Notes                     |
| ----------------- | ------------------------- | ------------------------- |
| **Documentation** | `a[rel="next"]`           | Standard HTML             |
| **Documentation** | `ft-tooltip > button`     | Shadow DOM (ServiceNow)   |
| **Blogs**         | `.nav-next a`             | WordPress common          |
| **Blogs**         | `.next.page-numbers`      | WordPress pagination      |
| **Forums**        | `.pageNav-jump--next`     | XenForo style             |
| **Tutorials**     | `[data-purpose="next"]`   | React apps                |
| **API Docs**      | `.pagination .next`       | Bootstrap style           |
| **Any Site**      | `button:contains('Next')` | Text-based (if supported) |

## Selector Testing

### Test in Console

```javascript
// Basic test
const btn = document.querySelector("YOUR_SELECTOR");
console.log(btn); // Should show the button

// Verify it's visible
console.log("Visible:", btn && btn.offsetParent !== null);

// Verify it's clickable
btn && btn.click(); // Should navigate
```

### Test Shadow DOM

```javascript
// Find in shadow roots
function testShadow(selector) {
  // Try document first
  let el = document.querySelector(selector);
  if (el) return console.log("Found in document:", el);

  // Search shadows
  document.querySelectorAll("*").forEach((element) => {
    if (element.shadowRoot) {
      el = element.shadowRoot.querySelector(selector);
      if (el) console.log("Found in shadow of:", element.tagName, el);
    }
  });
}

testShadow("button"); // Replace with your selector
```

## Configuration Quick Settings

### Increase Delay (Slow Pages)

```javascript
// 5 seconds between pages
localStorage.setItem("__stn_auto_pagination_delay", "5000");
```

### Decrease Delay (Fast Pages)

```javascript
// 1 second between pages
localStorage.setItem("__stn_auto_pagination_delay", "1000");
```

### Set Max Pages

```javascript
// Process up to 50 pages
localStorage.setItem("__stn_auto_pagination_max_pages", "50");
```

### Reset to Defaults

```javascript
localStorage.removeItem("__stn_auto_pagination_delay");
localStorage.removeItem("__stn_auto_pagination_max_pages");
// Defaults: 3000ms delay, 10 max pages
```

## Keyboard Shortcuts

| Action                 | Windows/Linux  | Mac           |
| ---------------------- | -------------- | ------------- |
| Toggle Auto-Pagination | `Ctrl+Shift+P` | `Cmd+Shift+P` |

## Troubleshooting Checklist

- [ ] **Button exists?** Test selector in console
- [ ] **Button visible?** Check `offsetParent !== null`
- [ ] **Delay sufficient?** Try increasing delay
- [ ] **Shadow DOM?** Use `parent > child` selector
- [ ] **Max pages reached?** Check current count
- [ ] **Console errors?** Look for [Auto-Pagination] messages
- [ ] **Selector stable?** Test on page 2-3 manually

## Status Messages

### Console Logs

```
✅ [Auto-Pagination] Starting automation...
✅ [Auto-Pagination] Page X: Save complete
✅ [Auto-Pagination] Clicking next button...
❌ [Auto-Pagination] Next button not found
❌ [Auto-Pagination] Max pages reached
⚠️  [Auto-Pagination] Selector not found: .next-btn
```

### What They Mean

- **"Starting automation"** - Feature activated successfully
- **"Save complete"** - Page saved, about to navigate
- **"Clicking next button"** - Navigation happening
- **"Not found"** - Selector doesn't match any element
- **"Max pages reached"** - Hit your configured limit (success!)

## Quick Fixes

### Problem: Can't find selector

```javascript
// List all buttons on page
document.querySelectorAll("button").forEach((btn, i) => {
  console.log(`Button ${i}:`, btn.textContent.trim(), btn.className);
});

// List all links with "next" text
document.querySelectorAll("a").forEach((a) => {
  if (a.textContent.toLowerCase().includes("next")) {
    console.log("Next link:", a.className, a.getAttribute("rel"));
  }
});
```

### Problem: Saves but doesn't navigate

```javascript
// Test click manually
const btn = document.querySelector("YOUR_SELECTOR");
if (btn) {
  console.log("Found button:", btn);
  btn.click(); // Should navigate
} else {
  console.log("Button not found!");
}
```

### Problem: Too fast/slow

```javascript
// Check current delay
const delay = localStorage.getItem("__stn_auto_pagination_delay") || "3000";
console.log("Current delay:", delay + "ms");

// Adjust as needed
localStorage.setItem("__stn_auto_pagination_delay", "4000"); // 4 seconds
```

## File Locations

```
Web-2-Notion/
├── autoPagination.js              ← Main automation logic
├── autoPaginationUI.js            ← Configuration UI
├── autoPagination.html            ← Configuration popup
├── AUTO_PAGINATION_README.md      ← Full documentation
├── AUTO_PAGINATION_QUICK_START.md ← Tutorial
├── AUTO_PAGINATION_CONFIG_GUIDE.md← Site-specific help
└── auto-pagination-test-page-*.html ← Test files
```

## Test Page Selectors

For the included test pages (1-5):

```css
.next-btn
```

Use this to verify the feature works before trying on real sites.

## Emergency Stop

### Method 1: Click Stop in Popup

Open extension popup → Click "Stop Automation"

### Method 2: Console Command

```javascript
localStorage.removeItem("__stn_auto_pagination_active");
localStorage.removeItem("__stn_auto_pagination_selector");
location.reload(); // Refresh page
```

### Method 3: Close Tab

Simply close the tab - automation is per-tab, not global

## Performance Tips

1. **Start small**: Test with 3-5 pages first
2. **Monitor console**: Watch for errors
3. **Use specific selectors**: Avoid generic like just `.next`
4. **Respect delays**: 3 seconds is reasonable default
5. **Check results**: Verify first few saves before bulk processing

## Common Patterns

### Bootstrap Pagination

```css
.pagination .next
.page-link[aria-label="Next"]
```

### Material Design

```css
button.mat-button[aria-label="Next"]
.mat-paginator-navigation-next
```

### Custom Components

```css
[data-testid="next"]
[data-action="next-page"]
custom-pagination > button:last-child
```

### WordPress

```css
.nav-next a
.next.page-numbers
a[rel="next"]
```

---

## 📚 Full Documentation

- **README**: AUTO_PAGINATION_README.md
- **Tutorial**: AUTO_PAGINATION_QUICK_START.md
- **Configuration**: AUTO_PAGINATION_CONFIG_GUIDE.md
- **Implementation**: AUTO_PAGINATION_IMPLEMENTATION.md

---

**Quick Start:** Load test page 1 → Click Auto-Pagination → Enter `.next-btn` → Start → Watch it work!
