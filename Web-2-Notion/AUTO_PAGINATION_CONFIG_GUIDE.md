# Auto-Pagination Configuration Guide

## Overview

This guide helps you configure the auto-pagination feature for different types of websites.

## Basic Configuration

### 1. Identify the Next Button

First, you need to find the CSS selector for the "Next" or "Continue" button on the website.

**Methods to find the selector:**

1. Right-click the button → Inspect
2. Look at the element in DevTools
3. Note the class names, ID, or element structure
4. Test the selector in the Console: `document.querySelector('your-selector')`

### 2. Common Selector Patterns

#### Simple Class-Based Selectors

```css
/* Single class */
.next-page
.btn-next
.pagination-next

/* Multiple classes */
.button.next
.nav-button.forward
```

#### ID-Based Selectors

```css
#next-page
#btnNext
#continue
```

#### Attribute Selectors

```css
/* By title attribute */
[title="Next page"]
[aria-label="Next"]

/* By href pattern */
a[href*="page="]
a[href*="next"]
```

#### Structural Selectors

```css
/* Within pagination container */
.pagination > .next
nav.pagination button:last-child

/* By position */
.page-nav button:nth-child(2)
```

#### Shadow DOM Selectors

```css
/* Direct shadow DOM children */
ft-tooltip > button
my-component > .next-btn

/* Note: Deep shadow DOM requires multiple selectors */
```

## Website-Specific Examples

### Documentation Sites

#### ServiceNow Docs (FluidTopics)

```css
ft-tooltip > button
```

**Notes:**

- Uses shadow DOM
- Button is inside ft-tooltip element
- Often has arrow icon

#### ReadTheDocs

```css
.rst-footer-buttons a.btn-neutral[rel="next"]
```

**Notes:**

- Uses Bootstrap classes
- rel="next" attribute is reliable
- Usually at bottom of page

#### MkDocs

```css
a.md-footer__link--next
```

**Notes:**

- Material theme specific
- Clear semantic class name

### Blog & Article Sites

#### Medium

```css
button[aria-label="Next"]
```

**Notes:**

- Uses ARIA labels
- Attribute selector most reliable

#### WordPress (Common Themes)

```css
.nav-next a
.next.page-numbers
a.next
```

**Notes:**

- Varies by theme
- Test selector first
- Multiple fallback options

### Tutorial & Course Sites

#### Pluralsight

```css
button[data-test="next-button"]
```

**Notes:**

- Uses data attributes for testing
- Very stable selector

#### Udemy

```css
button[data-purpose="go-to-next"]
```

**Notes:**

- Similar to Pluralsight
- Data attributes preferred

### API Documentation

#### Swagger/OpenAPI

```css
.btn.next
```

**Notes:**

- Often uses Bootstrap
- Simple class-based

#### Postman Docs

```css
.pagination-next
```

**Notes:**

- Custom pagination component

## Testing Your Selector

### Browser Console Method

```javascript
// Test if selector finds element
const element = document.querySelector("YOUR_SELECTOR");
console.log(element); // Should show the button element

// Test if clickable
if (element) {
  console.log("Button found!");
  console.log("Text:", element.textContent);
  console.log("Visible:", element.offsetParent !== null);
} else {
  console.log("Button not found - try a different selector");
}
```

### Shadow DOM Testing

```javascript
// For shadow DOM elements
function findInShadow(selector) {
  // Try direct
  let element = document.querySelector(selector);
  if (element) return element;

  // Search shadow roots
  const allElements = document.querySelectorAll("*");
  for (let el of allElements) {
    if (el.shadowRoot) {
      element = el.shadowRoot.querySelector(selector);
      if (element) return element;
    }
  }
  return null;
}

const button = findInShadow("YOUR_SELECTOR");
console.log(button);
```

## Advanced Configuration

### Timing Adjustments

**Slow-loading pages:**

```javascript
// Increase delay to 5 seconds
localStorage.setItem("__stn_auto_pagination_delay", "5000");
```

**Fast-loading pages:**

```javascript
// Decrease delay to 1 second
localStorage.setItem("__stn_auto_pagination_delay", "1000");
```

### Page Limits

**Process many pages:**

```javascript
// Set max to 50 pages
localStorage.setItem("__stn_auto_pagination_max_pages", "50");
```

**Process few pages:**

```javascript
// Set max to 5 pages
localStorage.setItem("__stn_auto_pagination_max_pages", "5");
```

