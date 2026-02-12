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

    var hasProducerMarker = /XCELLIDX\(CELL_[A-Za-z0-9_]+\)XCELLIDX/i.test(
      cellClone.textContent || "",
    );
    var hasPreservedImg = !!(
      cellClone.querySelector &&
      cellClone.querySelector("img[data-stn-preserve], .stn-inline-image")
    );
    if (hasProducerMarker || hasPreservedImg) {
      return (cellClone.textContent || "").trim() + "\n\n";
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
          if (isrc) output += "![" + ialt + "](" + isrc + ")\n\n";
        });

        // Then process paragraphs
        paras.forEach(function (p) {
          var pImageMarkdowns = [];
          Array.from(p.querySelectorAll("img")).forEach(function (pi) {
            var psrc = pi.getAttribute("src") || pi.src || "";
            var palt = pi.getAttribute("alt") || "";
            // Remove image but don't add placeholder text
            pi.remove();
            if (psrc) pImageMarkdowns.push("![" + palt + "](" + psrc + ")");
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
          if (isrc) output += "![" + ialt + "](" + isrc + ")\n\n";
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
