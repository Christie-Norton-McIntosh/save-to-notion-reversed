/**
 * Test: Table to Text Blocks Conversion
 *
 * Verifies that table cells are converted to plain text blocks (not bullets)
 * and that each <p> tag becomes a separate Notion text block.
 */

const { JSDOM } = require("jsdom");
const path = require("path");

console.log("🧪 Testing table to text blocks conversion");

// Setup DOM environment
const dom = new JSDOM("<!doctype html><html><body></body></html>");
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;

// Load the table-to-list utilities
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

const processCellForTableToList = utils.processCellForTableToList;

// Test 1: Cell with multiple paragraphs
console.log("\n📝 Test 1: Multiple paragraphs in cell");
const cell1 = document.createElement("td");
cell1.innerHTML = `
  <p>First paragraph</p>
  <p>Second paragraph</p>
  <p>Third paragraph</p>
`;

const output1 = processCellForTableToList(cell1);
console.log("Output:", JSON.stringify(output1));

// Check that each paragraph is on its own line
const lines1 = output1
  .trim()
  .split("\n\n")
  .filter((l) => l.trim());
console.log("Paragraph count:", lines1.length);
console.log("Paragraphs:", lines1);

if (
  lines1.length === 3 &&
  lines1[0].includes("First paragraph") &&
  lines1[1].includes("Second paragraph") &&
  lines1[2].includes("Third paragraph")
) {
  console.log("✅ Test 1 PASSED: Each <p> becomes separate block\n");
} else {
  console.error("❌ Test 1 FAILED: Expected 3 separate paragraphs\n");
  process.exit(1);
}

// Test 2: Cell with image (should NOT have bullet placeholder)
console.log("📝 Test 2: Cell with image - no bullet placeholder");
const cell2 = document.createElement("td");
cell2.innerHTML = `
  <img src="https://example.com/image.png" alt="Test Image">
  <p>Text after image</p>
`;

const output2 = processCellForTableToList(cell2);
console.log("Output:", JSON.stringify(output2));

// Check that there's NO bullet placeholder
if (output2.includes("•")) {
  console.error("❌ Test 2 FAILED: Found bullet placeholder (•) in output\n");
  console.error("Output:", output2);
  process.exit(1);
}

// Check that image markdown is present
if (!output2.includes("![Test Image](https://example.com/image.png)")) {
  console.error("❌ Test 2 FAILED: Image markdown not found\n");
  console.error("Output:", output2);
  process.exit(1);
}

// Check that text is present
if (!output2.includes("Text after image")) {
  console.error("❌ Test 2 FAILED: Text content not found\n");
  console.error("Output:", output2);
  process.exit(1);
}

console.log("✅ Test 2 PASSED: Image without bullet placeholder\n");

// Test 3: Cell with mixed content (image inside paragraph)
console.log("📝 Test 3: Image inside paragraph");
const cell3 = document.createElement("td");
cell3.innerHTML = `
  <p>Before image <img src="data:image/png;base64,ABC" alt="Icon"> after image</p>
`;

const output3 = processCellForTableToList(cell3);
console.log("Output:", JSON.stringify(output3));

// Check no bullet placeholder
if (output3.includes("•")) {
  console.error("❌ Test 3 FAILED: Found bullet placeholder in output\n");
  process.exit(1);
}

// Check that text is clean (image removed but no placeholder)
if (!output3.includes("Before image") || !output3.includes("after image")) {
  console.error("❌ Test 3 FAILED: Text missing\n");
  process.exit(1);
}

console.log("✅ Test 3 PASSED: Image removed without placeholder\n");

// Test 4: Empty cell
console.log("📝 Test 4: Empty cell");
const cell4 = document.createElement("td");
cell4.innerHTML = "";

const output4 = processCellForTableToList(cell4);
console.log("Output:", JSON.stringify(output4));

if (output4.trim() !== "") {
  console.error("❌ Test 4 FAILED: Expected empty output for empty cell\n");
  process.exit(1);
}

console.log("✅ Test 4 PASSED: Empty cell returns empty\n");

// Test 5: Cell with XCELLIDX marker (should be preserved)
console.log("📝 Test 5: XCELLIDX marker preservation");
const cell5 = document.createElement("td");
cell5.innerHTML = `XCELLIDX(CELL_test123)XCELLIDX<p>Content</p>`;

const output5 = processCellForTableToList(cell5);
console.log("Output:", JSON.stringify(output5));

if (!output5.includes("XCELLIDX(CELL_test123)XCELLIDX")) {
  console.error("❌ Test 5 FAILED: XCELLIDX marker not preserved\n");
  process.exit(1);
}

console.log("✅ Test 5 PASSED: XCELLIDX marker preserved\n");

console.log("═".repeat(60));
console.log("✅ ALL TESTS PASSED!");
console.log("═".repeat(60));
console.log("\nSummary:");
console.log("- Each <p> tag becomes a separate text block");
console.log("- Images are converted to markdown (no bullet placeholders)");
console.log("- XCELLIDX markers are preserved");
console.log("- Clean text output without extra symbols\n");
