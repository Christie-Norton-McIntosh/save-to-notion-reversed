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

// Case D: legitimate bracketed text should NOT be removed
const td4 = document.createElement("td");
td4.innerHTML = 'See [Section 2] for details';
const out4 = proc(td4);
if (out4.indexOf("[Section 2]") === -1) {
  console.error("❌ legitimate bracketed text was removed");
  process.exit(1);
}

console.log("✅ processCellForTableToList PASSED");
process.exit(0);
