/* Playwright prototype: automate extension "Save Page" → click page "next" button loop
   - Simulates the user's workflow: open page, open extension popup, click Save Page,
     wait for extension to finish sending (detected via background console log),
     then click the page's next button (selector: ft-button[forcetooltip][trailingicon]).
   - This is a hybrid prototype that uses the popup's localStorage to provide the
     scraped payload (robust for CI) but exercises the real popup + background
     save flow and the page navigation step.
*/

const path = require("path");
const fs = require("fs");
const os = require("os");
const { chromium } = require("playwright");

async function makeMultiStepDataUrl(steps) {
  // Create a small single-page app that exposes a `pageIndex` and a next button
  // with the exact selector used in production: ft-button[forcetooltip][trailingicon]
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>STN E2E Pager</title></head><body>
    <div id="app">
      <div id="content"></div>
      <ft-button forcetooltip trailingicon id="nextBtn">Next</ft-button>
    </div>
    <script>
      const steps = ${JSON.stringify(steps)};
      let idx = 0;
      function render() {
        document.getElementById('content').innerHTML = steps[idx];
        document.body.setAttribute('data-page-index', String(idx));
      }
      document.getElementById('nextBtn').addEventListener('click', function () {
        idx = Math.min(idx + 1, steps.length - 1);
        render();
      });
      render();
    </script>
  </body></html>`;
  return "data:text/html;base64," + Buffer.from(html).toString("base64");
}

(async () => {
  const extensionPath = path.resolve(__dirname, "..", "..");
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "stn-e2e-"));

  const browserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      "--no-sandbox",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  });

  try {
    // Wait for extension background/service worker to register
    await new Promise((r) => setTimeout(r, 1000));
    const background = browserContext.backgroundPages().length
      ? browserContext.backgroundPages()[0]
      : (browserContext.serviceWorkers() || [])[0];
    if (!background)
      throw new Error("extension background/service worker not found");
    const extensionId = new URL(background.url()).host;

    // Prepare a 4-step page sequence to click through
    const steps = [
      "<h1>Page 1 - start</h1><p>Item A</p>",
      "<h1>Page 2 - middle</h1><p>Item B</p>",
      "<h1>Page 3 - middle</h1><p>Item C</p>",
      "<h1>Page 4 - last</h1><p>Item D</p>",
    ];
    const dataUrl = await makeMultiStepDataUrl(steps);

    // Open the test page as the active tab
    const page = await browserContext.newPage();
    await page.goto(dataUrl);

    // Helper: open popup page for the extension
    const popupUrl = `chrome-extension://${extensionId}/popup/index.html`;

    // Listen for background console to detect save completion
    let saveCount = 0;
    background.on &&
      background.on("console", (msg) => {
        try {
          const text = msg.text();
          if (text && text.includes("[data/notion] savePage:done")) {
            saveCount += 1;
          }
        } catch (e) {}
      });

    // Helper: prefer a structured storage signal set by the extension when a
    // save completes. Falls back to console-based detection if storage is
    // unavailable.
    async function waitForSaveCompleteViaStorage(sinceTs, timeout = 15000) {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        try {
          const saved = await background.evaluate((k) => {
            return new Promise((res) => {
              try {
                chrome.storage.local.get(k, (r) =>
                  res(r && r[k] ? r[k] : null),
                );
              } catch (err) {
                res(null);
              }
            });
          }, "__stn_last_save");

          if (saved && saved.ts && saved.ts > sinceTs) return true;
        } catch (err) {
          // ignore and fallback to console
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      return false;
    }

    const iterations = 3;
    for (let i = 0; i < iterations; i++) {
      // Ensure the content script has initialized on the page so the popup
      // can request the active tab's scraped content (exercise the real
      // content-script -> popup path rather than seeding localStorage).
      try {
        await page.waitForFunction(() => !!window.__stnModule, {
          timeout: 2000,
        });
      } catch (err) {
        // fallback: give content script a small extra moment if it isn't
        // immediately present (extensions may take a moment to inject).
        await page.waitForTimeout(250);
      }

      // Open popup — the popup will call chrome.tabs.sendMessage to request
      // the page's content and the content script should respond.
      const popup = await browserContext.newPage();
      await popup.goto(popupUrl);

      // Wait for the popup to render a Save button and click it
      const saveBtn = popup.locator('button:has-text("Save Page")');
      await saveBtn.first().waitFor({ state: "visible", timeout: 5000 });
      await saveBtn.first().click();

      // Wait for the extension to report save completion. Prefer the
      // structured storage signal (set at the time of save) — this is more
      // reliable for tests — and fall back to the background console event.
      const start = Date.now();
      const storageSignaled = await waitForSaveCompleteViaStorage(
        start,
        15_000,
      );
      if (!storageSignaled) {
        // fallback: wait for console-based signal
        const wantSaveCount = saveCount + 1;
        while (Date.now() - start < 15_000 && saveCount < wantSaveCount) {
          await new Promise((r) => setTimeout(r, 200));
        }
        if (saveCount < wantSaveCount) {
          const logs = await background
            .evaluate(() => (console.__stn_lastLogs || "").toString())
            .catch(() => "");
          throw new Error(
            "timed out waiting for extension save completion. background logs:" +
              logs,
          );
        }
      }

      // Close popup (some flows auto-close, ensure closed)
      try {
        await popup.close();
      } catch (e) {}

      // Click the page "next" button and wait for the content to update
      const nextBtn = page.locator("ft-button[forcetooltip][trailingicon]");
      await nextBtn.waitFor({ state: "visible", timeout: 5000 });
      await nextBtn.click();

      // Wait for the page index to advance
      const expectedIndex = Math.min(i + 1, steps.length - 1);
      await page.waitForFunction(
        (idx) => document.body.getAttribute("data-page-index") == String(idx),
        expectedIndex,
        { timeout: 5000 },
      );
    }

    console.log("✅ Prototype loop completed —", iterations, "iterations");
    await browserContext.close();
    process.exit(0);
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    try {
      await browserContext.close();
    } catch (e) {}
    process.exit(1);
  }
})();
