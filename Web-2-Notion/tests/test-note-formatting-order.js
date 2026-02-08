/**
 * Test custom format rules are applied BEFORE unwrapping
 * Version: 5.0.6 - Critical Fix
 *
 * Issue: note__title and note__body were being unwrapped BEFORE custom format
 * rules could apply bold/italic, causing the selectors to not match.
 *
 * Solution: Apply custom format rules FIRST, then unwrap elements.
 */

const { JSDOM } = require("jsdom");

function applyCustomFormattingWithRules(htmlString, formatRules) {
  const dom = new JSDOM(htmlString);
  const doc = dom.window.document;

  console.log("=== STEP 1: Apply custom format rules FIRST ===");
  formatRules.forEach((rule) => {
    const elements = doc.querySelectorAll(rule.selector);
    console.log(`Found ${elements.length} elements for "${rule.selector}"`);

    elements.forEach((el) => {
      const isBlockElement = ["DIV", "P", "SECTION"].includes(el.tagName);
      const isInlineReplacement = ["strong", "em", "code"].includes(
        rule.replacement,
      );

      if (isBlockElement && isInlineReplacement) {
        // Wrap children with inline element
        const wrapper = doc.createElement(rule.replacement);
        while (el.firstChild) {
          wrapper.appendChild(el.firstChild);
        }
        el.appendChild(wrapper);
        console.log(
          `Wrapped ${el.tagName}.${el.className} children in <${rule.replacement}>`,
        );
      } else {
        // Replace element
        const replacement = doc.createElement(rule.replacement);
        replacement.innerHTML = el.innerHTML;
        el.parentNode.replaceChild(replacement, el);
        console.log(
          `Replaced ${el.tagName}.${el.className} with <${rule.replacement}>`,
        );
      }
    });
  });

  console.log("\n=== STEP 2: Unwrap note__body and note__title containers ===");
  const noteBodyElements = doc.querySelectorAll(
    "div.note__body, div.note__title",
  );
  console.log(`Found ${noteBodyElements.length} note elements to unwrap`);

  noteBodyElements.forEach((el) => {
    console.log(`Unwrapping ${el.className}`);
    const parent = el.parentNode;
    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el);
    }
    parent.removeChild(el);
  });

  console.log("\n=== STEP 3: Convert div.note to blockquote ===");
  const noteElements = doc.querySelectorAll("div.note");
  console.log(`Found ${noteElements.length} div.note elements`);

  noteElements.forEach((el) => {
    const blockquote = doc.createElement("blockquote");
    while (el.firstChild) {
      blockquote.appendChild(el.firstChild);
    }
    el.parentNode.replaceChild(blockquote, el);
  });

  return doc.body.innerHTML;
}

// Test Case: note with title (bold) and body (italic)
console.log("\n========================================");
console.log("TEST: Note with custom formatting");
console.log("========================================\n");

const testHTML = `
<div class="note">
  <div class="note__title">Important Title</div>
  <div class="note__body">This is the body text</div>
</div>
`;

const formatRules = [
  {
    selector: "div.note__title",
    replacement: "strong",
    description: "Make note titles bold",
  },
  {
    selector: "div.note__body",
    replacement: "em",
    description: "Make note bodies italic",
  },
];

console.log("INPUT HTML:");
console.log(testHTML);

const result = applyCustomFormattingWithRules(testHTML, formatRules);

console.log("\nOUTPUT HTML:");
console.log(result);

// Verify the output
const hasBlockquote = result.includes("<blockquote>");
const hasStrong = result.includes("<strong>Important Title</strong>");
const hasEm = result.includes("<em>This is the body text</em>");
const noNoteClasses =
  !result.includes("note__title") && !result.includes("note__body");
const strongBeforeEm = result.indexOf("<strong>") < result.indexOf("<em>");

console.log("\n========================================");
console.log("VERIFICATION:");
console.log("========================================");
console.log("✓ Has blockquote:", hasBlockquote ? "YES" : "NO ❌");
console.log("✓ Title is bold:", hasStrong ? "YES" : "NO ❌");
console.log("✓ Body is italic:", hasEm ? "YES" : "NO ❌");
console.log("✓ No note classes:", noNoteClasses ? "YES" : "NO ❌");
console.log("✓ Title before body:", strongBeforeEm ? "YES" : "NO ❌");

if (hasBlockquote && hasStrong && hasEm && noNoteClasses && strongBeforeEm) {
  console.log("\n✅ ALL TESTS PASSED!");
  console.log("Custom format rules are correctly applied BEFORE unwrapping.");
} else {
  console.log("\n❌ TESTS FAILED!");
  console.log("Custom format rules were not applied correctly.");
}
