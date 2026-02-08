// Diagnostic script: show per-td transformation used by popup extraction logic
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const testHtmlPath = path.join(__dirname, "table-content-line-breaks.html");
const testHtml = fs.readFileSync(testHtmlPath, "utf8");
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
const document = dom.window.document;
const tempDiv = document.createElement("div");
tempDiv.innerHTML = testHtml;
const cells = tempDiv.querySelectorAll("td");

function wrapOrphanTextNodes(parent) {
  var children = Array.from(parent.childNodes);
  children.forEach(function (node) {
    if (node.nodeType === 3 && node.textContent.trim()) {
      var wrapper = document.createElement("p");
      wrapper.textContent = node.textContent;
      parent.replaceChild(wrapper, node);
    }
  });
}

cells.forEach((cell, index) => {
  const cellClone = cell.cloneNode(true);
  // Remove images to focus on text
  const images = cellClone.querySelectorAll("img");
  images.forEach((i) => i.remove());

  console.log("\n--- CELL", index + 1, "---");
  console.log(
    "innerHTML:",
    cellClone.innerHTML.replace(/\n\s*/g, "\n").slice(0, 400),
  );
  // run same steps as popup
  wrapOrphanTextNodes(cellClone);
  const blockElements = cellClone.querySelectorAll(
    "div, p, pre, blockquote, h1, h2, h3, h4, h5, h6, section, article, header, footer",
  );
  console.log("blockElements count:", blockElements.length);
  console.log(
    "childNodes types:",
    Array.from(cellClone.childNodes).map(
      (n) =>
        `${n.nodeName}:${n.nodeType}:${n.nodeType === 3 ? JSON.stringify(n.textContent).slice(0, 30) : n.nodeName}`,
    ),
  );
  blockElements.forEach(function (block) {
    var separator = document.createTextNode(" __BLOCK_END__ ");
    if (block.nextSibling) {
      block.parentNode.insertBefore(separator, block.nextSibling);
    } else {
      block.parentNode.appendChild(separator);
    }
  });
  cellClone.querySelectorAll("br").forEach(function (br) {
    br.replaceWith(document.createTextNode(" __BR__ "));
  });
  let text = cellClone.textContent || "";
  console.log("text WITH markers:", JSON.stringify(text.slice(0, 300)));
  const textWithNewlines = text
    .replace(/__BLOCK_END__/g, "\n")
    .replace(/__TDSEP__/g, " | ")
    .replace(/__BR__/g, "\n")
    .replace(/[ \t]{3,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  console.log(
    "text AFTER replacements:",
    JSON.stringify(textWithNewlines.slice(0, 300)),
  );
  const hasLineBreaks = textWithNewlines.includes("\n");
  const originalText = cell.textContent.trim();
  const hasMultipleBlocks =
    cellClone.querySelectorAll("div, p").length > 1 ||
    (cellClone.querySelector("p") &&
      cellClone.textContent.trim() !==
        cellClone.querySelector("p").textContent.trim());
  console.log("hasMultipleBlocks?", hasMultipleBlocks);
  console.log("result hasLineBreaks?", hasLineBreaks);
});
