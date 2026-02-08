const { JSDOM } = require("jsdom");

// Comprehensive test for menucascade spacing preservation
function testMenucascadeInTable() {
  console.log("🧪 COMPREHENSIVE MENUCASCADE SPACING TEST\n");
  console.log("==========================================\n");

  // Test 1: Inline HTML (no extra whitespace)
  console.log("TEST 1: Inline HTML (no newlines between elements)");
  const html1 = `
    <table>
      <tr>
        <td>
          <span class="ph menucascade"><span class="ph uicontrol">Workspaces</span><abbr title="and then"> &gt; </abbr><span class="ph uicontrol">Service Operations Workspace</span></span>
        </td>
      </tr>
    </table>
  `;
  testHTML(html1, "Inline");

  // Test 2: Formatted HTML (newlines between elements)
  console.log("\n---");
  console.log("TEST 2: Formatted HTML (newlines between elements)");
  const html2 = `
    <table>
      <tr>
        <td>
          <span class="ph menucascade">
            <span class="ph uicontrol">Workspaces</span>
            <abbr title="and then"> &gt; </abbr>
            <span class="ph uicontrol">Service Operations Workspace</span>
          </span>
        </td>
      </tr>
    </table>
  `;
  testHTML(html2, "Formatted");

  // Test 3: Multiple spaces in HTML entity
  console.log("\n---");
  console.log("TEST 3: Multiple spaces around >>");
  const html3 = `
    <table>
      <tr>
        <td>
          <span>A</span><abbr>  &gt;  </abbr><span>B</span>
        </td>
      </tr>
    </table>
  `;
  testHTML(html3, "Multiple spaces");

  // Test 4: nbsp entities
  console.log("\n---");
  console.log("TEST 4: Non-breaking spaces (&nbsp;)");
  const html4 = `
    <table>
      <tr>
        <td>
          <span>A</span><abbr>&nbsp;&gt;&nbsp;</abbr><span>B</span>
        </td>
      </tr>
    </table>
  `;
  testHTML(html4, "nbsp");
}

function testHTML(html, label) {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
  const doc = dom.window.document;
  global.Node = dom.window.Node;

  const cell = doc.querySelector("td");

  console.log(`📋 ${label} HTML:`);
  const cellHTML = cell.innerHTML.replace(/\n\s+/g, " ").trim();
  console.log(`   Cell HTML: ${cellHTML.substring(0, 150)}...`);

  // Step 1: Direct textContent
  const directText = cell.textContent;
  console.log(`   Direct textContent: ${JSON.stringify(directText)}`);

  // Step 2: Clone and get textContent (what sanitizeCell does)
  const clone = cell.cloneNode(true);
  const cloneText = clone.textContent || "";
  console.log(`   Clone textContent: ${JSON.stringify(cloneText)}`);

  // Step 3: Normalize whitespace (simulating the processing)
  const normalized = cloneText.replace(/\s+/g, " ").trim();
  console.log(`   After replace(/\\s+/g, " ").trim(): "${normalized}"`);

  // Step 4: Apply the actual processing logic
  let processed = cloneText;
  processed = processed.replace(/\s+/g, " "); // Collapse all whitespace to single space
  processed = processed.trim();
  console.log(`   Final processed: "${processed}"`);

  // Check result
  const hasSpacesAroundGT = processed.includes(" > ");
  console.log(
    `   Result: ${hasSpacesAroundGT ? "✅ PASS" : "❌ FAIL"} - Spaces around >: ${hasSpacesAroundGT}`,
  );

  if (!hasSpacesAroundGT && processed.includes(">")) {
    console.log(`   ⚠️  Found > without spaces!`);
    console.log(`   Pattern check:`);
    console.log(
      `      Has "Workspaces>"? ${processed.includes("Workspaces>")}`,
    );
    console.log(`      Has ">Service"? ${processed.includes(">Service")}`);
    console.log(`      Has "A>"? ${processed.includes("A>")}`);
    console.log(`      Has ">B"? ${processed.includes(">B")}`);
  }
}

testMenucascadeInTable();

console.log("\n==========================================");
console.log("✅ All tests complete\n");
