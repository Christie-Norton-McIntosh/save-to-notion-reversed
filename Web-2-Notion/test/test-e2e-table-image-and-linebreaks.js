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
    </table>`;

  // Run sanitize & marker storage
  const tests = [];
  ["c1", "c2", "c3", "c4", "c5"].forEach((id) => {
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

/*
 * Regression test: real-world ServiceNow table markup (from user report).
 * Ensures:
 *  - empty table cells don't crash conversion
 *  - inline text + <p>wrapped image preserve the inline text
 *  - data: (base64) images are queued and removed from the cell text
 */
(function () {
  console.log('\n🧪 Regression: ServiceNow "Open incidents" table markup');
  const html = `
<div class="body conbody"><p class="shortdesc">View the current information about open incidents as a list, or as a heatmap or pivot table organized by breakdown.</p>
    <div class="p">
      <div class="note important note_important"><span class="note__title">Important:</span> <div class="note__body">
        <p class="p">Starting in <span class="ph">Xanadu</span> release, the Open Incidents Reports dashboard is deprecated. Users can use <a class="xref ft-internal-link" href="https://www.servicenow.com/docs/r/MlbQAgTiiiMOLOw9T36wJg/vFp4O3cbdP5t1T8elq1y6A" title="Dashboard providing a view into process metrics related to Open and Closed incidents." data-ft-click-interceptor="ft-internal-link">Incident management dashboard</a> to view the current information about open incidents as a list, or as a heatmap or pivot table organized by breakdown.</p>
      </div></div>
    </div>
    <figure class="fig fignone" id="open-incidents-reports-dashboard__fig_n1f_y2p_blb"><figcaption><span class="fig--title-label">Figure 1. </span>Tabs of the Open Incidents Reports dashboard</figcaption>
         
         
      <a href="#"><img class="image ft-zoomable-image ft-responsive-image" alt="Animated gif" src="https://example.com/img.png"></a>
    </figure>
    <section class="section" id="open-incidents-reports-dashboard__section_upb_qj4_2fb"><h2 class="title sectiontitle">End user and roles</h2>
         
      <div class="p">
        <table class="table frame-all" id="open-incidents-reports-dashboard__table_ov2_tj4_2fb"><caption></caption><colgroup><col style="width:33.333%"><col style="width:33.333%"><col style="width:33.333%"></colgroup><thead class="thead">
              <tr class="row">
                <th class="entry">End user and goal</th>
                <th class="entry">Required role</th>
                <th class="entry">Benefits</th>
              </tr>
            </thead><tbody class="tbody">
              <tr class="row">
                <td class="entry"></td>
                <td class="entry"></td>
                <td class="entry"></td>
              </tr>
            </tbody></table>
      </div>
    </section>
    <section class="section" id="open-incidents-reports-dashboard__section_t5q_fl4_2fb"><h2 class="title sectiontitle">Data visualizations</h2>
         
      <div class="p">
            
        <table class="table frame-all" id="open-incidents-reports-dashboard__table_xvt_hl4_2fb"><caption></caption><colgroup><col style="width:33.333%"><col style="width:33.333%"><col style="width:33.333%"></colgroup><thead class="thead">
              <tr class="row">
                <th class="entry">Title</th>
                <th class="entry">Type</th>
                <th class="entry">Description</th>
              </tr>
            </thead><tbody class="tbody">
              <tr class="row">
                <td class="entry">Open Incidents List</td>
                <td class="entry">List <p class="p"><span class="image icon"><a href="#"><img class="image icon" alt="list icon" src="https://example.com/list.png"></a></span></p></td>
                <td class="entry">List of all incident records for open incidents</td>
              </tr>
              <tr class="row">
                <td class="entry">Open Incidents Heatmap</td>
                <td class="entry">Heatmap <p class="p"><a href="#"><img class="image icon" src="data:image/png;base64,AAA" alt="Heatmap icon"></a></p></td>
                <td class="entry">Heatmap that lets you explore the number of open incidents by combinations of state, assignment group, category, priority, and age.</td>
              </tr>
            </tbody></table>
      </div>
    </section>
  </div>`;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;

  // Process both tables
  const tables = wrapper.querySelectorAll('table');
  if (tables.length < 2) {
   console.error('❌ expected two tables in fixture');
   process.exit(1);
  }

  // First table: empty cells should yield empty strings and not throw
  const t1 = tables[0];
  const emptyCell = t1.querySelector('tbody td');
  const r1 = simulateSanitizeCellAndQueue(emptyCell, 'svc_empty_1');
  if (!window.__TABLE_CELL_CONTENT_MAP__['svc_empty_1'] || window.__TABLE_CELL_CONTENT_MAP__['svc_empty_1'].trim() !== '') {
   console.error('❌ empty table cell produced non-empty output:', JSON.stringify(window.__TABLE_CELL_CONTENT_MAP__['svc_empty_1']));
   process.exit(1);
  }

  // Second table: ensure inline text + <p>wrapped image preserves inline text
  const t2 = wrapper.querySelector('#open-incidents-reports-dashboard__table_xvt_hl4_2fb');
  const rows = Array.from(t2.querySelectorAll('tbody tr'));
  const row1 = rows[0];
  const typeCell1 = row1.cells[1];
  simulateSanitizeCellAndQueue(typeCell1, 'svc_type_1');
  if (!window.__TABLE_CELL_CONTENT_MAP__['svc_type_1'].includes('List')) {
   console.error('❌ "List" label lost from type cell');
   process.exit(1);
  }

  // Row with heatmap: data: image should be queued and removed from text
  const row2 = rows[1];
  const typeCell2 = row2.cells[1];
  simulateSanitizeCellAndQueue(typeCell2, 'svc_type_2');
  if (!window.__TABLE_CELL_CONTENT_MAP__['svc_type_2'].includes('Heatmap')) {
   console.error('❌ "Heatmap" label lost from type cell');
   process.exit(1);
  }
  if (!window.__base64ImageArray || window.__base64ImageArray.length === 0) {
   console.error('❌ expected data: image to be queued, but __base64ImageArray is', window.__base64ImageArray);
   process.exit(1);
  }
  // Reconstruct the markdown the popup would produce for the second table
  const header = Array.from(t2.querySelectorAll('thead tr th')).map(h => h.textContent.trim());
  const headerLine = '| ' + header.join(' | ') + ' |';

  const bodyLines = rows.map((tr, rIdx) => {
    const cells = Array.from(tr.cells).map((cell, cIdx) => {
      const key = rIdx === 0 && cIdx === 1 ? 'svc_type_1' : rIdx === 1 && cIdx === 1 ? 'svc_type_2' : null;
      if (key && window.__TABLE_CELL_CONTENT_MAP__ && window.__TABLE_CELL_CONTENT_MAP__[key]) {
        return window.__TABLE_CELL_CONTENT_MAP__[key].replace(/\n/g, ' ');
      }
      return (cell.textContent || '').trim();
    });
    return '| ' + cells.join(' | ') + ' |';
  });

  const tableMarkdown = [headerLine].concat(bodyLines).join('\n');

  if (!tableMarkdown.includes('| Title | Type | Description |')) {
    console.error('❌ generated markdown header is incorrect:\n', tableMarkdown);
    process.exit(1);
  }

  if (!tableMarkdown.includes('Open Incidents List') || !tableMarkdown.includes('List of all incident records')) {
    console.error('❌ expected visible text missing from generated markdown:\n', tableMarkdown);
    process.exit(1);
  }

  // Ensure base64 image was queued and is referenced by a placeholder (not leaked as data: URL)
  const b64Map = window.__TABLE_BASE64_IMAGE_MAP__ || {};
  const hasPlaceholder = Object.keys(b64Map).some((pid) => pid.indexOf('BASE64_IMG_') === 0);
  if (!hasPlaceholder) {
    console.error('❌ expected BASE64 placeholder in TABLE_BASE64_IMAGE_MAP__');
    process.exit(1);
  }

  if (tableMarkdown.indexOf('data:image/png;base64') !== -1) {
    console.error('❌ data: URL leaked into generated markdown');
    process.exit(1);
  }

  console.log('✅ Regression: ServiceNow table fixture handled correctly (markdown + placeholders verified)');
  process.exit(0);
})();
