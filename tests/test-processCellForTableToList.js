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

console.log("✅ processCellForTableToList PASSED");
process.exit(0);
