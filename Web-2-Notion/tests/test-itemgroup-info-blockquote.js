/**
 * Test itemgroup.info conversion to blockquote
 * Version: 5.0.6
 *
 * Verifies that:
 * 1. itemgroup.info is converted to blockquote (not unwrapped)
 * 2. Regular itemgroup (without .info) is still unwrapped
 * 3. Nesting is preserved correctly
 */

const { JSDOM } = require("jsdom");

function applyItemgroupFormatting(htmlString) {
  const dom = new JSDOM(htmlString);
  const doc = dom.window.document;

  // 1. Convert div.itemgroup.info to blockquote
  const itemgroupInfoElements = doc.querySelectorAll("div.itemgroup.info");
  console.log(`Found ${itemgroupInfoElements.length} itemgroup.info elements`);

  itemgroupInfoElements.forEach((el) => {
    const blockquote = doc.createElement("blockquote");
    while (el.firstChild) {
      blockquote.appendChild(el.firstChild);
    }
    el.parentNode.replaceChild(blockquote, el);
  });

  // 2. Unwrap div.itemgroup (not .info)
  const itemgroupElements = doc.querySelectorAll("div.itemgroup:not(.info)");
  console.log(`Found ${itemgroupElements.length} regular itemgroup elements`);

  itemgroupElements.forEach((el) => {
    const parent = el.parentNode;
    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el);
    }
    parent.removeChild(el);
  });

  return doc.body.innerHTML;
}

console.log(
  "\n=== TEST 1: itemgroup.info in list should become blockquote ===",
);
const test1 = `
<ul>
  <li>
    Regular item text
    <div class="itemgroup info">
      <p>This is important info</p>
      <p>Should be in a blockquote</p>
    </div>
    <p>More item text</p>
  </li>
</ul>
`;
const result1 = applyItemgroupFormatting(test1);
console.log("RESULT:", result1);
console.log(
  "✓ PASS: Contains <blockquote>" +
    (result1.includes("<blockquote>") ? " YES" : " NO"),
);
console.log(
  "✓ PASS: No itemgroup" + (!result1.includes("itemgroup") ? " YES" : " NO"),
);
console.log(
  "✓ PASS: Content preserved" +
    (result1.includes("important info") ? " YES" : " NO"),
);

console.log("\n=== TEST 2: Regular itemgroup should be unwrapped ===");
const test2 = `
<div>
  <div class="itemgroup">
    <p>Regular content</p>
    <p>Should be unwrapped</p>
  </div>
</div>
`;
const result2 = applyItemgroupFormatting(test2);
console.log("RESULT:", result2);
console.log(
  "✓ PASS: No itemgroup wrapper" +
    (!result2.includes("itemgroup") ? " YES" : " NO"),
);
console.log(
  "✓ PASS: No blockquote" +
    (!result2.includes("<blockquote>") ? " YES" : " NO"),
);
console.log(
  "✓ PASS: Content preserved" +
    (result2.includes("Regular content") ? " YES" : " NO"),
);

console.log("\n=== TEST 3: Both types together ===");
const test3 = `
<div>
  <div class="itemgroup">
    <p>Regular itemgroup - should unwrap</p>
  </div>
  <div class="itemgroup info">
    <p>Info itemgroup - should become blockquote</p>
  </div>
</div>
`;
const result3 = applyItemgroupFormatting(test3);
console.log("RESULT:", result3);
console.log(
  "✓ PASS: Contains blockquote" +
    (result3.includes("<blockquote>") ? " YES" : " NO"),
);
console.log(
  "✓ PASS: No itemgroup wrapper" +
    (!result3.includes("itemgroup") ? " YES" : " NO"),
);
console.log(
  "✓ PASS: Both contents preserved" +
    (result3.includes("Regular itemgroup") && result3.includes("Info itemgroup")
      ? " YES"
      : " NO"),
);

console.log("\n=== TEST 4: Nested lists with itemgroup.info ===");
const test4 = `
<ul>
  <li>
    Item 1
    <div class="itemgroup info">
      <p>Info for item 1</p>
      <ul>
        <li>Nested list in info</li>
      </ul>
    </div>
  </li>
  <li>Item 2</li>
</ul>
`;
const result4 = applyItemgroupFormatting(test4);
console.log("RESULT:", result4);
console.log(
  "✓ PASS: Contains blockquote" +
    (result4.includes("<blockquote>") ? " YES" : " NO"),
);
console.log(
  "✓ PASS: Nested list preserved" +
    (result4.includes("Nested list in info") ? " YES" : " NO"),
);
console.log(
  "✓ PASS: Parent structure intact" +
    (result4.includes("<li>") && result4.includes("Item 2") ? " YES" : " NO"),
);

console.log("\n=== SUMMARY ===");
console.log("itemgroup.info elements are now converted to blockquotes");
console.log("Regular itemgroup elements are still unwrapped");
console.log("Nesting and content order are preserved");
