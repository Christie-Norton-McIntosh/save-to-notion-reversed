/* Runtime patch: make the existing Turndown `tableToList` behavior delegate
 * to the extracted `STN_tableToListImageUtils` where possible. This lets us
 * improve image handling without rebuilding the large bundle.
 */
(function () {
  "use strict";

  function ensureReady(fn) {
    if (typeof window === "undefined") return;
    if (window.JZ) return fn();
    // try again when DOM is ready — the bundle defines JZ early but be safe
    document.addEventListener("DOMContentLoaded", function cb() {
      document.removeEventListener("DOMContentLoaded", cb);
      if (window.JZ) fn();
    });
    // also attempt a short timeout in case JZ is added later
    setTimeout(function () {
      if (window.JZ) fn();
    }, 500);
  }

  function patchJZ() {
    if (!window.JZ) return;
    if (!window.STN_tableToListImageUtils) return;

    var originalJZ = window.JZ;

    // Wrap JZ so we pre-process table cells using our utilities.
    window.JZ = function (html, opts) {
      try {
        if (!html) return originalJZ(html, opts);

        var parser = new DOMParser();
        var doc = parser.parseFromString(html, "text/html");

        var tables = doc.querySelectorAll("table");
        if (tables && tables.length) {
          Array.from(tables).forEach(function (table) {
            Array.from(table.rows).forEach(function (row) {
              Array.from(row.cells).forEach(function (cell) {
                try {
                  // If XCELLIDX or preserved wrapper present, skip
                  var txt = cell.textContent || "";
                  if (
                    /XCELLIDX\(/i.test(txt) ||
                    cell.querySelector("[data-stn-preserve], .stn-inline-image")
                  )
                    return;

                  Array.from(cell.querySelectorAll("img")).forEach(
                    function (img) {
                      var resolved =
                        window.STN_tableToListImageUtils.resolveImageSrc(
                          img,
                          window.location && window.location.href,
                        );
                      if (resolved)
                        img.setAttribute("data-original-src", resolved);

                      // If image has alt text, replace visible <img> with placeholder
                      var alt = img.getAttribute("alt") || "";
                      if (alt && alt.trim()) {
                        window.STN_tableToListImageUtils.replaceImgWithPlaceholder(
                          img,
                          alt,
                        );
                      }
                    },
                  );

                  // preserve paragraph grouping (no-op here — Turndown will see <p>)
                } catch (err) {
                  /* non-fatal */
                }
              });
            });
          });
        }

        // Pass the modified DOM's body/html string to the original converter
        var container = document.createElement("div");
        container.appendChild(document.importNode(doc.body, true));
        return originalJZ(container, opts);
      } catch (err) {
        return originalJZ(html, opts);
      }
    };
    window.JZ.__stn_patched_tableToList = true;
  }

  // Ensure the patch is applied even if the helper utilities are registered
  // after the popup bundle loads. If the canonical helper isn't available
  // we install a conservative, minimal fallback so installed extensions
  // that missed a build still preserve images/XCELLIDX in most pages.
  //
  // This function is exported for unit tests and is deliberately small and
  // reversible (only mutates window.JZ when asked to).
  function ensurePatchWithFallback(root) {
    root = root || window;
    if (!root || !root.JZ) return false;
    // if already patched, nothing to do
    if (root.JZ.__stn_patched_tableToList) return true;

    // Preferred path: use the extracted utilities when available
    if (root.STN_tableToListImageUtils) {
      try {
        // reuse existing implementation by calling patchJZ in the real window
        if (root === window) patchJZ();
        else {
          // best-effort: wrap the existing JZ implementation to call the
          // string-preprocessor which mirrors the utility behaviour
          const orig = root.JZ;
          root.JZ = function (html, opts) {
            try {
              if (!html) return orig(html, opts);
              // delegate to the module's preprocessTableHtmlString for safety
              const mod = module && module.exports;
              if (mod && mod.preprocessTableHtmlString)
                html = mod.preprocessTableHtmlString(html, root.location && root.location.href);
            } catch (err) {}
            return orig(html, opts);
          };
          root.JZ.__stn_patched_tableToList = true;
        }
        return true;
      } catch (err) {
        return false;
      }
    }

    // Fallback: apply a minimal runtime preprocessor that mirrors the
    // in-page sanitizer used by the content-script. This is intentionally
    // conservative (only injects XCELLIDX and preserves hidden imgs) and
    // logs a diagnostic so we can triage producer failures.
    try {
      const orig = root.JZ;
      root.JZ = function (html, opts) {
        try {
          if (typeof html === "string") {
            // quick string-level handling for common anchor+img & img+alt
            const mod = module && module.exports;
            if (mod && mod.preprocessTableHtmlString)
              html = mod.preprocessTableHtmlString(html, root.location && root.location.href);
          }
        } catch (err) {}
        return orig(html, opts);
      };
      root.JZ.__stn_patched_tableToList = true;

      // if images exist but there's no TABLE_CELL_CONTENT_MAP__ then warn —
      // this typically indicates the content-script didn't run on the page.
      if ((root.__imageUrlArray && root.__imageUrlArray.length) && !(root.__TABLE_CELL_CONTENT_MAP__ && Object.keys(root.__TABLE_CELL_CONTENT_MAP__).length)) {
        console.warn("[tableToList guard] images present but no __TABLE_CELL_CONTENT_MAP__ — content-script may not have run on the source page. Using fallback preprocessing.");
      }

      return true;
    } catch (err) {
      return false;
    }
  }

  // Lightweight HTML-string preprocessor (works without a DOM). It handles
  // the common patterns we care about in tests: img in anchor, relative src
  // resolution (using baseHref), data: URLs, and XCELLIDX pass-through.
  function preprocessTableHtmlString(html, baseHref) {
    if (!html || typeof html !== "string") return html;

    // If XCELLIDX present in the cell, don't modify that region.
    if (/XCELLIDX\(/i.test(html)) return html;

    // Replace <a ...><img ...></a> where anchor href looks like image: add data-original-src
    html = html.replace(
      /<a([^>]+)href=["']([^"']+)["']([^>]*)>\s*(<img[^>]+>)\s*<\/a>/gi,
      function (m, a1, href, a2, imgTag) {
        var lower = href.toLowerCase();
        if (
          !/data:image\//.test(lower) &&
          !/\.(png|jpe?g|gif|svg|webp|bmp|tiff|tif|heic)/.test(lower)
        )
          return m;
        // resolve relative
        try {
          if (!href.match(/^https?:\/\//) && baseHref)
            href = new URL(href, baseHref).href;
        } catch (err) {}
        // inject data-original-src into img tag if not present
        if (!/data-original-src\s*=/.test(imgTag)) {
          imgTag = imgTag.replace(
            /<img/,
            '<img data-original-src="' + href + '"',
          );
        }
        return "<a" + a1 + 'href="' + href + '"' + a2 + ">" + imgTag + "</a>";
      },
    );

    // For standalone <img ... alt="..."> replace visible img with placeholder text
    html = html.replace(
      /<img([^>]*)alt=["']([^"']+)["']([^>]*)\/?\s*>/gi,
      function (m, a1, alt, a2) {
        // keep data-original-src if present; otherwise attempt to resolve src attribute
        var srcMatch = m.match(/src=["']([^"']+)["']/i);
        var src = srcMatch ? srcMatch[1] : "";
        try {
          if (
            src &&
            baseHref &&
            !src.match(/^https?:\/\//) &&
            !src.startsWith("data:")
          )
            src = new URL(src, baseHref).href;
        } catch (err) {}
        // emit a visible bullet placeholder (the bundle's tableToList will also emit markdown for the URL)
        return (
          " • " +
          alt +
          " • " +
          (src ? '<img data-original-src="' + src + '" alt="' + alt + '">' : "")
        );
      },
    );

    return html;
  }

  // export for tests
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      patchJZ: patchJZ,
      preprocessTableHtmlString: preprocessTableHtmlString,
    };
  }

  ensureReady(patchJZ);
  // Retry/apply guard for a short period in case helpers are registered
  // asynchronously (or an older popup build is installed). Poll lightly
  // and then stop — this keeps runtime overhead negligible.
  (function pollForHelpers() {
    var attempts = 0;
    var max = 10; // ~2s with interval below
    var iv = setInterval(function () {
      attempts++;
      try {
        if (ensurePatchWithFallback(window)) {
          clearInterval(iv);
          return;
        }
      } catch (err) {}
      if (attempts >= max) {
        clearInterval(iv);
        // final best-effort attempt and diagnostic
        try { ensurePatchWithFallback(window); } catch (e) {}
      }
    }, 200);
  })();

  // Export guard for unit tests
  if (typeof module !== "undefined" && module.exports) module.exports.ensurePatchWithFallback = ensurePatchWithFallback;
})();
