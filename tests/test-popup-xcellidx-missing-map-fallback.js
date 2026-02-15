// Ensure popup recovers visible placeholder/text when XCELLIDX marker is
// present but __TABLE_CELL_CONTENT_MAP__ does not contain the entry

console.log(
  "🧪 test-popup-xcellidx-missing-map-fallback — fallback when map entry missing",
);

global.window = {};
window.__TABLE_CELL_CONTENT_MAP__ = {}; // deliberately empty

const richText = [
  {
    type: "text",
    annotations: {},
    text: {
      content: `XCELLIDXCELL_MISSINGXCELLIDX • Example ALT • Leading text`,
      link: null,
    },
  },
];

function expand(rtArray) {
  const expanded = [];
  rtArray.forEach((rt) => {
    const content = rt.text.content;
    const m = content.match(/XCELLIDX(CELL_[A-Za-z0-9]+)XCELLIDX/);
    if (m && window.__TABLE_CELL_CONTENT_MAP__) {
      const id = m[1];
      const original = window.__TABLE_CELL_CONTENT_MAP__[id];
      if (original && Array.isArray(original.paragraphs)) {
        original.paragraphs.forEach((part, idx) => {
          expanded.push({
            type: rt.type,
            annotations: rt.annotations,
            text: {
              content:
                part + (idx < original.paragraphs.length - 1 ? "\n" : ""),
              link: null,
            },
          });
        });
        return;
      }
      // fallback: strip marker and keep remaining visible content. If the
      // visible content looks like the TABLE:bullet placeholder, attempt to
      // recover an image URL from window.__imageUrlArray or the richText's
      // own link and emit a linked richText so later stages can convert it
      // into an image block.
      const fallback = content
        .replace(/XCELLIDX(CELL_[A-Za-z0-9]+)XCELLIDX/, "")
        .trim();
      if (fallback) {
        const bulletMatch = fallback.match(/•\s*([^•]+?)\s*•/);
        if (bulletMatch) {
          const alt = bulletMatch[1].trim();
          const href = (rt.text && rt.text.link && rt.text.link.url) || null;
          const looksLikeImage = (u) =>
            !!(
              u &&
              (u.startsWith("data:image/") ||
                /\.(png|jpe?g|gif|webp)(\?|$)/i.test(u))
            );
          if (href && looksLikeImage(href)) {
            expanded.push({
              type: rt.type,
              annotations: rt.annotations,
              text: { content: alt, link: { url: href } },
            });
            return;
          }
          if (window.__imageUrlArray && window.__imageUrlArray.length) {
            const found = window.__imageUrlArray.find((it) => {
              return (
                (it.alt || "").trim().toLowerCase() === alt.toLowerCase() ||
                (it.alt || "").toLowerCase().includes(alt.toLowerCase())
              );
            });
            if (found && looksLikeImage(found.src)) {
              expanded.push({
                type: rt.type,
                annotations: rt.annotations,
                text: { content: alt, link: { url: found.src } },
              });
              return;
            }
          }
          // Attempt to recover from sibling tokens (inline image markdown
          // or bare data: URL) when __imageUrlArray is not available.
          if (!window.__imageUrlArray || !window.__imageUrlArray.length) {
            const imgMd = /!\[([^\]]*)\]\((data:image\/[^)]+|https?:[^)]+)\)/i;
            const dataRe = /(data:image\/[a-z0-9+\-./=]+\b[^\s)]*)/i;
            for (let si = 0; si < rtArray.length; si++) {
              const s = rtArray[si].text && rtArray[si].text.content;
              if (!s) continue;
              const m = s.match(imgMd);
              if (m && looksLikeImage(m[2])) {
                expanded.push({
                  type: rt.type,
                  annotations: rt.annotations,
                  text: { content: m[1] || alt, link: { url: m[2] } },
                });
                return;
              }
              const md = s.match(dataRe);
              if (md && looksLikeImage(md[1])) {
                expanded.push({
                  type: rt.type,
                  annotations: rt.annotations,
                  text: { content: alt, link: { url: md[1] } },
                });
                return;
              }
            }
          }
        }

        expanded.push({
          type: rt.type,
          annotations: rt.annotations,
          text: { content: fallback, link: null },
        });
        return;
      }
    }
    expanded.push(rt);
  });
  return expanded;
}

const out = expand(richText);
if (!Array.isArray(out) || out.length < 1) {
  console.error("❌ Expected at least one expanded paragraph, got", out.length);
  process.exit(1);
}
if (!out[0].text.content.includes("• Example ALT •")) {
  console.error(
    "❌ Expected visible bullet placeholder to be preserved/fallbacked",
    out[0].text.content,
  );
  process.exit(1);
}
if (!out[0].text.content.includes("Leading text")) {
  console.error(
    "❌ Expected trailing text to be preserved in fallback",
    out[0].text.content,
  );
  process.exit(1);
}

// Now test image-recovery path: when the visible placeholder alt matches an
// entry in window.__imageUrlArray the expansion should attach a link so
// downstream logic can convert it into an image block.
window.__imageUrlArray = [
  { alt: "Example ALT", src: "https://example.com/example.png" },
];
const out2 = expand(richText);
if (
  !out2[0].text.link ||
  out2[0].text.link.url !== "https://example.com/example.png"
) {
  console.error(
    "❌ Expected image-recovery to attach image URL from __imageUrlArray",
    out2[0],
  );
  process.exit(1);
}

// Case: __imageUrlArray missing but a sibling richText token contains a
// data: URL image markdown. Expansion should recover the data: URL and
// attach it to the bullet placeholder paragraph.
delete window.__imageUrlArray;
const richTextWithDataSibling = [
  {
    type: "text",
    annotations: {},
    text: {
      content: `XCELLIDXCELL_MISSINGXCELLIDX • Example ALT •`,
      link: null,
    },
  },
  {
    type: "text",
    annotations: {},
    text: {
      content: "![](data:image/png;base64,AAAABBBB)",
      link: null,
    },
  },
];
const out3 = expand(richTextWithDataSibling);
if (
  !out3[0].text.link ||
  out3[0].text.link.url.indexOf("data:image/png;base64") !== 0
) {
  console.error(
    "❌ Expected data: URL in sibling token to be recovered and attached as link",
    out3,
  );
  process.exit(1);
}

console.log("✅ PASSED");
process.exit(0);
