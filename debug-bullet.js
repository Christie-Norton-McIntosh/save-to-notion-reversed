const { JSDOM } = require("jsdom");
const dom = new JSDOM("<!doctype html><html><body></body></html>");
global.document = dom.window.document;
global.Node = dom.window.Node;
global.NodeFilter = dom.window.NodeFilter;

const utils = require("./Web-2-Notion/popup/lib/table-to-list-utils.js");
const proc = utils.processCellForTableToList;

const td = document.createElement("td");
td.innerHTML =
  'XCELLIDX(CELL_D)XCELLIDX • Icon • <img data-stn-preserve="1" alt="Icon">';

console.log("Before processing:");
console.log("innerHTML:", td.innerHTML);
console.log("textContent:", td.textContent);
console.log("childNodes:", td.childNodes.length);
td.childNodes.forEach((n, i) => {
  if (n.nodeType === 3) console.log(`  ${i}: TEXT "${n.textContent}"`);
  if (n.nodeType === 1) console.log(`  ${i}: <${n.tagName}>`);
});

const out = proc(td);
console.log("\nAfter processing:");
console.log("Output:", JSON.stringify(out));
console.log("Contains bullet:", /•\s*Icon\s*•/.test(out));
