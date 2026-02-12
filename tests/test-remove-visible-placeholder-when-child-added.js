// Regression test: when a child block is created for an inline placeholder
// (data: URL → inline placeholder → child block), the parent block's
// visible standalone bracketed placeholder should be removed.

console.log("🧪 test-remove-visible-placeholder-when-child-added");

(function () {
  const inlinePlaceholder = "[Automate IT service]";
  const titleArray = [[inlinePlaceholder], ["Enhance the service experience"]];
  const occurrences = 1; // simulated

  // Replicate the conservative removal logic used in popup/static/js/main.js
  function removeStandalonePlaceholders(titleArr, placeholder, occ) {
    const escapeRegex = (s) => s.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
    const placeholderExactRe = new RegExp(
      "^\\s*" + escapeRegex(placeholder) + "\\s*$",
    );
    if (occ <= 0) return titleArr;
    const filtered = (titleArr || []).filter(function (seg) {
      const txt = Array.isArray(seg) ? seg[0] : seg;
      return !placeholderExactRe.test(String(txt || ""));
    });
    return filtered.length < (titleArr || []).length ? filtered : titleArr;
  }

  const after = removeStandalonePlaceholders(
    titleArray,
    inlinePlaceholder,
    occurrences,
  );

  if (after.length === titleArray.length) {
    console.error("❌ Placeholder was NOT removed when it should have been");
    process.exit(1);
  }
  if ((after[0] || [""])[0] === inlinePlaceholder) {
    console.error(
      "❌ Placeholder still present in first segment after removal",
    );
    process.exit(1);
  }

  console.log("✅ PASSED");
  process.exit(0);
})();
