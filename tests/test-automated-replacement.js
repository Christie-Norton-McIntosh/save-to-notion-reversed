#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const uiAugmentPath = path.join(
  __dirname,
  "..",
  "Web-2-Notion",
  "popup",
  "shim",
  "ui-augment.js",
);
const bundlePath = path.join(
  __dirname,
  "..",
  "Web-2-Notion",
  "popup",
  "static",
  "js",
  "main.js",
);

function fail(msg) {
  console.error("❌", msg);
  process.exitCode = 1;
}

function pass(msg) {
  console.log("✓", msg);
}

const src = fs.readFileSync(uiAugmentPath, "utf8");
const bundle = fs.readFileSync(bundlePath, "utf8");

// Source-level checks
if (!/runAutomatedReplacementTest\s*=\s*async function/.test(src)) {
  fail("ui-augment.js does not define runAutomatedReplacementTest");
} else pass("ui-augment.js defines runAutomatedReplacementTest");

if (!/runDataUrlReplacementUnitTest/.test(src)) {
  fail(
    "ui-augment.js should attempt to call runDataUrlReplacementUnitTest (best-effort)",
  );
} else pass("ui-augment.js calls runDataUrlReplacementUnitTest (best-effort)");

if (!/replaceDataUrlPlaceholders/.test(src)) {
  fail(
    "ui-augment.js should send replaceDataUrlPlaceholders to service worker",
  );
} else pass("ui-augment.js sends replaceDataUrlPlaceholders to service worker");

// Bundle-level sanity — the popup bundle should also include the helper
if (!/runAutomatedReplacementTest/.test(bundle)) {
  fail(
    "popup bundle (main.js) missing runAutomatedReplacementTest — rebuild may be required",
  );
} else pass("popup bundle contains runAutomatedReplacementTest");

console.log("\nAll automated-replacement checks completed.");

if (process.exitCode) process.exit(process.exitCode);
