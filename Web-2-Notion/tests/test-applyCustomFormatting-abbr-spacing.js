/**
 * Regression Test: abbr spacing preservation in applyCustomFormatting
 *
 * Issue: Spaces around special characters (>, <, &, |) inside inline elements
 * like <abbr> were being removed by the whitespace normalization in applyCustomFormatting.
 *
 * Root Cause: TreeWalker traversing text nodes in block elements was removing
 * leading/trailing spaces from text nodes with no siblings (like text inside abbr tags).
 *
 * Fix: Skip whitespace normalization for text nodes inside inline elements
 * (ABBR, SPAN, EM, STRONG, B, I, CODE) that contain special characters.
 *
 * Version Fixed: 5.0.5
 */

// Use jsdom for Node.js environment
const { JSDOM } = require("jsdom");

// Simulate the fixed applyCustomFormatting whitespace cleanup logic
function simulateWhitespaceCleanup(htmlString) {
  const dom = new JSDOM(htmlString);
  const doc = dom.window.document;
  const NodeFilter = dom.window.NodeFilter;
  const document = dom.window.document;

  const blockElements = doc.querySelectorAll(
    "div, p, blockquote, section, article",
  );

  blockElements.forEach((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === 3) {
        // Node.TEXT_NODE
        // Skip text nodes inside inline elements with special characters
        const parent = node.parentElement;
        if (parent) {
          const inlineElements = [
            "ABBR",
            "SPAN",
            "EM",
            "STRONG",
            "B",
            "I",
            "CODE",
          ];
          const isInInlineElement = inlineElements.includes(parent.tagName);
          const hasSpecialChars = /[<>&|]/.test(node.textContent);
          if (isInInlineElement && hasSpecialChars) {
            continue; // Skip whitespace normalization
          }
        }

        let text = node.textContent;
        // Remove leading whitespace at start of block
        if (
          node.previousSibling === null ||
          node.previousSibling.nodeName === "BR"
        ) {
          text = text.replace(/^\s+/, "");
        }
        // Remove trailing whitespace at end of block
        if (node.nextSibling === null || node.nextSibling.nodeName === "BR") {
          text = text.replace(/\s+$/, "");
        }
        // Collapse multiple spaces/tabs to single space
        text = text.replace(/[ \t]+/g, " ");
        node.textContent = text;
      }
    }
  });

  return doc.body.innerHTML;
}

// Test cases
const tests = [
  {
    name: "ServiceNow menucascade with abbr > (HTML entity)",
    input: `<div><span class="ph menucascade"><span class="ph uicontrol">Workspaces</span><abbr title="and then"> &gt; </abbr><span class="ph uicontrol">Service Operations Workspace</span></span></div>`,
    expected: `<span class="ph menucascade"><span class="ph uicontrol">Workspaces</span><abbr title="and then"> &gt; </abbr><span class="ph uicontrol">Service Operations Workspace</span></span>`,
    check: (result) => {
      const hasSpacedGt = result.includes(" &gt; ");
      const noCollapsedGt =
        !result.includes("&gt;</abbr>") &&
        !result.includes('<abbr title="and then">&gt;');
      return hasSpacedGt && noCollapsedGt;
    },
  },
  {
    name: "abbr with > (decoded)",
    input: `<div><span><abbr> > </abbr></span></div>`,
    expected: `<span><abbr> &gt; </abbr></span>`,
    check: (result) => result.includes(" > ") || result.includes(" &gt; "),
  },
  {
    name: "abbr with pipe separator",
    input: `<div><span><abbr title="or"> | </abbr></span></div>`,
    expected: `<span><abbr title="or"> | </abbr></span>`,
    check: (result) => result.includes(" | "),
  },
  {
    name: "Multiple abbr in sequence",
    input: `<div><span>A<abbr> > </abbr>B<abbr> > </abbr>C</span></div>`,
    expected: `<span>A<abbr> &gt; </abbr>B<abbr> &gt; </abbr>C</span>`,
    check: (result) => {
      const matches = result.match(/<abbr>[^<]*<\/abbr>/g);
      return matches && matches.every((m) => m.includes(" "));
    },
  },
  {
    name: "abbr with < character",
    input: `<div><span><abbr> &lt; </abbr></span></div>`,
    expected: `<span><abbr> &lt; </abbr></span>`,
    check: (result) => result.includes(" &lt; "),
  },
  {
    name: "abbr with & character",
    input: `<div><span><abbr> &amp; </abbr></span></div>`,
    expected: `<span><abbr> &amp; </abbr></span>`,
    check: (result) => result.includes(" &amp; ") || result.includes(" & "),
  },
  {
    name: "Regular text in p should have whitespace collapsed",
    input: `<p>  This    has   multiple     spaces  </p>`,
    expected: `This has multiple spaces`,
    check: (result) => {
      // Should collapse multiple spaces and trim
      return !result.includes("    ") && result.trim() === result;
    },
  },
  {
    name: "abbr without special chars should have whitespace trimmed",
    input: `<div><abbr>   normal text   </abbr></div>`,
    expected: `<abbr>normal text</abbr>`,
    check: (result) => {
      // No special chars, so whitespace should be trimmed
      return result.includes("normal text") && !result.includes("   ");
    },
  },
  {
    name: "span with special char should preserve spaces",
    input: `<div><span> > </span></div>`,
    expected: `<span> &gt; </span>`,
    check: (result) => result.includes(" > ") || result.includes(" &gt; "),
  },
  {
    name: "strong with special char should preserve spaces",
    input: `<div><strong> | </strong></div>`,
    expected: `<strong> | </strong>`,
    check: (result) => result.includes(" | "),
  },
  {
    name: "em with special char should preserve spaces",
    input: `<div><em> &gt; </em></div>`,
    expected: `<em> &gt; </em>`,
    check: (result) => result.includes(" &gt; "),
  },
  {
    name: "code with special char should preserve spaces",
    input: `<div><code> > </code></div>`,
    expected: `<code> &gt; </code>`,
    check: (result) => result.includes(" > ") || result.includes(" &gt; "),
  },
  {
    name: "Nested structure with multiple levels",
    input: `<div><p><span class="breadcrumb"><span>Home</span><abbr> > </abbr><span>Settings</span></span></p></div>`,
    expected: `<span class="breadcrumb"><span>Home</span><abbr> &gt; </abbr><span>Settings</span></span>`,
    check: (result) =>
      result.includes("<abbr> > </abbr>") ||
      result.includes("<abbr> &gt; </abbr>"),
  },
];

// Run tests
console.log("🧪 Testing applyCustomFormatting abbr spacing preservation");
console.log("=".repeat(60));

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  console.log(`\nTest ${index + 1}: ${test.name}`);
  console.log(
    "  Input:",
    test.input.substring(0, 80) + (test.input.length > 80 ? "..." : ""),
  );

  try {
    const result = simulateWhitespaceCleanup(test.input);
    console.log(
      "  Output:",
      result.substring(0, 80) + (result.length > 80 ? "..." : ""),
    );

    const checkPassed = test.check(result);

    if (checkPassed) {
      console.log("  ✅ PASS");
      passed++;
    } else {
      console.log("  ❌ FAIL - Check condition not met");
      console.log("  Expected pattern:", test.expected);
      console.log("  Actual output:", result);
      failed++;
    }
  } catch (error) {
    console.log("  ❌ ERROR:", error.message);
    failed++;
  }
});

console.log("\n" + "=".repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("=".repeat(60));

if (failed === 0) {
  console.log("✅ All tests passed!");
} else {
  console.log(`❌ ${failed} test(s) failed`);
  process.exit(1);
}
