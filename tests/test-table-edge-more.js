/**
 * Additional table->markdown edge cases (round 2)
 * - nested tables
 * - deeply nested lists
 * - <template> (shadow-like) content should be ignored by textContent
 * - non-breaking spaces around entities
 * - empty block elements
 * - inline code adjacent to blocks
 */
const { JSDOM } = require("jsdom");

function normalizeCellText(cellHtml) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  const document = dom.window.document;
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = cellHtml;
  const cell = tempDiv.querySelector("td") || tempDiv;

  // wrap orphan text nodes
  Array.from(cell.childNodes).forEach(function (node) {
    if (node.nodeType === 3 && node.textContent.trim()) {
      const wrapper = document.createElement("p");
      wrapper.textContent = node.textContent;
      cell.replaceChild(wrapper, node);
    }
  });

  // mark block boundaries (include pre/blockquote)
  const blockElements = cell.querySelectorAll(
    "div, p, pre, blockquote, h1, h2, h3, h4, h5, h6, section, article, header, footer",
  );
  blockElements.forEach(function (block) {
    // If inline content directly precedes a block (e.g. <code>x</code><p>..),
    // insert a leading marker so the inline content and block don't concatenate.
    const prev = block.previousSibling;
    const needsLeading =
      prev &&
      ((prev.nodeType === 3 && /\S/.test(prev.textContent)) ||
        (prev.nodeType === 1 &&
          /^(CODE|SPAN|A|STRONG|EM|I|B|U)$/.test(prev.nodeName)));
    if (needsLeading) {
      const leading = document.createTextNode("__BLOCK_END__");
      block.parentNode.insertBefore(leading, block);
    }

    const marker = document.createTextNode("__BLOCK_END__");
    if (block.nextSibling)
      block.parentNode.insertBefore(marker, block.nextSibling);
    else block.parentNode.appendChild(marker);
  });

  Array.from(cell.querySelectorAll("li")).forEach((li) =>
    li.appendChild(document.createTextNode("__LI_END__")),
  );
  Array.from(cell.querySelectorAll("br")).forEach((br) =>
    br.replaceWith(document.createTextNode("__BR__")),
  );
  // remove images (mirrors existing conversion)
  Array.from(cell.querySelectorAll("img")).forEach((i) => i.remove());

  let text = cell.textContent || "";
  text = text
    .replace(/__BLOCK_END__/g, "\n")
    .replace(/__TDSEP__/g, " | ")
    .replace(/__BR__/g, "\n")
    .replace(/__LI_END__/g, "\n")
    .replace(/\u00A0/g, " ") // NBSP -> space
    .replace(/[ \t]{3,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text;
}

function assert(cond, msg) {
  if (!cond) {
    console.error("❌", msg);
    process.exit(1);
  }
}

console.log("🧪 table -> markdown extra edge-case tests");

// Nested table: inner table text should appear in the output (separated)
{
  const html =
    "<table><tr><td>Outer<table><tr><td>Inner</td></tr></table>After</td></tr></table>";
  const out = normalizeCellText(html);
  if (!/Outer[\s\S]*Inner[\s\S]*After/.test(out)) {
    console.error("DEBUG nested-table output:", JSON.stringify(out));
  }
  assert(
    /Outer[\s\S]*Inner[\s\S]*After/.test(out),
    "nested table inner text preserved",
  );
}

// Deeply nested lists: ensure all list items become separate lines (flattened)
{
  const html =
    "<td><ul><li>one<ul><li>one.a</li></ul></li><li>two</li></ul></td>";
  const out = normalizeCellText(html);
  assert(
    /one[\s\S]*one\.a[\s\S]*two/.test(out),
    "nested list items preserved in order",
  );
}

// <template> content (shadow-like) should be ignored by textContent
{
  const html = "<td>host<template><p>shadow-like</p></template></td>";
  const out = normalizeCellText(html);
  assert(/host/.test(out), "host text is present");
  assert(
    !/shadow-like/.test(out),
    "<template> content is ignored by textContent",
  );
}

// Non-breaking spaces around '>' should be preserved as single spaces
{
  const html = "<td>A&nbsp;&gt;&nbsp;B</td>";
  const out = normalizeCellText(html);
  assert(
    /\s>\s/.test(out),
    "NBSP around > becomes regular spaces and preserved",
  );
}

// Empty block elements should not introduce extra blank lines
{
  const html = "<td><p></p><p>Has</p></td>";
  const out = normalizeCellText(html);
  assert(!/\n\n\n/.test(out), "no excessive blank lines from empty blocks");
  assert(/Has/.test(out), "content after empty block preserved");
}

// Inline code adjacent to a block: spacing must be preserved and separated from block
{
  const html = "<td>before <code>x</code><p>block</p>after</td>";
  const out = normalizeCellText(html);
  assert(
    /before\s*x\s*\n\s*block/.test(out),
    "inline code preserved and separated from block",
  );
  assert(
    /block[\s\S]*\n[\s\S]*after/.test(out),
    "block separated from trailing inline",
  );
}

console.log("✅ table extra-edge tests: all passed");
process.exit(0);
