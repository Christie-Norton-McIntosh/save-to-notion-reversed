/**
 * DIAGNOSTIC: Test itemgroup.info unwrapping behavior
 *
 * Issue: "class='itemgroup info' when unwrapped is not appending as a child
 * of the parent. It is flattened to the root which causes issues with
 * contents being out of order in lists and any other nesting"
 *
 * Test different scenarios to identify the exact problem.
 */

const { JSDOM } = require("jsdom");

// Test the unwrapping logic in isolation
function unwrapItemgroups(htmlString) {
  const dom = new JSDOM(htmlString);
  const doc = dom.window.document;

  const itemgroupElements = doc.querySelectorAll("div.itemgroup");
  console.log(`Found ${itemgroupElements.length} itemgroup elements`);

  itemgroupElements.forEach((el) => {
    console.log(`Unwrapping: ${el.className}`);
    console.log(`Parent: ${el.parentNode.tagName}`);

    const parent = el.parentNode;
    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el);
    }
    parent.removeChild(el);
  });

  return doc.body.innerHTML;
}

// Test Case 1: itemgroup.info in a list item
console.log("\n=== TEST 1: itemgroup.info in list item ===");
const test1 = `
<ul>
  <li>
    Item text
    <div class="itemgroup info">
      <p>Info paragraph 1</p>
      <p>Info paragraph 2</p>
    </div>
  </li>
</ul>
`;
console.log("BEFORE:", test1);
console.log("AFTER:", unwrapItemgroups(test1));

// Test Case 2: Nested itemgroups
console.log("\n=== TEST 2: Nested itemgroups ===");
const test2 = `
<div class="outer">
  <div class="itemgroup">
    <p>Outer content</p>
    <div class="itemgroup info">
      <p>Inner info</p>
    </div>
  </div>
</div>
`;
console.log("BEFORE:", test2);
console.log("AFTER:", unwrapItemgroups(test2));

// Test Case 3: Multiple itemgroups in same parent
console.log("\n=== TEST 3: Multiple itemgroups in same parent ===");
const test3 = `
<div class="parent">
  <p>Before</p>
  <div class="itemgroup">
    <p>First group</p>
  </div>
  <p>Middle</p>
  <div class="itemgroup info">
    <p>Second group (info)</p>
  </div>
  <p>After</p>
</div>
`;
console.log("BEFORE:", test3);
console.log("AFTER:", unwrapItemgroups(test3));

// Test Case 4: itemgroup at document root
console.log("\n=== TEST 4: itemgroup at document root ===");
const test4 = `
<div class="itemgroup info">
  <p>Root level info</p>
</div>
<p>Following paragraph</p>
`;
console.log("BEFORE:", test4);
console.log("AFTER:", unwrapItemgroups(test4));

// Test Case 5: Complex nesting with lists
console.log("\n=== TEST 5: Complex list nesting ===");
const test5 = `
<ul>
  <li>
    Item 1
    <div class="itemgroup info">
      <p>Info for item 1</p>
      <ul>
        <li>Nested list item</li>
      </ul>
    </div>
  </li>
  <li>Item 2</li>
</ul>
`;
console.log("BEFORE:", test5);
console.log("AFTER:", unwrapItemgroups(test5));
