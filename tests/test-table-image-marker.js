/**
 * Test that table images get the <<stn-table-img>> marker
 * This ensures they won't be extracted as data URL placeholders
 */

const { JSDOM } = require("jsdom");

// Set up global DOM
const globalDom = new JSDOM("<!doctype html><html><body></body></html>");
global.window = globalDom.window;
global.document = globalDom.window.document;
global.Node = globalDom.window.Node;

// Load utilities
const tableToListUtils = require("../dev-tools/table-to-list-utils.js");

console.log("🧪 Testing <<stn-table-img>> marker for table images\n");

// Test 1: Image in table cell should get marker
console.log("Test 1: Image in table cell gets marker");
const td1 = document.createElement("td");
td1.innerHTML =
  '<p>Icon: <img src="data:image/png;base64,ABC123" alt="Home icon" /></p>';

const result1 = tableToListUtils.processCellForTableToList(td1);
console.log("  Result:", result1.substring(0, 100));

if (result1.includes("<<stn-table-img>>")) {
  console.log("  ✅ PASSED - Marker present\n");
} else {
  console.log("  ❌ FAILED - Marker missing\n");
  process.exit(1);
}

// Test 2: Multiple images should all get markers
console.log("Test 2: Multiple images all get markers");
const td2 = document.createElement("td");
td2.innerHTML = `
  <p>Status: <img src="data:image/png;base64,AAA" alt="Red dot" /></p>
  <p>Warning: <img src="data:image/png;base64,BBB" alt="Triangle" /></p>
`;

const result2 = tableToListUtils.processCellForTableToList(td2);
const markerCount = (result2.match(/<<stn-table-img>>/g) || []).length;
console.log("  Found", markerCount, "markers");

if (markerCount === 2) {
  console.log("  ✅ PASSED - Both images marked\n");
} else {
  console.log("  ❌ FAILED - Expected 2 markers, found", markerCount, "\n");
  process.exit(1);
}

// Test 3: Verify markdown format with marker
console.log("Test 3: Verify markdown format");
const td3 = document.createElement("td");
td3.innerHTML = '<img src="data:image/png;base64,TEST" alt="Test image" />';

const result3 = tableToListUtils.processCellForTableToList(td3);
const expectedPattern =
  /!\[Test image\]\(data:image\/png;base64,TEST\)<<stn-table-img>>/;

if (expectedPattern.test(result3)) {
  console.log("  ✅ PASSED - Correct markdown format with marker\n");
} else {
  console.log("  ❌ FAILED - Incorrect format");
  console.log(
    "  Expected: ![Test image](data:image/png;base64,TEST)<<stn-table-img>>",
  );
  console.log("  Got:", result3);
  process.exit(1);
}

console.log("✅ All marker tests PASSED!");
