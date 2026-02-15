const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log(
  "🧪 test-custom-selectors-domain-match — findSelectorsForHostname helper",
);

const clipPath = path.join(__dirname, "..", "Web-2-Notion", "clipContent.js");
const src = fs.readFileSync(clipPath, "utf8");

// Extract the top-level helper function definition for findSelectorsForHostname
const fnName = "findSelectorsForHostname";
const startIdx = src.indexOf(`function ${fnName}(`);
if (startIdx === -1) {
  console.error(`❌ could not find ${fnName} in clipContent.js`);
  process.exit(1);
}
// find matching closing brace for the function body
let braceIdx = src.indexOf("{", startIdx);
if (braceIdx === -1) {
  console.error("❌ malformed function — no opening brace");
  process.exit(1);
}
let depth = 1;
let i = braceIdx + 1;
for (; i < src.length; i++) {
  const ch = src[i];
  if (ch === "{") depth++;
  else if (ch === "}") {
    depth--;
    if (depth === 0) break;
  }
}
if (depth !== 0) {
  console.error("❌ could not find matching closing brace for function");
  process.exit(1);
}
const fnCode = src.slice(startIdx, i + 1) + "\n";

const dom = new JSDOM("<!doctype html><html><body></body></html>");
const win = dom.window;

// Install the function into the JSDOM window
(function installFn(targetWin, code, name) {
  const fnMatch = code.match(/function\s+([^(]+)\s*\(([^)]*)\)\s*\{/);
  if (!fnMatch) throw new Error("invalid function code");
  const fnName = fnMatch[1];
  const params = fnMatch[2].trim();
  const bodyStart = code.indexOf("{", fnMatch.index) + 1;
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
  const body = code.slice(bodyStart, i);
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const fn = new Function(params, body);
  targetWin[fnName] = fn.bind(targetWin);
})(win, fnCode, "findSelectorsForHostname");

// Tests
(function run() {
  // 1) simple apex fallback: example.com stored, hostname = sub.example.com
  const selectors1 = {
    "example.com": [{ selector: ".content" }],
  };
  const res1 = win.findSelectorsForHostname(selectors1, "sub.example.com");
  assert(Array.isArray(res1), "result should be array");
  assert.strictEqual(res1.length, 1);
  assert.strictEqual(res1[0].selector, ".content");

  // 2) more-specific wins: subdomain entry should win over apex
  const selectors2 = {
    "example.com": [{ selector: ".content" }],
    "sub.example.com": [{ selector: ".special" }],
  };
  const res2 = win.findSelectorsForHostname(selectors2, "sub.example.com");
  assert.strictEqual(res2.length, 1);
  assert.strictEqual(res2[0].selector, ".special");

  // 3) multi-part TLD (example.co.uk) fallback
  const selectors3 = {
    "example.co.uk": [{ selector: ".uk" }],
  };
  const res3 = win.findSelectorsForHostname(selectors3, "www.example.co.uk");
  assert.strictEqual(res3.length, 1);
  assert.strictEqual(res3[0].selector, ".uk");

  // 4) no match -> empty array
  const selectors4 = { "foo.com": [{ selector: ".x" }] };
  const res4 = win.findSelectorsForHostname(selectors4, "bar.example.com");
  assert.deepStrictEqual(res4, []);

  console.log("✅ PASSED");
  process.exit(0);
})();
