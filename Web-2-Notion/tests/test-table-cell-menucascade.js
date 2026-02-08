const { JSDOM } = require("jsdom");

function testTableCellProcessing() {
  console.log("🧪 Testing table cell processing with menucascade...\n");

  // Simulate a table cell with menucascade
  const html = `
    <table>
      <tr>
        <td>
          <span class="ph menucascade">
            <span class="ph uicontrol">Workspaces</span><abbr title="and then"> &gt; </abbr><span class="ph uicontrol">Service Operations Workspace</span>
          </span>
        </td>
      </tr>
    </table>
  `;

  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
  const doc = dom.window.document;
  global.Node = dom.window.Node;
  global.window = dom.window;
  global.document = doc;

  const cell = doc.querySelector("td");

  console.log("📋 Original cell HTML:");
  console.log(cell.innerHTML.replace(/\s+/g, " ").trim());
  console.log("");

  console.log("📋 Direct textContent:");
  console.log("Result:", JSON.stringify(cell.textContent));
  console.log("Display:", cell.textContent.replace(/\s+/g, " ").trim());
  console.log("");

  // Simulate the actual processing from sanitizeCell
  console.log("📋 Simulating sanitizeCell processing:");

  const cellClone = cell.cloneNode(true);

  // This is what the code does
  const text = cellClone.textContent || "";
  console.log("Step 1 - textContent:", JSON.stringify(text));

  // After trimming and collapsing whitespace
  const normalized = text.replace(/\s+/g, " ").trim();
  console.log("Step 2 - normalized:", JSON.stringify(normalized));
  console.log("");

  if (normalized.includes(" > ")) {
    console.log("✅ Spaces around > are preserved!");
  } else {
    console.log("❌ Spaces around > were removed!");
    console.log("   Result has:", normalized);
  }
}

testTableCellProcessing();
