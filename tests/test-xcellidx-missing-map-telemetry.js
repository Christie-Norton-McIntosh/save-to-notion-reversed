const { JSDOM } = require("jsdom");
const path = require("path");

console.log("🧪 test-xcellidx-missing-map-telemetry — telemetry increments when map missing");

const dom = new JSDOM("<!doctype html><html><body></body></html>");
global.window = dom.window;
global.document = dom.window.document;

// Use the pure, node-friendly utility (no full popup bundle required)
const utils = require(path.join(__dirname, '..', 'Web-2-Notion', 'popup', 'lib', 'table-to-list-utils.js'));

const html = "<table><tr><td>XCELLIDXCELL_123XCELLIDX</td></tr></table>";
const res = utils.checkXcellMarkers(html, {});

console.log('diagnostic ->', JSON.stringify(res));
if (!res || !Array.isArray(res.missing) || res.missing.length === 0) {
  console.error('❌ Expected missing XCELLIDX entry to be reported');
  process.exit(1);
}

console.log('✅ telemetry diagnostic (pure) passed');
process.exit(0);
