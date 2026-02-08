/**
 * Additional test to verify if insertBefore vs replaceChild makes any practical difference
 */

const { JSDOM } = require("jsdom");

function unwrapWithInsertBefore(htmlString) {
  const dom = new JSDOM(htmlString);
  const doc = dom.window.document;

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

function unwrapWithReplaceChild(htmlString) {
  const dom = new JSDOM(htmlString);
  const doc = dom.window.document;

  const itemgroupElements = doc.querySelectorAll("div.itemgroup");
  itemgroupElements.forEach((el) => {
    const parent = el.parentNode;
    const fragment = doc.createDocumentFragment();
    
    while (el.firstChild) {
      fragment.appendChild(el.firstChild);
    }
    
    parent.replaceChild(fragment, el);
  });

  return doc.body.innerHTML;
}

// Edge case tests - looking for differences
const edgeCaseTests = [
  {
    name: "Itemgroup with text nodes between elements",
    input: `<div><div class="itemgroup">Text1<p>P1</p>Text2<p>P2</p>Text3</div></div>`,
  },
  {
    name: "Itemgroup with empty text nodes",
    input: `<div><div class="itemgroup">   <p>Content</p>   </div></div>`,
  },
  {
    name: "Multiple nested itemgroups processed in reverse order",
    input: `<div><div class="itemgroup"><div class="itemgroup"><div class="itemgroup"><p>Deep</p></div></div></div></div>`,
  },
  {
    name: "Itemgroup with comment nodes",
    input: `<div><div class="itemgroup"><!-- comment --><p>Content</p><!-- comment2 --></div></div>`,
  },
  {
    name: "Adjacent itemgroups",
    input: `<div><div class="itemgroup"><p>A</p></div><div class="itemgroup"><p>B</p></div><div class="itemgroup"><p>C</p></div></div>`,
  },
  {
    name: "Itemgroup as last child",
    input: `<div><p>Before</p><div class="itemgroup"><p>Last</p></div></div>`,
  },
  {
    name: "Itemgroup as first child",
    input: `<div><div class="itemgroup"><p>First</p></div><p>After</p></div>`,
  },
  {
    name: "Complex ServiceNow structure with event handlers",
    input: `<div><div class="itemgroup info"><p onclick="alert()">Interactive</p><span class="note">Note</span></div></div>`,
  },
];

console.log("🔬 Comparing insertBefore vs replaceChild approaches\n");
console.log("=".repeat(70));

let differencesFound = 0;
let testsRun = 0;

edgeCaseTests.forEach((test, index) => {
  console.log(`\nTest ${index + 1}: ${test.name}`);
  console.log("Input:", test.input.substring(0, 70) + (test.input.length > 70 ? "..." : ""));
  
  testsRun++;
  
  try {
    const result1 = unwrapWithInsertBefore(test.input);
    const result2 = unwrapWithReplaceChild(test.input);
    
    // Normalize for comparison
    const normalized1 = result1.replace(/>\s+</g, "><").trim();
    const normalized2 = result2.replace(/>\s+</g, "><").trim();
    
    if (normalized1 === normalized2) {
      console.log("✅ Both approaches produce identical results");
    } else {
      console.log("❌ DIFFERENCE FOUND!");
      console.log("insertBefore result:", result1);
      console.log("replaceChild result:", result2);
      differencesFound++;
    }
  } catch (error) {
    console.log("⚠️  ERROR:", error.message);
    differencesFound++;
  }
});

console.log("\n" + "=".repeat(70));
console.log(`Tests run: ${testsRun}`);
console.log(`Differences found: ${differencesFound}`);
console.log("=".repeat(70));

if (differencesFound === 0) {
  console.log("\n✅ Both approaches are functionally equivalent!");
  console.log("The replaceChild approach is still preferred for:");
  console.log("  - Clearer intent (single atomic operation)");
  console.log("  - Better code readability");
  console.log("  - Follows DOM manipulation best practices");
} else {
  console.log(`\n⚠️  Found ${differencesFound} case(s) where approaches differ`);
  process.exit(1);
}
