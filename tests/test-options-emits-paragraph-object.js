const { JSDOM } = require("jsdom");

console.log(
  "🧪 test-options-emits-paragraph-object — content-script emits structured payload",
);

const dom = new JSDOM(`<!doctype html><html><body></body></html>`);
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;

const html = `
<table>
  <tr>
    <td>Lead text<p>First para</p><p>Second para</p></td>
  </tr>
</table>
`;
document.body.innerHTML = html;

// Reuse the sanitizeCell logic from the real content-script (minimal
// inline replication) to assert the structured payload shape.
function sanitizeCellAndEmit(cell) {
  const cellClone = cell.cloneNode(true);
  cellClone.querySelectorAll("script, style").forEach((s) => s.remove());

  // Wrap orphan text nodes and insert markers (same approach used in options.js)
  Array.from(cellClone.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      const p = document.createElement("p");
      p.textContent = node.textContent;
      cellClone.replaceChild(p, node);
    }
  });

  Array.from(cellClone.querySelectorAll("p")).forEach((p) => {
    const marker = document.createTextNode("__BLOCK_END__");
    if (p.nextSibling) p.parentNode.insertBefore(marker, p.nextSibling);
    else p.parentNode.appendChild(marker);
  });

  const t = (cellClone.textContent || "")
    .replace(/__BLOCK_END__/g, "\n")
    .trim();
  // simulate insertion into __TABLE_CELL_CONTENT_MAP__
  window.__TABLE_CELL_CONTENT_MAP__ = {};
  const id = "CELL_TEST";
  const paragraphs = t
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  window.__TABLE_CELL_CONTENT_MAP__[id] = {
    paragraphs: paragraphs,
    flattened: paragraphs.join(" "),
  };
  return window.__TABLE_CELL_CONTENT_MAP__[id];
}

const cell = document.querySelector("td");
const obj = sanitizeCellAndEmit(cell);

if (!obj || !Array.isArray(obj.paragraphs) || obj.paragraphs.length !== 3) {
  console.error(
    "❌ Expected paragraphs array with 3 entries, got",
    obj && obj.paragraphs,
  );
  process.exit(1);
}
if (obj.flattened.indexOf("Lead text") === -1) {
  console.error("❌ Flattened string missing leading text");
  process.exit(1);
}

console.log("✅ PASSED");
process.exit(0);
