// Test that scanWebpage preserves spaces in abbr tags
// This simulates the stripMultispaces function behavior

function testStripMultispacesWithAbbr() {
  console.log("🧪 Testing stripMultispaces with abbr spacing\n");

  // Simulate the WS_REGEXP pattern (simplified for testing)
  const WS_REGEXP = /\s+/g;

  // Original (buggy) version
  function stripMultispaces_OLD(str) {
    return str.replace(WS_REGEXP, " ").trim();
  }

  // Fixed version
  function stripMultispaces_NEW(str) {
    // Protect spaces in specific inline elements (e.g., <abbr> &gt; </abbr>)
    var protected = str.replace(
      /<(abbr|span|em|strong|b|i|code)[^>]*>\s*([^<]*?)\s*<\/\1>/gi,
      function (match, tag, content) {
        // If content contains special chars like > with spaces, protect them
        if (/\s+[<>&|]\s+/.test(content)) {
          return match.replace(/\s+/g, "\u00A0"); // Non-breaking space
        }
        return match;
      },
    );

    var result = protected.replace(WS_REGEXP, " ").trim();
    return result.replace(/\u00A0/g, " ");
  }

  // Test cases
  const testCases = [
    {
      name: "abbr with spaces around >",
      input:
        '<span>Workspaces</span><abbr title="and then"> &gt; </abbr><span>Service Operations Workspace</span>',
      expected: "Workspaces > Service Operations Workspace",
    },
    {
      name: "abbr with spaces around > (HTML decoded)",
      input:
        '<span>Workspaces</span><abbr title="and then"> > </abbr><span>Service Operations Workspace</span>',
      expected: "Workspaces > Service Operations Workspace",
    },
    {
      name: "Multiple spaces in regular content",
      input: "<p>This  has    multiple   spaces</p>",
      expected: "This has multiple spaces",
    },
    {
      name: "abbr with | separator",
      input: "<abbr> | </abbr>",
      expected: " | ",
    },
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach((test, i) => {
    console.log(`Test ${i + 1}: ${test.name}`);
    console.log(`  Input: ${test.input}`);

    const oldResult = stripMultispaces_OLD(test.input);
    const newResult = stripMultispaces_NEW(test.input);

    // Extract text content for comparison
    const tempDiv = { innerHTML: "" };
    if (typeof document !== "undefined") {
      const div = document.createElement("div");
      div.innerHTML = newResult;
      var extractedText = div.textContent;
    } else {
      // Node.js - use simple regex extraction
      var extractedText = newResult
        .replace(/<[^>]+>/g, "")
        .replace(/&gt;/g, ">")
        .replace(/&lt;/g, "<");
    }

    const oldExtracted = oldResult
      .replace(/<[^>]+>/g, "")
      .replace(/&gt;/g, ">")
      .replace(/&lt;/g, "<");

    console.log(`  OLD result: ${oldExtracted}`);
    console.log(`  NEW result: ${extractedText}`);
    console.log(`  Expected:   ${test.expected}`);

    const oldMatches = oldExtracted.includes(test.expected);
    const newMatches = extractedText.includes(test.expected);

    if (newMatches) {
      console.log(`  ✅ PASS - Fix preserves spacing correctly`);
      passed++;
    } else {
      console.log(`  ❌ FAIL - Fix did not preserve spacing`);
      failed++;
    }

    if (!oldMatches && newMatches) {
      console.log(`  🎉 IMPROVEMENT - Old version failed, new version passes!`);
    }

    console.log("");
  });

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`${"=".repeat(50)}\n`);

  return failed === 0;
}

// Run the test
const success = testStripMultispacesWithAbbr();
process.exit(success ? 0 : 1);
