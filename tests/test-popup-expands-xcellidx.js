// Ensure popup expansion correctly splits newline-preserved XCELLIDX payloads
console.log(
  "🧪 test-popup-expands-xcellidx — popup expands newline XCELLIDX into paragraphs",
);

// Simulate the global map produced by the content-script
global.window = {};
window.__TABLE_CELL_CONTENT_MAP__ = {};
const cellId = "CELL_TEST123";
window.__TABLE_CELL_CONTENT_MAP__[cellId] = [
  "Enhance the service experience",
  "Automate support for common requests with virtual agents.",
].join("\n");

// Simulate a richText array item the popup would receive containing the marker
const richText = [
  {
    type: "text",
    annotations: {},
    text: { content: `XCELLIDX${cellId}XCELLIDX`, link: null },
  },
];

// Run the same expansion logic used in popup/static/js/main.js (minimal)
function expandRichTextArray(arr) {
  const expanded = [];
  arr.forEach((rt) => {
    const content = rt.text.content;
    const cellIdMatch = content.match(/XCELLIDX(CELL_[A-Za-z0-9]+)XCELLIDX/);
    if (cellIdMatch && window.__TABLE_CELL_CONTENT_MAP__) {
      const id = cellIdMatch[1];
      const original = window.__TABLE_CELL_CONTENT_MAP__[id];
      if (original && original.includes("\n")) {
        const parts = original.split("\n");
        parts.forEach((part, idx) => {
          if (part) {
            expanded.push({
              type: rt.type,
              annotations: rt.annotations,
              text: {
                content: part + (idx < parts.length - 1 ? "\n" : ""),
                link: null,
              },
            });
          }
        });
        return;
      }
    }
    expanded.push(rt);
  });
  return expanded;
}

const out = expandRichTextArray(richText);
console.log(JSON.stringify(out, null, 2));

if (out.length !== 2) {
  console.error("❌ Expected 2 expanded paragraphs, got", out.length);
  process.exit(1);
}
if (out[0].text.content.indexOf("Enhance the service experience") === -1) {
  console.error("❌ Leading paragraph missing");
  process.exit(1);
}
if (
  out[1].text.content.indexOf("Automate support for common requests") === -1
) {
  console.error("❌ Second paragraph missing");
  process.exit(1);
}

console.log("✅ PASSED");
process.exit(0);
