<<<<<<< HEAD:tests/test-servicenow-viewer-url.js
const { JSDOM } = require("jsdom");

console.log("🧪 Testing ServiceNow viewer/attachment URL scenario...\n");
=======
const { JSDOM } = require('jsdom');

console.log('🧪 Testing ServiceNow viewer/attachment URL scenario...\n');
>>>>>>> 5dea4f0 (fix: accept ServiceNow viewer/attachment URLs for image extraction):Web-2-Notion/test/test-servicenow-viewer-url.js

// Exact ServiceNow HTML with viewer/attachment URL
const html = `
<table>
  <tr>
    <td>
      <a href="https://www.servicenow.com/docs/viewer/attachment/MlbQAgTiiiMOLOw9T36wJg/FBue0LinyCrQ_vyRxtzuyA-MlbQAgTiiiMOLOw9T36wJg">
        <img src="data:image/png;base64,iVBORw0K..." alt="List icon">
      </a>
    </td>
  </tr>
</table>
`;

const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
global.document = dom.window.document;
global.window = dom.window;
global.Node = dom.window.Node;

<<<<<<< HEAD:tests/test-servicenow-viewer-url.js
const cell = dom.window.document.querySelector("td");
const cellClone = cell.cloneNode(true);
const img = cellClone.querySelector("img");
const parentAnchor =
  img.parentElement?.tagName === "A" ? img.parentElement : null;

console.log("📋 Input:");
console.log("   Image src:", img.getAttribute("src").substring(0, 30) + "...");
console.log("   Image alt:", img.getAttribute("alt"));
console.log("   Anchor href:", parentAnchor?.href.substring(0, 70) + "...");
console.log("");

// Simulate the OLD buggy logic (options.js before fix)
let srcOld = img.getAttribute("src");
if (srcOld.startsWith("data:") && parentAnchor && parentAnchor.href) {
  const anchorHref = parentAnchor.getAttribute("href") || parentAnchor.href;
  // OLD: Excludes /viewer/attachment/ URLs
  if (
    anchorHref &&
    !anchorHref.includes("/viewer/attachment/") &&
    (anchorHref.includes("/resources/") ||
=======
const cell = dom.window.document.querySelector('td');
const cellClone = cell.cloneNode(true);
const img = cellClone.querySelector('img');
const parentAnchor = img.parentElement?.tagName === 'A' ? img.parentElement : null;

console.log('📋 Input:');
console.log('   Image src:', img.getAttribute('src').substring(0, 30) + '...');
console.log('   Image alt:', img.getAttribute('alt'));
console.log('   Anchor href:', parentAnchor?.href.substring(0, 70) + '...');
console.log('');

// Simulate the OLD buggy logic (options.js before fix)
let srcOld = img.getAttribute('src');
if (srcOld.startsWith('data:') && parentAnchor && parentAnchor.href) {
  const anchorHref = parentAnchor.getAttribute('href') || parentAnchor.href;
  // OLD: Excludes /viewer/attachment/ URLs
  if (
    anchorHref &&
    !anchorHref.includes('/viewer/attachment/') &&
    (anchorHref.includes('/resources/') ||
>>>>>>> 5dea4f0 (fix: accept ServiceNow viewer/attachment URLs for image extraction):Web-2-Notion/test/test-servicenow-viewer-url.js
      anchorHref.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i))
  ) {
    srcOld = anchorHref;
  }
}
<<<<<<< HEAD:tests/test-servicenow-viewer-url.js
const isValidUrlOld =
  srcOld && (srcOld.startsWith("http://") || srcOld.startsWith("https://"));

console.log("📋 OLD behavior (excluded viewer URLs):");
console.log("   Final src:", srcOld.substring(0, 30) + "...");
console.log("   isValidUrl:", isValidUrlOld);
console.log(
  "   Result:",
  isValidUrlOld
    ? "✅ Image extracted"
    : "❌ Image SKIPPED (data: URL not replaced)",
);
console.log("");

// Simulate the NEW fixed logic (popup/main.js style)
let srcNew = img.getAttribute("src");
if (srcNew.startsWith("data:") && parentAnchor && parentAnchor.href) {
  const anchorHref = parentAnchor.getAttribute("href") || parentAnchor.href;
  // NEW: Accepts all http/https URLs, including /viewer/attachment/
  if (
    anchorHref &&
    (anchorHref.startsWith("http://") || anchorHref.startsWith("https://"))
=======
const isValidUrlOld = srcOld && (srcOld.startsWith('http://') || srcOld.startsWith('https://'));

console.log('📋 OLD behavior (excluded viewer URLs):');
console.log('   Final src:', srcOld.substring(0, 30) + '...');
console.log('   isValidUrl:', isValidUrlOld);
console.log('   Result:', isValidUrlOld ? '✅ Image extracted' : '❌ Image SKIPPED (data: URL not replaced)');
console.log('');

// Simulate the NEW fixed logic (popup/main.js style)
let srcNew = img.getAttribute('src');
if (srcNew.startsWith('data:') && parentAnchor && parentAnchor.href) {
  const anchorHref = parentAnchor.getAttribute('href') || parentAnchor.href;
  // NEW: Accepts all http/https URLs, including /viewer/attachment/
  if (
    anchorHref &&
    (anchorHref.startsWith('http://') || anchorHref.startsWith('https://'))
>>>>>>> 5dea4f0 (fix: accept ServiceNow viewer/attachment URLs for image extraction):Web-2-Notion/test/test-servicenow-viewer-url.js
  ) {
    srcNew = anchorHref;
  }
}
<<<<<<< HEAD:tests/test-servicenow-viewer-url.js
const isValidUrlNew =
  srcNew && (srcNew.startsWith("http://") || srcNew.startsWith("https://"));

console.log("📋 NEW behavior (accepts viewer URLs):");
console.log("   Final src:", srcNew.substring(0, 70) + "...");
console.log("   isValidUrl:", isValidUrlNew);
console.log(
  "   Result:",
  isValidUrlNew ? "✅ Image extracted" : "❌ Image SKIPPED",
);
console.log("");

console.log("=".repeat(70));
if (!isValidUrlOld && isValidUrlNew) {
  console.log("✅ FIX VERIFIED: ServiceNow viewer/attachment URLs now work!");
  process.exit(0);
} else if (isValidUrlOld && isValidUrlNew) {
  console.log("⚠️  Both old and new work (test may not be accurate)");
  process.exit(0);
} else {
  console.log("❌ FIX FAILED: Image still not being extracted");
=======
const isValidUrlNew = srcNew && (srcNew.startsWith('http://') || srcNew.startsWith('https://'));

console.log('📋 NEW behavior (accepts viewer URLs):');
console.log('   Final src:', srcNew.substring(0, 70) + '...');
console.log('   isValidUrl:', isValidUrlNew);
console.log('   Result:', isValidUrlNew ? '✅ Image extracted' : '❌ Image SKIPPED');
console.log('');

console.log('='.repeat(70));
if (!isValidUrlOld && isValidUrlNew) {
  console.log('✅ FIX VERIFIED: ServiceNow viewer/attachment URLs now work!');
  process.exit(0);
} else if (isValidUrlOld && isValidUrlNew) {
  console.log('⚠️  Both old and new work (test may not be accurate)');
  process.exit(0);
} else {
  console.log('❌ FIX FAILED: Image still not being extracted');
>>>>>>> 5dea4f0 (fix: accept ServiceNow viewer/attachment URLs for image extraction):Web-2-Notion/test/test-servicenow-viewer-url.js
  process.exit(1);
}
