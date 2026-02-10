const assert = require("assert");
const path = require("path");

const utils = require(
  path.join(
    __dirname,
    "..",
    "Web-2-Notion",
    "popup",
    "shim",
    "table-to-list-image-utils.js",
  ),
);

console.log("Running table-to-list image utils tests");

try {
  assert(utils.looksLikeImageUrl("https://example.com/a.png"));
  assert(utils.looksLikeImageUrl("HTTP://EXAMPLE/JPG.JPG"));
  assert(utils.looksLikeImageUrl("data:image/png;base64,AAA"));
  assert(!utils.looksLikeImageUrl("https://example.com/page.html"));
  assert(!utils.looksLikeImageUrl(""));
  console.log("  ✓ looksLikeImageUrl");

  const base = "https://example.com/path/page.html";
  const imgLike = {
    getAttribute: (k) => (k === "src" ? "/img/1.png" : null),
    src: "/img/1.png",
    parentElement: {
      tagName: "A",
      getAttribute: () => "images/foo.png",
      href: "images/foo.png",
    },
  };
  const resolved = utils.resolveImageSrc(imgLike, base);
  assert(resolved.startsWith("https://example.com/"));
  assert(resolved.indexOf("foo.png") !== -1);
  console.log("  ✓ resolveImageSrc (anchor preference + relative resolution)");

  const imgLike2 = {
    getAttribute: (k) => (k === "src" ? "data:image/png;base64,AAA" : null),
    src: "data:image/png;base64,AAA",
  };
  assert.strictEqual(
    utils.resolveImageSrc(imgLike2),
    "data:image/png;base64,AAA",
  );
  console.log("  ✓ resolveImageSrc (data: url)");

  const md = utils.imageMarkdown("alt text", "https://ex.com/a.png", 'a"b');
  assert(md.indexOf("alt text") !== -1);
  assert(md.indexOf("https://ex.com/a.png") !== -1);
  console.log("  ✓ imageMarkdown");

  const placeholder = utils.replaceImgWithPlaceholder({}, "Alt");
  assert.strictEqual(typeof placeholder, "string");
  assert(placeholder.indexOf("Alt") !== -1);
  console.log("  ✓ replaceImgWithPlaceholder (non-DOM)");

  console.log("All table-to-list image utils tests passed");
} catch (err) {
  console.error("Test failed:", err && err.message);
  process.exitCode = 1;
}

// Also test the HTML preprocessor (string-only) exported by the patch shim
try {
  const patch = require("../Web-2-Notion/popup/shim/table-to-list-patch.js");
  if (patch && patch.preprocessTableHtmlString) {
    const html =
      '<table><tr><td><a href="images/foo.png"><img src="data:image/png;base64,AAA" alt="Img"></a></td></tr></table>';
    const out = patch.preprocessTableHtmlString(
      html,
      "https://example.com/base/page.html",
    );
    if (!/data-original-src/.test(out))
      throw new Error("expected data-original-src in preprocessed html");
    console.log("  ✓ preprocessTableHtmlString (anchor->data-original-src)");
  } else {
    console.log("  - preprocessTableHtmlString not found (skipping)");
  }
} catch (err) {
  console.error("preprocessTableHtmlString test failed:", err && err.message);
  process.exitCode = 1;
}
