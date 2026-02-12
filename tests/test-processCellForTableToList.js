const { JSDOM } = require("jsdom");
const path = require("path");

console.log(
  "🧪 test-processCellForTableToList — exposes and exercises cell processor",
);

const dom = new JSDOM("<!doctype html><html><body></body></html>");
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;

const utils = require(
  path.join(
    __dirname,
    "..",
    "Web-2-Notion",
    "popup",
    "lib",
    "table-to-list-utils.js",
  ),
);
const proc = utils.processCellForTableToList;

// Also exercise the popup/browser implementation (exports same helper).
let popupProc;
try {
  popupProc = require(
    path.join(
      __dirname,
      "..",
      "Web-2-Notion",
      "popup",
      "static",
      "js",
      "main.js",
    ),
  ).processCellForTableToList;
} catch (err) {
  // Some test environments may not be able to load the full bundle; skip if so.
  popupProc = null;
}

// Case A: producer marker -> short-circuit (no data: markdown inserted)
const td1 = document.createElement("td");
td1.innerHTML =
  'XCELLIDX(CELL_ABC)XCELLIDX<img data-original-src="data:image/png;base64,AAA" data-stn-preserve="1" alt="I">';
const out1 = proc(td1);
if (
  !out1.includes("XCELLIDX(CELL_ABC)XCELLIDX") ||
  out1.includes("data:image/")
) {
  console.error(
    "❌ processCellForTableToList did not short-circuit or leaked data: URL",
  );
  process.exit(1);
}

if (popupProc) {
  const pOut1 = popupProc(td1);
  if (
    !pOut1.includes("XCELLIDX(CELL_ABC)XCELLIDX") ||
    pOut1.includes("data:image/")
  ) {
    console.error("❌ popup processCellForTableToList did not short-circuit");
    process.exit(1);
  }
}

// Case B: fallback paragraph with data: URL -> should emit markdown
const td2 = document.createElement("td");
td2.innerHTML =
  '<p>Leading text</p><p><img src="data:image/png;base64,BBB" alt="Alt"></p>';
const out2 = proc(td2);
if (!/\!\[Alt\]\(data:image\//.test(out2) || !/Leading text/.test(out2)) {
  console.error(
    "❌ processCellForTableToList fallback did not emit expected markdown",
  );
  process.exit(1);
}

if (popupProc) {
  const pOut2 = popupProc(td2);
  if (!/\!\[Alt\]\(data:image\//.test(pOut2) || !/Leading text/.test(pOut2)) {
    console.error("❌ popup fallback did not emit expected markdown");
    process.exit(1);
  }
}

// Case C: preserved IMG with legacy visible bracketed placeholder — the
// visible "[alt]" must be stripped but the preserved IMG should keep the
// cell treated as a producer (no data: URL leakage).
const td3 = document.createElement("td");
td3.innerHTML =
  'XCELLIDX(CELL_ABC)XCELLIDX<img data-original-src="data:image/png;base64,AAA" data-stn-preserve="1" alt="I"> [I]';
const out3 = proc(td3);
if (!out3.includes("XCELLIDX(CELL_ABC)XCELLIDX") || /\[I\]/.test(out3)) {
  console.error(
    "❌ legacy bracketed placeholder was not stripped or XCELLIDX handling broken",
  );
  process.exit(1);
}

if (popupProc) {
  const pOut3 = popupProc(td3);
  if (!pOut3.includes("XCELLIDX(CELL_ABC)XCELLIDX") || /\[I\]/.test(pOut3)) {
    console.error("❌ popup did not strip legacy bracketed placeholder");
    process.exit(1);
  }
}

// Case D: legitimate bracketed text should NOT be removed
const td4 = document.createElement("td");
td4.innerHTML = "See [Section 2] for details";
const out4 = proc(td4);
if (out4.indexOf("[Section 2]") === -1) {
  console.error("❌ legitimate bracketed text was removed");
  process.exit(1);
}

// Case E: bracketed placeholder wrapped in a span next to preserved IMG
const td5 = document.createElement("td");
td5.innerHTML =
  'XCELLIDX(CELL_X)XCELLIDX<img data-original-src="data:image/png;base64,AAA" data-stn-preserve="1" alt="X"><span>[X]</span>';
const out5 = proc(td5);
if (/\[X\]/.test(out5)) {
  console.error("❌ bracketed placeholder inside span was NOT stripped");
  process.exit(1);
}

if (popupProc) {
  const pOut5 = popupProc(td5);
  if (/\[X\]/.test(pOut5)) {
    console.error("❌ popup did not strip span-wrapped bracketed placeholder");
    process.exit(1);
  }
}

// Case F: empty parentheses left after removing an inline image wrapper
const td6 = document.createElement("td");
td6.innerHTML =
  'XCELLIDX(CELL_Y)XCELLIDX<img data-original-src="data:image/png;base64,AAA" data-stn-preserve="1" alt="Y"> ()';
const out6 = proc(td6);
if (/\(\s*\)/.test(out6)) {
  console.error("❌ empty parentheses '()' were NOT removed");
  process.exit(1);
}

// Case H: inline SVG icon between parentheses — should be treated like an
// inline image and the empty parentheses removed.
const td8 = document.createElement("td");
td8.innerHTML =
  '(<svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>) next to text';
const out8 = proc(td8);
if (/\(\s*\)/.test(out8) || out8.indexOf("next to text") === -1) {
  console.error(
    "❌ SVG-wrapped empty parentheses were NOT removed or text lost",
  );
  process.exit(1);
}

// Case G: legitimate parenthetical content must be preserved
const td7 = document.createElement("td");
td7.innerHTML = "See (Fig. 2) for details";
const out7 = proc(td7);
if (!/\(Fig\. 2\)/.test(out7)) {
  console.error("❌ legitimate parenthetical content was removed");
  process.exit(1);
}

console.log("✅ processCellForTableToList PASSED");
process.exit(0);