### Custom Wait Conditions

If a page needs extra time to load content after navigation:

```javascript
// In autoPagination.js, modify the navigation function
// to wait for specific content to appear

async function waitForContent() {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const content = document.querySelector(".main-content");
      if (content && content.textContent.length > 100) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 500);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 10000);
  });
}
```

## Troubleshooting

### Button Not Found

**Symptom:** Console shows "Next button not found"

**Solutions:**

1. **Verify selector in console:**
   ```javascript
   document.querySelector("YOUR_SELECTOR");
   ```
2. **Check if button loads after page:**
   - Wait a few seconds and try again
   - Increase delay setting
3. **Check shadow DOM:**
   - Use DevTools to inspect element structure
   - Look for shadowRoot properties
4. **Try more specific selector:**

   ```css
   /* Instead of: */
   .next

   /* Try: */
   .pagination .next
   nav button.next
   ```

### Button Found But Not Clicking

**Symptom:** Selector works in console but automation doesn't click

**Solutions:**

1. **Check if button is visible:**
   ```javascript
   const btn = document.querySelector("YOUR_SELECTOR");
   console.log("Visible:", btn.offsetParent !== null);
   ```
2. **Check for overlays:**
   - Cookie banners
   - Modal dialogs
   - Loading spinners
3. **Try different click method:**
   - Modify autoPagination.js to use different click approach

### Saves Too Fast/Slow

**Symptom:** Navigation happens before save completes, or waits too long

**Solutions:**

1. **Adjust delay:**
   ```javascript
   // Try different delays
   localStorage.setItem("__stn_auto_pagination_delay", "4000"); // 4 seconds
   ```
2. **Monitor console logs:**
   - Check timing between "Save complete" and "Navigating"
3. **Consider page size:**
   - Large pages need more time
   - Simple pages can use less time

### Stops Prematurely

**Symptom:** Automation stops before reaching max pages

**Solutions:**

1. **Check console for errors**
2. **Verify selector still works on later pages:**
   - Navigate manually to page 3-4
   - Test selector in console
3. **Check max pages setting:**
   ```javascript
   console.log(localStorage.getItem("__stn_auto_pagination_max_pages"));
   ```

## Best Practices

### 1. Test on Single Page First

Before starting automation:

- Save one page manually
- Verify content extraction is correct
- Check that your Notion database is set up properly

### 2. Start Small

- Set max_pages to 3-5 for first run
- Verify results before processing many pages
- Increase limit once confident

### 3. Monitor First Run

- Keep console open
- Watch for errors or warnings
- Verify page transitions are smooth

### 4. Use Specific Selectors

```css
/* ❌ Too generic - might match wrong element */
button
.next

/* ✅ Specific - unlikely to match wrong element */
nav.pagination > button.next
.page-navigation .next-page-btn
```

### 5. Document Your Selectors

Keep a list of working selectors for sites you use frequently:

```
ServiceNow Docs: ft-tooltip > button
MDN Web Docs: a[rel="next"]
GitHub Issues: a[aria-label="Next"]
```

## Support for Common Frameworks

### React Applications

- Often use `data-testid` attributes
- Example: `[data-testid="next-button"]`

### Vue Applications

- May use `v-` directives in development
- Look for semantic classes or ARIA labels

### Angular Applications

- Often use `mat-` prefix (Material Design)
- Example: `button.mat-button[aria-label="Next"]`

### Web Components

- Check for shadow DOM
- Use direct child selector: `my-component > button`

## Quick Reference

| Site Type     | Common Selector                     | Notes                   |
| ------------- | ----------------------------------- | ----------------------- |
| Documentation | `.next`, `a[rel="next"]`            | Usually clear labels    |
| Blogs         | `.nav-next a`, `.next.page-numbers` | Theme-dependent         |
| Forums        | `.pageNav-jump--next`               | Often in pagination bar |
| Tutorials     | `[data-purpose="next"]`             | Data attributes common  |
| E-commerce    | `.pagination .next`, `.arrow-right` | May have icons          |

## Getting Help

If you're having trouble finding the right selector:

1. **Share the URL** of the site you're trying to automate
2. **Take a screenshot** of the Next button
3. **Copy the HTML** of the button element from DevTools
4. **Share console logs** if getting errors

---

**Remember:** Always respect website terms of service and rate limits when using automation features.
