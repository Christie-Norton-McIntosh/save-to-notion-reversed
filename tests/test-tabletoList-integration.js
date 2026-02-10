const assert = require("assert");
const path = require("path");

console.log("Running tableToList string-level integration tests (images)");

const patch = require(
  path.join(
    __dirname,
    "..",
    "Web-2-Notion",
    "popup",
    "shim",
    "table-to-list-patch.js",
  ),
);

function conv(html) {
  return patch.preprocessTableHtmlString(html, "https://example.com/base/");
}

try {
  let html = `<table><tr><td><a href="https://example.com/i.png"><img src="data:image/png;base64,AAA" alt="Img1"></a></td><td>Desc</td></tr></table>`;
  let pre = conv(html);
  assert(
    /data-original-src=["']https:\/\/example\.com\/i\.png["']/.test(pre),
    "expected data-original-src for anchor image",
  );
  assert(/Desc/.test(pre));
  console.log("  ✓ preprocess: anchor image -> data-original-src");

  html = `<table><tr><td><p>See <img src="/img/icon.png" alt="Icon"></p></td></tr></table>`;
  pre = conv(html);
  assert(
    /• Icon •/.test(pre),
    "expected visible bullet placeholder for image with alt",
  );
  assert(
    /data-original-src/.test(pre),
    "expected data-original-src for resolved relative URL",
  );
  console.log(
    "  ✓ preprocess: image with alt -> placeholder + data-original-src",
  );

  html = `<table><tr><td>XCELLIDX(CELL_123)XCELLIDX</td></tr></table>`;
  pre = conv(html);
  assert(
    /XCELLIDX\(CELL_123\)XCELLIDX/.test(pre),
    "XCELLIDX marker should be preserved",
  );
  console.log("  ✓ preprocess: XCELLIDX preserved");

  console.log("All tableToList string-level integration tests passed");
} catch (err) {
  console.error("Integration test failed:", err && err.message);
  process.exitCode = 1;
}
