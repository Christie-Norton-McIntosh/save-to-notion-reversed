const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log(
  "🧪 test-content-selection-highlight — displayFieldAugmentation should create overlays",
);

const clipPath = path.join(__dirname, "..", "Web-2-Notion", "clipContent.js");
const src = fs.readFileSync(clipPath, "utf8");

// Extract the helper + displayFieldAugmentation functions so we can run the
// overlay logic inside JSDOM. We need getFieldName/getFieldType and
// displayFieldAugmentation.
const startMarker = "function getFieldName(";
const midMarker = "function displayFieldAugmentation(";
const startIdx = src.indexOf(startMarker);
const midIdx = src.indexOf(midMarker);
if (startIdx === -1 || midIdx === -1) {
  console.error("❌ required functions not found in clipContent.js");
  process.exit(1);
}

// Find the end of displayFieldAugmentation by matching braces from its start
let braceIdx = src.indexOf("{", midIdx);
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
  console.error("❌ could not extract displayFieldAugmentation body");
  process.exit(1);
}

const fnCode = src.slice(startIdx, i + 1) + "\n";

const dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
  runScripts: "dangerously",
  resources: "usable",
});
const win = dom.window;
win.console = console;
win.document.body.innerHTML = `
  <div class="wrapper" id="w1">
    <p>This is the important paragraph that should be highlighted.</p>
  </div>
`;

// Inject the extracted functions into the JSDOM window
win.eval(
  `window.__extracted_display_helpers = (function(){ ${fnCode}; return { getFieldName, getFieldType, displayFieldAugmentation }; })()`,
);
win.getFieldName = win.__extracted_display_helpers.getFieldName;
win.getFieldType = win.__extracted_display_helpers.getFieldType;
win.displayFieldAugmentation =
  win.__extracted_display_helpers.displayFieldAugmentation;

// Ensure no overlays exist initially
assert(
  !win.fieldOverlays || win.fieldOverlays.length === 0,
  "No overlays should exist initially",
);

// Call the function under test
const el = win.document.querySelector(".wrapper");
win.displayFieldAugmentation([el]);

// Validate overlays were created
assert(Array.isArray(win.fieldOverlays), "fieldOverlays should be an array");
assert(
  win.fieldOverlays.length === 1,
  "Expected exactly one overlay to be created",
);
console.log("✅ PASSED");
process.exit(0);
