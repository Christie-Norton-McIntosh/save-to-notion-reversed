const { JSDOM } = require("jsdom");

console.log(
  "🧪 Testing table cell paragraph-splitting and bullet placeholders...\n",
);

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;

function paragraphAwareExtract(cell) {
  const clone = cell.cloneNode(true);
  const out = [];

  const paras = clone.querySelectorAll("p");
  if (paras && paras.length) {
    Array.from(paras).forEach((p) => {
      Array.from(p.querySelectorAll("img")).forEach((img) => {
        const alt = img.getAttribute("alt") || "";
        if (alt) img.replaceWith(document.createTextNode(" • " + alt + " • "));
        else img.remove();
      });
      const t = (p.textContent || "").trim();
      if (t) out.push(t);
    });
    // include orphan text nodes
    Array.from(clone.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
      .forEach((tn) => out.push(tn.textContent.trim()));
  } else {
    Array.from(clone.querySelectorAll("img")).forEach((img) => {
      const alt = img.getAttribute("alt") || "";
      if (alt) img.replaceWith(document.createTextNode(" • " + alt + " • "));
      else img.remove();
    });
    const t = (clone.textContent || "").trim();
    if (t) out.push(t);
  }

  return out.join("\n\n");
}

let pass = 0;
let fail = 0;

function expect(desc, got, wantSubstr) {
  console.log(`\n• ${desc}`);
  if (got.includes(wantSubstr)) {
    console.log(`  ✅ contains: ${wantSubstr}`);
    pass++;
  } else {
    console.log(`  ❌ missing: ${wantSubstr}`);
    console.log(`    result: "${got}"`);
    fail++;
  }
}

// Test: two paragraphs, image in second
const table = document.createElement("table");
const tr = document.createElement("tr");
const td = document.createElement("td");
td.innerHTML =
  '<p>First paragraph</p><p>Second <img src="https://example.com/i.png" alt="ICON"></p>';
tr.appendChild(td);
table.appendChild(tr);
document.body.appendChild(table);

const out = paragraphAwareExtract(td);
expect(
  "first paragraph preserved as its own paragraph",
  out,
  "First paragraph",
);
expect(
  "second paragraph preserved and contains bullet placeholder",
  out,
  " • ICON • ",
);

// Test: orphan text preserved
td.innerHTML =
  'Orphan text before<p>Para with <img src="https://example.com/x.png" alt="X"></p>And after';
const out2 = paragraphAwareExtract(td);
expect("orphan text preserved", out2, "Orphan text before");
expect("trailing orphan text preserved", out2, "And after");

console.log(`\nSummary: ✅ ${pass}   ❌ ${fail}`);
if (fail) process.exit(1);
process.exit(0);
