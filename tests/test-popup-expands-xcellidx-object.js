console.log(
  "🧪 test-popup-expands-xcellidx-object — popup accepts structured object payloads",
);

// Simulate structured payload emitted by content-script
global.window = {};
window.__TABLE_CELL_CONTENT_MAP__ = {};
const cellId = "CELL_OBJ1";
window.__TABLE_CELL_CONTENT_MAP__[cellId] = {
  paragraphs: ["Lead text", "First paragraph", "Second paragraph"],
  flattened: "Lead text First paragraph Second paragraph",
  meta: { containsImage: false, hasLinks: false, approxLength: 80 },
};

// Simulate richText array containing the cell marker
const richText = [
  {
    type: "text",
    annotations: {},
    text: { content: `XCELLIDX${cellId}XCELLIDX`, link: null },
  },
];

// Minimal copy of the popup expansion logic (same algorithm used in main.js)
function expand(rtArray) {
  const expanded = [];
  rtArray.forEach((rt) => {
    const content = rt.text.content;
    const m = content.match(/XCELLIDX(CELL_[A-Za-z0-9]+)XCELLIDX/);
    if (m && window.__TABLE_CELL_CONTENT_MAP__) {
      const id = m[1];
      const original = window.__TABLE_CELL_CONTENT_MAP__[id];
      if (
        original &&
        typeof original === "object" &&
        Array.isArray(original.paragraphs)
      ) {
        original.paragraphs.forEach((part, idx) => {
          expanded.push({
            type: rt.type,
            annotations: rt.annotations,
            text: {
              content:
                part + (idx < original.paragraphs.length - 1 ? "\n" : ""),
              link: null,
            },
          });
        });
        return;
      }
    }
    expanded.push(rt);
  });
  return expanded;
}

const out = expand(richText);
if (!Array.isArray(out) || out.length !== 3) {
  console.error("❌ Expected 3 expanded paragraphs, got", out.length);
  process.exit(1);
}
if (out[0].text.content.indexOf("Lead text") === -1) {
  console.error("❌ Leading paragraph missing");
  process.exit(1);
}

console.log("✅ PASSED");
process.exit(0);
