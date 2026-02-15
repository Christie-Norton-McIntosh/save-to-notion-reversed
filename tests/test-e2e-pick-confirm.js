const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log(
  "🧪 test-e2e-pick-confirm — saved selector -> pick -> confirm -> popup receives clipContentAdded",
);

const clipPath = path.join(__dirname, "..", "Web-2-Notion", "clipContent.js");
const src = fs.readFileSync(clipPath, "utf8");

// Extract helper region (normalizeDomain ... continueWithContentSelection)
const startMarker = "function normalizeDomain(";
const endMarker = "function continueWithContentSelection(";
const startIdx = src.indexOf(startMarker);
const midIdx = src.indexOf(endMarker);
if (startIdx === -1 || midIdx === -1) {
  console.error("❌ required helper region not found in clipContent.js");
  process.exit(1);
}
// find end of continueWithContentSelection body
let braceIdx = src.indexOf("{", midIdx);
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
  console.error("❌ could not extract helper region end");
  process.exit(1);
}
const regionCode = src.slice(startIdx, i + 1);

const dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
  runScripts: "dangerously",
  resources: "usable",
  url: "https://example.com/",
});
const win = dom.window;
win.console = console;

// Inject extracted helpers and expose them on window.__stn_helpers
win.eval(
  `window.__stn_helpers = (function(){ ${regionCode}; return { normalizeDomain, findSelectorsForHostname, getCustomSelectorsForCurrentDomain, buildContentFromSelectors, extractContentData, continueWithContentSelection }; })();`,
);

// Stub chrome.storage and chrome.runtime in the JSDOM window
let capturedMessage = null;
win.chrome = {
  storage: {
    local: {
      get: function (keys, cb) {
        // Return a saved selector for example.com
        const selectors = {
          "example.com": [
            {
              selector: "div > ft-floating-menu > ft-tooltip > ft-chip > span",
            },
          ],
        };
        cb({ customSiteSelectors: selectors });
      },
    },
  },
  runtime: {
    sendMessage: function (msg, cb) {
      capturedMessage = msg;
      if (typeof cb === "function") cb({ ok: true });
    },
  },
};

// Build a DOM that contains the element matched by the saved selector
win.document.body.innerHTML = `
  <div id="root">
    <div>
      <ft-floating-menu>
        <ft-tooltip>
          <ft-chip>
            <span>zurich</span>
          </ft-chip>
        </ft-tooltip>
      </ft-floating-menu>
    </div>
  </div>
`;

(async () => {
  // Simulate "saved selector" lookup
  const selectorEntries =
    await win.__stn_helpers.getCustomSelectorsForCurrentDomain();
  assert(
    Array.isArray(selectorEntries) && selectorEntries.length > 0,
    "selectorEntries should be present",
  );

  // Simulate "pick" by using the root element as the selected node
  const root = win.document.querySelector("#root");

  // Build content from selectors (picker's extraction logic)
  const contentData = win.__stn_helpers.buildContentFromSelectors(
    root,
    selectorEntries,
  );
  assert(contentData, "contentData should be returned");
  assert(
    contentData.textContent.indexOf("zurich") !== -1,
    "extracted text must contain 'zurich'",
  );

  // Simulate "confirm" -> manager would create payload and send popup message
  const payload = win.__stn_helpers.continueWithContentSelection(
    contentData,
    false,
  );

  // Simulate manager sending the popup message
  win.chrome.runtime.sendMessage(
    { popup: { name: "clipContentAdded", args: payload } },
    function (resp) {
      /* no-op callback */
    },
  );

  // Assert popup received the message and payload contains expected content
  assert(capturedMessage && capturedMessage.popup, "popup message was sent");
  assert(
    capturedMessage.popup.name === "clipContentAdded",
    "popup message name must be clipContentAdded",
  );
  assert(
    capturedMessage.popup.args.textContent.indexOf("zurich") !== -1,
    "popup payload must contain extracted text",
  );

  console.log("✅ PASSED");
  process.exit(0);
})();
