const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log(
  "🧪 test-clipContent-manual-selector — extractContentData should handle custom-element selector chains",
);

const clipPath = path.join(__dirname, "..", "Web-2-Notion", "clipContent.js");
const src = fs.readFileSync(clipPath, "utf8");

// Extract extractContentData function using brace matching
const fnName = "extractContentData";
const startIdx = src.indexOf(`function ${fnName}(`);
if (startIdx === -1) {
  console.error(`❌ could not find ${fnName} in clipContent.js`);
  process.exit(1);
}
let braceIdx = src.indexOf("{", startIdx);
let depth = 1;
let i = braceIdx + 1;
for (; i < src.length; i++) {
  const ch = src[i];
  if (ch === "{") depth++;
  else if (ch === "}") {
    depth--;
    if (depth === 0) break;
  }
}
if (depth !== 0) {
  console.error("❌ could not extract function body");
  process.exit(1);
}
const fnCode = src.slice(startIdx, i + 1) + "\n";

const dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
  runScripts: "dangerously",
  resources: "usable",
});
const win = dom.window;
win.console = console;
const doc = win.document;

// Inject the extracted function into the JSDOM window so `document` resolves
const wrapped = fnCode.replace(/^function\s+extractContentData/, "function");
win.eval(`window.${fnName} = ${wrapped};`);

// Build DOM with custom-element chain that includes the text 'zurich'
const html = `
  <div id="root">
    <div>
      <ft-floating-menu>
        <ft-tooltip>
          <ft-chip>
            <span>zurich</span>
          </ft-chip>
        </ft-tooltip>
      </ft-floating-menu>
    </div>
  </div>
`;

doc.body.innerHTML = html;

const root = doc.querySelector("#root");
const selector = "div > ft-floating-menu > ft-tooltip > ft-chip > span";
const res = win.extractContentData(root, selector);

if (!res) {
  console.error("❌ extractContentData returned null — expected content");
  process.exit(1);
}

assert(
  res.textContent.indexOf("zurich") !== -1,
  'Expected extracted text to contain "zurich"',
);
assert(res.elementCount >= 1, "Expected at least one elementCount");

console.log("✅ PASSED");
process.exit(0);
