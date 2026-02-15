// Test to verify table cell behavior with images

console.log("🧪 Testing table cell image and block separation\n");

// Simulate what happens when XCELLIDX expansion creates richText with image links
const cellRichText = [
  {
    type: "text",
    annotations: {},
    text: {
      content: "Service Portal App",
      link: { url: "data:image/png;base64,iVBORw0KGgoAAAA..." },
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

console.log("Cell rich_text array:");
cellRichText.forEach((rt, i) => {
  console.log(`  [${i}] content: "${rt.text.content}"`);
  console.log(
    `      link: ${rt.text.link ? rt.text.link.url.substring(0, 30) + "..." : "null"}`,
  );
});

console.log("\n❌ Problem:");
console.log("1. Notion table cells only accept rich_text arrays");
console.log("2. Rich text with link shows as linked text, not an image");
console.log("3. Multiple richText elements run together without line breaks");

console.log("\n✅ Solution needed:");
console.log("1. For images: DON'T try to show images in table cells");
console.log("2. Instead: Show alt text as placeholder in the cell");
console.log("3. For separate blocks: Add \\n between richText elements");

console.log("\n📋 Correct behavior:");
console.log("Table cells should contain:");
console.log("  - Alt text for images (e.g., 'Service Portal App')");
console.log("  - Regular text");
console.log("  - Newlines between elements so text doesn't run together");

console.log("\n💡 The real fix:");
console.log(
  "If user wants images and separate blocks, don't use table format.",
);
console.log(
  "The tableToList Turndown rule should convert to markdown paragraphs.",
);
console.log(
  "Then those paragraphs become separate Notion blocks that CAN contain images.",
);
