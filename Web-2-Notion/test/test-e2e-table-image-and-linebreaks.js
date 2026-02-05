/**
 * End-to-end style integration test (DOM -> markers -> placeholder -> imageUploads)
 * - verifies paragraph/div/BR -> preserved newlines
 * - verifies UL/LI -> preserved newlines
 * - verifies anchor(img + span) preserves text
 * - verifies data: (base64) images are queued and converted to imageUploads
 */
const { JSDOM } = require("jsdom");

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.window = dom.window;
global.document = dom.window.document;

function simulateSanitizeCellAndQueue(cell, cellId) {
  const cellClone = cell.cloneNode(true);

  // remove scripts/styles
  cellClone.querySelectorAll("script, style").forEach((el) => el.remove());

  // handle images: if data: URL, queue; preserve anchor text
  cellClone.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || img.src || "";
    const alt = img.getAttribute("alt") || "";
    const parentAnchor =
      img.parentElement && img.parentElement.tagName === "A"
        ? img.parentElement
        : null;
    const isData = typeof src === "string" && src.startsWith("data:");
    if (isData) {
      window.__base64ImageArray = window.__base64ImageArray || [];
      window.__base64ImageArray.push({ alt: alt || "", dataUrl: src });
      if (parentAnchor) {
        // replace anchor with textual nodes (preserve span text)
        const preservedText = Array.from(parentAnchor.childNodes)
          .filter(
            (n) =>
              n.nodeType === window.Node.TEXT_NODE ||
              (n.nodeType === window.Node.ELEMENT_NODE && n.tagName !== "IMG"),
          )
          .map((n) => n.textContent || "")
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (preservedText)
          parentAnchor.replaceWith(document.createTextNode(preservedText));
        else parentAnchor.remove();
      } else {
        img.replaceWith(document.createTextNode(alt || "[image]"));
      }
    } else {
      // for non-data images just remove the img but keep label if present
      if (parentAnchor) {
        const preservedText = Array.from(parentAnchor.childNodes)
          .filter(
            (n) =>
              n.nodeType === window.Node.TEXT_NODE ||
              (n.nodeType === window.Node.ELEMENT_NODE && n.tagName !== "IMG"),
          )
          .map((n) => n.textContent || "")
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (preservedText)
          parentAnchor.replaceWith(document.createTextNode(preservedText));
        else parentAnchor.remove();
      } else {
        img.remove();
      }
    }
  });

  // lists -> append LI marker
  cellClone.querySelectorAll("ul, ol").forEach((list) => {
    Array.from(list.querySelectorAll("li")).forEach((li) => {
      li.appendChild(document.createTextNode(" __LI_END__ "));
    });
  });

  // br -> marker
  cellClone
    .querySelectorAll("br")
    .forEach((br) => br.replaceWith(document.createTextNode(" __BR__ ")));

  // block-level separation marker
  Array.from(
    cellClone.querySelectorAll(
      "div, p, section, article, header, footer, h1, h2, h3, h4, h5, h6",
    ),
  ).forEach((blk) => {
    const mk = document.createTextNode(" __BLOCK_END__ ");
    if (blk.nextSibling) blk.parentNode.insertBefore(mk, blk.nextSibling);
    else blk.parentNode.appendChild(mk);
  });

  // get text and convert markers to newlines
  let text = cellClone.textContent || "";
  let textWithNewlines = text.replace(/ ?__BLOCK_END__ ?/g, "\n");
  textWithNewlines = textWithNewlines.replace(/ ?__BR__ ?/g, "\n");
  textWithNewlines = textWithNewlines.replace(/ ?__LI_END__ ?/g, "\n");
  textWithNewlines = textWithNewlines.replace(/[ \t]{3,}/g, " ");
  textWithNewlines = textWithNewlines.replace(/\n{3,}/g, "\n\n");
  textWithNewlines = textWithNewlines.trim();

  // store in CELL map and return marker
  window.__TABLE_CELL_CONTENT_MAP__ = window.__TABLE_CELL_CONTENT_MAP__ || {};
  const cid = cellId || "CELL_" + Math.random().toString(36).substr(2, 9);
  window.__TABLE_CELL_CONTENT_MAP__[cid] = textWithNewlines;
  return {
    cellId: cid,
    marker: "XCELLIDX" + cid + "XCELLIDX",
    original: textWithNewlines,
  };
}

function processQueuedBase64ImagesForTest(userInputMap, imageUploads) {
  // same algorithm as popup helper
  var pidToUploadId = {};
  var map = window.__TABLE_BASE64_IMAGE_MAP__ || {};
  Object.keys(map).forEach(function (pid) {
    var entry = map[pid];
    Object.entries(userInputMap || {}).forEach(function (pair) {
      var dap = pair[1];
      if (!dap || !dap.options) return;
      var def = dap.options.defaultValue;
      if (!def) return;
      var replaced = false;
      var newDef = Array.isArray(def)
        ? def.map(function (it) {
            if (
              it &&
              (it.imgUrl === pid ||
                (typeof it.imgUrl === "string" &&
                  it.imgUrl.indexOf(pid) !== -1))
            ) {
              var uid = (Math.random().toString(36) + "000000").slice(2, 26);
              imageUploads[uid] = {
                id: uid,
                imageBase64: entry.dataUrl,
                name: entry.alt || null,
              };
              pidToUploadId[pid] = uid;
              replaced = true;
              return { uploadId: uid, width: null, height: null };
            }
            return it;
          })
        : def;
      if (replaced) dap.options.defaultValue = newDef;
    });
  });
  return pidToUploadId;
}

