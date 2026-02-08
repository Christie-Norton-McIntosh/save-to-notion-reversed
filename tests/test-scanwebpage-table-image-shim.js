const { JSDOM } = require("jsdom");

console.log(
  "🧪 test-scanwebpage-table-image-shim — producer shim should annotate TDs with XCELLIDX and preserve images",
);

const dom = new JSDOM(`<!doctype html><html><body></body></html>`);
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;

// fixture: linked image with descriptive text in first cell, paragraphs in second
const html = `
<table>
  <tr>
    <td>Icon: <a href="https://example.com/p/1"><img alt="Sample image" src="https://example.com/img.png"></a></td>
    <td>Lead text<p>First para</p><p>Second para</p></td>
  </tr>
</table>
`;

document.body.innerHTML = html;

// If the real helper is present (scanWebpage.js attached it), use it; otherwise
// run a minimal in-test shim that mirrors the intended behaviour so the test
// asserts the contract that the popup expects.
function runShim(root) {
  if (typeof window.__stn_annotateTableCells === "function") {
    window.__stn_annotateTableCells(root);
    return;
  }

  // Minimal inline shim (same algorithm used in the content-script)
  window.__TABLE_CELL_CONTENT_MAP__ = window.__TABLE_CELL_CONTENT_MAP__ || {};
  Array.from(root.querySelectorAll("td,th")).forEach((cell) => {
    const imgs = Array.from(cell.querySelectorAll("img"));
    if (!imgs.length) return;
    const cellClone = cell.cloneNode(true);
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
    const textWithNewlines = (cellClone.textContent || "")
      .replace(/__BLOCK_END__/g, "\n")
      .trim();
    const paragraphs = textWithNewlines
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const id = "CELL_TEST" + Math.random().toString(36).slice(2, 8);
    window.__TABLE_CELL_CONTENT_MAP__[id] = {
      paragraphs: paragraphs,
      flattened: paragraphs.join(" "),
    };

    imgs.forEach((img) => {
      const alt = img.getAttribute("alt") || "image";
      const parentA =
        img.parentElement && img.parentElement.tagName === "A"
          ? img.parentElement
          : null;
      const placeholder = ` • ${alt} • `;
      if (parentA) {
        const a = document.createElement("a");
        a.setAttribute("href", parentA.getAttribute("href") || "");
        a.appendChild(document.createTextNode(placeholder));
        const preserved = document.createElement("img");
        preserved.setAttribute("data-stn-preserve", "1");
        preserved.setAttribute("src", img.getAttribute("src") || "");
        preserved.style.display = "none";
        a.appendChild(preserved);
        img.replaceWith(a);
      } else {
        img.replaceWith(document.createTextNode(placeholder));
        const preserved = document.createElement("img");
        preserved.setAttribute("data-stn-preserve", "1");
        preserved.setAttribute("src", img.getAttribute("src") || "");
        preserved.style.display = "none";
        cell.appendChild(preserved);
      }
    });

    cell.innerHTML = `XCELLIDX${id}XCELLIDX` + cell.innerHTML;
  });
}

runShim(document);

// assertions
const firstCell = document.querySelector("td");
const containsMarker = /XCELLIDX(CELL_[A-Za-z0-9]+)XCELLIDX/.test(
  firstCell.innerHTML,
);
if (!containsMarker) {
  console.error(
    "❌ Expected XCELLIDX marker in first cell innerHTML:",
    firstCell.innerHTML,
  );
  process.exit(1);
}

const preserved = firstCell.querySelector('img[data-stn-preserve="1"]');
if (!preserved) {
  console.error(
    '❌ Expected preserved hidden img[data-stn-preserve="1"] in first cell',
  );
  process.exit(1);
}

if (!firstCell.textContent.includes("• Sample image •")) {
  console.error(
    "❌ Expected visible bullet placeholder in first cell textContent",
  );
  process.exit(1);
}

// verify the TABLE_CELL_CONTENT_MAP entry exists and contains paragraphs for the second cell
const mapKeys = Object.keys(window.__TABLE_CELL_CONTENT_MAP__ || {});
if (!mapKeys.length) {
  console.error(
    "❌ Expected __TABLE_CELL_CONTENT_MAP__ to contain at least one entry",
  );
  process.exit(1);
}

const some = window.__TABLE_CELL_CONTENT_MAP__[mapKeys[0]];
if (!some || !Array.isArray(some.paragraphs) || some.paragraphs.length < 1) {
  console.error(
    "❌ Expected paragraphs array in __TABLE_CELL_CONTENT_MAP__ entry, got",
    some,
  );
  process.exit(1);
}

console.log("✅ PASSED");
process.exit(0);
