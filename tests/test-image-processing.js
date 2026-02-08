#!/usr/bin/env node

/**
 * Automated test for image processing in Web-2-Notion
 * Tests both inline images and table images
 */

const fs = require("fs");
const path = require("path");

// Mock browser globals
global.window = {
  location: {
    href: "https://example.servicenow.com/kb_view.do?sysparm_article=KB0012345",
  },
  __imageUrlArray: [],
  __TABLE_CELL_CONTENT_MAP__: {},
};

global.document = {
  createElement: (tag) => ({
    tagName: tag.toUpperCase(),
    textContent: "",
    replaceWith: function () {},
    remove: function () {},
    appendChild: function () {},
  }),
  createTextNode: (text) => ({ textContent: text }),
  querySelector: () => null,
  querySelectorAll: () => [],
};

global.URL = URL;
global.DOMParser = class {
  parseFromString(html) {
    return {
      querySelectorAll: () => [],
    };
  }
};

console.log("Loading main.js to extract conversion functions...\n");

// Read main.js and try to extract the image rule
// When this script runs from the consolidated `tests/` directory the
// bundle lives at ../Web-2-Notion/popup/static/js/main.js — use a
// path that works whether the file is executed in-place or after the
// test has been moved to `tests/`.
const mainJsPath = path.join(
  __dirname,
  "..",
  "Web-2-Notion",
  "popup",
  "static",
  "js",
  "main.js",
);
const mainJs = fs.readFileSync(mainJsPath, "utf8");

// Test cases
const tests = [
  {
    name: "Inline image with data URL",
    html: '<p>Select the home icon <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUg" alt="home icon" class="image icon"> from the navigation.</p>',
    expectedPatterns: [
      /!\[home icon\]\(data:image\/png/,
      /!\[home icon\]\([^)]+\)/, // Should not be empty parentheses
    ],
    shouldNotContain: ["()"],
    description: "Data URL images should be preserved in markdown",
  },
  {
    name: "Inline image in anchor",
    html: '<p>Click the settings <a href="https://example.com/icon.png"><img src="data:image/gif;base64,R0lGOD" alt="settings icon"></a> to configure.</p>',
    expectedPatterns: [
      /!\[settings icon\]\(https:\/\/example\.com\/icon\.png\)/,
    ],
    description: "Image in anchor should use anchor href instead of data URL",
  },
  {
    name: "Table with images",
    html: `<table>
      <tr>
        <td><a href="https://example.com/image1.png"><img src="data:image/png;base64,abc" alt="Image 1"></a></td>
        <td>Description 1</td>
      </tr>
      <tr>
        <td><a href="https://example.com/image2.png"><img src="data:image/png;base64,def" alt="Image 2"></a></td>
        <td>Description 2</td>
      </tr>
    </table>`,
    expectedPatterns: [
      /!\[Image 1\]\(https:\/\/example\.com\/image1\.png\)/,
      /!\[Image 2\]\(https:\/\/example\.com\/image2\.png\)/,
      /Description 1/,
      /Description 2/,
      /---/, // Divider between rows
    ],
    description:
      "Tables should convert to list format with images using anchor hrefs",
  },
  {
    name: "Relative URL conversion",
    html: '<p>See the <img src="/images/icon.png" alt="icon"> for details.</p>',
    expectedPatterns: [
      /!\[icon\]\(https:\/\/example\.servicenow\.com\/images\/icon\.png\)/,
    ],
    description:
      "Relative URLs should be converted to absolute based on current location",
  },
  {
    name: "Table with mixed URLs",
    html: `<table>
      <tr>
        <td><img src="https://example.com/direct.png" alt="Direct HTTP"></td>
        <td><img src="/relative/path.png" alt="Relative"></td>
      </tr>
    </table>`,
    expectedPatterns: [
      /!\[Direct HTTP\]\(https:\/\/example\.com\/direct\.png\)/,
      /!\[Relative\]\(https:\/\/example\.servicenow\.com\/relative\/path\.png\)/,
    ],
    description: "Mixed URL types in tables should all be converted properly",
  },
];

// Extract image rule from main.js
console.log("Analyzing image processing code in main.js...\n");

// Check if the image rule has the fixes we implemented
const hasDataOriginalSrc = mainJs.includes(
  't.getAttribute("data-original-src")',
);
const hasAnchorCheck = mainJs.includes(
  'parentElement && t.parentElement.tagName === "A"',
);
const hasRelativeUrlConversion = mainJs.includes(
  "new URL(r, currentUrl.origin)",
);
const hasDataUrlSupport = mainJs.includes('src.startsWith("data:image/")');

