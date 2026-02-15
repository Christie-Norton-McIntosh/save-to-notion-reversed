// Test that tables with XCELLIDX markers get converted to bulleted lists with image blocks

console.log(
  "🧪 test-table-to-bullet-list-with-images — verifying table conversion\n",
);

// Mock the functions used in the table conversion
global.window = {
  __TABLE_CELL_CONTENT_MAP__: {
    CELL_abc123: {
      paragraphs: [
        "[Service Portal App](data:image/png;base64,iVBORw0KGgoAAAA...)",
        "Automate IT service",
      ],
    },
    CELL_def456: {
      paragraphs: ["Regular text content"],
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

function nB(type) {
  return type;
}

function h(obj, key, value) {
  obj[key] = value;
  return obj;
}

function c(a) {
  return {};
}

// Simulate a table block with XCELLIDX markers
const tableBlock = {
  id: "table_001",
  type: "table",
  table: {
    table_width: 2,
    children: [
      {
        table_row: {
          cells: [
            [
              {
                type: "text",
                annotations: {},
                text: {
                  content: "XCELLIDXCELL_abc123XCELLIDX",
                  link: null,
                },
              },
            ],
            [
              {
                type: "text",
                annotations: {},
                text: {
                  content: "XCELLIDXCELL_def456XCELLIDX",
                  link: null,
                },
              },
            ],
          ],
        },
      },
    ],
  },
};

// Run the table conversion logic
var a = tableBlock;

// Check if table contains XCELLIDX markers
var hasXcellidx = false;
if (a.table && a.table.children) {
  outerLoop: for (var rowIdx = 0; rowIdx < a.table.children.length; rowIdx++) {
    var row = a.table.children[rowIdx];
    if (row.table_row && row.table_row.cells) {
      for (var cellIdx = 0; cellIdx < row.table_row.cells.length; cellIdx++) {
        var cell = row.table_row.cells[cellIdx];
        for (var rtIdx = 0; rtIdx < cell.length; rtIdx++) {
          var rt = cell[rtIdx];
          if (rt.text && rt.text.content && /XCELLIDX/.test(rt.text.content)) {
            hasXcellidx = true;
            break outerLoop;
          }
        }
      }
    }
  }
}

console.log("✓ Detected XCELLIDX markers:", hasXcellidx);

if (hasXcellidx && a.table && a.table.children) {
  console.log("✓ Converting table to bulleted list");
  var listBlocks = {};
  var imageBlocks = [];
  var bulletBlocks = [];

  a.table.children.forEach(function (row) {
    if (row.table_row && row.table_row.cells) {
      row.table_row.cells.forEach(function (cell) {
        var cellId = hr();
        var cellContent = [];
        var cellImages = [];

        cell.forEach(function (richText) {
          var content = richText.text.content;
          var cellIdMatch = content.match(
            /XCELLIDX(CELL_[A-Za-z0-9]+)XCELLIDX/,
          );

          if (cellIdMatch && window.__TABLE_CELL_CONTENT_MAP__) {
            var mapId = cellIdMatch[1];
            var originalContent = window.__TABLE_CELL_CONTENT_MAP__[mapId];

            if (
              originalContent &&
              typeof originalContent === "object" &&
              Array.isArray(originalContent.paragraphs)
            ) {
              originalContent.paragraphs.forEach(function (part) {
                if (part) {
                  var linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                  if (linkMatch) {
                    var linkUrl = linkMatch[2];
                    var linkText = linkMatch[1];
                    if (
                      linkUrl.startsWith("data:image/") ||
                      /\.(png|jpe?g|gif|webp)(\?|$)/i.test(linkUrl)
                    ) {
                      var imgId = hr();
                      listBlocks[imgId] = {
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
                              source: [[linkUrl]],
                              caption: [[linkText]],
                            },
                            format: { block_width: 500 },
                          },
                        ),
                      };
                      cellImages.push(imgId);
                      imageBlocks.push(imgId);
                    } else {
                      cellContent.push([[linkText, [["a", linkUrl]]]]);
                    }
                  } else {
                    cellContent.push([[part]]);
                  }
                }
              });
            }
          }
        });

        if (cellContent.length > 0 || cellImages.length > 0) {
          listBlocks[cellId] = {
            role: "reader",
            value: g(
              {
                id: cellId,
                type: "bulleted_list_item",
                parent_id: a.id,
                parent_table: "block",
              },
              l(),
              {
                type: "bulleted_list_item",
                properties: {
                  title: cellContent.length > 0 ? cellContent : [[""]],
                },
                content: cellImages,
              },
            ),
          };
          bulletBlocks.push(cellId);
        }
      });
    }
  });

  console.log("✓ Created", bulletBlocks.length, "bullet_list_item blocks");
  console.log("✓ Created", imageBlocks.length, "image blocks");

  // Verify blocks were created correctly
  if (bulletBlocks.length !== 2) {
    console.error("❌ Expected 2 bullet blocks, got", bulletBlocks.length);
    process.exit(1);
  }

  if (imageBlocks.length !== 1) {
    console.error("❌ Expected 1 image block, got", imageBlocks.length);
    process.exit(1);
  }

  // Check that image block has correct structure
  const imgBlock = listBlocks[imageBlocks[0]];
  if (!imgBlock || imgBlock.value.type !== "image") {
    console.error("❌ Image block has wrong type:", imgBlock);
    process.exit(1);
  }

  if (!imgBlock.value.properties.source[0][0].startsWith("data:image/")) {
    console.error(
      "❌ Image block missing data URL:",
      imgBlock.value.properties.source,
    );
    process.exit(1);
  }

  console.log("✓ Image block has correct data URL");
  console.log(
    "✓ Image block caption:",
    imgBlock.value.properties.caption[0][0],
  );

  // Check that bullet items have content
  const bulletBlock1 = listBlocks[bulletBlocks[0]];
  if (!bulletBlock1.value.content || bulletBlock1.value.content.length === 0) {
    console.error("❌ First bullet block should have image as child");
    process.exit(1);
  }

  console.log("✓ Bullet items have child blocks (images)");

  const bulletBlock2 = listBlocks[bulletBlocks[1]];
  if (
    !bulletBlock2.value.properties.title ||
    bulletBlock2.value.properties.title.length === 0
  ) {
    console.error("❌ Second bullet block should have text content");
    process.exit(1);
  }

  console.log("✓ Bullet items have text content");

  console.log(
    "\n✅ PASSED - Tables with XCELLIDX convert to bullet lists with images",
  );
} else {
  console.error("❌ Failed to detect XCELLIDX markers");
  process.exit(1);
}
