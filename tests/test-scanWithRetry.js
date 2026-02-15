const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

console.log(
  "🧪 test-scanWithRetry — retry wrapper extracted from popup bundle",
);

const mainJs = fs.readFileSync(
  path.join(
    __dirname,
    "..",
    "Web-2-Notion",
    "popup",
    "static",
    "js",
    "main.js",
  ),
  "utf8",
);

// Extract the window.__stn_scanWithRetry helper from the bundle using a
// regex that captures the full `async function (...) { ... };` assignment.
const re =
  /window\.__stn_scanWithRetry\s*=\s*async function\s*\([^)]*\)\s*\{[\s\S]*?\n\s*\}\s*;/m;
const m = mainJs.match(re);
if (!m) {
  console.error("❌ Could not find scanWithRetry implementation in main.js");
  process.exit(1);
}
const helperCode = m[0] + "\n";

const dom = new JSDOM(`<!doctype html><html><body></body></html>`);
const win = dom.window;

// Inject a no-op qr so the extracted code can be evaluated safely
win.qr = async function () {
  return { content: "" };
};

// Instead of eval-ing the surrounding bundle (which can include outer
// conditionals), extract the async function's parameter list and body and
// reconstruct it in the JSDOM window. This is more robust for minified
// bundles.
function installAsyncFn(targetWin, code, globalName) {
  const fnMatch = code.match(/async function\s*\(([^)]*)\)\s*\{/);
  if (!fnMatch) return false;
  const params = fnMatch[1].trim();
  const bodyStart = code.indexOf("{", fnMatch.index) + 1;
  // find matching closing brace for the function body
  let depth = 1;
  let i = bodyStart;
  for (; i < code.length; i++) {
    const ch = code[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) break;
    }
  }
  if (depth !== 0) return false;
  const body = code.slice(bodyStart, i);
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const fn = params
    ? new AsyncFunction(...params.split(/\s*,\s*/).filter(Boolean), body)
    : new AsyncFunction(body);
  targetWin[globalName] = fn.bind(targetWin);
  return true;
}

win.qr = async function () {
  return { content: "" };
};

if (!installAsyncFn(win, helperCode, "__stn_scanWithRetry")) {
  console.error("❌ could not extract scanWithRetry from bundle");
  process.exit(1);
}

(async function runTests() {
  // Test: retries when first result is short
  let calls = 0;
  const short = { content: "x" };
  const good = { content: "<div>" + "a".repeat(200) + "</div>" };
  const scanFn = async () => {
    calls++;
    return calls === 1 ? short : good;
  };

  const res = await win.__stn_scanWithRetry(scanFn, {
    attempts: 2,
    delay: 10,
    minLength: 100,
  });
  if (!res || res.content.indexOf("a".repeat(50)) === -1) {
    console.error(
      "❌ Expected scanWithRetry to return the good result after retry",
      res,
    );
    process.exit(1);
  }
  if (calls !== 2) {
    console.error("❌ Expected scanFn to be called twice, was called", calls);
    process.exit(1);
  }

  // Test: gives up after attempts
  calls = 0;
  const alwaysShort = async () => {
    calls++;
    return { content: "tiny" };
  };
  const res2 = await win.__stn_scanWithRetry(alwaysShort, {
    attempts: 3,
    delay: 5,
    minLength: 100,
  });
  if (!res2 || res2.content !== "tiny") {
    console.error(
      "❌ Expected final short result to be returned when all attempts fail",
      res2,
    );
    process.exit(1);
  }
  if (calls !== 3) {
    console.error("❌ Expected 3 attempts, got", calls);
    process.exit(1);
  }

  console.log("✅ PASSED");
  process.exit(0);
})();
