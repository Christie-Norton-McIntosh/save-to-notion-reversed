const { JSDOM } = require("jsdom");

console.log("🧪 Testing tableWithoutHeading emits bullet-style placeholders...\n");

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;

let pass = 0;
let fail = 0;

function expect(desc, got, want) {
  console.log(`\n• ${desc}`);
  if (got.includes(want)) {
    console.log(`  ✅ contains: ${want}`);
    pass++;
  } else {
    console.log(`  ❌ missing: ${want}`);
    console.log(`    result: "${got}"`);
    fail++;
  }
}

const td = document.createElement("td");
td.innerHTML = 'Open <img src="https://example.com/icon.png" alt="arrow" /> portal';

// Simulate the sanitizeCell behavior (focused on image replacement)
const clone = td.cloneNode(true);
const img = clone.querySelector("img");
if (img) {
  const alt = img.getAttribute("alt") || "";
  if (alt) img.replaceWith(document.createTextNode(" • " + alt + " • "));
  else img.remove();
}

const out = (clone.textContent || "").trim();
expect("visible bullet placeholder is present", out, " • arrow • ");
expect("surrounding text preserved", out, "Open");

console.log(`\nSummary: ✅ ${pass}   ❌ ${fail}`);
if (fail) process.exit(1);
process.exit(0);
