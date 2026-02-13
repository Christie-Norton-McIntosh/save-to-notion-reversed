/**
 * Test actual HTML fixtures to see if bracketed placeholders are being removed
 * This simulates what happens in the live extension
 */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

// Set up global DOM before loading utilities
const globalDom = new JSDOM("<!doctype html><html><body></body></html>");
global.window = globalDom.window;
global.document = globalDom.window.document;
global.Node = globalDom.window.Node;

// Load the actual utilities
const tableToListUtils = require("../dev-tools/table-to-list-utils.js");

// Test configuration
const fixtures = [
  {
    name: "inline-image-in-paragraph.html",
    class: "body conbody",
    expectedBehavior: "Working - no [alt] or ()",
  },
  {
    name: "table-with-images-indv-cells.html",
    class: "body refbody",
    expectedBehavior: "Failing - showing [alt]",
  },
  {
    name: "table-w-inline.html",
    class: "body conbody",
    expectedBehavior: "Failing - showing () and [alt]",
  },
];

console.log(
  "🧪 Testing actual HTML fixtures for bracketed placeholder removal\n",
);

fixtures.forEach((fixture) => {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`Testing: ${fixture.name}`);
  console.log(`Class: ${fixture.class}`);
  console.log(`Expected: ${fixture.expectedBehavior}`);
  console.log("=".repeat(70));

  // Load the fixture HTML
  const fixturePath = path.join(__dirname, "fixtures", fixture.name);
  const html = fs.readFileSync(fixturePath, "utf8");

  // Create a JSDOM instance
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Find all table cells
  const cells = document.querySelectorAll("td, th");
  console.log(`\nFound ${cells.length} table cells\n`);

  let issuesFound = [];

  cells.forEach((cell, index) => {
    // Get original text
    const originalText = cell.textContent.trim();

    // Skip empty cells
    if (!originalText) return;

    // Process the cell - returns a string
    const processedText = tableToListUtils.processCellForTableToList(cell);

    // Remove markdown images from consideration (they contain bracketed text by design)
    const textWithoutMarkdown = processedText.replace(
      /!\[[^\]]*\]\([^)]+\)/g,
      "",
    );

    // Check for bracketed text patterns (excluding markdown)
    const hasBracketedText = /\[[^\]]+\]/.test(textWithoutMarkdown);
    const hasEmptyParens = /\(\s*\)/.test(textWithoutMarkdown);
    const hasBulletPlaceholder = /•\s*[^•]+\s*•/.test(textWithoutMarkdown);

    if (hasBracketedText || hasEmptyParens || hasBulletPlaceholder) {
      // Check if this is legitimate bracketed text (like [DRAFT])
      const bracketsMatch = textWithoutMarkdown.match(/\[([^\]]+)\]/);
      const isLegitimate =
        bracketsMatch &&
        (bracketsMatch[1].includes("DRAFT") || bracketsMatch[1].length > 20); // Long text is probably legitimate

      if (!isLegitimate || hasEmptyParens || hasBulletPlaceholder) {
        issuesFound.push({
          cellIndex: index,
          issue: hasBracketedText
            ? `[${bracketsMatch[1]}]`
            : hasEmptyParens
              ? "()"
              : "bullet placeholder",
          text:
            processedText.substring(0, 100) +
            (processedText.length > 100 ? "..." : ""),
          hasImage: cell.querySelector("img") !== null,
        });
      }
    }
  });

  // Report findings
  if (issuesFound.length === 0) {
    console.log("✅ No placeholder issues found!");
  } else {
    console.log(
      `❌ Found ${issuesFound.length} cells with placeholder issues:\n`,
    );
    issuesFound.forEach((issue, i) => {
      console.log(`  ${i + 1}. Cell #${issue.cellIndex}:`);
      console.log(`     Issue: ${issue.issue}`);
      console.log(`     Has image: ${issue.hasImage}`);
      console.log(`     Text preview: "${issue.text}"`);
      console.log("");
    });
  }
});

console.log("\n" + "=".repeat(70));
console.log("Test complete");
console.log("=".repeat(70));