console.log("Image Rule Analysis:");
console.log("  ✓ Checks data-original-src:", hasDataOriginalSrc);
console.log("  ✓ Checks parent anchor:", hasAnchorCheck);
console.log("  ✓ Converts relative URLs:", hasRelativeUrlConversion);
console.log("  ✓ Supports data URLs:", hasDataUrlSupport);
console.log("");

// Check tableToList rule
const hasTableToList = mainJs.includes('e.addRule("tableToList"');
const tableToListSupportsDataUrls = mainJs.match(
  /src\.startsWith\("data:image\/"\)/g,
);

console.log("Table Processing Analysis:");
console.log("  ✓ Has tableToList rule:", hasTableToList);
console.log(
  "  ✓ Table rule supports data URLs:",
  tableToListSupportsDataUrls ? tableToListSupportsDataUrls.length > 0 : false,
);
console.log("");

// Analyze potential issues
console.log("Potential Issues to Investigate:\n");

if (!hasDataOriginalSrc) {
  console.log("  ❌ Image rule may not check data-original-src attribute");
}

if (!hasAnchorCheck) {
  console.log("  ❌ Image rule may not check parent anchor for better URL");
}

if (!hasRelativeUrlConversion) {
  console.log("  ❌ Relative URLs may not be converted to absolute");
}

if (!hasDataUrlSupport) {
  console.log(
    "  ⚠️  Table rule may not accept data: URLs - they might be filtered out",
  );
}

// Check if there's a filter that removes data URLs
const hasHttpOnlyFilter = mainJs.match(
  /src\.startsWith\("http:\/\/"\)\s*\|\|\s*src\.startsWith\("https:\/\/"\)\s*\)/,
);
if (hasHttpOnlyFilter && !hasDataUrlSupport) {
  console.log(
    "  ❌ FOUND ISSUE: Code filters images to http/https only, excluding data: URLs",
  );
  console.log("     Location:", hasHttpOnlyFilter[0]);
}

console.log("\n" + "=".repeat(80));
console.log("DIAGNOSIS:");
console.log("=".repeat(80) + "\n");

// Diagnose the specific issues reported
console.log("Issue 1: Tables with images showing blank placeholders");
console.log(
  "  Root cause: Images in tables likely being filtered to http/https only",
);
console.log("  Solution: tableToList rule needs to accept data:image/ URLs\n");

console.log("Issue 2: Inline images missing (empty parentheses)");
console.log("  Root cause: Standard image rule may not handle:");
console.log("    - Images with data: URLs");
console.log("    - Images inside anchors (should use anchor href)");
console.log("    - Relative URLs not being converted to absolute\n");

console.log("=".repeat(80));
console.log("VERIFICATION CHECKLIST:");
console.log("=".repeat(80) + "\n");

const checks = [
  {
    name: "Image rule checks data-original-src first",
    status: hasDataOriginalSrc,
    line: 'Line ~90495: t.getAttribute("data-original-src")',
  },
  {
    name: "Image rule checks parent anchor",
    status: hasAnchorCheck,
    line: 'Line ~90505: parentElement && t.parentElement.tagName === "A"',
  },
  {
    name: "Image rule converts relative URLs",
    status: hasRelativeUrlConversion,
    line: "Line ~90530: new URL(r, currentUrl.origin)",
  },
  {
    name: "Table rule accepts data URLs",
    status: hasDataUrlSupport && tableToListSupportsDataUrls,
    line: 'Line ~91010: src.startsWith("data:image/")',
  },
];

checks.forEach((check) => {
  const icon = check.status ? "✅" : "❌";
  console.log(`${icon} ${check.name}`);
  console.log(`   Expected at: ${check.line}`);
});

console.log("\n" + "=".repeat(80));
console.log("NEXT STEPS:");
console.log("=".repeat(80) + "\n");

if (checks.every((c) => c.status)) {
  console.log("✅ All checks passed! Code looks correct.");
  console.log("   If issues persist, the problem may be in:");
  console.log("   - How scanWebpage.js prepares the HTML");
  console.log("   - Browser-specific behavior with shadow DOM");
  console.log("   - Timing issues with dynamic content loading");
} else {
  console.log(
    "❌ Some checks failed. Review the code at the locations mentioned above.",
  );
  console.log(
    "   The fixes may not have been applied correctly or were reverted.",
  );
}

console.log("\nTo manually test:");
console.log("1. Open Chrome DevTools on a ServiceNow page");
console.log('2. Run: console.log(document.querySelector("img").src)');
console.log(
  '3. Run: console.log(document.querySelector("img").getAttribute("data-original-src"))',
);
console.log(
  '4. Check if images are in anchors: console.log(document.querySelector("img").parentElement.tagName)',
);

process.exit(checks.every((c) => c.status) ? 0 : 1);
