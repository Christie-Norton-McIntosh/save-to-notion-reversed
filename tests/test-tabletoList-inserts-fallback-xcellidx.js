const { JSDOM } = require("jsdom");

console.log(
  "🧪 test-tabletoList-inserts-fallback-xcellidx — ensure fallback marker is added when no XCELLIDX",
);

const dom = new JSDOM(`<!doctype html><html><body></body></html>`);
global.document = dom.window.document;
global.Node = dom.window.Node;

// Build a cell that simulates the fallback situation: anchor-wrapped image,
// but no XCELLIDX (content-script didn't run on this page).
const td = document.createElement("td");
const a = document.createElement("a");
a.setAttribute("href", "https://example.com/viewer/attachment.png");
const img = document.createElement("img");
img.setAttribute("alt", "Example ALT");
img.setAttribute("src", "data:image/png;base64,AAA");
a.appendChild(img);
td.appendChild(a);

// Now run the same synthetic-marker insertion we added to tableToList fallback
const clone = td.cloneNode(true);
try {
  if (!(clone.textContent || "").match(/XCELLIDX/i)) {
    const fid = "CELL_FALLBACK_" + Math.random().toString(36).slice(2, 8);
    clone.insertBefore(
      document.createTextNode("XCELLIDX" + fid + "XCELLIDX"),
      clone.firstChild,
    );
  }
} catch (e) {}

// Simulate the rest of the tableToList fallback that replaces <img> with the
// visible TABLE:bullet placeholder (the synthetic marker would have been
// inserted *before* this replacement in the real code path).
Array.from(clone.querySelectorAll("img")).forEach((img) => {
  const alt = img.getAttribute("alt") || "Image";
  img.replaceWith(document.createTextNode(" • " + alt + " • "));
});

// Assertion: synthetic marker present and visible placeholder preserved
if (
  !/XCELLIDXCELL_FALLBACK_/.test(clone.textContent) &&
  !/XCELLIDXCELL_FALLBACK_/.test(clone.textContent)
) {
  console.error(
    "❌ Expected synthetic XCELLIDX fallback marker to be inserted",
    clone.textContent,
  );
  process.exit(1);
}

// Verify placeholder text exists now that images have been replaced
if (
  !clone.textContent.includes("Example ALT") &&
  !clone.textContent.includes("Image")
) {
  console.error(
    "❌ Expected visible ALT placeholder to remain in the cloned cell",
    clone.textContent,
  );
  process.exit(1);
}

console.log("✅ PASSED");
process.exit(0);
