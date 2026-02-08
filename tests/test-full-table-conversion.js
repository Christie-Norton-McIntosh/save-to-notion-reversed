const { JSDOM } = require("jsdom");

// Full end-to-end test of table conversion with abbr spacing
function testFullTableConversion() {
  console.log("🧪 Testing FULL table conversion with abbr spacing...\n");

  // Your actual HTML
  const html = `
    <table>
      <tr>
        <td>
          <span class="ph menucascade">
            <span class="ph uicontrol">Workspaces</span>
            <abbr title="and then"> &gt; </abbr>
            <span class="ph uicontrol">Service Operations Workspace</span>
          </span>
        </td>
      </tr>
      <tr>
        <td>
          <li class="li step stepexpand">
            <span class="ph cmd">Select the <span class="ph uicontrol">List</span> (<a href="https://www.servicenow.com/docs/viewer/attachment/test" data-ft-container-id="test"><img class="image icon" src="data:image/png;base64,iVBORw0K" alt="List icon"></a>) icon.</span>
          </li>
        </td>
      </tr>
    </table>
  `;

  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
  const doc = dom.window.document;
  global.document = doc;
  global.window = dom.window;
  global.Node = dom.window.Node;

  // Setup globals
  dom.window.__imageUrlArray = {};
  dom.window.__TABLE_CELL_CONTENT_MAP__ = {};

  const table = doc.querySelector("table");
  const cell = table.rows[0].cells[0];

  console.log("📋 Original cell HTML:");
  console.log(cell.innerHTML.replace(/\n\s+/g, " ").trim().substring(0, 200));
  console.log("");

  console.log("📋 Original cell textContent:");
  console.log("   Raw:", JSON.stringify(cell.textContent.substring(0, 100)));
  console.log(
    "   Collapsed:",
    JSON.stringify(cell.textContent.replace(/\s+/g, " ").trim()),
  );
  console.log("");

  // Clone the cell (like sanitizeCell does)
  const cellClone = cell.cloneNode(true);

  console.log("📋 Clone textContent (before processing):");
  console.log(
    "   Raw:",
    JSON.stringify(cellClone.textContent.substring(0, 100)),
  );
  console.log(
    "   Collapsed:",
    JSON.stringify(cellClone.textContent.replace(/\s+/g, " ").trim()),
  );
  console.log("");

  // Add __BLOCK_END__ markers (like sanitizeCell does)
  const blockElements = cellClone.querySelectorAll(
    "div, p, pre, blockquote, h1, h2, h3, h4, h5, h6, section, article, header, footer",
  );
  blockElements.forEach(function (block) {
    const separator = doc.createTextNode(" __BLOCK_END__ ");
    if (block.nextSibling) {
      block.parentNode.insertBefore(separator, block.nextSibling);
    } else {
      block.parentNode.appendChild(separator);
    }
  });

  console.log("📋 After adding __BLOCK_END__ markers:");
  const afterMarkers = cellClone.textContent;
  console.log(
    "   textContent:",
    JSON.stringify(afterMarkers.substring(0, 100)),
  );
  console.log("");

  // Extract text and process (like sanitizeCell does)
  let text = cellClone.textContent || "";

  console.log("📋 Processing steps:");
  console.log("   1. Raw textContent:", JSON.stringify(text.substring(0, 100)));

  const step1 = text.replace(/(\s*)__BLOCK_END__(\s*)/g, "$1\n$2");
  console.log(
    "   2. After __BLOCK_END__ replacement:",
    JSON.stringify(step1.substring(0, 100)),
  );

  const step2 = step1.replace(/__TDSEP__/g, " | ");
  console.log(
    "   3. After __TDSEP__ replacement:",
    JSON.stringify(step2.substring(0, 100)),
  );

  const step3 = step2.replace(/__BR__/g, "\n");
  console.log(
    "   4. After __BR__ replacement:",
    JSON.stringify(step3.substring(0, 100)),
  );

  const step4 = step3.replace(/__LI_END__/g, "\n");
  console.log(
    "   5. After __LI_END__ replacement:",
    JSON.stringify(step4.substring(0, 100)),
  );

  const step5 = step4.replace(/[ \t]{3,}/g, " ");
  console.log(
    "   6. After 3+ space collapse:",
    JSON.stringify(step5.substring(0, 100)),
  );

  const step6 = step5.replace(/\n{3,}/g, "\n\n");
  console.log(
    "   7. After 3+ newline collapse:",
    JSON.stringify(step6.substring(0, 100)),
  );

  const final = step6.trim();
  console.log("   8. After trim:", JSON.stringify(final.substring(0, 100)));
  console.log("");

  // Check the final result
  const singleLine = final.replace(/\n/g, " ").replace(/\s+/g, " ");
  console.log("📋 Final result (single line):");
  console.log("   Result:", JSON.stringify(singleLine));
  console.log('   Expected: "Workspaces > Service Operations Workspace"');
  console.log(
    "   Has spaces around >:",
    singleLine.includes(" > ") ? "✅" : "❌",
  );
  console.log("");

  // Now test the second cell with the inline image
  console.log("📋 Testing inline image cell:");
  const cell2 = table.rows[1].cells[0];
  const cell2Clone = cell2.cloneNode(true);
  const anchor = cell2Clone.querySelector("a");
  const img = cell2Clone.querySelector("img");

  console.log("   Anchor exists:", !!anchor);
  console.log("   Image exists:", !!img);
  console.log(
    "   Image is child of anchor:",
    !!(anchor && img && anchor.contains(img)),
  );
  console.log("   Image alt:", img?.alt);
}

testFullTableConversion();
