/* Lightweight, DOM-only utilities used by the popup's table->list flow.
 * These are intentionally small and dependency-free so unit-tests can
 * require and exercise them in Node (jsdom) without loading the full
 * popup bundle (which depends on chrome.* and other browser APIs).
 */
(function () {
  "use strict";

  function processCellForTableToList(cell) {
    if (!cell || cell.nodeType !== 1) return "";
    var cellClone = cell.cloneNode(true);

    // Post-processing: safely strip legacy visible bracketed placeholders
    // (e.g. "[alt]") when they are clearly the legacy placeholder that
    // accompanies preserved images or XCELLIDX markers. This is a
    // conservative removal that only deletes bracketed text when it's
    // standalone and colocated with a preserved image/marker so we don't
    // accidentally remove legitimate bracketed text like "see [Section 2]".
    (function stripLegacyBracketedPlaceholders(root) {
      if (!root || !root.querySelector) return;
      var SHOW_TEXT =
        (typeof NodeFilter !== "undefined" && NodeFilter.SHOW_TEXT) || 4;
      var walker = document.createTreeWalker(root, SHOW_TEXT, null, false);
      var toRemove = [];
      var bracketRe = /^\s*\[([^\]]+)\]\s*$/;
      var bulletRe = /^\s*•\s*([^•]+)\s*•\s*$/; // Matches " • text • "
      // Precompute cell-level signals so we can make ancestor-level
      // decisions (text nodes may be wrapped in <span> etc.).
      var cellLevelHasPreservedImg = !!(
        root.querySelector &&
        root.querySelector(
          'img[data-stn-preserve], .stn-inline-image, svg, .icon, .ft-zoomable-image, [role="img"]',
        )
      );
      var cellLevelContainsXcell =
        /XCELLIDX\(CELL_[A-Za-z0-9_]+\)XCELLIDX/i.test(root.innerHTML || "");

      while (walker.nextNode()) {
        var tn = walker.currentNode;
        var txt = tn.textContent || "";
        // Check for both bracketed [alt] and bullet • alt • formats
        var m = txt.match(bracketRe) || txt.match(bulletRe);
        if (!m) continue;

        var parent = tn.parentNode;
        if (!parent) continue;

        // If parent is an explicit preserved-wrapper, remove the bracketed text.
        if (parent.classList && parent.classList.contains("stn-inline-image")) {
          toRemove.push(tn);
          continue;
        }

        // Check if an adjacent sibling is a preserved image or a
        // marker (covers cases like: <img ...></img> [alt] or [alt] <img ...>)
        var prev = tn.previousSibling;
        var next = tn.nextSibling;
        var siblingHasPreservedImg = function (n) {
          if (!n) return false;
          if (n.nodeType === Node.ELEMENT_NODE) {
            return !!(
              n.matches &&
              n.matches("img[data-stn-preserve], .stn-inline-image")
            );
          }
          if (n.nodeType === Node.TEXT_NODE) {
            return /XCELLIDX\(CELL_[A-Za-z0-9_]+\)XCELLIDX/i.test(
              n.textContent || "",
            );
          }
          return false;
        };
        if (siblingHasPreservedImg(prev) || siblingHasPreservedImg(next)) {
          toRemove.push(tn);
          continue;
        }

        // Also check if parent element's siblings contain preserved images
        // (handles: <img ...><span>[alt]</span>)
        if (parent && parent !== root && parent.parentNode) {
          var parentPrev = parent.previousSibling;
          var parentNext = parent.nextSibling;
          if (
            siblingHasPreservedImg(parentPrev) ||
            siblingHasPreservedImg(parentNext)
          ) {
            // Only remove if this text node contains ONLY the bracketed text
            // (to avoid removing legitimate text in a span next to an image)
            if (parent.textContent.trim() === txt.trim()) {
              toRemove.push(parent); // Remove the whole span
              continue;
            }
          }
        }

        // Check if the direct parent contains ONLY this bracketed text and an image
        // (and possibly some whitespace/punctuation). This is the pattern for
        // image placeholders like: <a href="...">[alt]<img/></a> or <span>[alt] •</span>
        // But NOT for legitimate text like: <li>The word [DRAFT] is...</li>
        var parentOnlyHasTextAndImage = false;
        if (parent && parent.childNodes) {
          var significantChildren = Array.from(parent.childNodes).filter(
            function (n) {
              if (n === tn) return true; // The bracketed text node itself
              if (n.nodeType === Node.ELEMENT_NODE) {
                // Count images and preserved wrappers
                if (
                  n.matches &&
                  n.matches(
                    "img[data-stn-preserve], .stn-inline-image, svg, .icon",
                  )
                ) {
                  return true;
                }
              }
              if (n.nodeType === Node.TEXT_NODE) {
                // Only count text nodes with more than just whitespace/bullets
                var content = (n.textContent || "").trim();
                if (content && !/^[•\s\(\)]+$/.test(content)) {
                  return true;
                }
              }
              return false;
            },
          );

          // If parent only has: bracketed text + image (+ maybe whitespace/bullets)
          // then it's likely a placeholder
          var hasImage = significantChildren.some(function (n) {
            return (
              n.nodeType === Node.ELEMENT_NODE &&
              n.matches &&
              n.matches("img[data-stn-preserve], .stn-inline-image, svg, .icon")
            );
          });

          if (hasImage && significantChildren.length <= 3) {
            parentOnlyHasTextAndImage = true;
          }
        }

        if (parentOnlyHasTextAndImage) {
          toRemove.push(tn);
          continue;
        }

        // Otherwise treat as user text and keep it.
      }

      toRemove.forEach(function (n) {
        try {
          n.parentNode && n.parentNode.removeChild(n);
        } catch (err) {
          /* ignore */
        }
      });

      // Conservative cleanup: remove empty parentheses "()" that were
      // left behind when an inline image was removed (common pattern:
      // text ( <img/> ) text). Only run when the cell contains a
      // preserved image/marker to avoid removing meaningful
      // parenthetical content like "(see Fig. 2)".
      if (cellLevelHasPreservedImg || cellLevelContainsXcell) {
        try {
          var walker2 = document.createTreeWalker(root, SHOW_TEXT, null, false);
          var textNodesToMaybeRemove = [];
          while (walker2.nextNode()) {
            var tn2 = walker2.currentNode;
            if (!tn2 || !tn2.textContent) continue;
            var replaced = tn2.textContent
              .replace(/\(\s*\)/g, " ")
              .replace(/\s{2,}/g, " ");
            if (replaced.trim() === "") {
              textNodesToMaybeRemove.push(tn2);
            } else if (replaced !== tn2.textContent) {
              tn2.textContent = replaced;
            }
          }
          textNodesToMaybeRemove.forEach(function (n) {
            try {
              n.parentNode && n.parentNode.removeChild(n);
            } catch (err) {
              /* ignore */
            }
          });
          // Additional pass: remove orphaned/opening "(" at the end of a
          // text node when the matching ")" lives in the following text
          // node (the placeholder was removed from between them). This
          // handles DOMs where punctuation is split across nodes.
          try {
            var tnWalker = document.createTreeWalker(
              root,
              SHOW_TEXT,
              null,
              false,
            );
            var seq = [];
            while (tnWalker.nextNode()) seq.push(tnWalker.currentNode);
            for (var i = 0; i < seq.length - 1; i++) {
              var a = seq[i];
              var b = seq[i + 1];
              if (!a || !b) continue;
              var aText = String(a.textContent || "");
              var bText = String(b.textContent || "");
              if (/\(\s*$/.test(aText) && /^\s*\)/.test(bText)) {
                // Replace orphaned paren with a single space so surrounding
                // words don't run together (later whitespace normalization
                // will collapse duplicates).
                a.textContent = aText.replace(/\(\s*$/, " ");
                b.textContent = bText.replace(/^\s*\)/, " ");
                // Normalize whitespace and remove empty nodes
                if (!a.textContent.trim()) {
                  try {
                    a.parentNode && a.parentNode.removeChild(a);
                  } catch (err) {}
                }
                if (!b.textContent.trim()) {
                  try {
                    b.parentNode && b.parentNode.removeChild(b);
                  } catch (err) {}
                }
              }
            }
          } catch (err) {
            /* tolerant — never throw from cleanup */
          }

          // Final normalization pass: collapse consecutive internal
          // whitespace to single spaces so removed placeholders or
          // split-paren fixes don't leave multiple spaces.
          try {
            var normWalker = document.createTreeWalker(
              root,
              SHOW_TEXT,
              null,
              false,
            );
            var norms = [];
            while (normWalker.nextNode()) norms.push(normWalker.currentNode);
            norms.forEach(function (tn) {
              try {
                if (!tn || !tn.textContent) return;
                var cleaned = tn.textContent.replace(/\s{2,}/g, " ");
                if (cleaned.trim() === "") {
                  tn.parentNode && tn.parentNode.removeChild(tn);
                } else if (cleaned !== tn.textContent) {
                  tn.textContent = cleaned;
                }
              } catch (e) {
                /* noop */
              }
            });

            // Collapse cross-node whitespace: if a node ends with a space
            // and the next starts with a space, remove the leading space
            // from the next node so concatenation produces a single
            // separating space.
            for (var i = 0; i < norms.length - 1; i++) {
              try {
                var a = norms[i];
                var b = norms[i + 1];
                if (!a || !b || !a.textContent || !b.textContent) continue;
                if (/\s$/.test(a.textContent) && /^\s/.test(b.textContent)) {
                  b.textContent = b.textContent.replace(/^\s+/, "");
                  if (!b.textContent.trim()) {
                    b.parentNode && b.parentNode.removeChild(b);
                    norms.splice(i + 1, 1);
                    i--;
                  }
                }
              } catch (e) {
                /* noop */
              }
            }
          } catch (err) {
            /* tolerant */
          }
        } catch (err) {
          /* be tolerant — never throw from cleanup */
        }
      }
    })(cellClone);

    var hasProducerMarker = /XCELLIDX\(CELL_[A-Za-z0-9_]+\)XCELLIDX/i.test(
      cellClone.textContent || "",
    );
    var hasPreservedImg = !!(
      cellClone.querySelector &&
      cellClone.querySelector(
        'img[data-stn-preserve], .stn-inline-image, svg, .icon, [role="img"]',
      )
    );
    if (hasProducerMarker || hasPreservedImg) {
      var text = String(cellClone.textContent || "");
      // Remove bullet-format placeholders • alt • (these are image placeholders from table-to-list patch)
      text = text.replace(/\s*•\s*[^•]+\s*•\s*/g, " ");
      // If the clone contains inline imagery, replace empty parens with
      // a space so words don't run together and normalize whitespace.
      if (
        /(?:<svg\b|class=\".*icon.*\"|role=\"img\")/i.test(
          cellClone.innerHTML || "",
        ) ||
        /\(\s*\)/.test(text)
      ) {
        text = text
          .replace(/\(\s*\)/g, " ")
          .replace(/\s{2,}/g, " ")
          .trim();
      }
      return text + "\n\n";
    }

    var output = "";
    try {
      cellClone.querySelectorAll("script, style").forEach(function (el) {
        el.remove();
      });

      var paras = Array.from(cellClone.querySelectorAll("p"));
      if (paras && paras.length) {
        // First process images that are direct children of the cell (not in <p>)
        var directImages = Array.from(cellClone.childNodes).filter(
          function (n) {
            return n.nodeType === 1 && n.nodeName === "IMG";
          },
        );
        directImages.forEach(function (img) {
          var isrc = img.getAttribute("src") || img.src || "";
          var ialt = img.getAttribute("alt") || "";
          img.remove();
          // Add metadata marker to preserve inline images from data URL extraction
          if (isrc)
            output += "![" + ialt + "](" + isrc + ")<<stn-table-img>>\n\n";
        });

        // Then process paragraphs
        paras.forEach(function (p) {
          var pImageMarkdowns = [];
          Array.from(p.querySelectorAll("img")).forEach(function (pi) {
            var psrc = pi.getAttribute("src") || pi.src || "";
            var palt = pi.getAttribute("alt") || "";
            // Remove image but don't add placeholder text
            pi.remove();
            // Add metadata marker to preserve inline images from data URL extraction
            if (psrc)
              pImageMarkdowns.push(
                "![" + palt + "](" + psrc + ")<<stn-table-img>>",
              );
          });
          var ptext = (p.textContent || "").trim();
          if (pImageMarkdowns.length)
            output += pImageMarkdowns.join("\n\n") + "\n\n";
          if (ptext) output += ptext + "\n\n";
        });

        var orphanTexts = Array.from(cellClone.childNodes).filter(function (n) {
          return n.nodeType === Node.TEXT_NODE && n.textContent.trim();
        });
        orphanTexts.forEach(function (tn) {
          output += tn.textContent.trim() + "\n\n";
        });
      } else {
        Array.from(cellClone.querySelectorAll("img")).forEach(function (ii) {
          var isrc = ii.getAttribute("src") || ii.src || "";
          var ialt = ii.getAttribute("alt") || "";
          // Remove image but don't add placeholder text
          ii.remove();
          // Add metadata marker to preserve inline images from data URL extraction
          if (isrc)
            output += "![" + ialt + "](" + isrc + ")<<stn-table-img>>\n\n";
        });
        var text = (cellClone.textContent || "").trim();
        if (text) output += text + "\n\n";
      }
    } catch (err) {
      output += (cellClone.textContent || "").trim() + "\n\n";
    }

    return output;
  }

  function checkXcellMarkers(htmlStr, tableCellContentMap) {
    var markerRe = /XCELLIDX(CELL_[a-z0-9]+)XCELLIDX/gi;
    var found = [
      ...new Set(
        (htmlStr.match(markerRe) || []).map(
          (m) => (m.match(/CELL_[a-z0-9]+/i) || [])[0],
        ),
      ),
    ];
    var mapKeys = tableCellContentMap ? Object.keys(tableCellContentMap) : [];
    var missing = found.filter(function (id) {
      return !mapKeys.includes(id);
    });
    return { found: found, missing: missing };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      processCellForTableToList: processCellForTableToList,
      checkXcellMarkers: checkXcellMarkers,
    };
  }
})();
