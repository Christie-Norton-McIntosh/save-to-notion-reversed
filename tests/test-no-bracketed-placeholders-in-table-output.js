// Ensure bracketed placeholders are normalized to bullet-style in table flows
console.log("🧪 test-no-bracketed-placeholders-in-table-output");

function replaceBracketedPlaceholdersInTextNodes(str) {
  // Mirrors the logic in options.js: replace entire-text-node bracketed
  // placeholders like "[Automate IT service]" with bullet-style.
  return str.replace(/(^|\s)\[([^\]]+)\](\s|$)/g, function (_, a, inner, b) {
    return (a || "") + " • " + inner + " • " + (b || "");
  });
}

const input = "  [Automate IT service]  ";
const out = replaceBracketedPlaceholdersInTextNodes(input).trim();

if (out === "[Automate IT service]") {
  console.error("❌ Bracketed placeholder was not replaced");
  process.exit(1);
}
if (out.indexOf("• Automate IT service •") === -1) {
  console.error("❌ Replacement produced unexpected output:", out);
  process.exit(1);
}

console.log("✅ PASSED");
process.exit(0);
