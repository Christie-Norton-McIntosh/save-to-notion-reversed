const { JSDOM } = require("jsdom");

// Simple test to see what textContent returns
function testSimple() {
  console.log("🧪 Testing textContent with menucascade...\n");

  const html = `<span class="ph menucascade"><span class="ph uicontrol">Workspaces</span><abbr title="and then"> &gt; </abbr><span class="ph uicontrol">Service Operations Workspace</span></span>`;

  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
  const doc = dom.window.document;
  const span = doc.querySelector(".ph.menucascade");

  console.log("📋 HTML (no extra whitespace):");
  console.log(html);
  console.log("");

  console.log("📋 textContent result:");
  const text = span.textContent;
  console.log("Raw:", JSON.stringify(text));
  console.log("Display:", text);
  console.log("");

  // Now test with newlines in HTML (more realistic)
  const htmlWithNewlines = `
    <span class="ph menucascade">
      <span class="ph uicontrol">Workspaces</span>
      <abbr title="and then"> &gt; </abbr>
      <span class="ph uicontrol">Service Operations Workspace</span>
    </span>
  `;

  const dom2 = new JSDOM(
    `<!DOCTYPE html><html><body>${htmlWithNewlines}</body></html>`,
  );
  const doc2 = dom2.window.document;
  const span2 = doc2.querySelector(".ph.menucascade");

  console.log("📋 HTML (with newlines):");
  console.log(htmlWithNewlines.trim());
  console.log("");

  console.log("📋 textContent result:");
  const text2 = span2.textContent;
  console.log("Raw:", JSON.stringify(text2));
  console.log("Display:", text2);
  console.log("");

  // Test what happens when we normalize newlines and collapse spaces
  console.log("📋 After replacing newlines with space and collapsing:");
  const normalized = text2.replace(/\s+/g, " ").trim();
  console.log("Result:", JSON.stringify(normalized));
  console.log("Display:", normalized);
  console.log("");

  // Check if > has spaces
  if (normalized.includes(" > ")) {
    console.log("✅ Spaces around > are preserved!");
  } else if (normalized.includes(">")) {
    console.log("❌ Spaces around > were removed!");
    console.log("   Looking for patterns:");
    console.log("   Has 'Workspaces>'?", normalized.includes("Workspaces>"));
    console.log("   Has '>Service'?", normalized.includes(">Service"));
  }
}

testSimple();
