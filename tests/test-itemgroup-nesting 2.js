/**
 * Test itemgroup content stays nested in list items
 * Version: 5.0.6 - Critical Fix
 *
 * Issue: After unwrapping itemgroup, block-level children (p, table, etc.)
 * were being extracted from list items and moved to the end of the page.
 *
 * Solution: Mark itemgroup children with data-itemgroup-content attribute
 * so they're skipped during block element extraction.
 */

const { JSDOM } = require("jsdom");

function processListWithItemgroup(htmlString) {
  const dom = new JSDOM(htmlString);
  const doc = dom.window.document;

  console.log("=== STEP 1: Mark and unwrap itemgroups ===");
  const itemgroupElements = doc.querySelectorAll("div.itemgroup");
  console.log(`Found ${itemgroupElements.length} itemgroup elements`);

  itemgroupElements.forEach((el) => {
    // Mark all block-level children before unwrapping
    Array.from(el.children).forEach((child) => {
      const tagName = child.tagName.toLowerCase();
      if (
        tagName === "p" ||
        tagName === "blockquote" ||
        tagName === "div" ||
        tagName === "table"
      ) {
        child.setAttribute("data-itemgroup-content", "true");
        console.log(`Marked <${tagName}> as itemgroup content`);
      }
    });

    // Unwrap: move children to parent
    const parent = el.parentNode;
    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el);
    }
    parent.removeChild(el);
    console.log("Unwrapped itemgroup");
  });

  console.log(
    "\n=== STEP 2: Extract non-itemgroup block elements from list items ===",
  );
  const listItems = doc.querySelectorAll("li");
  let blocksExtracted = 0;

  listItems.forEach((li, index) => {
    const blockElements = Array.from(li.children).filter((child) => {
      const tagName = child.tagName.toLowerCase();
      const isBlockElement =
        tagName === "p" ||
        tagName === "blockquote" ||
        tagName === "div" ||
        tagName === "table";

      // Skip elements from itemgroup
      if (child.hasAttribute("data-itemgroup-content")) {
        console.log(
          `  LI ${index + 1}: Skipping <${tagName}> (itemgroup content) - kept nested`,
        );
        return false;
      }

      return isBlockElement;
    });

    if (blockElements.length > 0) {
      console.log(
        `  LI ${index + 1}: Extracting ${blockElements.length} block elements`,
      );
      const parentList = li.closest("ol, ul");
      if (parentList && parentList.parentNode) {
        let insertionPoint = parentList.nextSibling;
        blockElements.forEach((block) => {
          const cloned = block.cloneNode(true);
          if (insertionPoint) {
            parentList.parentNode.insertBefore(cloned, insertionPoint);
          } else {
            parentList.parentNode.appendChild(cloned);
          }
          insertionPoint = cloned.nextSibling;
          li.removeChild(block);
          blocksExtracted++;
        });
      }
    }
  });

  console.log(`Total blocks extracted: ${blocksExtracted}`);
  return doc.body.innerHTML;
}

console.log("\n========================================");
console.log("TEST: itemgroup table should stay nested in list item");
console.log("========================================\n");

const testHTML = `
<ol>
  <li>Step 1</li>
  <li>Step 2</li>
  <li>
    Step 3: Do something
    <div class="itemgroup info">
      <p>Additional info paragraph</p>
      <table>
        <tr><td>Field</td><td>Description</td></tr>
        <tr><td>Name</td><td>Enter name</td></tr>
      </table>
    </div>
  </li>
  <li>Step 4</li>
</ol>
`;

console.log("INPUT HTML:");
console.log(testHTML);

const result = processListWithItemgroup(testHTML);

console.log("\n========================================");
console.log("OUTPUT HTML:");
console.log("========================================");
console.log(result);

// Verification
const hasTable = result.includes("<table>") || result.includes("<tbody>");
const tableInListItem =
  result.match(/<li>[\s\S]*Step 3[\s\S]*<table[\s\S]*<\/li>/) ||
  result.match(/<li>[\s\S]*Step 3[\s\S]*<tbody>[\s\S]*<\/li>/);
const tableAfterList =
  result.match(/<\/ol>[\s\S]*<table/) || result.match(/<\/ol>[\s\S]*<tbody>/);
const hasDataAttribute = result.includes("data-itemgroup-content");

console.log("\n========================================");
console.log("VERIFICATION:");
console.log("========================================");
console.log("✓ Table exists:", hasTable ? "YES" : "NO ❌");
console.log(
  "✓ Table nested in LI with Step 3:",
  tableInListItem ? "YES" : "NO ❌",
);
console.log(
  "✓ Table NOT after list:",
  !tableAfterList ? "YES (correct)" : "NO ❌ (table moved to end!)",
);
console.log(
  "✓ Has data-itemgroup-content marker:",
  hasDataAttribute ? "YES" : "NO ❌",
);

if (hasTable && tableInListItem && !tableAfterList && hasDataAttribute) {
  console.log("\n✅ ALL TESTS PASSED!");
  console.log("itemgroup content stays properly nested in list items.");
} else {
  console.log("\n❌ TESTS FAILED!");
  console.log("itemgroup content was extracted from list item.");
}
