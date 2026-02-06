const { JSDOM } = require("jsdom");

// Test how textContent handles whitespace
function testTextContent() {
  console.log("🧪 Testing how textContent handles whitespace...\n");

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

  console.log("📋 Original HTML innerHTML:");
  console.log(span.innerHTML.replace(/\n\s+/g, " ").trim());
  console.log("");

  console.log("📋 textContent (raw):");
  console.log("   Result:", JSON.stringify(span.textContent));
  console.log("");

  console.log("📋 textContent (collapsed whitespace):");
  const collapsed = span.textContent.replace(/\s+/g, " ").trim();
  console.log("   Result:", JSON.stringify(collapsed));
  console.log('   Expected: "Workspaces > Service Operations Workspace"');
  console.log(
    "   Match:",
    collapsed === "Workspaces > Service Operations Workspace" ? "✅" : "❌",
  );
  console.log("");

  // Test what the abbr element's textContent is
  const abbr = doc.querySelector("abbr");
  console.log("📋 abbr textContent:");
  console.log("   Raw:", JSON.stringify(abbr.textContent));
  console.log('   Note: " > " has spaces on both sides');
  console.log("");

  // Test what happens when we clone and process
  const clone = span.cloneNode(true);
  console.log("📋 Clone textContent:");
  console.log("   Raw:", JSON.stringify(clone.textContent));
  const cloneCollapsed = clone.textContent.replace(/\s+/g, " ").trim();
  console.log("   Collapsed:", JSON.stringify(cloneCollapsed));
  console.log("");

  // Test with the actual problematic regex
  const withNewlines = clone.textContent;
  const step1 = withNewlines.replace(/(\s*)__BLOCK_END__(\s*)/g, "$1\n$2");
  const step2 = step1.replace(/[ \t]{3,}/g, " ");
  const step3 = step2.replace(/\n{3,}/g, "\n\n");
  const step4 = step3.trim();
  const final = step4.replace(/\s+/g, " ");

  console.log("📋 After regex processing:");
  console.log(
    "   Step 1 (__BLOCK_END__):",
    JSON.stringify(step1.substring(0, 100)),
  );
  console.log(
    "   Step 2 (3+ spaces):",
    JSON.stringify(step2.substring(0, 100)),
  );
  console.log(
    "   Step 3 (3+ newlines):",
    JSON.stringify(step3.substring(0, 100)),
  );
  console.log("   Step 4 (trim):", JSON.stringify(step4.substring(0, 100)));
  console.log("   Final (collapse all whitespace):", JSON.stringify(final));
  console.log('   Expected: "Workspaces > Service Operations Workspace"');
  console.log(
    "   Match:",
    final === "Workspaces > Service Operations Workspace" ? "✅" : "❌",
  );
}

testTextContent();
