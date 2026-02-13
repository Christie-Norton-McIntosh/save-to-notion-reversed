/* Runtime patch: Prevent LEGACY:bracketed placeholders from being produced
 * for table flows. The main.js bundle produces [alt] format for inline images
 * via the CN(image) path, but table flows should use bullet format • alt •
 * or be preserved as images. This patch intercepts image processing to ensure
 * table contexts don't produce LEGACY:bracketed placeholders and adds
 * diagnostics so we can confirm the shim is active in production builds.
 */
(function () {
  "use strict";

  const LOG_PREFIX = "[Web-2-Notion] LEGACY:bracketed prevention";
  const preservedImages = new WeakMap();

  let globalObserver = null;
  let observerActive = false;
  let observerRearmTimer = null;
  let alreadyPatched = false;

  function log(message, detail) {
    if (typeof console === "undefined" || !console.log) {
      return;
    }
    if (typeof detail === "undefined") {
      console.log(LOG_PREFIX, message);
    } else {
      console.log(LOG_PREFIX, message, detail);
    }
  }

  function ensureReady(fn) {
    if (typeof window === "undefined") return;
    log("ensureReady check", document.readyState);
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      log("ensureReady executing immediately");
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", function cb() {
        document.removeEventListener("DOMContentLoaded", cb);
        log("ensureReady executing after DOMContentLoaded");
        fn();
      });
    }
  }

  function isElement(value) {
    return !!value && value.nodeType === Node.ELEMENT_NODE;
  }

  function isTableContext(element) {
    if (!isElement(element)) return false;
    if (/^(TABLE|TBODY|TR|TD|TH)$/i.test(element.tagName)) return true;
    if (
      element.classList &&
      (element.classList.contains("table-cell") ||
        element.classList.contains("stn-table-cell"))
    ) {
      return true;
    }
    if (element.closest) {
      const match = element.closest("table, tbody, tr, td, th");
      return !!match;
    }
    return false;
  }

  function visitTableContexts(root, visitor) {
    if (!root) return;

    if (isElement(root) && isTableContext(root)) {
      visitor(root);
    }

    if (root.querySelectorAll) {
      root
        .querySelectorAll("table, tbody, tr, td, th, .table-cell, .stn-table-cell")
        .forEach((node) => {
          if (isElement(node)) {
            visitor(node);
          }
        });
    }
  }

  function storePreservedImage(img) {
    if (!isElement(img) || !img.parentNode) return;
    const alt = (img.getAttribute("alt") || "").trim();
    if (!alt) return;

    const parentElement = img.parentNode.nodeType === Node.ELEMENT_NODE ? img.parentNode : null;
    if (!parentElement) return;

    preservedImages.set(parentElement, {
      alt,
      clone: img.cloneNode(true),
    });

    log("stored preserved image", alt);
  }

  function findPreserved(element, alt) {
    if (!alt) return null;
    let current = element;
    while (isElement(current)) {
      const record = preservedImages.get(current);
      if (record && record.alt === alt) {
        return record;
      }
      current = current.parentElement;
    }
    return null;
  }

  function buildBullet(doc, alt) {
    if (!doc || !alt) return null;
    const fragment = doc.createDocumentFragment();
    fragment.appendChild(doc.createTextNode("• " + alt + " •"));
    return fragment;
  }

  function handleBracketedText(node, alt) {
    const parent = node.parentNode;
    if (!isElement(parent)) return false;

    const preserved = findPreserved(parent, alt);
    const replacement = preserved
      ? preserved.clone.cloneNode(true)
      : buildBullet(node.ownerDocument, alt);

    if (!replacement) return false;

    log(
      preserved ? "restoring preserved image from global observer" : "converting placeholder to bullet",
      alt,
    );

    parent.replaceChild(replacement, node);
    return true;
  }

  function handleMutations(mutations) {
    let handled = false;

    mutations.forEach((mutation) => {
      const nodes = mutation.type === "characterData"
        ? [mutation.target]
        : Array.from(mutation.addedNodes || []);

      nodes.forEach((node) => {
        if (!node || node.nodeType !== Node.TEXT_NODE) return;
        const parent = node.parentNode;
        if (!isElement(parent) || !isTableContext(parent)) return;

        const text = node.textContent || "";
        const match = text.match(/^\s*\[([^\]]+)\]\s*$/);
        if (!match) return;

        const alt = match[1].trim();
        if (!alt) return;

        log("global observer detected bracketed placeholder", alt);

        if (handleBracketedText(node, alt)) {
          handled = true;
        }
      });
    });

    if (handled) {
      stopObserver("handled placeholder");
      rearmObserver();
    }
  }

  function startObserver() {
    if (!document.body) return;

    if (!globalObserver) {
      globalObserver = new MutationObserver(handleMutations);
      window.addEventListener("beforeunload", () => {
        stopObserver("beforeunload");
      });
    }

    if (observerActive) return;

    globalObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    observerActive = true;
    log("global observer armed");
  }

  function stopObserver(reason) {
    if (!globalObserver || !observerActive) return;
    globalObserver.disconnect();
    observerActive = false;
    log("global observer stopped", reason);
  }

  function rearmObserver() {
    if (observerRearmTimer != null) return;
    observerRearmTimer = window.setTimeout(() => {
      observerRearmTimer = null;
      startObserver();
    }, 50);
  }

  function interceptImageProcessing(root) {
    if (!root) return;

    visitTableContexts(root, (context) => {
      log("interceptImageProcessing entered", context.tagName || "unknown");
      const images = context.querySelectorAll("img[alt]");
      images.forEach((img) => {
        const alt = (img.getAttribute("alt") || "").trim();
        if (!alt) return;

        img.setAttribute("data-stn-prevent-bracketed", "true");
        storePreservedImage(img);

        const parent = img.parentNode;
        if (!parent) return;

        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            Array.from(mutation.addedNodes || []).forEach((node) => {
              if (!node || node.nodeType !== Node.TEXT_NODE) return;
              const text = node.textContent || "";
              const match = text.match(/^\s*\[([^\]]+)\]\s*$/);
              if (!match) return;
              if (match[1].trim() !== alt) return;

              log("inline observer replacing bracketed placeholder", alt);

              if (node.parentNode) {
                node.parentNode.replaceChild(img.cloneNode(true), node);
              }
            });
          });
        });

        observer.observe(parent, {
          childList: true,
          subtree: false,
        });

        window.setTimeout(() => observer.disconnect(), 5000);
      });
    });
  }

  function patchLegacyBracketedPrevention() {
    if (alreadyPatched) {
      log("patch already applied");
      return;
    }
    alreadyPatched = true;

    log("patch execution start");

    const originalInnerHTML = Object.getOwnPropertyDescriptor(
      Element.prototype,
      "innerHTML",
    );

    if (originalInnerHTML && typeof originalInnerHTML.set === "function") {
      const originalSetInnerHTML = originalInnerHTML.set;
      Object.defineProperty(Element.prototype, "innerHTML", {
        set: function (value) {
          const result = originalSetInnerHTML.call(this, value);
          if (
            typeof value === "string" &&
            value.indexOf("<img") !== -1 &&
            value.indexOf("<table") !== -1
          ) {
            interceptImageProcessing(this);
          }
          return result;
        },
        get: originalInnerHTML.get,
      });
    }

    const originalAppendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function (child) {
      const result = originalAppendChild.call(this, child);
      if (child && child.nodeType === Node.ELEMENT_NODE) {
        interceptImageProcessing(child);
      }
      interceptImageProcessing(this);
      return result;
    };

    const originalInsertBefore = Element.prototype.insertBefore;
    Element.prototype.insertBefore = function (newNode, referenceNode) {
      const result = originalInsertBefore.call(this, newNode, referenceNode);
      if (newNode && newNode.nodeType === Node.ELEMENT_NODE) {
        interceptImageProcessing(newNode);
      }
      interceptImageProcessing(this);
      return result;
    };

    const originalReplaceChild = Element.prototype.replaceChild;
    Element.prototype.replaceChild = function (newChild, oldChild) {
      const result = originalReplaceChild.call(this, newChild, oldChild);
      if (newChild && newChild.nodeType === Node.ELEMENT_NODE) {
        interceptImageProcessing(newChild);
      }
      interceptImageProcessing(this);
      return result;
    };

    interceptImageProcessing(document.body);
    startObserver();

    log("patch applied");
  }

  ensureReady(patchLegacyBracketedPrevention);
})();
