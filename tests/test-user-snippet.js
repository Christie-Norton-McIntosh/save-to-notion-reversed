const { JSDOM } = require("jsdom");

// Test the actual user-provided HTML snippets
function testUserSnippets() {
  console.log("🧪 Testing user-provided HTML snippets...\n");

  // Test 1: abbr with spaces around >
  const abbrHTML = `
    <span class="ph menucascade">
      <span class="ph uicontrol">Workspaces</span>
      <abbr title="and then"> &gt; </abbr>
      <span class="ph uicontrol">Service Operations Workspace</span>
    </span>
  `;

  const dom1 = new JSDOM(
    `<!DOCTYPE html><html><body>${abbrHTML}</body></html>`,
  );
  const doc1 = dom1.window.document;
  const span1 = doc1.querySelector(".ph.menucascade");

  console.log("📋 Test 1: abbr with spaces around >");
  console.log("   Input HTML:", abbrHTML.replace(/\n\s+/g, " ").trim());
  console.log("   textContent:", JSON.stringify(span1.textContent));
  console.log(
    '   Expected: "Workspaces > Service Operations Workspace" (with spaces around >)',
  );
  console.log("");

  // Test 2: inline image inside anchor
  const imageHTML = `
    <li class="li step stepexpand">
      <span class="ph cmd">Select the <span class="ph uicontrol">List</span> (<a href="https://www.servicenow.com/docs/viewer/attachment/MlbQAgTiiiMOLOw9T36wJg/FBue0LinyCrQ_vyRxtzuyA-MlbQAgTiiiMOLOw9T36wJg" data-ft-container-id="MlbQAgTiiiMOLOw9T36wJg" data-ft-resource-id="FBue0LinyCrQ_vyRxtzuyA-MlbQAgTiiiMOLOw9T36wJg"><img class="image icon ft-zoomable-image ft-responsive-image" id="start-conference-call-telephony__image_w1f_v11_f1c" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAlCAYAAADMdYB5AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIaADAAQAAAABAAAAJQAAAADjwCbAAAABpElEQVRYCe2WwW7CMAyG/9BOCZdyg0kD0ScAafAe056XvtNGkQocSGZn84RQgoLKxA6xVDmpktj5/cmtentvHB5sgwfH9+FzElKFrERWQhQQn5nISogC4jMTokQpg5C39vutUgA/Mg+tvfZO9sfWRJOwJ+B1pTGvn9A0HbafJ6xWBoulRuq3n4O3W4tm02G3sxhEih9NwjmH8aREXZcwGvggVcbPBaazEpxgSiIcdDSy0AaUREwHUjn2U0M5YDhU0Fqhba0vhTGKDo1cJxSDlDgenVeDz4tZVAmWcr936DrnZeT54cBzkuEG432xMsgx0SR4gWTPng8Tz+Okevwsk318ZsiiSXgw1xo1gbkhsDyYawJzQYCQXVH3N86Akt32BnNcYD4/A3NyO5hVXzANgWkuwKwITK5GqnkwCWwpbWhftBxc9wOBuf/XYIauFHjHCtwdzKV0zAQyWc0/AfNlWuKU2CoU9bX+YFKH5C553jGrisCkGyYI4QHuDyZ1SO6a3PE8qI/omByYHzEeF4XM7udv+BrdL+jlSTkJUSQrkZUQBcR/ARpYzMe2ccRXAAAAAElFTkSuQmCC" alt="List icon" data-ft-click-interceptor="ft-img-zoom" data-ft-container-id="MlbQAgTiiiMOLOw9T36wJg" data-ft-resource-id="FBue0LinyCrQ_vyRxtzuyA-MlbQAgTiiiMOLOw9T36wJg"></a>) icon.</span>
    </li>
  `;

  const dom2 = new JSDOM(
    `<!DOCTYPE html><html><body>${imageHTML}</body></html>`,
  );
  const doc2 = dom2.window.document;
  const anchor = doc2.querySelector("a");
  const img = anchor.querySelector("img");

  console.log("📋 Test 2: inline image inside anchor");
  console.log("   Anchor exists:", !!anchor);
  console.log("   Image exists:", !!img);
  console.log(
    "   Image is child of anchor:",
    anchor && img && anchor.contains(img),
  );
  console.log("   Image alt:", img?.alt);
  console.log("   Image src:", img?.src.substring(0, 50) + "...");
  console.log("");

  // Now simulate what sanitizeCell does
  console.log("📋 Simulating sanitizeCell processing...");

  // Setup globals like sanitizeCell expects
  dom2.window.__imageUrlArray = {};
  const extractedImages = [];

  // Find the image and process it
  const imageElement = doc2.querySelector("img");
  if (imageElement && imageElement.parentElement) {
    const parentAnchor = imageElement.closest("a");
    const alt = imageElement.getAttribute("alt") || "";
    const src = imageElement.getAttribute("src");

    console.log("   Found image with alt:", JSON.stringify(alt));
    console.log("   Parent is anchor:", !!parentAnchor);

    if (parentAnchor) {
      // Get the original src
      const originalSrc = imageElement.getAttribute("data-original-src") || src;

      // Add to extracted images
      extractedImages.push({
        src: originalSrc,
        alt: alt,
      });

      // Store in global array
      const imageKey = `img_${Date.now()}_${Math.random()}`;
      dom2.window.__imageUrlArray[imageKey] = originalSrc;

      // Create wrapper with preserved image and placeholder
      const wrapper = doc2.createElement("span");

      // Create preserved image (hidden)
      const preservedImg = doc2.createElement("img");
      preservedImg.setAttribute("data-stn-preserve", "1");
      preservedImg.setAttribute("data-original-src", originalSrc);
      preservedImg.setAttribute("data-image-key", imageKey);
      preservedImg.setAttribute("alt", alt);
      preservedImg.setAttribute("src", originalSrc);
      preservedImg.style.width = "0";
      preservedImg.style.height = "0";
      preservedImg.style.opacity = "0";
      preservedImg.style.position = "absolute";

      // Do NOT create a visible bracketed placeholder; preserve mapping via
      // the hidden IMG only.
      const placeholder = doc2.createTextNode("");

      // Add both to wrapper
      wrapper.appendChild(preservedImg);
      wrapper.appendChild(placeholder);

      // Replace the original image with wrapper
      imageElement.replaceWith(wrapper);

      console.log(
        "   ✅ Replaced image with wrapper containing preserved IMG + placeholder",
      );
      console.log(
        "   Preserved IMG has data-stn-preserve:",
        preservedImg.getAttribute("data-stn-preserve"),
      );
      console.log(
        "   Preserved IMG is child of anchor:",
        parentAnchor.contains(preservedImg),
      );
      console.log("   Anchor still exists:", !!doc2.querySelector("a"));
      console.log(
        "   Anchor contains preserved IMG:",
        !!doc2.querySelector('a img[data-stn-preserve="1"]'),
      );
    }
  }

  console.log("");
  console.log("📋 Final DOM state:");
  const finalAnchor = doc2.querySelector("a");
  const preservedImg = finalAnchor?.querySelector('img[data-stn-preserve="1"]');
  console.log("   Anchor exists:", !!finalAnchor);
  console.log("   Preserved IMG exists:", !!preservedImg);
  console.log(
    "   Preserved IMG is child of anchor:",
    !!(finalAnchor && preservedImg && finalAnchor.contains(preservedImg)),
  );
  console.log("   Anchor innerHTML:", finalAnchor?.innerHTML.substring(0, 200));
}

testUserSnippets();
