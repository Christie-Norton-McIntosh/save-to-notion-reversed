#!/usr/bin/env node
/**
 * Comprehensive test for bracketed placeholder and empty parens removal
 */

const { JSDOM } = require("jsdom");
const path = require("path");

console.log("🧪 Testing bracketed placeholder removal with fixtures\n");

const dom = new JSDOM("<!doctype html><html><body></body></html>");
global.document = dom.window.document;
global.Node = dom.window.Node;
global.NodeFilter = dom.window.NodeFilter;

const utils = require("../Web-2-Notion/popup/lib/table-to-list-utils.js");
const proc = utils.processCellForTableToList;

// Test 1: Image placeholder next to image should be removed
console.log("Test 1: Remove [alt] next to image");
const td1 = document.createElement("td");
td1.innerHTML =
  'XCELLIDX(CELL_A)XCELLIDX<img data-stn-preserve="1" alt="Icon"> [Icon]';
const out1 = proc(td1);
if (/\[Icon\]/.test(out1)) {
  console.error("  ❌ FAILED: [Icon] was not removed");
  process.exit(1);
}
console.log("  ✅ PASSED\n");

// Test 2: Image placeholder in span next to image should be removed
console.log("Test 2: Remove [alt] in span next to image");
const td2 = document.createElement("td");
td2.innerHTML =
  'XCELLIDX(CELL_B)XCELLIDX<img data-stn-preserve="1" alt="Icon"><span>[Icon]</span>';
const out2 = proc(td2);
if (/\[Icon\]/.test(out2)) {
  console.error("  ❌ FAILED: [Icon] in span was not removed");
  process.exit(1);
}
console.log("  ✅ PASSED\n");

// Test 3: Legitimate bracketed text should be preserved
console.log("Test 3: Preserve [legitimate text]");
const td3 = document.createElement("td");
td3.innerHTML = "<p>The word [DRAFT] is in front of the item name.</p>";
const out3 = proc(td3);
if (!/\[DRAFT\]/.test(out3)) {
  console.error("  ❌ FAILED: [DRAFT] was incorrectly removed");
  process.exit(1);
}
console.log("  ✅ PASSED\n");

// Test 4: Legitimate bracketed text in cell with images elsewhere
console.log("Test 4: Preserve [DRAFT] in cell with images elsewhere");
const td4 = document.createElement("td");
td4.innerHTML = `
  <div>
    <p>Some text with <img data-stn-preserve="1" alt="Red dot"> an image</p>
    <ul>
      <li>The word [DRAFT] is in front of the item name.</li>
    </ul>
  </div>
`;
const out4 = proc(td4);
if (!/\[DRAFT\]/.test(out4)) {
  console.error(
    "  ❌ FAILED: [DRAFT] was removed from cell with distant image",
  );
  process.exit(1);
}
console.log("  ✅ PASSED\n");

// Test 5: Empty parentheses should be removed
console.log("Test 5: Remove empty ()");
const td5 = document.createElement("td");
td5.innerHTML =
  'XCELLIDX(CELL_C)XCELLIDX<img data-stn-preserve="1" alt="Icon"> () text';
const out5 = proc(td5);
if (/\(\s*\)/.test(out5)) {
  console.error("  ❌ FAILED: Empty () was not removed");
  process.exit(1);
}
console.log("  ✅ PASSED\n");

// Test 6: Legitimate parentheses should be preserved
console.log("Test 6: Preserve (legitimate parens)");
const td6 = document.createElement("td");
td6.innerHTML = "<p>See (Fig. 2) for details</p>";
const out6 = proc(td6);
if (!/\(Fig\. 2\)/.test(out6)) {
  console.error("  ❌ FAILED: (Fig. 2) was incorrectly removed");
  process.exit(1);
}
console.log("  ✅ PASSED\n");

// Test 7: Images should be converted to Markdown
console.log("Test 7: Convert images to Markdown");
const td7 = document.createElement("td");
td7.innerHTML = '<p><img src="data:image/png;base64,AAA" alt="Test"></p>';
const out7 = proc(td7);
if (!/!\[Test\]\(data:image\//.test(out7)) {
  console.error("  ❌ FAILED: Image not converted to Markdown");
  process.exit(1);
}
console.log("  ✅ PASSED\n");

// Test 8: Remove bullet-format placeholders (• alt •)
console.log("Test 8: Remove bullet-format placeholders");
const td8 = document.createElement("td");
td8.innerHTML =
  'XCELLIDX(CELL_D)XCELLIDX • Icon • <img data-stn-preserve="1" alt="Icon" src="data:image/png;base64,AAA">';
const out8 = proc(td8);
if (/•\s*Icon\s*•/.test(out8)) {
  console.error("  ❌ FAILED: Bullet placeholder was not removed");
  console.error("  Output:", out8);
  process.exit(1);
}
console.log("  ✅ PASSED\n");

console.log("✅ All tests PASSED!");
