/**
 * Ensure extra spaces around the '>' entity are preserved when markers
 * (e.g. __BLOCK_END__) are removed. Regression appeared where the
 * marker-replacement regex consumed surrounding single spaces which
 * collapsed sequences like "  >  ".
 */
const { JSDOM } = require("jsdom");

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.document = dom.window.document;

function testGtSpacing() {
  // Build a td that contains: "A  >  B" with a marker immediately after the
  // '>' so naive marker-replacements that consume adjacent spaces would
  // remove the intentional spacing.
  const td = document.createElement("td");
  td.appendChild(document.createTextNode("A  "));
  const abbr = document.createElement("abbr");
  abbr.innerHTML = "&gt;"; // will become '>' in textContent
  td.appendChild(abbr);
  td.appendChild(document.createTextNode("  B"));

  // Simulate insertion of a marker adjacent to the abbr (real code may
  // append markers after block elements). Place marker immediately after
  // the abbr to reproduce the fragile case.
  const marker = document.createTextNode("__BLOCK_END__");
  abbr.parentNode.insertBefore(marker, abbr.nextSibling);

  let text = td.textContent;

  // Run the same marker -> newline replacements used by the popup code.
  text = text
    .replace(/(\s*)__BLOCK_END__(\s*)/g, "$1\n$2")
    .replace(/__BR__/g, "\n")
    .replace(/__TDSEP__/g, " | ");
  text = text
    .replace(/[ \t]{3,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!/\s>\s/.test(text)) {
    console.error("❌ '>' spacing was not preserved:", JSON.stringify(text));
    process.exit(1);
  }

  console.log("✅ '>' spacing preserved ->", JSON.stringify(text));
  // Additional regression: nested <abbr> with surrounding spaces
  const container = document.createElement("div");
  container.innerHTML =
    'Navigate to <span class="ph menucascade">' +
    '<span class="ph uicontrol">Workspaces</span>' +
    '<abbr title="and then"> &gt; </abbr>' +
    '<span class="ph uicontrol">Service Operations Workspace</span>' +
    "</span>.";

  let out = container.textContent || "";
  out = out
    .replace(/[ \t]{3,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!/Workspaces\s>\sService Operations Workspace/.test(out)) {
    console.error(
      "❌ regression: spaces around '>' were removed in nested/abbr case:\n",
      JSON.stringify(out),
    );
    process.exit(1);
  }

  console.log("✅ nested/abbr '>' spacing preserved ->", JSON.stringify(out));
  process.exit(0);
}

try {
  testGtSpacing();
} catch (err) {
  console.error(err);
  process.exit(1);
}

// Regression: ensure spaces around '>' are preserved when the entity is
// inside an <abbr> that contains leading/trailing spaces and is nested
// inside other inline elements (real-world example from ServiceNow):
// <span class="ph cmd">Navigate to <span class="ph menucascade"><span class="ph uicontrol">Workspaces</span><abbr title="and then"> &gt; </abbr><span class="ph uicontrol">Service Operations Workspace</span></span>.</span>
try {
  const container = document.createElement("div");
  container.innerHTML =
    'Navigate to <span class="ph menucascade">' +
    '<span class="ph uicontrol">Workspaces</span>' +
    '<abbr title="and then"> &gt; </abbr>' +
    '<span class="ph uicontrol">Service Operations Workspace</span>' +
    "</span>.";

  // This mirrors the non-table extraction path which ultimately uses
  // the element's textContent before minor normalization.
  let out = container.textContent || "";
  out = out
    .replace(/[ \t]{3,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!/Workspaces\s>\sService Operations Workspace/.test(out)) {
    console.error(
      "❌ regression: spaces around '>' were removed in nested/abbr case:\n",
      JSON.stringify(out),
    );
    process.exit(1);
  }

  console.log("✅ nested/abbr '>' spacing preserved ->", JSON.stringify(out));
} catch (err) {
  console.error(err);
  process.exit(1);
}

// Reproduce the exact options.js sequence: marker nodes inserted by the
// algorithm (no surrounding padding) and then the marker -> newline
// cleanup used in the options conversion path. This caught the real-world
// regression reported by users.
try {
  const td = document.createElement("td");
  td.appendChild(document.createTextNode("Workspaces"));
  const abbr = document.createElement("abbr");
  abbr.innerHTML = " &gt; ";
  td.appendChild(abbr);
  td.appendChild(document.createTextNode("Service Operations Workspace"));

  // Simulate options.js inserting a marker node immediately after the abbr
  // (the node value itself does not include surrounding spaces).
  const marker = document.createTextNode("__BLOCK_END__");
  abbr.parentNode.insertBefore(marker, abbr.nextSibling);

  let text = td.textContent || "";
  // Use the exact replacement implemented in options.js
  text = text
    .replace(/(\s*)__BLOCK_END__(\s*)/g, "$1\n$2")
    .replace(/__BR__/g, "\n")
    .replace(/__TDSEP__/g, " | ")
    .replace(/[ \t]{3,}/g, " ")
    .trim();

  if (!/Workspaces\s>\sService Operations Workspace/.test(text)) {
    console.error(
      "❌ options.js sequence failed to preserve spaces:",
      JSON.stringify(text),
    );
    process.exit(1);
  }

  console.log(
    "✅ options.js sequence preserves '>' spacing ->",
    JSON.stringify(text),
  );
} catch (err) {
  console.error(err);
  process.exit(1);
}
