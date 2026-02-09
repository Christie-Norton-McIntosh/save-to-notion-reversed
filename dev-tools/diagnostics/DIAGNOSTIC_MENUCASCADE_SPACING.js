// Diagnostic: Check if menucascade > spacing is preserved in actual table processing
// Run this in the browser console on a ServiceNow page with menucascade elements

console.log("🔍 Menucascade Spacing Diagnostic (Enhanced)");
console.log("============================================\n");

// Try multiple selectors to find menucascade elements
const selectors = [
  ".ph.menucascade",
  "[class*='menucascade']",
  "span.menucascade",
  ".menucascade",
];

let menucascades = [];
for (const selector of selectors) {
  const found = document.querySelectorAll(selector);
  if (found.length > 0) {
    menucascades = Array.from(found);
    console.log(
      `Found ${found.length} elements using selector: "${selector}"\n`,
    );
    break;
  }
}

if (menucascades.length === 0) {
  console.log("No menucascade elements found with any selector.\n");
  console.log("📋 Searching for ANY abbr elements with > ...");
}

if (menucascades.length > 0) {
  const firstMC = menucascades[0];
  console.log("📋 First menucascade element:");
  console.log(
    "   HTML:",
    firstMC.innerHTML.replace(/\s+/g, " ").trim().substring(0, 200),
  );
  console.log("   textContent:", JSON.stringify(firstMC.textContent));
  console.log("   Display:", firstMC.textContent.replace(/\s+/g, " ").trim());
  console.log("");

  // Check if it's in a table
  let parent = firstMC;
  let inTable = false;
  while (parent) {
    if (parent.tagName === "TABLE") {
      inTable = true;
      break;
    }
    parent = parent.parentElement;
  }
  console.log("   Is in table?", inTable);

  if (inTable) {
    // Find the cell
    let cell = firstMC;
    while (cell && cell.tagName !== "TD" && cell.tagName !== "TH") {
      cell = cell.parentElement;
    }

    if (cell) {
      console.log("\n📋 Parent cell:");
      console.log("   tagName:", cell.tagName);
      console.log(
        "   innerHTML:",
        cell.innerHTML.replace(/\s+/g, " ").trim().substring(0, 300),
      );
      console.log("   textContent:", JSON.stringify(cell.textContent));
      console.log("   Display:", cell.textContent.replace(/\s+/g, " ").trim());

      // Simulate what the sanitizeCell function does
      console.log("\n🔧 Simulating sanitizeCell processing:");
      const clone = cell.cloneNode(true);
      const text = clone.textContent || "";
      console.log("   Step 1 - clone.textContent:", JSON.stringify(text));

      const normalized = text.replace(/\s+/g, " ").trim();
      console.log("   Step 2 - normalized:", JSON.stringify(normalized));

      if (normalized.includes(" > ")) {
        console.log("   ✅ Spaces preserved!");
      } else if (normalized.includes(">")) {
        console.log("   ❌ Spaces REMOVED!");
        console.log(
          "   Has 'Workspaces>'?",
          normalized.includes("Workspaces>"),
        );
        console.log("   Has '>Service'?", normalized.includes(">Service"));
      }
    }
  }
}

// Check if there are abbr elements with > in them
console.log("\n📋 Searching for ALL abbr elements:");
const allAbbrs = document.querySelectorAll("abbr");
console.log(`Found ${allAbbrs.length} total abbr elements`);

const abbrs = Array.from(allAbbrs).filter(
  (a) => a.textContent.includes(">") || a.innerHTML.includes("&gt;"),
);
console.log(`Found ${abbrs.length} abbr elements containing ">" or "&gt;"\n`);

abbrs.slice(0, 5).forEach((abbr, i) => {
  console.log(`   [${i}]:`);
  console.log("      innerHTML:", abbr.innerHTML);
  console.log("      textContent:", JSON.stringify(abbr.textContent));
  console.log("      Spaces around >?", abbr.textContent.includes(" > "));

  // Check parent context
  const parent = abbr.parentElement;
  if (parent) {
    console.log("      Parent:", parent.className || parent.tagName);
    console.log(
      "      Parent text:",
      parent.textContent.replace(/\s+/g, " ").trim().substring(0, 100),
    );
  }
  console.log("");
});

// Also search in any element with class containing 'result' or 'scan'
console.log("\n📋 Checking scanned/result content:");
const scanContainers = document.querySelectorAll(
  '[class*="scan"], [class*="result"], [class*="combined"]',
);
console.log(`Found ${scanContainers.length} scan/result containers`);
if (scanContainers.length > 0) {
  scanContainers.forEach((container, i) => {
    const abbrsInside = container.querySelectorAll("abbr");
    if (abbrsInside.length > 0) {
      console.log(`\n   Container [${i}]: ${container.className}`);
      console.log(`   Contains ${abbrsInside.length} abbr elements`);
      abbrsInside.forEach((abbr, j) => {
        if (abbr.innerHTML.includes("&gt;") || abbr.textContent.includes(">")) {
          console.log(
            `      abbr[${j}]: innerHTML="${abbr.innerHTML}" textContent="${abbr.textContent}"`,
          );
        }
      });
    }
  });
}

console.log("\n✅ Diagnostic complete");
