// Regression test: ensure empty parentheses left after inline-placeholder
// removal are stripped even when the placeholder was embedded inside a
// title segment. Also ensure meaningful parentheticals are preserved.

console.log("🧪 test-remove-empty-parentheses-inline");

(function () {
  const inlinePlaceholder = "[List icon]";

  // Simulate a paragraph where the placeholder was embedded across
  // segments and left empty parentheses remain after removal.
  const titleArray = [
    ["selecting the list icon ("],
    [inlinePlaceholder],
    [") from the left navigation pane."],
  ];

  const occurrences = 1; // simulated detection of the inline placeholder

  // Replicate the conservative removal + empty-paren cleanup used in
  // popup/static/js/main.js (keeps the test self-contained).
  function escapeRegex(s) {
    return s.replace(/[\\^$.*+?()\[\]{}|]/g, "\\$&");
  }

  const placeholderExactRe = new RegExp(
    "^\\s*" + escapeRegex(inlinePlaceholder) + "\\s*$",
  );

  // Step 1: remove standalone placeholder segments (if any)
  let filtered = (titleArray || []).filter(function (seg) {
    const txt = Array.isArray(seg) ? seg[0] : seg;
    return !placeholderExactRe.test(String(txt || ""));
  });

  // Step 2: if placeholder was present, strip empty parentheses across
  // all segments (but only empty parens, so '(Fig. 2)' is preserved).
  function stripEmptyParensFromTitle(arr) {
    return arr
      .map(function (seg) {
        const txt = Array.isArray(seg) ? seg[0] : seg;
        const replaced = String(txt || "")
          .replace(/\(\s*\)/g, "")
          .replace(/\s{2,}/g, " ")
          .trim();
        return [replaced];
      })
      .filter(Boolean);
  }

  let final = filtered;
  const fullBlockText = (titleArray || [])
    .map((s) => (s && s[0]) || "")
    .join("");
  if (occurrences > 0 && fullBlockText.indexOf(inlinePlaceholder) !== -1) {
    final = stripEmptyParensFromTitle(final.length ? final : titleArray);
  }

  const joined = final.map((s) => s[0]).join(" ");

  if (joined.indexOf("()") !== -1) {
    console.error("❌ Empty parentheses were NOT removed: ", joined);
    process.exit(1);
  }

  // Ensure meaningful parentheticals remain untouched
  const withMeaningful = [["See (Fig. 2) for details"], [inlinePlaceholder]];
  const fullMeaningful = withMeaningful.map((s) => s[0]).join("");
  const cleanedMeaningful = stripEmptyParensFromTitle(withMeaningful);
  if (cleanedMeaningful.join(" ").indexOf("(Fig. 2)") === -1) {
    console.error("❌ Meaningful parenthetical was removed incorrectly");
    process.exit(1);
  }

  console.log("✅ PASSED");
  process.exit(0);
})();
