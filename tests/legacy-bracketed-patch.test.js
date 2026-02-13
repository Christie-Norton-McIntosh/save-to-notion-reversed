/*
 * Basic runtime assertions for the LEGACY:bracketed prevention shim.
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert").strict;
const { JSDOM } = require("jsdom");

const patchPath = path.resolve(
  __dirname,
  "../Web-2-Notion/popup/shim/legacy-bracketed-patch.js",
);
const patchCode = fs.readFileSync(patchPath, "utf8");

function delay(window, ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function runTests() {
  const dom = new JSDOM(
    `<!doctype html><html><body>
       <table>
         <tbody>
           <tr>
             <td id="primary-cell"><img src="test.png" alt="Automate IT service" /></td>
           </tr>
         </tbody>
       </table>
     </body></html>`,
    { runScripts: "dangerously", resources: "usable" },
  );

  const { window } = dom;
  const { document } = window;

  // Make sure the shim thinks the DOM is ready right away.
  try {
    Object.defineProperty(document, "readyState", {
      configurable: true,
      get: () => "complete",
    });
  } catch (error) {
    // Silently ignore if jsdom does not allow overriding readyState.
  }

  window.console = console;

  window.eval(patchCode);

  document.dispatchEvent(new window.Event("DOMContentLoaded"));

  const primaryCell = document.getElementById("primary-cell");
  const originalImg = primaryCell.querySelector("img");
  assert.ok(originalImg, "Expected a seed image in the primary cell");

  const originalAlt = originalImg.getAttribute("alt");
  primaryCell.replaceChild(
    document.createTextNode(`[${originalAlt}]`),
    originalImg,
  );

  await delay(window, 50);

  const restoredImg = primaryCell.querySelector("img");
  assert.ok(
    restoredImg,
    "The shim should restore the image in the primary cell",
  );
  assert.strictEqual(restoredImg.getAttribute("alt"), originalAlt);
  assert.ok(
    !primaryCell.textContent.includes(`[${originalAlt}]`),
    "Bracketed text should be removed",
  );

  await delay(window, 120);

  const newCell = document.createElement("td");
  newCell.setAttribute("id", "fallback-cell");
  const targetRow = document.querySelector("tr");
  targetRow.appendChild(newCell);
  newCell.appendChild(document.createTextNode("[Fallback image]"));

  await delay(window, 100);

  assert.strictEqual(
    newCell.textContent.trim(),
    "• Fallback image •",
    "Bracketed placeholders without preserved images should become bullet placeholders",
  );

  const parenCell = document.createElement("td");
  parenCell.setAttribute("id", "paren-placeholder");
  targetRow.appendChild(parenCell);
  parenCell.appendChild(document.createTextNode("([Paren placeholder])"));

  await delay(window, 100);

  assert.strictEqual(
    parenCell.textContent.trim(),
    "• Paren placeholder •",
    "Bracketed placeholders wrapped in parentheses should become bullet placeholders",
  );

  const trailingCell = document.createElement("td");
  trailingCell.setAttribute("id", "trailing-placeholder");
  targetRow.appendChild(trailingCell);
  trailingCell.appendChild(
    document.createTextNode("[Trailing placeholder] ()"),
  );

  await delay(window, 100);

  assert.strictEqual(
    trailingCell.textContent.trim(),
    "• Trailing placeholder •",
    "Bracketed placeholders followed by empty parentheses should become bullet placeholders",
  );

  console.log("✅ LEGACY:bracketed prevention shim tests passed");
}

runTests().catch((error) => {
  console.error("❌ LEGACY:bracketed prevention shim tests failed");
  console.error(error);
  process.exitCode = 1;
});