// The E2E test
(function () {
  console.log("🧪 E2E: table line-breaks + images");

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <table>
      <tr><td id="c1"><p>First paragraph</p><p>Second paragraph</p></td></tr>
      <tr><td id="c2"><ul><li>One</li><li>Two</li></ul></td></tr>
      <tr><td id="c3">Line1<br/>Line2</td></tr>
      <tr><td id="c4"><a href="#"><img src="data:image/png;base64,AAA" alt="ic"><span>Explore</span></a></td></tr>
      <tr><td id="c5"><a href="#"><img src="data:image/png;base64,BBB" alt="pic"></a></td></tr>
      <!-- regression: anchor contains text before+after image and image has http/src (alt may be empty) -->
      <tr><td id="c6"><a href="#"><span class="ph">Explore</span><span class="image decorative"></span><img alt="" class="image decorative ft-responsive-image" id="dex-landing__image_nh2_dvw_b1c" src="https://www.servicenow.com/docs/api/khub/maps/MlbQAgTiiiMOLOw9T36wJg/resources/g3XGXJfxR8CwcDhAFVQ2YQ-MlbQAgTiiiMOLOw9T36wJg/content?Ft-Calling-App=ft/turnkey-portal" data-ft-container-id="MlbQAgTiiiMOLOw9T36wJg" data-ft-resource-id="g3XGXJfxR8CwcDhAFVQ2YQ-MlbQAgTiiiMOLOw9T36wJg"><span class="ph">Leverage the system for monitoring and remediation objectives</span>.</a></td></tr>
    </table>`;

  // Run sanitize & marker storage
  const tests = [];
  ["c1", "c2", "c3", "c4", "c5", "c6"].forEach((id) => {
    const cell = wrapper.querySelector("#" + id);
    tests.push(simulateSanitizeCellAndQueue(cell, id));
  });

  // Assertions: paragraphs -> newline
  if (!window.__TABLE_CELL_CONTENT_MAP__["c1"].includes("\n")) {
    console.error("❌ c1 paragraphs did not produce newline");
    process.exit(1);
  }

  // UL/LI -> newline per item
  if (!window.__TABLE_CELL_CONTENT_MAP__["c2"].includes("One\nTwo")) {
    console.error("❌ c2 list items did not preserve line breaks");
    process.exit(1);
  }

  // BR -> newline
  if (!window.__TABLE_CELL_CONTENT_MAP__["c3"].includes("Line1\nLine2")) {
    console.error("❌ c3 br did not convert to newline");
    process.exit(1);
  }

  // Anchor with img+span -> preserve span text
  if (window.__TABLE_CELL_CONTENT_MAP__["c4"].trim() !== "Explore") {
    console.error("❌ c4 anchor+img lost text");
    process.exit(1);
  }

  // Base64 images should be queued and then convertible to imageUploads
  if (!window.__base64ImageArray || window.__base64ImageArray.length < 2) {
    console.error(
      "❌ base64 images were not queued as expected",
      window.__base64ImageArray,
    );
    process.exit(1);
  }

  // Simulate adding placeholders for queued base64 images as the popup would
  window.__TABLE_BASE64_IMAGE_MAP__ = window.__TABLE_BASE64_IMAGE_MAP__ || {};
  window.__base64ImageArray.forEach(function (item, i) {
    var pid = "BASE64_IMG_" + i + "_e2e";
    window.__TABLE_BASE64_IMAGE_MAP__[pid] = item;
    // pretend the fallback markdown referenced the pid for cell c5
    if (i === 1) {
      window.__TABLE_CELL_CONTENT_MAP__["c5"] = "![](" + pid + ")";
    }
  });

  // Prepare fake userInputMap that references the placeholder
  const userInputMap = {
    imgField: {
      property: { id: "imgField", type: "image" },
      options: {
        defaultValue: [
          { imgUrl: Object.keys(window.__TABLE_BASE64_IMAGE_MAP__)[1] },
        ],
      },
    },
  };
  const imageUploads = {};

  const mapping = processQueuedBase64ImagesForTest(userInputMap, imageUploads);
  const pid = Object.keys(window.__TABLE_BASE64_IMAGE_MAP__)[1];
  if (!mapping[pid]) {
    console.error("❌ queued base64 placeholder was not converted to uploadId");
    process.exit(1);
  }

  // New: ensure the edge-case row (c6) preserved the anchor text AND
  // that any base64 images are queued. The c6 image uses an http src
  // and an empty alt; we must preserve the surrounding span text.
  if (!window.__TABLE_CELL_CONTENT_MAP__ || !window.__TABLE_CELL_CONTENT_MAP__["c6"]) {
    console.error("❌ expected cell c6 to appear in TABLE_CELL_CONTENT_MAP__", window.__TABLE_CELL_CONTENT_MAP__);
    process.exit(1);
  }
  const c6 = window.__TABLE_CELL_CONTENT_MAP__["c6"];
  if (!/Explore/.test(c6) || !/Leverage the system/.test(c6)) {
    console.error("❌ expected c6 to preserve text around the image; got:", JSON.stringify(c6));
    process.exit(1);
  }

  const uid = mapping[pid];
  if (
    !imageUploads[uid] ||
    imageUploads[uid].imageBase64.indexOf("data:image/png;base64") !== 0
  ) {
    console.error("❌ imageUploads entry missing or invalid");
    process.exit(1);
  }

  console.log("✅ E2E: table line-breaks + images passed");
  process.exit(0);
})();
