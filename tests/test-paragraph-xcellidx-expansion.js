// Test paragraph blocks with XCELLIDX markers (from tableToList conversion)

console.log(
  "🧪 test-paragraph-xcellidx-expansion — expanding XCELLIDX in paragraphs\n",
);

// Mock global environment
global.window = {
  __TABLE_CELL_CONTENT_MAP__: {
    CELL_r2h1ghqx: {
      paragraphs: [
        "[Automate IT service](data:image/png;base64,iVBORw0KGgoAAAA...)",
        "Enhance the service experienceAutomate support for common requests with virtual agents powered by natural language understanding (NLU). Engage users with natural, human conversation to provide consistent good customer service experiences.",
      ],
    },
    CELL_d4bd0q06: {
      paragraphs: [
        "[Consolidate IT service](data:image/jpeg;base64,/9j/4AAQSkZJRg...)",
        "Consolidate IT servicesRapidly consolidate existing tools to a single system of action in the cloud.",
      ],
    },
  },
  __imageUrlArray: [],
};

// Mock helper functions
function hr() {
  return "id_" + Math.random().toString(36).substr(2, 9);
}

function g(...args) {
  return Object.assign({}, ...args);
}

function l() {
  return { alive: true, version: 1 };
}

// Simulate a paragraph block with XCELLIDX marker (from tableToList)
const paragraphBlock = {
  id: "para_001",
  type: "paragraph",
  paragraph: {
    rich_text: [
      {
        type: "text",
        annotations: {},
        text: {
          content: "XCELLIDXCELL_r2h1ghqxXCELLIDX• Automate IT service •",
          link: null,
        },
      },
    ],
  },
};

// Simulate the expansion logic
var a = paragraphBlock;
var hasXcellidxMarker = a[a.type].rich_text.some(function (rt) {
  return (
    rt.text &&
    rt.text.content &&
    /XCELLIDX(CELL_[A-Za-z0-9]+)XCELLIDX/.test(rt.text.content)
  );
});

console.log("✓ Detected XCELLIDX marker:", hasXcellidxMarker);

if (hasXcellidxMarker) {
  console.log("✓ Expanding XCELLIDX markers");
  var expandedBlocks = {};
  var blockSequence = [];

  a[a.type].rich_text.forEach(function (richText) {
    var content = richText.text.content;
    var cellIdMatch = content.match(/XCELLIDX(CELL_[A-Za-z0-9]+)XCELLIDX/);

    if (cellIdMatch && window.__TABLE_CELL_CONTENT_MAP__) {
      var mapId = cellIdMatch[1];
      var originalContent = window.__TABLE_CELL_CONTENT_MAP__[mapId];

      if (
        originalContent &&
        typeof originalContent === "object" &&
        Array.isArray(originalContent.paragraphs)
      ) {
        originalContent.paragraphs.forEach(function (para) {
          if (!para) return;

          // Check if this is an image link
          var imgMatch = para.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (
            imgMatch &&
            (imgMatch[2].startsWith("data:image/") ||
              /\.(png|jpe?g|gif|webp)(\?|$)/i.test(imgMatch[2]))
          ) {
            var imgId = hr();
            expandedBlocks[imgId] = {
              role: "reader",
              value: g(
                {
                  id: imgId,
                  type: "image",
                  parent_id: a.id,
                  parent_table: "block",
                },
                l(),
                {
                  type: "image",
                  properties: {
                    source: [[imgMatch[2]]],
                    caption: [[imgMatch[1]]],
                  },
                  format: { block_width: 500 },
                },
              ),
            };
            blockSequence.push(imgId);
            console.log("  ✓ Created image block with caption:", imgMatch[1]);
          } else {
            var paraId = hr();
            expandedBlocks[paraId] = {
              role: "reader",
              value: g(
                {
                  id: paraId,
                  type: "paragraph",
                  parent_id: a.id,
                  parent_table: "block",
                },
                l(),
                {
                  type: "paragraph",
                  properties: { title: [[para]] },
                },
              ),
            };
            blockSequence.push(paraId);
            console.log(
              "  ✓ Created paragraph block with text:",
              para.substring(0, 50) + "...",
            );
          }
        });
      }
    }
  });

  console.log("\n✓ Created", blockSequence.length, "blocks total");

  // Verify results
  var imageBlocks = Object.values(expandedBlocks).filter(
    (b) => b.value.type === "image",
  );
  var paraBlocks = Object.values(expandedBlocks).filter(
    (b) => b.value.type === "paragraph",
  );

  console.log("✓ Image blocks:", imageBlocks.length);
  console.log("✓ Paragraph blocks:", paraBlocks.length);

  if (imageBlocks.length !== 1) {
    console.error("❌ Expected 1 image block, got", imageBlocks.length);
    process.exit(1);
  }

  if (paraBlocks.length !== 1) {
    console.error("❌ Expected 1 paragraph block, got", paraBlocks.length);
    process.exit(1);
  }

  // Verify image has data URL
  var img = imageBlocks[0];
  if (!img.value.properties.source[0][0].startsWith("data:image/")) {
    console.error(
      "❌ Image doesn't have data URL:",
      img.value.properties.source,
    );
    process.exit(1);
  }

  console.log("\n✅ PASSED - Paragraph XCELLIDX markers expanded correctly");
} else {
  console.error("❌ Failed to detect XCELLIDX marker");
  process.exit(1);
}
