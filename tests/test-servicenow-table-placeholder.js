const { JSDOM } = require("jsdom");

// Regression test for ServiceNow table cell where a linked image in one cell
// must produce a visible placeholder (and not be removed) when the table
// row is converted to flattened paragraph lines.

console.log("🧪 Testing ServiceNow table-cell image placeholder regression\n");

const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;

window.__TABLE_CELL_CONTENT_MAP__ = {};

const html = `
<table>
<tr class="row">
<td class="entry colsep-1 rowsep-1"><a href="https://www.servicenow.com/docs/viewer/attachment/MlbQAgTiiiMOLOw9T36wJg/QUqRPn2wAlnUa3GHFAcvKA-MlbQAgTiiiMOLOw9T36wJg"><img alt="Automate IT service" src="data:image/png;base64,AAA"/></a></td>
<td class="entry rowsep-1">Enhance the service experience<p class="p">Automate support for common requests with virtual agents powered by natural language understanding (NLU).</p></td>
</tr>
</table>
`;

document.body.innerHTML = html;

const table = document.querySelector("table");
const row = table.rows[0];
const cell0 = row.cells[0];
const cell1 = row.cells[1];

// Simulate the content-script/table sanitizer (same approach as other tests)
function sanitizeCell(cell) {
  const cellClone = cell.cloneNode(true);
  cellClone.querySelectorAll("script, style").forEach((el) => el.remove());

  // mimic our sanitizeCell image handling (simplified)
  const images = cellClone.querySelectorAll("img");
  images.forEach((img) => {
    const alt = img.getAttribute("alt") || "Image";
    const parentAnchor =
      img.parentElement && img.parentElement.tagName === "A"
        ? img.parentElement
        : null;
    // replace with bullet placeholder (table flow)
    const placeholder = document.createTextNode(` • ${alt} • `);
    img.replaceWith(placeholder);
  });

  // convert anchors to text
  cellClone.querySelectorAll("a").forEach((a) => {
    a.replaceWith(document.createTextNode(a.textContent || ""));
  });

  // Add spacing before block elements to prevent text from running together
  cellClone
    .querySelectorAll("p, div, h1, h2, h3, h4, h5, h6, li, br")
    .forEach((el) => {
      // Insert a space marker before each block element
      const spaceMarker = document.createTextNode(" ");
      el.parentNode.insertBefore(spaceMarker, el);
    });

  const text = (cellClone.textContent || "").replace(/\s+/g, " ").trim();
  return text;
}

const out0 = sanitizeCell(cell0);
const out1 = sanitizeCell(cell1);

console.log("Cell0 ->", JSON.stringify(out0));
console.log("Cell1 ->", JSON.stringify(out1));

// Flattened row output (tableToList-like)
const flattened = [out0, out1].filter(Boolean).join(" ");
console.log("\nFlattened ->", JSON.stringify(flattened));

let pass = true;
if (!flattened.includes("• Automate IT service •")) {
  console.error("❌ Placeholder missing in flattened output");
  pass = false;
}
if (!/Enhance the service experience\s+Automate support/.test(flattened)) {
  console.error("❌ Text ran together or spacing missing between phrases");
  pass = false;
}

if (pass) {
  console.log("\n✅ Regression test PASSED");
  process.exit(0);
} else {
  console.log("\n❌ Regression test FAILED");
  process.exit(1);
}
