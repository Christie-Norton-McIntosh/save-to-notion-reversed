const path = require("path");
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

console.log(
  "🧪 test-no-duplicate-dataurl-when-xcellidx — ensure XCELLIDX prevents extra data: URL markdown",
);

function conv(html) {
  return patch.preprocessTableHtmlString(html, "https://example.com/base/");
}

// Producer-like HTML: XCELLIDX present and a preserved img (data-original-src)
const html = `<table><tr><td>XCELLIDXCELL_123XCELLIDX<img data-original-src="data:image/png;base64,AAA" data-stn-preserve="1" alt="Img"></td></tr></table>`;
const pre = conv(html);

console.log("Preprocessed ->", pre.replace(/\s+/g, " ").substring(0, 200));

if (!/XCELLIDXCELL_123XCELLIDX/.test(pre)) {
  console.error("❌ XCELLIDX was not preserved by preprocess");
  process.exit(1);
}

if (!/data-original-src=[\"']data:image\//.test(pre)) {
  console.error("❌ preserved image src missing in preprocess output");
  process.exit(1);
}

// The preprocessor should NOT convert the preserved region into an inline
// data:image markdown token — that is the popup's fallback responsibility
// and must not run when XCELLIDX is present.
if (/!\[.*\]\(data:image\//.test(pre)) {
  console.error(
    "❌ Preprocessor injected data:image markdown where XCELLIDX existed",
  );
  process.exit(1);
}

console.log("✅ test-no-duplicate-dataurl-when-xcellidx PASSED");
process.exit(0);
