/**
 * Extension Code Verification Script
 *
 * This script checks if the critical fixes are present in main.js
 * Run this to verify the extension code has been properly updated.
 */

const fs = require("fs");
const path = require("path");

const MAIN_JS_PATH = path.join(
  __dirname,
  "../Web-2-Notion/popup/static/js/main.js",
);

console.log("🔍 Verifying Extension Code...\n");

// Read main.js
let mainJsContent;
try {
  mainJsContent = fs.readFileSync(MAIN_JS_PATH, "utf8");
  console.log("✅ Found main.js at:", MAIN_JS_PATH);
  console.log(
    "   File size:",
    (mainJsContent.length / 1024).toFixed(2),
    "KB\n",
  );
} catch (err) {
  console.error("❌ Error reading main.js:", err.message);
  process.exit(1);
}

// Check for critical code patterns
const checks = [
  {
    name: "tableCellMap Transfer Fix (sB function)",
    pattern: /\[sB\/Fix\] Assigned tableCellMap/,
    description: "Assigns tableCellMap to window.__TABLE_CELL_CONTENT_MAP__",
  },
  {
    name: "tableCellMap Forward (N1→aB)",
    pattern:
      /tableCellMap: n\.tableCellMap.*CRITICAL: Pass tableCellMap through/,
    description: "Forwards tableCellMap from N1 to aB",
  },
  {
    name: "tableCellMap Forward (Z1 call)",
    pattern:
      /tableCellMap: i\.payload\.tableCellMap.*CRITICAL: Pass tableCellMap/,
    description: "Passes tableCellMap in Z1 call",
  },
  {
    name: "XCELLIDX Markdown Expansion",
    pattern: /\[JZ\/Turndown\/XCELLIDX\] Expanding marker/,
    description: "Expands XCELLIDX markers in markdown",
  },
  {
    name: "XCELLIDX Image Handling",
    pattern: /\[JZ\/Turndown\/XCELLIDX\] Added image markdown for:/,
    description: "Processes images from XCELLIDX payloads",
  },
];

let allPassed = true;
let passCount = 0;

console.log("Running checks:\n");

checks.forEach((check, index) => {
  const found = check.pattern.test(mainJsContent);

  if (found) {
    console.log(`✅ Check ${index + 1}: ${check.name}`);
    console.log(`   → ${check.description}`);
    passCount++;
  } else {
    console.log(`❌ Check ${index + 1}: ${check.name}`);
    console.log(`   → ${check.description}`);
    console.log(`   ⚠️  NOT FOUND IN CODE`);
    allPassed = false;
  }
  console.log("");
});

// Summary
console.log("═".repeat(70));
console.log(`\n📊 Results: ${passCount}/${checks.length} checks passed\n`);

if (allPassed) {
  console.log("✅ SUCCESS: All critical fixes are present in main.js");
  console.log("\n📋 Next Steps:");
  console.log("   1. Go to chrome://extensions in your browser");
  console.log('   2. Find "Web-2-Notion" extension');
  console.log("   3. Click the reload button (↻)");
  console.log("   4. Test the ServiceNow page again");
  console.log("   5. Look for [sB/Fix] logs in the console\n");
} else {
  console.log("❌ FAILURE: Some fixes are missing from main.js");
  console.log(
    "\n⚠️  This suggests the files may not have been saved properly.",
  );
  console.log("   Please verify:");
  console.log("   - Files were saved after editing");
  console.log("   - No merge conflicts or file corruption");
  console.log("   - You're checking the correct main.js file\n");
}

// Additional diagnostics
console.log("═".repeat(70));
console.log("\n🔬 Diagnostics:\n");

// Check for the specific line numbers mentioned in docs
const lineChecks = [
  { line: "~99475", pattern: /\[sB\/Fix\] Assigned tableCellMap with/ },
  { line: "~91770", pattern: /\[JZ\/Turndown\/XCELLIDX\] After expansion/ },
  { line: "~136703", pattern: /tableCellMap: n\.tableCellMap/ },
];

lineChecks.forEach((check) => {
  const found = check.pattern.test(mainJsContent);
  console.log(
    `   ${found ? "✓" : "✗"} Expected code near line ${check.line}: ${found ? "Found" : "Missing"}`,
  );
});

console.log("\n═".repeat(70));

// Exit with appropriate code
process.exit(allPassed ? 0 : 1);
