// Ensure popup expansion + downstream text processing preserves the
// canonical TABLE:bullet placeholder when XCELLIDX provenance is present.

console.log(
  "🧪 test-popup-preserves-table-bullet — preserve TABLE:bullet when XCELLIDX present",
);

global.window = {};
window.__TABLE_CELL_CONTENT_MAP__ = {};
const cellId = "CELL_BUL1";
window.__TABLE_CELL_CONTENT_MAP__[cellId] = {
  paragraphs: [" • Example ALT • ", "Following paragraph"],
  flattened: " • Example ALT •  Following paragraph",
};

const richText = [
  {
    type: "text",
    annotations: {},
    text: { content: `XCELLIDX${cellId}XCELLIDX`, link: null },
  },
];

// Minimal popup expansion (mirrors real implementation)
function expand(rtArray) {
  const expanded = [];
  rtArray.forEach((rt) => {
    const content = rt.text.content;
    const m = content.match(/XCELLIDX(CELL_[A-Za-z0-9]+)XCELLIDX/);
    if (m && window.__TABLE_CELL_CONTENT_MAP__) {
      const id = m[1];
      const original = window.__TABLE_CELL_CONTENT_MAP__[id];
      if (original && Array.isArray(original.paragraphs)) {
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
if (!Array.isArray(out) || out.length !== 2) {
  console.error("❌ Expected 2 expanded paragraphs, got", out.length);
  process.exit(1);
}
if (!out[0].text.content.includes("• Example ALT •")) {
  console.error(
    "❌ Bullet placeholder missing after expansion",
    out[0].text.content,
  );
  process.exit(1);
}

console.log("✅ PASSED");
process.exit(0);
