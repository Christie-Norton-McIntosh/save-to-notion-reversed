const { JSDOM } = require("jsdom");

console.log(
  "🧪 test-table-inline-image — ensure inline image in table cell gets placeholder",
);
const dom = new JSDOM(`<!doctype html><html><body></body></html>`);
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;

const html = `
<table>
  <tr>
    <td>Enhance the service experience <a href="https://example.com"><img src="data:image/png;base64,AAA" alt="Automate IT service"></a> Automate support for common requests</td>
  </tr>
</table>
`;

document.body.innerHTML = html;

// replicate sanitizeCell logic minimal
function sanitizeCell(cell) {
  const cellClone = cell.cloneNode(true);
  cellClone.querySelectorAll("script, style").forEach((el) => el.remove());

  const images = cellClone.querySelectorAll("img");
  images.forEach((img) => {
    const parentAnchor =
      img.parentElement && img.parentElement.tagName === "A"
        ? img.parentElement
        : null;
    const alt = img.getAttribute("alt") || "Image";
    // force placeholder for inline images - check if the image (or its anchor parent)
    // has text siblings
    const prev = img.previousSibling;
    const next = img.nextSibling;
    const hasTextSibling =
      (prev && prev.nodeType === Node.TEXT_NODE && prev.textContent.trim()) ||
      (next && next.nodeType === Node.TEXT_NODE && next.textContent.trim()) ||
      (parentAnchor &&
        ((parentAnchor.previousSibling && parentAnchor.previousSibling.nodeType === Node.TEXT_NODE && parentAnchor.previousSibling.textContent.trim()) ||
         (parentAnchor.nextSibling && parentAnchor.nextSibling.nodeType === Node.TEXT_NODE && parentAnchor.nextSibling.textContent.trim()) ||
         Array.from(parentAnchor.childNodes).some(
           (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim(),
         )));
    if (hasTextSibling) {
      const preserved = img.cloneNode(true);
      preserved.setAttribute("data-stn-preserve", "1");
      const wrapper = document.createElement("span");
      wrapper.className = "stn-inline-image";
      wrapper.appendChild(preserved);
      wrapper.appendChild(document.createTextNode(" • " + alt + " • "));
      img.replaceWith(wrapper);
    }
  });

  return (cellClone.textContent || "").replace(/\s+/g, " ").trim();
}

const cell = document.querySelector("td");
const out = sanitizeCell(cell);
console.log("OUTPUT:", JSON.stringify(out));

if (
  out.includes("• Automate IT service •") &&
  /Enhance the service experience\s+•/.test(out)
) {
  console.log("✅ PASSED");
  process.exit(0);
} else {
  console.error("❌ FAILED — placeholder missing or spacing wrong");
  process.exit(1);
}
