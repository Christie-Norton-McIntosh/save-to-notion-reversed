const path = require("path");
const mod = require(
  path.join(
    __dirname,
    "..",
    "Web-2-Notion",
    "popup",
    "shim",
    "table-to-list-patch.js",
  ),
);

console.log(
  "🧪 test-tabletoList-patch-guard — ensure startup guard + fallback",
);

try {
  // 1) Fallback path: JZ present, images present, no TABLE map
  const fake = {
    JZ: function (html) {
      return html;
    },
    __imageUrlArray: [{ src: "data:," }],
    location: { href: "https://example.com/" },
  };

  let warned = false;
  const origWarn = console.warn;
  console.warn = function () {
    warned = true;
  };

  const ok = mod.ensurePatchWithFallback(fake);
  console.warn = origWarn;

  if (!ok)
    throw new Error("ensurePatchWithFallback returned false for fallback case");
  if (!fake.JZ.__stn_patched_tableToList)
    throw new Error("JZ was not patched in fallback case");
  if (!warned)
    throw new Error(
      "Expected a diagnostic warning when images present but no TABLE map",
    );

  console.log("  ✓ fallback guard applied and logged");

  // 2) Preferred path: utilities present — should also patch
  const fake2 = {
    JZ: function (html) {
      return html;
    },
    STN_tableToListImageUtils: { resolveImageSrc: function () {} },
    location: { href: "https://example.com/" },
  };
  const ok2 = mod.ensurePatchWithFallback(fake2);
  if (!ok2)
    throw new Error(
      "ensurePatchWithFallback returned false for preferred path",
    );
  if (!fake2.JZ.__stn_patched_tableToList)
    throw new Error("JZ was not patched when utilities present");
  console.log("  ✓ preferred-path guard applied");

  console.log("\n✅ PASSED - startup guard + fallback behavior");
} catch (err) {
  console.error("❌ Failed:", err && err.message);
  process.exitCode = 1;
}
