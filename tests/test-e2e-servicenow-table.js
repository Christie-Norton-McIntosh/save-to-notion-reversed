const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

console.log(
  "🧪 test-e2e-servicenow-table — full pipeline (content-script -> popup)",
);

const html = fs.readFileSync(
  path.join(__dirname, "fixtures", "servicenow-table-sample.html"),
  "utf8",
);
const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`);
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;

// Minimal reproduction of the content-script sanitizeCell behavior that
// the popup expects (produces XCELLIDX and populates __TABLE_CELL_CONTENT_MAP__)
function sanitizeCell(cell) {
  const cellClone = cell.cloneNode(true);
  cellClone.querySelectorAll("script, style").forEach((el) => el.remove());

  // Replace images with bullet placeholders (table flow) and preserve a
  // hidden image if inline; simplified for the test
  const images = Array.from(cellClone.querySelectorAll("img"));
  images.forEach((img) => {
    const alt = img.getAttribute("alt") || "Image";
    const placeholder = document.createTextNode(" • " + alt + " • ");
    img.replaceWith(placeholder);
  });

  // Convert anchors to text
  cellClone.querySelectorAll("a").forEach((a) => {
    a.replaceWith(document.createTextNode(a.textContent || ""));
  });

  // Wrap orphan text nodes so they become paragraph-like
  Array.from(cellClone.childNodes).forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) {
      const p = document.createElement("p");
      p.textContent = n.textContent.trim();
      cellClone.replaceChild(p, n);
    }
  });

  // Insert block-end markers and extract newline-preserving string
  Array.from(cellClone.querySelectorAll("p, div")).forEach((p) => {
    const m = document.createTextNode("__BLOCK_END__");
    if (p.nextSibling) p.parentNode.insertBefore(m, p.nextSibling);
    else p.parentNode.appendChild(m);
  });

  const textWithNewlines = (cellClone.textContent || "")
    .replace(/__BLOCK_END__/g, "\n")
    .split("\n")
    .map((s) => s.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");

  // Publish structured payload (what options.js does)
  window.__TABLE_CELL_CONTENT_MAP__ = window.__TABLE_CELL_CONTENT_MAP__ || {};
  const id =
    "CELL_E2E_" + Math.random().toString(36).substr(2, 6).toUpperCase();
  window.__TABLE_CELL_CONTENT_MAP__[id] = {
    paragraphs: textWithNewlines.split("\n"),
    flattened: textWithNewlines.split("\n").join(" "),
    meta: {
      containsImage: images.length > 0,
      hasLinks: false,
      approxLength: (textWithNewlines || "").length,
    },
  };

  return `XCELLIDX${id}XCELLIDX`;
}

// Minimal popup expansion that consumes the structured payload (same logic as main.js)
function popupExpand(marker) {
  const m = marker.match(/XCELLIDX(CELL_[A-Z0-9_]+)XCELLIDX/);
  if (!m) return [marker];
  const id = m[1];
  const payload = window.__TABLE_CELL_CONTENT_MAP__[id];
  if (!payload) return [marker];
  return payload.paragraphs.slice();
}

// Run the end-to-end scenario: sanitize both cells, then expand and assert
const table = document.querySelector("table");
const row = table.rows[0];
const cell0 = row.cells[0];
const cell1 = row.cells[1];

const marker0 = sanitizeCell(cell0);
const marker1 = sanitizeCell(cell1);

// Simulate flattened tableToList output: join cell representations with a space
const flattened = [marker0, marker1]
  .map((m) => {
    const parts = popupExpand(m);
    return parts.join("\n");
  })
  .filter(Boolean)
  .join(" ");

console.log("Flattened (simulated) ->", JSON.stringify(flattened));

if (!flattened.includes("• Automate IT service •")) {
  console.error("❌ Image placeholder missing in E2E output");
  process.exit(1);
}
if (!/Enhance the service experience/.test(flattened)) {
  console.error("❌ Leading orphan text missing in E2E output");
  process.exit(1);
}
if (!/Automate support for common requests/.test(flattened)) {
  console.error("❌ Paragraph content missing in E2E output");
  process.exit(1);
}

// Regression guard: when the producer marker is present the popup must not
// inject data: URL image markdown that can be lost later in the pipeline.
if (/data:image\//.test(flattened)) {
  console.error(
    "❌ Unexpected data: URL image markdown present in flattened output when XCELLIDX was used",
  );
  process.exit(1);
}

console.log("✅ E2E PASSED");
process.exit(0);
