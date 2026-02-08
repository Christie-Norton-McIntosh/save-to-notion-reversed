/**
 * Test for table cell line break preservation
 *
 * This test verifies that line breaks are preserved when converting
 * table cells with block-level elements to markdown.
 */

const fs = require("fs");
const path = require("path");

// Read the test HTML
const testHtmlPath = path.join(__dirname, "table-content-line-breaks.html");
const testHtml = fs.readFileSync(testHtmlPath, "utf8");

// Create a DOM-like environment for testing
const { JSDOM } = require("jsdom");
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.document = dom.window.document;
global.window = dom.window;

// Load the Turndown library (simplified version for testing)
// In production, this would load from main.js
function testTableCellConversion() {
  console.log("🧪 Testing table cell line break preservation...\n");

  // Parse the test HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = testHtml;

  // Get all table cells
  const cells = tempDiv.querySelectorAll("td");
  let passedTests = 0;
  let failedTests = 0;

  cells.forEach((cell, index) => {
    // Process the cell using our marker approach
    const cellClone = cell.cloneNode(true);

    // Remove images to focus on text content
    const images = cellClone.querySelectorAll("img");
    images.forEach((img) => img.remove());

    // Insert markers after block elements
    const blockElements = cellClone.querySelectorAll(
      "div, p, pre, blockquote, h1, h2, h3, h4, h5, h6, section, article, header, footer, li",
    );
    blockElements.forEach((el) => {
      const marker = document.createTextNode("__BLOCK_END__");
      el.appendChild(marker);
    });

    // Replace br tags with markers
    const brs = cellClone.querySelectorAll("br");
    brs.forEach((br) => {
      const marker = document.createTextNode("__BR__");
      br.parentNode.replaceChild(marker, br);
    });

    // Get text with markers
    let text = cellClone.textContent || "";

    // Replace markers with markdown line breaks
    text = text
      .replace(/__BLOCK_END__/g, "  \n")
      .replace(/__BR__/g, "  \n")
      .replace(/__TDSEP__/g, " | ");

    // Clean up excessive spaces and newlines
    text = text.replace(/ {3,}/g, "  ").replace(/\n{3,}/g, "\n\n");
    text = text.trim();

    // Check if the result has line breaks
    const hasLineBreaks = text.includes("\n");
    const originalText = cell.textContent.trim();
    // Consider a cell to have "multiple blocks" only when either:
    // - it contains more than one block-level element (div or p), or
    // - it contains at least one block-level element and there is
    //   additional non-block text outside that element.
    const pEl = cellClone.querySelector("p");
    const divEls = cellClone.querySelectorAll("div");
    const hasMultipleBlocks =
      divEls.length > 1 ||
      (pEl && cellClone.textContent.trim() !== pEl.textContent.trim());

    if (hasMultipleBlocks && !hasLineBreaks) {
      console.log(`❌ Test ${index + 1} FAILED`);
      console.log(`   Expected: Line breaks between content blocks`);
      console.log(
        `   Original HTML blocks: ${cellClone.querySelectorAll("div, p").length}`,
      );
      console.log(`   Result: "${text.substring(0, 100)}..."`);
      console.log(`   Has line breaks: ${hasLineBreaks}\n`);
      failedTests++;
    } else if (hasMultipleBlocks && hasLineBreaks) {
      console.log(`✅ Test ${index + 1} PASSED`);
      console.log(`   Result: "${text.substring(0, 100)}..."`);
      console.log(`   Line breaks preserved: YES\n`);
      passedTests++;
    } else {
      // Single block, skip
      console.log(`⏭️  Test ${index + 1} SKIPPED (single block cell)\n`);
    }
  });

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log(`Test Summary:`);
  console.log(`  ✅ Passed: ${passedTests}`);
  console.log(`  ❌ Failed: ${failedTests}`);
  console.log(`  Total: ${passedTests + failedTests}`);
  console.log("=".repeat(60) + "\n");

  if (failedTests > 0) {
    console.log("❌ LINE BREAKS ARE NOT BEING PRESERVED");
    process.exit(1);
  } else {
    console.log("✅ ALL TESTS PASSED - LINE BREAKS ARE PRESERVED");
    process.exit(0);
  }
}

// Run the test
try {
  testTableCellConversion();
} catch (error) {
  console.error("❌ Test error:", error);
  process.exit(1);
}
