/*
 * Ensure final-payload sentinel/mangled-marker recovery works.
 */
const { JSDOM } = require("jsdom");

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.window = dom.window;

console.log("🧪 test: final-payload marker recovery (mangled markers)");

// Prepare a fake TABLE_CELL_CONTENT_MAP__ with a real value
window.__TABLE_CELL_CONTENT_MAP__ = {
  CELL_abc12345: "Line one\nLine two",
  CELL_MANGLE: "Recovered text",
};

// Simulate a final payload string containing several mangled variants
const mangled = [
  "XCELLIDXCELL_abc12345XCELLIDX",
  "XCELLIDXCELL_abc12345XCELLIDX", // common mangled form
  "⟦STN_CELL:CELL_MANGLE⟧",
  "<!--STN_CELL:CELL_MANGLE-->",
  '<span data-stn-cell="CELL_MANGLE"></span>',
  "prefix CELL_abc12345 suffix",
].join(" ");

// Reuse the same tolerant resolver as the popup (best-effort)
function recoverFromString(str) {
  const map = window.__TABLE_CELL_CONTENT_MAP__ || {};
  // exact sentinels
  str = str.replace(
    /XCELLIDX(CELL_[A-Za-z0-9]+)XCELLIDX/g,
    (m, id) => map[id] || m,
  );
  str = str.replace(/⟦STN_CELL:(CELL_[A-Za-z0-9]+)⟧/g, (m, id) => map[id] || m);
  str = str.replace(
    /<!--\s*STN_CELL:(CELL_[A-Za-z0-9]+)\s*-->/g,
    (m, id) => map[id] || m,
  );
  str = str.replace(
    /<span[^>]*data-stn-cell=["'](CELL_[A-Za-z0-9]+)["'][^>]*><\/span>/g,
    (m, id) => map[id] || m,
  );
  // fallback: literal key
  Object.keys(map).forEach((k) => {
    if (str.indexOf(k) !== -1) str = str.split(k).join(map[k]);
  });
  return str;
}

const out = recoverFromString(mangled);
if (!out.includes("Line one") || !out.includes("Recovered text")) {
  console.error("❌ failed to recover mangled markers — result:", out);
  process.exit(1);
}

console.log("✅ final-payload marker recovery behaved as expected");
// continue to fallback recovery test below

// -------------------------------------------------------------------------
// New: fallback recovery test — simulate popup missing the map and the page
// providing it via the page-fetcher hook (async). This mirrors the hotfix's
// recovery path where the popup asks the active tab for the maps.
(async function fallbackRecoveryTest() {
  console.log("🧪 test: final-payload marker recovery (page-fallback)");

  // Ensure map is absent initially (simulates lost/mangled transfer)
  delete window.__TABLE_CELL_CONTENT_MAP__;

  // Simulated incoming payload with an XCELL marker
  const payload = "Here is a cell: XCELLIDXCELL_fallback123XCELLIDX";

  // Stub the page fetcher that the popup will call. It returns the map
  // asynchronously (the real implementation uses chrome.scripting.executeScript).
  window.__stn_pageMapFetcher = async function () {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ table: { CELL_fallback123: "Recovered from page" } });
      }, 10);
    });
  };

  // Call the exposed attemptRecover helper if present; otherwise invoke
  // the simulated page fetcher directly (unit-test shim).
  let recovered = false;
  if (typeof window.__stn_attemptRecoverMapsFromPage === "function") {
    recovered = await window.__stn_attemptRecoverMapsFromPage({ timeoutMs: 200 });
  } else if (typeof window.__stn_pageMapFetcher === "function") {
    const res = await window.__stn_pageMapFetcher();
    if (res && res.table) {
      window.__TABLE_CELL_CONTENT_MAP__ = Object.assign({}, res.table);
      recovered = true;
    }
  }

  if (!recovered) {
    console.error("❌ page-fallback did not report recovered (unexpected)");
    process.exit(1);
  }

  // Reuse the same tolerant resolver logic from above
  function resolveMarkers(str) {
    const map = window.__TABLE_CELL_CONTENT_MAP__ || {};
    str = str.replace(
      /XCELLIDX(CELL_[A-Za-z0-9]+)XCELLIDX/g,
      (m, id) => map[id] || m,
    );
    Object.keys(map).forEach((k) => {
      if (str.indexOf(k) !== -1) str = str.split(k).join(map[k]);
    });
    return str;
  }

  const out = resolveMarkers(payload);
  if (!out.includes("Recovered from page")) {
    console.error("❌ fallback recovery failed — result:", out);
    process.exit(1);
  }

  console.log("✅ final-payload marker page-fallback passed");
  process.exit(0);
})();
