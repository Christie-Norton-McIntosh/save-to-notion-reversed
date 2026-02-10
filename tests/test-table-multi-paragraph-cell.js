const { JSDOM } = require("jsdom");

console.log(
  "🧪 test-table-multi-paragraph-cell — ensure each <p> in a table cell becomes its own paragraph",
);
const dom = new JSDOM(`<!doctype html><html><body></body></html>`);
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;

const html = `
<table>
  <tr>
    <td><a href="https://example.com/img.png"><img src="https://example.com/img.png" alt="Automate IT service"></a></td>
    <td>
      Enhance the service experience
      <p class="p">First paragraph in cell.</p>
      <p>Second paragraph in same cell — should NOT be concatenated.</p>
    </td>
  </tr>
</table>
`;

document.body.innerHTML = html;

function tableToListFlatten(table) {
  const rows = Array.from(table.rows);
  const outParts = [];
  rows.forEach((row) => {
    const cells = Array.from(row.cells);
    cells.forEach((cell) => {
      const clone = cell.cloneNode(true);
      clone.querySelectorAll("script, style").forEach((s) => s.remove());

      // Replace imgs with bullet placeholder and preserve hidden img emulation
      const imgs = Array.from(clone.querySelectorAll("img"));
      imgs.forEach((img) => {
        const alt = img.getAttribute("alt") || "Image";
        img.replaceWith(document.createTextNode(" • " + alt + " • "));
      });

      // If the cell contains <p> elements, emit each <p> as its own part
      // but also include any orphan text nodes that appear before/after the <p>s.
      const paras = Array.from(clone.querySelectorAll("p"));
      if (paras.length > 0) {
        // Walk the cell's childNodes in order and collect text from
        // text nodes and <p> nodes to preserve original ordering.
        Array.from(clone.childNodes).forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const t = (node.textContent || "").trim();
            if (t) outParts.push(t);
          } else if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.tagName === "P"
          ) {
            const t = (node.textContent || "").trim();
            if (t) outParts.push(t);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            // For other elements (anchors that now wrap placeholders),
            // include their text content.
            const t = (node.textContent || "").trim();
            if (t) outParts.push(t);
          }
        });
      } else {
        outParts.push((clone.textContent || "").trim());
      }
    });
  });
  // Simulate tableToList flattening (space between cells, divider between rows)
  return outParts.filter(Boolean).join(" ");
}

const table = document.querySelector("table");
const flattened = tableToListFlatten(table);
console.log("Flattened ->", JSON.stringify(flattened));

let ok = true;
if (!flattened.includes("• Automate IT service •")) {
  console.error("❌ Missing placeholder for image in adjacent cell");
  ok = false;
}
if (!/Enhance the service experience/.test(flattened)) {
  console.error("❌ Leading orphan text missing");
  ok = false;
}
if (!/First paragraph in cell\./.test(flattened)) {
  console.error("❌ First paragraph missing");
  ok = false;
}
if (!/Second paragraph in same cell/.test(flattened)) {
  console.error("❌ Second paragraph missing");
  ok = false;
}

if (ok) {
  console.log("✅ PASSED");
  process.exit(0);
} else {
  console.error("❌ FAILED");
  process.exit(1);
}
