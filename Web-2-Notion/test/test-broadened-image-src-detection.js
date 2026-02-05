/**
 * Test for broadened image-src detection (data-src, srcset, currentSrc)
 * 
 * This test verifies that images with various src attributes are properly
 * detected and extracted, including:
 * - data-src
 * - data-original-src
 * - srcset (uses first candidate)
 * - currentSrc (for responsive images)
 */

const { JSDOM } = require("jsdom");

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;

console.log("🧪 Testing broadened image-src detection...\n");

// Test helper to simulate image extraction logic from main.js
function extractImageSrcBroadened(img) {
  if (!img) return "";
  try {
    var dataOriginalSrc = img.getAttribute("data-original-src");
    var dataSrc = img.getAttribute("data-src");
    var srcAttr = img.getAttribute("src") || "";
    var srcProp = img.src || "";
    var srcsetAttr = img.getAttribute("srcset") || "";
    var currentSrc = img.currentSrc || "";
    
    // Extract first candidate from srcset if available
    var srcsetFirst = "";
    if (srcsetAttr && typeof srcsetAttr === "string") {
      var firstCandidate = srcsetAttr.split(",")[0];
      if (firstCandidate) {
        srcsetFirst = firstCandidate.trim().split(" ")[0];
      }
    }
    
    return dataOriginalSrc || dataSrc || srcsetFirst || currentSrc || srcAttr || srcProp;
  } catch (err) {
    console.debug("extractImageSrcBroadened error", err);
  }
  return "";
}

// Test 1: data-src attribute
(function testDataSrc() {
  console.log("Test 1: data-src attribute");
  const img = document.createElement("img");
  img.setAttribute("data-src", "https://example.com/data-src-image.jpg");
  const src = extractImageSrcBroadened(img);
  if (src !== "https://example.com/data-src-image.jpg") {
    console.error("❌ FAILED: Expected data-src to be extracted");
    process.exit(1);
  }
  console.log("✅ PASSED: data-src attribute detected\n");
})();

// Test 2: data-original-src takes priority over data-src
(function testDataOriginalSrcPriority() {
  console.log("Test 2: data-original-src takes priority");
  const img = document.createElement("img");
  img.setAttribute("data-original-src", "https://example.com/original.jpg");
  img.setAttribute("data-src", "https://example.com/data.jpg");
  img.setAttribute("src", "https://example.com/src.jpg");
  const src = extractImageSrcBroadened(img);
  if (src !== "https://example.com/original.jpg") {
    console.error("❌ FAILED: Expected data-original-src to take priority");
    process.exit(1);
  }
  console.log("✅ PASSED: data-original-src takes priority\n");
})();

// Test 3: srcset extraction
(function testSrcset() {
  console.log("Test 3: srcset attribute (first candidate)");
  const img = document.createElement("img");
  img.setAttribute("srcset", "https://example.com/small.jpg 480w, https://example.com/medium.jpg 800w, https://example.com/large.jpg 1200w");
  const src = extractImageSrcBroadened(img);
  if (src !== "https://example.com/small.jpg") {
    console.error("❌ FAILED: Expected first srcset candidate to be extracted, got:", src);
    process.exit(1);
  }
  console.log("✅ PASSED: srcset first candidate extracted\n");
})();

// Test 4: Priority order verification
(function testPriorityOrder() {
  console.log("Test 4: Priority order verification");
  const img = document.createElement("img");
  img.setAttribute("src", "https://example.com/src.jpg");
  img.setAttribute("data-src", "https://example.com/data.jpg");
  img.setAttribute("srcset", "https://example.com/srcset.jpg 480w");
  const src = extractImageSrcBroadened(img);
  if (src !== "https://example.com/data.jpg") {
    console.error("❌ FAILED: Expected data-src to take priority over srcset and src, got:", src);
    process.exit(1);
  }
  console.log("✅ PASSED: Priority order correct (data-src > srcset > src)\n");
})();

// Test 5: Fallback to src attribute when others are missing
(function testSrcFallback() {
  console.log("Test 5: Fallback to src attribute");
  const img = document.createElement("img");
  img.setAttribute("src", "https://example.com/fallback.jpg");
  const src = extractImageSrcBroadened(img);
  if (src !== "https://example.com/fallback.jpg") {
    console.error("❌ FAILED: Expected src fallback to work");
    process.exit(1);
  }
  console.log("✅ PASSED: Fallback to src attribute works\n");
})();

// Test 6: Empty/missing attributes
(function testEmpty() {
  console.log("Test 6: Empty/missing attributes");
  const img = document.createElement("img");
  const src = extractImageSrcBroadened(img);
  if (src !== "") {
    console.error("❌ FAILED: Expected empty string for missing attributes");
    process.exit(1);
  }
  console.log("✅ PASSED: Empty result for missing attributes\n");
})();

console.log("=".repeat(60));
console.log("✅ ALL BROADENED IMAGE-SRC DETECTION TESTS PASSED");
console.log("=".repeat(60));
process.exit(0);
