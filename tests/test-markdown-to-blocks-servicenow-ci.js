const path = require("path");
const fs = require("fs");

console.log(
  "🧪 test-markdown-to-blocks-servicenow-ci — ensure markdown->blocks keeps placeholders and no stray data: URLs",
);

const shim = require(
  path.join(
    __dirname,
    "..",
    "Web-2-Notion",
    "popup",
    "shim",
    "table-to-list-patch.js",
  ),
);
const html = fs.readFileSync(
  path.join(__dirname, "fixtures", "servicenow-table-sample.html"),
  "utf8",
);
const pre = shim.preprocessTableHtmlString(html, "https://example.com/");

// CI guard (string-level): ensure the preprocessor does not inject inline
// data: URL markdown for XCELLIDX-annotated cells and that visible
// placeholders remain present in the preprocessed HTML.
if (/XCELLIDX/.test(pre) && /!\[.*\]\(data:image\//.test(pre)) {
  console.error(
    "❌ Preprocessor produced inline data: URL markdown despite XCELLIDX being present",
  );
  process.exit(1);
}

if (!/•\s*Automate IT service\s*•/.test(pre)) {
  console.error(
    "❌ Expected visible bullet placeholder for table image to be present in preprocess output",
  );
  process.exit(1);
}

console.log("✅ markdown->blocks (string-level) CI guard passed");
process.exit(0);
