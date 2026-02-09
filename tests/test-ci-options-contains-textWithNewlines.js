const fs = require("fs");
const path = require("path");

console.log("🧪 test-ci-options-contains-textWithNewlines — CI assertion");

const optionsPath = path.join(__dirname, "..", "Web-2-Notion", "options.js");
const src = fs.readFileSync(optionsPath, "utf8");

if (!/textWithNewlines/.test(src)) {
  console.error(
    "❌ options.js does not contain paragraph-preserving payload (textWithNewlines)",
  );
  process.exit(1);
}

if (!/__TABLE_CELL_CONTENT_MAP__\[\w+\]/.test(src)) {
  console.error(
    "❌ options.js does not appear to write to __TABLE_CELL_CONTENT_MAP__",
  );
  process.exit(1);
}

// Ensure the structured payload shape is present (paragraphs + meta)
if (!/paragraphs\s*:\s*/.test(src) || !/meta\s*:\s*/.test(src)) {
  console.error(
    "❌ options.js does not appear to emit structured paragraph payloads (paragraphs/meta)",
  );
  process.exit(1);
}

console.log("✅ PASSED");
process.exit(0);
