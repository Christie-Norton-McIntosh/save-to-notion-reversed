const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log("🧪 test-clipContent-deep-drill — extractContentData should drill into wrapped content");

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

// Define the extracted function inside the JSDOM window so `document` and
// other DOM globals resolve correctly. Assign it to window explicitly.
const wrapped = fnCode.replace(/^function\s+extractContentData/, "function");
win.eval(`window.${fnName} = ${wrapped};`);

// Build a DOM where the selector matches a wrapper DIV with deeply nested
// paragraphs (the extractor must drill down to find the meaningful text).
const html = `
  <div class="wrapper">
    <div class="layer1">
      <div class="layer2">
        <div class="layer3">
          <div class="inner">
            <p>Short intro.</p>
            <div class="deep-wrap">
              <div>
                <div>
                  <p>This is the important paragraph that should be extracted by the deep-drill logic. It contains enough text to be considered meaningful.</p>
                </div>
              </div>
            </div>
            <p>Conclusion.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

doc.body.innerHTML = html;

const root = doc.querySelector('.wrapper');
const res = win.extractContentData(root, '.wrapper');

if (!res) {
  console.error('❌ extractContentData returned null — expected content');
  process.exit(1);
}

assert(res.textContent.indexOf('This is the important paragraph') !== -1, 'Deep paragraph should be present in extracted text');
assert(res.elementCount >= 1, 'Expected at least one elementCount');

console.log('✅ PASSED');
process.exit(0);
