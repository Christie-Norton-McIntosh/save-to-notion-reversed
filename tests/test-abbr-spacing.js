const { JSDOM } = require("jsdom");

// Test the abbr spacing issue with node.textContent.trim()
function testAbbrSpacing() {
  console.log("🧪 Testing abbr spacing issue...\n");

  const html = `
    <span class="ph menucascade">
      <span class="ph uicontrol">Workspaces</span>
      <abbr title="and then"> &gt; </abbr>
      <span class="ph uicontrol">Service Operations Workspace</span>
    </span>
  `;

  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
  const doc = dom.window.document;
  const span = doc.querySelector(".ph.menucascade");

  console.log("📋 Original HTML:");
  console.log("   innerHTML:", span.innerHTML.replace(/\n\s+/g, " ").trim());
  console.log("   textContent:", JSON.stringify(span.textContent));
  console.log("");

  // Simulate what the current code does (WRONG way)
  console.log("📋 Current (WRONG) approach - trim each text node:");
  const abbr1 = doc.querySelector("abbr");
  let wrongResult = "";
  Array.from(abbr1.childNodes).forEach((node) => {
    if (node.nodeType === 3) {
      // TEXT_NODE
      const txt = node.textContent.trim();
      if (txt) wrongResult += txt + " ";
    }
  });
  console.log("   Result:", JSON.stringify(wrongResult.trim()));
  console.log('   ❌ Lost leading space before ">"');
  console.log("");

  // Show the CORRECT way
  console.log("📋 Correct approach - preserve whitespace:");
  const abbr2 = doc.querySelector("abbr");
  let correctResult = "";
  Array.from(abbr2.childNodes).forEach((node) => {
    if (node.nodeType === 3) {
      // TEXT_NODE
      correctResult += node.textContent;
    }
  });
  console.log("   Result:", JSON.stringify(correctResult));
  console.log("   ✅ Preserves spacing correctly");
  console.log("");

  // Show what the full span looks like with wrong approach
  console.log(
    "📋 Full span textContent extraction (simulating table cell processing):",
  );
  const menucascade = doc.querySelector(".ph.menucascade");

  // Current wrong approach
  let fullWrong = "";
  function extractTextWrong(el) {
    Array.from(el.childNodes).forEach((node) => {
      if (node.nodeType === 3) {
        const txt = node.textContent.trim();
        if (txt) fullWrong += txt + " ";
      } else if (node.nodeType === 1) {
        extractTextWrong(node);
      }
    });
  }
  extractTextWrong(menucascade);
  console.log("   WRONG:", JSON.stringify(fullWrong.trim()));

  // Correct approach - just use textContent
  const fullCorrect = menucascade.textContent.replace(/\s+/g, " ").trim();
  console.log("   CORRECT:", JSON.stringify(fullCorrect));
  console.log("");

  console.log(
    "✅ Issue identified: .trim() on individual text nodes removes important whitespace",
  );
}

testAbbrSpacing();
