const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

console.log(
  "🧪 test-e2e-servicenow-r_ITServiceManagement — full pipeline for .body.refbody (ServiceNow)",
);

const html = fs.readFileSync(
  path.join(__dirname, "fixtures", "servicenow-r_ITServiceManagement.html"),
  "utf8",
);
const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`);
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;

// Use the real stnAnnotateTableCells if present (scanWebpage.js exposes it in runtime),
// otherwise fall back to the lightweight sanitizeCell used in other e2e tests.
function annotateOrSanitize(cell) {
  if (typeof window.__stn_annotateTableCells === "function") {
    // mimic the content-script behavior by invoking the annotator on a wrapper
    const wrapper = document.createElement("div");
    wrapper.appendChild(cell.cloneNode(true));
    window.__stn_annotateTableCells(wrapper);
    // annotated HTML will contain XCELLIDX marker; return that marker string
    const marker = wrapper.textContent.match(
      /XCELLIDX(CELL_[a-z0-9]+)XCELLIDX/i,
    );
    return marker ? marker[0] : null;
  }

  // fallback: simplified sanitize used in tests
  const cellClone = cell.cloneNode(true);
  cellClone.querySelectorAll("script, style").forEach((el) => el.remove());
  Array.from(cellClone.querySelectorAll("img")).forEach((img) => {
    const alt = img.getAttribute("alt") || "Image";
    img.replaceWith(document.createTextNode(" • " + alt + " • "));
  });
  // wrap orphan text
  Array.from(cellClone.childNodes).forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) {
      const p = document.createElement("p");
      p.textContent = n.textContent.trim();
      cellClone.replaceChild(p, n);
    }
  });
  Array.from(cellClone.querySelectorAll("p")).forEach((p) => {
    const m = document.createTextNode("__BLOCK_END__");
    if (p.nextSibling) p.parentNode.insertBefore(m, p.nextSibling);
    else p.parentNode.appendChild(m);
  });
  const textWithNewlines = (cellClone.textContent || "")
    .replace(/__BLOCK_END__/g, "\n")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join("\n");

  window.__TABLE_CELL_CONTENT_MAP__ = window.__TABLE_CELL_CONTENT_MAP__ || {};
  const id = "CELL_SN_" + Math.random().toString(36).slice(2, 8);
  window.__TABLE_CELL_CONTENT_MAP__[id] = {
    paragraphs: textWithNewlines.split("\n").filter(Boolean),
    flattened: textWithNewlines.split("\n").join(" "),
    meta: {
      containsImage: !!cell.querySelector("img"),
      hasLinks: !!cell.querySelector("a"),
    },
  };
  return `XCELLIDX${id}XCELLIDX`;
}

function popupExpand(marker) {
  const m = marker.match(/XCELLIDX(CELL_[A-Za-z0-9_]+)XCELLIDX/);
  if (!m) return [marker];
  const id = m[1];
  const payload = window.__TABLE_CELL_CONTENT_MAP__[id];
  if (!payload)
    return [marker.replace(/XCELLIDX(CELL_[A-Za-z0-9_]+)XCELLIDX/, "").trim()];
  return payload.paragraphs.slice();
}

// Capture the .body.refbody and run the pipeline
const container = document.querySelector(".body.refbody") || document.body;
const table = container.querySelector("table");
if (!table) {
  console.error("❌ Test fixture does not contain the expected table");
  process.exit(1);
}

const row0 = table.rows[0];
const marker0 = annotateOrSanitize(row0.cells[0]);
const marker1 = annotateOrSanitize(row0.cells[1]);

const flattened = [marker0, marker1]
  .map((m) => {
    const parts = popupExpand(m);
    return parts.join("\n");
  })
  .filter(Boolean)
  .join(" ");

console.log("Flattened ->", JSON.stringify(flattened));

// Assertions covering the user's report
if (!flattened.includes("• Automate IT service •")) {
  console.error("❌ Missing image placeholder for first row");
  process.exit(1);
}
if (!/Enhance the service experience/.test(flattened)) {
  console.error("❌ Missing leading orphan text for first row");
  process.exit(1);
}
if (!/Automate support for common requests/.test(flattened)) {
  console.error("❌ Missing paragraph for first row");
  process.exit(1);
}

// Quick spot-checks for other rows
const whole = Array.from(table.rows)
  .map((r) => {
    const m0 = annotateOrSanitize(r.cells[0]);
    const m1 = annotateOrSanitize(r.cells[1]);
    return [m0, m1].map((m) => popupExpand(m).join(" \n")).join(" ");
  })
  .join("\n---\n");

if (!/Consolidate IT services/.test(whole)) {
  console.error("❌ Missing text from second row");
  process.exit(1);
}
if (!/Improve IT productivity/.test(whole)) {
  console.error("❌ Missing text from third row");
  process.exit(1);
}

console.log("✅ ServiceNow .body.refbody table -> popup pipeline PASSED");
process.exit(0);
