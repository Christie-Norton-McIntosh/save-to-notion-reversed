const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

console.log(
  "🧪 test-scanWithRetry-integration — retry + pipeline produces table paragraphs",
);

const fixture = fs.readFileSync(
  path.join(__dirname, "fixtures", "servicenow-r_ITServiceManagement.html"),
  "utf8",
);

// Minimal DOM + helper install (reuse extracted helper like unit test)
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

// Extract the window.__stn_scanWithRetry helper from the built popup bundle
// using a regex to ensure we capture the complete `async function` block.
const re =
  /window\.__stn_scanWithRetry\s*=\s*async function\s*\([^)]*\)\s*\{[\s\S]*?\n\s*\}\s*;/m;
const m = mainJs.match(re);
if (!m) {
  console.error("❌ Could not find scanWithRetry in main.js");
  process.exit(1);
}
const helperCode = m[0] + "\n";

const dom = new JSDOM(`<!doctype html><html><body></body></html>`);
const win = dom.window;
// Instead of eval-ing the surrounding bundle, reconstruct the async
// function from the extracted snippet and install it onto the JSDOM window.
function installAsyncFn(targetWin, code, globalName) {
  const fnMatch = code.match(/async function\s*\(([^)]*)\)\s*\{/);
  if (!fnMatch) return false;
  const params = fnMatch[1].trim();
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

// Stubbed scan function: first call returns empty, second returns fixture
let calls = 0;
const scanFn = async () => {
  calls++;
  if (calls === 1) return { content: "" };
  return { content: fixture, textContent: fixture };
};

(async function run() {
  const res = await win.__stn_scanWithRetry(scanFn, {
    attempts: 2,
    delay: 5,
    minLength: 100,
  });
  if (!res || !(res.content || res.textContent)) {
    console.error("❌ scanWithRetry did not return fixture on retry", res);
    process.exit(1);
  }

  // Now run the same minimal pipeline used by popup: find table and ensure
  // paragraph-preservation works
  const jdom = new JSDOM(
    `<!doctype html><html><body>${res.content}</body></html>`,
  );
  const document = jdom.window.document;
  const table =
    document.querySelector(".body.refbody table") ||
    document.querySelector("table");
  if (!table) {
    console.error("❌ Fixture did not contain expected table after retry");
    process.exit(1);
  }

  // Simple sanitize+expand simulation (reuse existing test logic pattern)
  function sanitizeCell(cell) {
    const clone = cell.cloneNode(true);
    Array.from(clone.querySelectorAll("img")).forEach((img) => {
      const alt = img.getAttribute("alt") || "Image";
      img.replaceWith(document.createTextNode(" • " + alt + " • "));
    });
    Array.from(clone.childNodes).forEach((n) => {
      if (n.nodeType === jdom.window.Node.TEXT_NODE && n.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = n.textContent.trim();
        clone.replaceChild(p, n);
      }
    });
    const textWithNewlines = (clone.textContent || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .join("\n");
    return textWithNewlines.split("\n");
  }

  const firstRow = table.rows[0];
  const parts = sanitizeCell(firstRow.cells[1]);
  const joined = parts.join(" ");
  if (
    !joined.includes("Enhance the service experience") ||
    !joined.includes("Automate support for common requests")
  ) {
    console.error(
      "❌ After retry pipeline did not preserve paragraphs:",
      joined.slice(0, 200),
    );
    process.exit(1);
  }

  console.log("✅ PASSED");
  process.exit(0);
})();
