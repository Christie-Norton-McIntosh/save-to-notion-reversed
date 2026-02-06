/**
 * Test: itemgroup unwrap should preserve parent-child relationships
 *
 * Issue: When unwrapping elements with class="itemgroup info", children are
 * being flattened to the root instead of being appended as children of the parent.
 * This causes content to be out of order in lists and other nesting structures.
 *
 * Root Cause: The insertBefore logic inserts all children before the element
 * being removed, which is correct. However, if the element is nested inside
 * a list or other structure, we need to ensure children stay in the right parent.
 */

const { JSDOM } = require("jsdom");

/**
 * Simulate the current unwrap behavior (buggy)
 */
function simulateCurrentUnwrap(htmlString) {
  const dom = new JSDOM(htmlString);
  const doc = dom.window.document;

  // Current implementation
  const itemgroupElements = doc.querySelectorAll("div.itemgroup");
  itemgroupElements.forEach((el) => {
    const parent = el.parentNode;
    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el);
    }
    parent.removeChild(el);
  });

  return doc.body.innerHTML;
}

/**
 * Simulate the fixed unwrap behavior
 */
function simulateFixedUnwrap(htmlString) {
  const dom = new JSDOM(htmlString);
  const doc = dom.window.document;

  const itemgroupElements = doc.querySelectorAll("div.itemgroup");
  itemgroupElements.forEach((el) => {
    const parent = el.parentNode;
    
    // Create a document fragment to hold the children
    const fragment = doc.createDocumentFragment();
    
    // Move all children to the fragment
    while (el.firstChild) {
      fragment.appendChild(el.firstChild);
    }
    
    // Replace the element with its children
    parent.replaceChild(fragment, el);
  });

  return doc.body.innerHTML;
}

// Test cases
const tests = [
  {
    name: "Simple itemgroup unwrap",
    input: `<div><div class="itemgroup info"><p>Content</p></div></div>`,
    expected: `<div><p>Content</p></div>`,
    issue: "Should unwrap itemgroup and keep paragraph as child of outer div",
  },
  {
    name: "Nested list with itemgroup",
    input: `<ul><li>Item 1</li><li><div class="itemgroup info"><p>Item 2 content</p></div></li><li>Item 3</li></ul>`,
    expected: `<ul><li>Item 1</li><li><p>Item 2 content</p></li><li>Item 3</li></ul>`,
    issue: "Should unwrap itemgroup but keep content inside the li parent",
  },
  {
    name: "Multiple children in itemgroup",
    input: `<div><div class="itemgroup info"><p>First</p><p>Second</p></div></div>`,
    expected: `<div><p>First</p><p>Second</p></div>`,
    issue: "Should preserve order of multiple children",
  },
  {
    name: "Nested itemgroups",
    input: `<div><div class="itemgroup info"><div class="itemgroup"><p>Nested</p></div></div></div>`,
    expected: `<div><p>Nested</p></div>`,
    issue: "Should handle nested itemgroups correctly",
  },
  {
    name: "Itemgroup with siblings",
    input: `<div><p>Before</p><div class="itemgroup info"><p>Middle</p></div><p>After</p></div>`,
    expected: `<div><p>Before</p><p>Middle</p><p>After</p></div>`,
    issue: "Should maintain order with siblings",
  },
  {
    name: "Complex nesting with list and itemgroup",
    input: `<ol><li><div class="itemgroup info"><p>List item content</p><ul><li>Nested item</li></ul></div></li></ol>`,
    expected: `<ol><li><p>List item content</p><ul><li>Nested item</li></ul></li></ol>`,
    issue: "Should preserve complex nesting structures",
  },
  {
    name: "Deeply nested list with multiple itemgroups",
    input: `<ul><li>A<ul><li><div class="itemgroup info"><span>B</span></div></li></ul></li><li><div class="itemgroup info"><span>C</span></div></li></ul>`,
    expected: `<ul><li>A<ul><li><span>B</span></li></ul></li><li><span>C</span></li></ul>`,
    issue: "Should handle multiple itemgroups at different nesting levels",
  },
  {
    name: "Itemgroup in complex ServiceNow-like structure",
    input: `<div class="content"><ol><li>Step 1</li><li><div class="itemgroup info"><p>Step 2 description</p><div class="note"><span>Note: Important</span></div></div></li><li>Step 3</li></ol></div>`,
    expected: `<div class="content"><ol><li>Step 1</li><li><p>Step 2 description</p><div class="note"><span>Note: Important</span></div></li><li>Step 3</li></ol></div>`,
    issue: "Should preserve order in ordered lists with notes",
  },
  {
    name: "Multiple itemgroups in sequence",
    input: `<div><div class="itemgroup info"><p>First block</p></div><div class="itemgroup info"><p>Second block</p></div></div>`,
    expected: `<div><p>First block</p><p>Second block</p></div>`,
    issue: "Should handle sequential itemgroups correctly",
  },
];

// Run tests with current implementation
console.log("🧪 Testing itemgroup unwrap behavior");
console.log("=".repeat(60));
console.log("\n📍 CURRENT IMPLEMENTATION (potentially buggy):");
console.log("=".repeat(60));

let currentPassed = 0;
let currentFailed = 0;

tests.forEach((test, index) => {
  console.log(`\nTest ${index + 1}: ${test.name}`);
  console.log("  Issue:", test.issue);
  console.log("  Input:", test.input);

  try {
    const result = simulateCurrentUnwrap(test.input);
    console.log("  Output:", result);
    console.log("  Expected:", test.expected);

    // Normalize whitespace for comparison
    const normalizedResult = result.replace(/>\s+</g, "><").trim();
    const normalizedExpected = test.expected.replace(/>\s+</g, "><").trim();

    if (normalizedResult === normalizedExpected) {
      console.log("  ✅ PASS");
      currentPassed++;
    } else {
      console.log("  ❌ FAIL - Output doesn't match expected");
      currentFailed++;
    }
  } catch (error) {
    console.log("  ❌ ERROR:", error.message);
    currentFailed++;
  }
});

// Run tests with fixed implementation
console.log("\n" + "=".repeat(60));
console.log("📍 FIXED IMPLEMENTATION:");
console.log("=".repeat(60));

let fixedPassed = 0;
let fixedFailed = 0;

tests.forEach((test, index) => {
  console.log(`\nTest ${index + 1}: ${test.name}`);

  try {
    const result = simulateFixedUnwrap(test.input);
    console.log("  Output:", result);

    // Normalize whitespace for comparison
    const normalizedResult = result.replace(/>\s+</g, "><").trim();
    const normalizedExpected = test.expected.replace(/>\s+</g, "><").trim();

    if (normalizedResult === normalizedExpected) {
      console.log("  ✅ PASS");
      fixedPassed++;
    } else {
      console.log("  ❌ FAIL - Output doesn't match expected");
      console.log("    Got:", normalizedResult);
      console.log("    Expected:", normalizedExpected);
      fixedFailed++;
    }
  } catch (error) {
    console.log("  ❌ ERROR:", error.message);
    fixedFailed++;
  }
});

console.log("\n" + "=".repeat(60));
console.log("CURRENT IMPLEMENTATION: " + `${currentPassed} passed, ${currentFailed} failed`);
console.log("FIXED IMPLEMENTATION: " + `${fixedPassed} passed, ${fixedFailed} failed`);
console.log("=".repeat(60));

if (fixedFailed === 0) {
  console.log("✅ All tests pass with fixed implementation!");
  process.exit(0);
} else {
  console.log(`❌ ${fixedFailed} test(s) still failing with fixed implementation`);
  process.exit(1);
}
