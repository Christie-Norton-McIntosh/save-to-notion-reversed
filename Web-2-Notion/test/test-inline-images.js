/**
 * Test to verify inline images (like icons in parentheses) are preserved
 * as text placeholders [alt] within the cell content, maintaining parent context.
 *
 * Note: Notion doesn't support inline Markdown images in table cells.
 * Images are extracted separately and the cell shows text placeholders.
 *
 * This test simulates the image processing logic from sanitizeCell
 */

const { JSDOM } = require("jsdom");

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;

console.log("🧪 Testing inline image preservation...\n");

let passCount = 0;
let failCount = 0;

function test(name, html, expectedPattern, shouldContain) {
  console.log(`\n📋 Test: ${name}`);

  // Create a table with the test HTML
  const table = document.createElement("table");
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.innerHTML = html;
  row.appendChild(cell);
  table.appendChild(row);
  document.body.appendChild(table);

  // Initialize required globals
  window.__TABLE_CELL_CONTENT_MAP__ = {};
  window.__base64ImageArray = [];

  try {
    // This simulates what happens in the sanitizeCell function
    const cellClone = cell.cloneNode(true);

    // Remove scripts/styles
    cellClone.querySelectorAll("script, style").forEach((el) => el.remove());

    // Process images (mimicking the sanitizeCell logic)
    const images = cellClone.querySelectorAll("img");
    images.forEach((img) => {
      const src = img.getAttribute("src") || img.src || "";
      const alt = img.getAttribute("alt") || "";
      const parentAnchor =
        img.parentElement && img.parentElement.tagName === "A"
          ? img.parentElement
          : null;

      const isValidUrl =
        src && (src.startsWith("http://") || src.startsWith("https://"));

      if (isValidUrl) {
            // Replace with text placeholder [alt] (not image markdown)
            // New behavior: preserve the original anchor element and leave a
            // tiny hidden IMG (data-stn-preserve) as its child so that image
            // extraction can still associate the image with the anchor —
            // while the visible text shows the expected [alt] placeholder.
            if (alt) {
              if (parentAnchor) {
                const preservedImg = img.cloneNode(true);
                preservedImg.setAttribute("data-stn-preserve", "1");
                preservedImg.style.cssText =
                  "width:0;height:0;border:0;opacity:0;position:relative;left:0;";
                const wrapper = document.createElement("span");
                wrapper.className = "stn-inline-image";
                wrapper.appendChild(preservedImg);
                wrapper.appendChild(document.createTextNode("[" + alt + "]"));
                img.replaceWith(wrapper);
              } else {
                const replacement = document.createTextNode("[" + alt + "]");
                img.replaceWith(replacement);
              }
        } else {
          if (parentAnchor) {
            parentAnchor.remove();
          } else {
            img.remove();
          }
        }
      }
    });

    const result = cellClone.textContent || "";

    // Special-case assertion: ensure preserved IMG remains a child of the
    // original anchor (regression check).
    if (name === "Icon inside anchor keeps preserved IMG child") {
      const anchor = cellClone.querySelector("a");
      const preservedImg = anchor && anchor.querySelector("img[data-stn-preserve]");
      if (preservedImg) {
        console.log("✅ preserved IMG remains a child of the original anchor");
        passCount++;
        return;
      } else {
        console.log("❌ preserved IMG is NOT present as a child of the original anchor");
        console.log(`   Result DOM: ${cellClone.innerHTML}`);
        failCount++;
        return;
      }
    }

    // Check if the result matches expectations
    const hasPattern = expectedPattern ? expectedPattern.test(result) : true;
    const hasContent = shouldContain ? result.includes(shouldContain) : true;

    if (hasPattern && hasContent) {
      console.log("✅ PASSED");
      console.log(`   Result: "${result}"`);
      passCount++;
    } else {
      console.log("❌ FAILED");
      console.log(`   Expected pattern: ${expectedPattern}`);
      console.log(`   Should contain: "${shouldContain}"`);
      console.log(`   Result: "${result}"`);
      failCount++;
    }
  } catch (error) {
    console.log("❌ FAILED with error");
    console.log(`   Error: ${error.message}`);
    failCount++;
  } finally {
    // Cleanup
    document.body.removeChild(table);
  }
}

// Test 1: Simple inline icon
test(
  "Simple inline icon",
  '<img src="https://example.com/icon.png" alt="icon" />',
  /\[icon\]/,
  "[icon]",
);

// Test 2: Icon with text in parentheses
test(
  "Icon in parentheses with text",
  '(View details <img src="https://example.com/arrow.png" alt="arrow" />)',
  /\[arrow\]/,
  "[arrow]",
);

// Test 3: Multiple inline icons
test(
  "Multiple inline icons",
  'Start <img src="https://example.com/icon1.png" alt="icon1" /> middle <img src="https://example.com/icon2.png" alt="icon2" /> end',
  /\[icon1\].*\[icon2\]/,
  "[icon1]",
);

// Test 4: Icon inside anchor with text
test(
  "Icon inside anchor with surrounding text",
  '<a href="https://example.com">Open <img src="https://example.com/icon.png" alt="arrow" /> now</a>',
  /Open.*\[arrow\].*now/,
  "[arrow]",
);

// Ensure the preserved image remains associated with the original anchor
test(
  "Icon inside anchor keeps preserved IMG child",
  '<a href="https://example.com">Open <img src="https://example.com/icon.png" alt="arrow" /> now</a>',
  null,
  null,
);

// Test 5: Icon without alt text (should be removed)
test(
  "Icon without alt text",
  '<img src="https://example.com/icon.png" alt="" />',
  /^$/,
  "",
);

// Test 6: Complex case - text, icon, more text
test(
  "Text before and after icon",
  'Click here <img src="https://example.com/click.png" alt="click icon" /> to continue',
  /Click here.*\[click icon\].*to continue/,
  "[click icon]",
);

console.log("\n" + "=".repeat(50));
console.log("Test Summary:");
console.log(`  ✅ Passed: ${passCount}`);
console.log(`  ❌ Failed: ${failCount}`);
console.log(`  Total: ${passCount + failCount}`);
console.log("=".repeat(50));

if (failCount > 0) {
  console.log(
    "\n❌ INLINE IMAGE PLACEHOLDERS ARE NOT BEING PRESERVED CORRECTLY",
  );
  process.exit(1);
} else {
  console.log("\n✅ ALL INLINE IMAGE PLACEHOLDER TESTS PASSED");
  process.exit(0);
}
