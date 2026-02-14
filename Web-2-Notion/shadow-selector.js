/* Shadow-aware selector helpers
 * - querySelectorDeep(selector, root=document): returns first matching element in DOM or any shadow root
 * - querySelectorAllDeep(selector, root=document): returns array of matches across DOM and shadow roots
 * Exports as CommonJS and attaches to window for runtime use.
 */
(function () {
  function _safeQueryAll(root, selector) {
    try {
      return Array.from(root.querySelectorAll(selector));
    } catch (err) {
      // invalid selector
      return null;
    }
  }

  function querySelectorDeep(selector, root = document, depth = 0) {
    if (!selector || depth > 20) return null;

    // try current root first
    try {
      const hit = root.querySelector(selector);
      if (hit) return hit;
    } catch (err) {
      // invalid selector
      return null;
    }

    // walk children and recurse into shadow roots
    const all = root.querySelectorAll("*");
    for (const el of all) {
      if (el.shadowRoot) {
        const found = querySelectorDeep(selector, el.shadowRoot, depth + 1);
        if (found) return found;
      }
    }

    return null;
  }

  function querySelectorAllDeep(
    selector,
    root = document,
    depth = 0,
    out = [],
  ) {
    if (!selector || depth > 20) return out;

    const matches = _safeQueryAll(root, selector);
    if (matches === null) return out; // invalid selector => return what we have
    out.push(...matches);

    const all = root.querySelectorAll("*");
    for (const el of all) {
      if (el.shadowRoot) {
        querySelectorAllDeep(selector, el.shadowRoot, depth + 1, out);
      }
    }

    return out;
  }

  // attach to window when available (browser runtime)
  try {
    if (typeof window !== "undefined") {
      window.querySelectorDeep = querySelectorDeep;
      window.querySelectorAllDeep = querySelectorAllDeep;
    }
  } catch (e) {
    /* ignore */
  }

  // commonjs export for tests / node
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { querySelectorDeep, querySelectorAllDeep };
  }
})();
