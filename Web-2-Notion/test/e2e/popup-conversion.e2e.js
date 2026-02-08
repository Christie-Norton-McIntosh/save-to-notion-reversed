/* eslint-env node */
// Playwright end-to-end test — popup conversion path
// - Launches Chromium with the unpacked extension
// - Loads the popup, injects a representative HTML payload into extension localStorage
// - Reloads the popup (preload-format.js runs on startup) and asserts the
//   converted output contains expected pieces (nested tables, TD separators,
//   inline-code + block separation, and NBSP around '>').

const path = require("path");
const fs = require("fs");
const os = require("os");
const { chromium } = require("playwright");

(async () => {
  const extensionPath = path.resolve(__dirname, "..", ".."); // Web-2-Notion/
  if (!fs.existsSync(extensionPath)) {
    console.error("extension path not found:", extensionPath);
    process.exit(2);
  }

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "stn-e2e-"));
  const browserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // extensions are not supported in headless Chromium
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      "--no-sandbox",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  });

  try {
    // Wait for the extension to be registered and a background page/worker to appear
    await new Promise((r) => setTimeout(r, 1000));

    const background = browserContext.backgroundPages().length
      ? browserContext.backgroundPages()[0]
      : (browserContext.serviceWorkers() || [])[0];

    if (!background) {
      console.error("could not find extension background page/service worker");
      await browserContext.close();
      process.exit(3);
    }

    const extensionId = new URL(background.url()).host;
    const popupUrl = `chrome-extension://${extensionId}/popup/index.html`;

    // Open a real page containing the representative HTML so the content
    // script can extract it when the popup queries the active tab.
    const page = await browserContext.newPage();
    const sampleHtml = `
      <div>STN-E2E-MARKER
        <table>
          <tr>
            <td>Outer
              <table>
                <tr><td>InnerA</td><td>InnerB</td></tr>
              </table>
            After</td>
            <td>Right</td>
          </tr>
        </table>
        <p>A&nbsp;&gt;&nbsp;B</p>
        before <code>x</code><p>block</p>after
      </div>
    `;
    await page.setContent(sampleHtml, { waitUntil: "domcontentloaded" });

    // Wait for content script to be injected and ready (so popup's
    // chrome.tabs.sendMessage will get a real response)
    try {
      await page.waitForFunction(() => !!window.__stnModule, { timeout: 2000 });
    } catch (err) {
      await page.waitForTimeout(250);
    }

    const popup = await browserContext.newPage();
    await popup.goto(popupUrl);

    // Give the app some time to convert and render
    const timeout = 10000;
    const start = Date.now();
    let found = false;
    let lastText = "";
    while (Date.now() - start < timeout) {
      // Grab visible text from the popup (the converted preview should be rendered somewhere)
      const bodyText = (
        await popup.evaluate(() => document.body.innerText || "")
      ).trim();
      lastText = bodyText;
      if (bodyText.includes("STN-E2E-MARKER")) {
        found = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    if (!found) {
      console.error(
        "popup did not render converted preview — last popup text:\n",
        lastText,
      );
      throw new Error("converted preview not rendered");
    }

    // Assertions (text-based because the UI is a bundled React app)
    const out = lastText;

    // 1) Nested table inner text appears between Outer and After
    if (!/Outer[\s\S]*InnerA[\s\S]*InnerB[\s\S]*After/.test(out)) {
      console.error("nested table content missing or out-of-order:\n", out);
      throw new Error("nested table conversion failed");
    }

    // 2) Nested table column separator (TDSEP) preserved as ' | '
    if (!out.includes("InnerA") || !out.includes(" | ")) {
      console.error('expected column separator (" | ") in output:\n', out);
      throw new Error("nested table column separator missing");
    }

    // 3) NBSP around '>' preserved as spaces
    if (!/A\s>\sB/.test(out)) {
      console.error("NBSP around > not preserved as spaces:\n", out);
      throw new Error("> spacing regression");
    }

    // 4) Inline code adjacent to block is separated by a newline from the block
    if (!/before\s*x\s*\n\s*block/.test(out)) {
      console.error("inline-code + block spacing not preserved:\n", out);
      throw new Error("inline-code + block spacing regression");
    }

    console.log("✅ popup conversion e2e assertions passed");
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
