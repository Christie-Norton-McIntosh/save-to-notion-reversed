/**
 * Additional table -> markdown edge-case tests
 * These are small, focused regression tests that exercise
 * tricky table-cell contents (nested blocks, consecutive <br>s,
 * lists, pre/code blocks, mixed inline+block content, image+text).
 */
const { JSDOM } = require("jsdom");

function normalizeCellText(cellHtml) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  const document = dom.window.document;
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = cellHtml;
  // Prefer a top-level td when the input is a full <td> (avoid selecting
  // nested <td> from a nested table). Fall back to the first td found.
  const cell =
    tempDiv.querySelector(":scope > td") ||
    tempDiv.querySelector("td") ||
    tempDiv;

  // wrap orphan text nodes in paragraphs (same logic used in popup)
  Array.from(cell.childNodes).forEach(function (node) {
    if (node.nodeType === 3 && node.textContent.trim()) {
      const wrapper = document.createElement("p");
      wrapper.textContent = node.textContent;
      cell.replaceChild(wrapper, node);
    }
  });

  // insert block-end markers after block-level elements
  const blockElements = cell.querySelectorAll(
    "div, p, pre, blockquote, h1, h2, h3, h4, h5, h6, section, article, header, footer",
  );
  blockElements.forEach(function (block) {
    const marker = document.createTextNode("__BLOCK_END__");
    if (block.nextSibling)
      block.parentNode.insertBefore(marker, block.nextSibling);
    else block.parentNode.appendChild(marker);
  });

  // li markers
  Array.from(cell.querySelectorAll("li")).forEach((li) =>
    li.appendChild(document.createTextNode("__LI_END__")),
  );

  // replace brs with marker
  Array.from(cell.querySelectorAll("br")).forEach((br) =>
    br.replaceWith(document.createTextNode("__BR__")),
  );

  // remove images to mimic table-cell-only-text conversion used by Notion flow
  Array.from(cell.querySelectorAll("img")).forEach((img) => img.remove());

  let text = cell.textContent || "";
  text = text
    .replace(/__BLOCK_END__/g, "\n")
    .replace(/__TDSEP__/g, " | ")
    .replace(/__BR__/g, "\n")
    .replace(/__LI_END__/g, "\n")
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

console.log("🧪 table -> markdown edge-case tests");

// 1) Nested blocks: div > p — should produce a single blank line between blocks
{
  const html =
    "<td>Lead text<div><p>Inner paragraph one</p><p>Inner paragraph two</p></div>Trailing</td>";
  const out = normalizeCellText(html);
  assert(
    /Inner paragraph one[\s\S]*\n[\s\S]*Inner paragraph two/.test(out),
    "nested <p> keep internal separation",
  );
  assert(
    /Lead text[\s\S]*\n[\s\S]*Inner paragraph one/.test(out),
    "lead text separated from inner block",
  );
}

// 2) Mixed inline + block: inline text + <p> + inline — ensure newline between inline and block
{
  const html = "<td>Before <p>Paragraph</p> after</td>";
  const out = normalizeCellText(html);
  assert(
    /Before[\s\S]*\n[\s\S]*Paragraph/.test(out),
    "inline before separated from <p>",
  );
  assert(
    /Paragraph[\s\S]*\n[\s\S]*after/.test(out),
    "<p> separated from trailing inline",
  );
}

// 3) Consecutive <br>s -> produce multiple newlines (double <br> => blank line)
{
  const html = "<td>Line1<br><br>Line2</td>";
  const out = normalizeCellText(html);
  assert(/Line1\n\nLine2/.test(out), "double <br> becomes blank line");
}

// 4) List items inside cell: ensure each li becomes its own line
{
  const html = "<td><ul><li>one</li><li>two</li></ul></td>";
  const out = normalizeCellText(html);
  assert(/^one\n.*two/.test(out), "list items preserved as separate lines");
}

// 5) Pre/code block preserves internal newlines and is separated from surrounding text
{
  const html = "<td>Intro<pre>lineA\nlineB</pre>Outro</td>";
  const out = normalizeCellText(html);
  assert(/lineA\nlineB/.test(out), "pre preserves internal newlines");
  assert(
    /Intro[\s\S]*\n[\s\S]*lineA/.test(out),
    "pre separated from leading inline",
  );
  assert(
    /lineB[\s\S]*\n[\s\S]*Outro/.test(out),
    "pre separated from trailing inline",
  );
}

// 6) Image + paragraph: image removed but paragraph should still produce newline separation
{
  const html = '<td><img src="x" alt="i"> <p>Caption</p></td>';
  const out = normalizeCellText(html);
  assert(/Caption/.test(out), "paragraph after image preserved");
}

// 7) Mixed punctuation spacing (additional regression): keep spaces around '>' when adjacent to blocks
{
  const html = "<td>pre  &gt;  <p>next</p></td>";
  const out = normalizeCellText(html);
  assert(/\s>\s/.test(out), "spaces around '>' must be preserved");
  assert(
    />\s*\n\s*next/.test(out),
    "'>' may be separated from following block by newline",
  );
}
// 8) Nested table: inner rows should produce separations (don't collapse all cells)
{
  // wrap in a table/tr so the HTML parser preserves nested-table structure
  const html = `
    <table><tr>
    <td>
      Parent intro
      <table>
        <tr><td>i1</td><td>i2</td></tr>
        <tr><td>i3</td><td>i4</td></tr>
      </table>
      Parent outro
    </td>
    </tr></table>`;
  const out = normalizeCellText(html);
  // must contain all inner cell texts in order and at least one newline between rows
  assert(
    /i1[\s\S]*i2[\s\S]*\n[\s\S]*i3[\s\S]*i4/.test(out),
    "nested table rows preserved with separation",
  );
  assert(
    /Parent intro[\s\S]*\n[\s\S]*i1/.test(out),
    "parent intro separated from nested table",
  );
}

// 9) Complex nested lists: nested <ul>/<ol> should produce separate lines for each li in order
{
  const html = `
    <td>
      <ul>
        <li>one
          <ol>
            <li>one.a</li>
            <li>one.b
              <ul><li>one.b.i</li></ul>
            </li>
          </ol>
        </li>
        <li>two</li>
      </ul>
    </td>`;
  const out = normalizeCellText(html);
  // Ensure hierarchical items appear as separate lines and in the expected sequence
  assert(
    /one\s*\n[\s\S]*one\.a\s*\n[\s\S]*one\.b\s*\n[\s\S]*one\.b\.i\s*\n[\s\S]*two/.test(
      out,
    ),
    "complex nested list preserved in order with each li on its own line",
  );
}

console.log("✅ table edge-case tests: all passed");
process.exit(0);
