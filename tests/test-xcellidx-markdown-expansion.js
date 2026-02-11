/**
 * Test XCELLIDX markdown expansion logic
 *
 * This test verifies that XCELLIDX markers are correctly expanded into
 * markdown with paragraphs and images.
 */

// Mock window.__TABLE_CELL_CONTENT_MAP__
global.window = {
  __TABLE_CELL_CONTENT_MAP__: {
    CELL_abc123: {
      paragraphs: ["**Bold heading**", "Regular paragraph with text"],
      images: [
        { src: "data:image/png;base64,abc...", alt: "Test image" },
        { src: "https://example.com/image.png", alt: "External image" },
      ],
    },
    CELL_def456: {
      paragraphs: [],
      images: [{ src: "data:image/jpeg;base64,xyz...", alt: "Lonely image" }],
    },
    CELL_ghi789: {
      paragraphs: ["Just text, no images"],
      images: [],
    },
  },
};

/**
 * Simulate the XCELLIDX markdown expansion logic
 */
function expandXCELLIDXInMarkdown(markdownResult) {
  if (!window.__TABLE_CELL_CONTENT_MAP__) {
    return markdownResult;
  }

  const markerRe = /XCELLIDX(CELL_[a-z0-9]+)XCELLIDX/gi;
  return markdownResult.replace(markerRe, function (match, cellId) {
    const payload = window.__TABLE_CELL_CONTENT_MAP__[cellId];

    if (!payload || typeof payload !== "object") {
      console.warn("[TEST] No payload found for", cellId);
      return match;
    }

    console.log("[TEST] Expanding marker", cellId);

    const expandedMarkdown = [];

    // Add paragraphs
    if (Array.isArray(payload.paragraphs)) {
      payload.paragraphs.forEach(function (para) {
        if (para && para.trim()) {
          expandedMarkdown.push(para);
        }
      });
    }

    // Add images
    if (Array.isArray(payload.images)) {
      payload.images.forEach(function (img) {
        if (img && img.src) {
          const alt = img.alt || "image";
          expandedMarkdown.push("![" + alt + "](" + img.src + ")");
          console.log("[TEST] Added image markdown for:", alt);
        }
      });
    }

    if (expandedMarkdown.length === 0) {
      console.warn("[TEST] Payload for", cellId, "had no content");
      return "";
    }

    const result = expandedMarkdown.join("\n\n");
    console.log(
      "[TEST] Expanded",
      cellId,
      "into",
      expandedMarkdown.length,
      "items",
    );
    return result;
  });
}

// Test cases
console.log("=== Test 1: Cell with paragraphs and images ===");
const input1 = "XCELLIDXCELL_abc123XCELLIDX\n---\n";
const output1 = expandXCELLIDXInMarkdown(input1);
console.log("Input:", JSON.stringify(input1));
console.log("Output:", JSON.stringify(output1));
console.log(
  "Expected paragraphs and images:",
  output1.includes("**Bold heading**") && output1.includes("![Test image]"),
);
console.log("");

console.log("=== Test 2: Cell with only image ===");
const input2 = "XCELLIDXCELL_def456XCELLIDX";
const output2 = expandXCELLIDXInMarkdown(input2);
console.log("Input:", JSON.stringify(input2));
console.log("Output:", JSON.stringify(output2));
console.log("Expected only image:", output2.includes("![Lonely image]"));
console.log("");

console.log("=== Test 3: Cell with only text ===");
const input3 = "XCELLIDXCELL_ghi789XCELLIDX";
const output3 = expandXCELLIDXInMarkdown(input3);
console.log("Input:", JSON.stringify(input3));
console.log("Output:", JSON.stringify(output3));
console.log("Expected only text:", output3.includes("Just text, no images"));
console.log("");

console.log("=== Test 4: Multiple cells ===");
const input4 =
  "XCELLIDXCELL_abc123XCELLIDX\n---\nXCELLIDXCELL_ghi789XCELLIDX\n---\n";
const output4 = expandXCELLIDXInMarkdown(input4);
console.log("Input:", JSON.stringify(input4));
console.log("Output:", JSON.stringify(output4));
console.log(
  "Expected both cells expanded:",
  output4.includes("**Bold heading**") && output4.includes("Just text"),
);
console.log("");

console.log("=== Test 5: Unknown cell ID (fallback) ===");
const input5 = "XCELLIDXCELL_unknownXCELLIDX";
const output5 = expandXCELLIDXInMarkdown(input5);
console.log("Input:", JSON.stringify(input5));
console.log("Output:", JSON.stringify(output5));
console.log("Expected original marker preserved:", output5 === input5);
console.log("");

// Verify structure
console.log("=== Verify expanded markdown structure ===");
console.log(
  "Output1 has double newlines between items:",
  output1.includes("\n\n"),
);
console.log(
  "Output1 preserves markdown formatting:",
  output1.includes("**Bold heading**"),
);
console.log(
  "Output1 has image markdown:",
  output1.includes("![Test image](data:image/png;base64,abc...)"),
);
console.log("");

console.log("✅ All tests completed!");
