const { JSDOM } = require("jsdom");

// Test the EXACT user scenario with ServiceNow HTML
console.log("🧪 Testing EXACT user scenario...\n");

// Exact HTML from user
const userHTML = `
<table>
  <tr>
    <td>
      <span class="ph menucascade">
        <span class="ph uicontrol">Workspaces</span>
        <abbr title="and then"> &gt; </abbr>
        <span class="ph uicontrol">Service Operations Workspace</span>
      </span>
    </td>
  </tr>
  <tr>
    <td>
      <li class="li step stepexpand">
        <span class="ph cmd">Select the <span class="ph uicontrol">List</span> (<a href="https://www.servicenow.com/docs/viewer/attachment/MlbQAgTiiiMOLOw9T36wJg/FBue0LinyCrQ_vyRxtzuyA-MlbQAgTiiiMOLOw9T36wJg" data-ft-container-id="MlbQAgTiiiMOLOw9T36wJg" data-ft-resource-id="FBue0LinyCrQ_vyRxtzuyA-MlbQAgTiiiMOLOw9T36wJg"><img class="image icon ft-zoomable-image ft-responsive-image" id="start-conference-call-telephony__image_w1f_v11_f1c" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAlCAYAAADMdYB5AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIaADAAQAAAABAAAAJQAAAADjwCbAAAABpElEQVRYCe2WwW7CMAyG/9BOCZdyg0kD0ScAafAe056XvtNGkQocSGZn84RQgoLKxA6xVDmpktj5/cmtentvHB5sgwfH9+FzElKFrERWQhQQn5nISogC4jMTokQpg5C39vutUgA/Mg+tvfZO9sfWRJOwJ+B1pTGvn9A0HbafJ6xWBoulRuq3n4O3W4tm02G3sxhEih9NwjmH8aREXZcwGvggVcbPBaazEpxgSiIcdDSy0AaUREwHUjn2U0M5YDhU0Fqhba0vhTGKDo1cJxSDlDgenVeDz4tZVAmWcr936DrnZeT54cBzkuEG432xMsgx0SR4gWTPng8Tz+Okevwsk318ZsiiSXgw1xo1gbkhsDyYawJzQYCQXVH3N86Akt32BnNcYD4/A3NyO5hVXzANgWkuwKwITK5GqnkwCWwpbWhftBxc9wOBuf/XYIauFHjHCtwdzKV0zAQyWc0/AfNlWuKU2CoU9bX+YFKH5C553jGrisCkGyYI4QHuDyZ1SO6a3PE8qI/omByYHzEeF4XM7udv+BrdL+jlSTkJUSQrkZUQBcR/ARpYzMe2ccRXAAAAAElFTkSuQmCC" alt="List icon" data-ft-click-interceptor="ft-img-zoom" data-ft-container-id="MlbQAgTiiiMOLOw9T36wJg" data-ft-resource-id="FBue0LinyCrQ_vyRxtzuyA-MlbQAgTiiiMOLOw9T36wJg"></a>) icon.</span>
      </li>
    </td>
  </tr>
</table>
`;

const dom = new JSDOM(`<!DOCTYPE html><html><body>${userHTML}</body></html>`);
global.document = dom.window.document;
global.window = dom.window;
global.Node = dom.window.Node;

// Setup like the extension does
dom.window.__imageUrlArray = {};
dom.window.__TABLE_CELL_CONTENT_MAP__ = {};

const table = dom.window.document.querySelector("table");

// Manually simulate what sanitizeCell does - EXACT reproduction
function testCell(cellIndex) {
  const cell = table.rows[cellIndex].cells[0];
  console.log(`\n📋 Testing cell ${cellIndex}:`);
  console.log(
    "   Original HTML:",
    cell.innerHTML.substring(0, 150).replace(/\n\s+/g, " "),
  );

  const cellClone = cell.cloneNode(true);
  const extractedImages = [];

  // Process images
  const images = cellClone.querySelectorAll("img");
  images.forEach((img) => {
    const src = img.getAttribute("src") || img.src || "";
    const alt = img.getAttribute("alt") || "";
    const parentAnchor =
      img.parentElement?.tagName === "A" ? img.parentElement : null;

    console.log(`   Image found: alt="${alt}", hasAnchor=${!!parentAnchor}`);

    const isValidUrl =
      src && (src.startsWith("http://") || src.startsWith("https://"));

    if (isValidUrl) {
      extractedImages.push(`![${alt}](${src})`);

      if (alt) {
        if (parentAnchor) {
          console.log(
            "   → Should preserve anchor with hidden IMG + placeholder",
          );
          // Check if the fix is applied
          const preservedImg = img.cloneNode(true);
          preservedImg.setAttribute("data-stn-preserve", "1");
          const wrapper = dom.window.document.createElement("span");
          wrapper.appendChild(preservedImg);
          wrapper.appendChild(dom.window.document.createTextNode(`[${alt}]`));
          img.replaceWith(wrapper);
          console.log("   ✅ Anchor preserved, IMG hidden, placeholder added");
        } else {
          img.replaceWith(dom.window.document.createTextNode(`[${alt}]`));
        }
      }
    }
  });

  // Check final state
  const finalAnchor = cellClone.querySelector("a");
  const preservedImg = finalAnchor?.querySelector('img[data-stn-preserve="1"]');

  if (images.length > 0) {
    console.log(
      `   Final: Anchor exists=${!!finalAnchor}, PreservedIMG exists=${!!preservedImg}`,
    );
    if (preservedImg && finalAnchor && finalAnchor.contains(preservedImg)) {
      console.log("   ✅ PASS: Image preserved as child of anchor");
    } else if (images.length > 0) {
      console.log("   ❌ FAIL: Image NOT preserved as child of anchor");
    }
  }

  // Extract text (like sanitizeCell does)
  const text = cellClone.textContent || "";
  const normalized = text.replace(/\s+/g, " ").trim();
  console.log("   Text content:", JSON.stringify(normalized.substring(0, 100)));

  // Check for spacing around >
  if (normalized.includes(">")) {
    const hasSpaces = normalized.includes(" > ");
    console.log(
      `   Spacing around '>': ${hasSpaces ? "✅ PRESERVED" : "❌ LOST"}`,
    );
  }

  return {
    hasAnchor: !!finalAnchor,
    hasPreservedImg: !!preservedImg,
    text: normalized,
  };
}

// Test both cells
const cell0 = testCell(0);
const cell1 = testCell(1);

console.log("\n" + "=".repeat(60));
console.log("Summary:");
console.log(
  "  Cell 0 (abbr): " +
    (cell0.text.includes(" > ") ? "✅" : "❌") +
    " spacing preserved",
);
console.log(
  "  Cell 1 (image): " +
    (cell1.hasPreservedImg ? "✅" : "❌") +
    " image preserved",
);
console.log("=".repeat(60));

if (!cell0.text.includes(" > ") || !cell1.hasPreservedImg) {
  console.log("\n❌ TEST FAILED - Issues remain");
  process.exit(1);
} else {
  console.log("\n✅ TEST PASSED - Both issues fixed");
  process.exit(0);
}
