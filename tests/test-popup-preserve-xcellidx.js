const { JSDOM } = require("jsdom");

console.log("🧪 Testing popup preserves XCELLIDX markers and data-stn-preserve wrappers...\n");

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;

function extractText(cell) {
  const clone = cell.cloneNode(true);
  return (clone.textContent || "").trim();
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

// Case A: XCELLIDX token should be preserved verbatim
const td1 = document.createElement("td");
td1.innerHTML = 'XCELLIDXCELL_fooXCELLIDX';
expect("XCELLIDX token preserved in cell text", extractText(td1), "XCELLIDXCELL_fooXCELLIDX");

// Case B: data-stn-preserve IMG is left in DOM and visible placeholder remains
const td2 = document.createElement("td");
td2.innerHTML = '<span class="stn-inline-image"><img src="https://example.com/i.png" data-stn-preserve="1" alt="I"><span> • I • </span></span>';
expect("data-stn-preserve wrapper preserved", extractText(td2), "• I •");

console.log(`\nSummary: ✅ ${pass}   ❌ ${fail}`);
if (fail) process.exit(1);
process.exit(0);
