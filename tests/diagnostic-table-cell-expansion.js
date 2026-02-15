// Diagnostic to understand how table cell content becomes blocks in Notion

console.log("🔍 Diagnostic: Table cell expansion pipeline\n");

// Simulate the data structure from XCELLIDX expansion
const expandedCell = [
  {
    type: "text",
    annotations: {},
    text: {
      content: "Service Portal App",
      link: { url: "data:image/png;base64,iVBORw0KG..." },
    },
  },
  {
    type: "text",
    annotations: {},
    text: {
      content: "Automate IT service",
      link: null,
    },
  },
];

console.log("Expanded cell richText array:");
console.log(JSON.stringify(expandedCell, null, 2));

// This is what gets mapped to table cell properties
const cellContent = expandedCell.map(function (e) {
  return [
    e.text.content,
    e.annotations
      ? Object.entries(e.annotations)
          .filter(function (e) {
            return !0 === e[1];
          })
          .map(function (e) {
            return [e[0].charAt(0)];
          })
      : void 0,
  ].filter(Boolean);
});

console.log("\nCell content for Notion API:");
console.log(JSON.stringify(cellContent, null, 2));

// The problem: Notion table cells only support rich_text arrays, not child blocks
// So even if we have multiple paragraphs worth of content, they get combined
// into a single cell's rich_text array

console.log("\n❌ Issue identified:");
console.log(
  "1. Notion table cells only accept rich_text arrays (inline content)",
);
console.log("2. Cannot nest paragraph blocks inside table cells");
console.log(
  "3. Links to images don't automatically become image blocks in cells",
);
console.log(
  "4. Multiple lines/paragraphs run together as single rich_text array",
);

console.log("\n✅ Solution needed:");
console.log("1. For images: Convert text with image link to image markdown");
console.log(
  "2. For separate blocks: Use bullet_list_item blocks instead of table",
);
console.log(
  "3. TableToList should already emit markdown — check the conversion",
);
