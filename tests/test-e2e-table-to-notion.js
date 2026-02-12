/**
 * END-TO-END AUTOMATED TEST: Table Conversion to Notion
 *
 * This test simulates the FULL conversion pipeline:
 * 1. HTML table with images → XCELLIDX markers (content script)
 * 2. Markdown generation (popup/Turndown)
 * 3. Markdown → Notion blocks (options.js)
 * 4. Blocks → Notion API (serviceWorker)
 * 5. Verification of output in Notion
 *
 * Run this in the browser console with extension loaded:
 *
 * Usage (in console):
 *   testE2ETableConversion(pageId, spaceId)
 *
 * Or load this script in a test page.
 */

(function () {
  "use strict";

  const DEBUG = true;

  function log(...args) {
    if (DEBUG) console.log("[E2E Test]", ...args);
  }

  function error(...args) {
    console.error("[E2E Test ERROR]", ...args);
  }

  /**
   * Full end-to-end test of table conversion
   */
  async function testE2ETableConversion(pageId, spaceId, options = {}) {
    const opts = {
      maxWaitTime: 30000, // 30 seconds max wait
      checkInterval: 1000, // Check every second
      ...options,
    };

    log("Starting E2E table conversion test");
    log("Page ID:", pageId);
    log("Space ID:", spaceId);

    try {
      // PHASE 1: Create test HTML with table
      const testHtml = createTestTableHtml();
      log("Phase 1: Created test HTML table");

      // PHASE 2: Simulate content script processing
      const processedHtml = simulateContentScriptProcessing(testHtml);
      log("Phase 2: Processed with XCELLIDX markers");
      log("XCELLIDX count:", (processedHtml.match(/XCELLIDX/g) || []).length);

      // PHASE 3: Convert to markdown (Turndown)
      const markdown = await convertToMarkdown(processedHtml);
      log("Phase 3: Converted to markdown");
      log("Markdown sample:", markdown.substring(0, 200));

      // Check if markdown has dividers instead of content
      const dividerCount = (markdown.match(/^---$/gm) || []).length;
      const bulletCount = (markdown.match(/^[-*+]\s/gm) || []).length;
      log("Divider lines (---):", dividerCount);
      log("Bullet lines (- *):", bulletCount);

      if (dividerCount > bulletCount) {
        error("❌ PROBLEM: More dividers than bullets!");
        error(
          "This means table rows are becoming horizontal rules instead of content",
        );
        return {
          success: false,
          phase: "markdown_generation",
          detail: "Table rows converted to dividers instead of content",
          markdown,
          dividerCount,
          bulletCount,
        };
      }

      // PHASE 4: Convert markdown to Notion blocks
      const blocks = await convertMarkdownToBlocks(markdown);
      log("Phase 4: Converted to Notion blocks");
      log("Block count:", blocks.length);
      log(
        "Block types:",
        blocks.map((b) => b.type || b.object),
      );

      // Check block types
      const dividerBlocks = blocks.filter(
        (b) => b.type === "divider" || b.object === "divider",
      );
      const bulletBlocks = blocks.filter(
        (b) => b.type === "bulleted_list" || b.type === "bulleted_list_item",
      );
      const imageBlocks = blocks.filter((b) => b.type === "image");

      log("Divider blocks:", dividerBlocks.length);
      log("Bullet blocks:", bulletBlocks.length);
      log("Image blocks:", imageBlocks.length);

      // Guard: no block titles should contain a standalone bracketed
      // placeholder (legacy visible alt placeholders). They should be
      // removed by the pipeline or converted to child image blocks.
      const standaloneBracketRe = /^\s*\[[^\]]+\]\s*$/;
      for (const b of blocks) {
        try {
          const title = (b.properties && b.properties.title) || [];
          const text = Array.isArray(title)
            ? title.map((s) => s[0] || "").join("")
            : String(title || "");
          if (standaloneBracketRe.test(text)) {
            error(
              "❌ Found standalone bracketed placeholder in block title:",
              text,
            );
            return {
              success: false,
              phase: "block_generation",
              detail: "Found legacy bracketed placeholder in block title",
              block: b,
            };
          }
        } catch (err) {
          /* ignore malformed blocks for this guard */
        }
      }

      if (
        dividerBlocks.length > 0 &&
        bulletBlocks.length === 0 &&
        imageBlocks.length === 0
      ) {
        error("❌ CRITICAL: Only dividers created, no content blocks!");
        return {
          success: false,
          phase: "block_generation",
          detail: "Only divider blocks created, no bullets or images",
          blocks: blocks.map((b) => ({ type: b.type, object: b.object })),
        };
      }

      // PHASE 5: Send to Notion (if API available)
      if (
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        chrome.runtime.sendMessage
      ) {
        log("Phase 5: Sending to Notion...");
        const notionResult = await sendToNotion(pageId, spaceId, blocks);
        log(
          "Notion response:",
          notionResult.success ? "✓ Success" : "✗ Failed",
        );

        if (!notionResult.success) {
          error("❌ Failed to save to Notion:", notionResult.error);
          return {
            success: false,
            phase: "notion_api",
            detail: notionResult.error,
            blocks,
          };
        }

        // PHASE 6: Verify in Notion
        log("Phase 6: Verifying blocks in Notion...");
        await wait(2000); // Wait for Notion to process

        const verification = await verifyInNotion(pageId, blocks);
        log("Verification:", verification.success ? "✓ Passed" : "✗ Failed");

        if (!verification.success) {
          error("❌ Verification failed:", verification.detail);
          return {
            success: false,
            phase: "verification",
            detail: verification.detail,
            expected: verification.expected,
            actual: verification.actual,
          };
        }

        log("✅ ALL TESTS PASSED!");
        return {
          success: true,
          phases: [
            "html",
            "xcellidx",
            "markdown",
            "blocks",
            "notion",
            "verification",
          ],
          summary: {
            dividers: dividerBlocks.length,
            bullets: bulletBlocks.length,
            images: imageBlocks.length,
          },
        };
      } else {
        // No Notion API available, just validate blocks
        log("Phase 5: Skipped (no Notion API available)");

        const hasContent = bulletBlocks.length > 0 || imageBlocks.length > 0;
        const result = {
          success: hasContent,
          phases: ["html", "xcellidx", "markdown", "blocks"],
          summary: {
            dividers: dividerBlocks.length,
            bullets: bulletBlocks.length,
            images: imageBlocks.length,
          },
        };

        if (hasContent) {
          log("✅ TESTS PASSED (without Notion API verification)");
        } else {
          error("❌ No content blocks generated");
        }

        return result;
      }
    } catch (err) {
      error("Exception during test:", err);
      return {
        success: false,
        phase: "exception",
        detail: err.message,
        stack: err.stack,
      };
    }
  }

  /**
   * Create test HTML table with images
   */
  function createTestTableHtml() {
    return `
      <table>
        <tr>
          <td>
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Test Image 1">
            <p>Cell 1 text content</p>
          </td>
          <td>
            <p>Cell 2 - First paragraph</p>
            <p>Cell 2 - Second paragraph</p>
          </td>
        </tr>
        <tr>
          <td>
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" alt="Test Image 2">
            <p>Row 2 Cell 1</p>
          </td>
          <td>
            <p>Row 2 Cell 2</p>
          </td>
        </tr>
      </table>
    `;
  }

  /**
   * Simulate content script processing (XCELLIDX creation)
   */
  function simulateContentScriptProcessing(html) {
    // This mimics what options.js does in the content script
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const table = doc.querySelector("table");

    if (!table) return html;

    // Store cell content map
    window.__TABLE_CELL_CONTENT_MAP__ = window.__TABLE_CELL_CONTENT_MAP__ || {};

    let cellIndex = 0;
    table.querySelectorAll("td, th").forEach((cell) => {
      const cellId = "CELL_test" + cellIndex++;

      // Extract content
      const paragraphs = [];
      const images = [];

      cell.querySelectorAll("p").forEach((p) => {
        const text = p.textContent.trim();
        if (text) paragraphs.push(text);
      });

      cell.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src");
        const alt = img.getAttribute("alt") || "";
        if (src) {
          images.push({ src, alt });
          // Replace with placeholder
          const placeholder = doc.createTextNode(` • ${alt} • `);
          img.replaceWith(placeholder);
        }
      });

      // Store in map
      window.__TABLE_CELL_CONTENT_MAP__[cellId] = {
        paragraphs,
        images,
        flattened: paragraphs.join("\n"),
      };

      // Insert XCELLIDX marker
      const marker = doc.createTextNode(`XCELLIDX${cellId}XCELLIDX`);
      cell.insertBefore(marker, cell.firstChild);
    });

    return doc.body.innerHTML;
  }

  /**
   * Convert HTML to markdown using Turndown
   */
  async function convertToMarkdown(html) {
    // Check if Turndown/JZ is available
    if (typeof window.JZ === "function") {
      return window.JZ(html);
    }

    // Fallback: simple conversion
    log("Warning: Turndown not available, using fallback");
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    let markdown = "";
    doc.querySelectorAll("tr").forEach((row, idx) => {
      const cells = Array.from(row.querySelectorAll("td, th"));
      cells.forEach((cell) => {
        const text = cell.textContent.trim();
        markdown += `- ${text}\n`;
      });
      if (idx < doc.querySelectorAll("tr").length - 1) {
        markdown += "\n---\n\n"; // Row separator
      }
    });

    return markdown;
  }

  /**
   * Convert markdown to Notion blocks
   */
  async function convertMarkdownToBlocks(markdown) {
    // This would use the actual conversion function from main.js
    // For now, we'll simulate the expected output

    // Check if the conversion function is available
    if (typeof window.markdownToBlocks === "function") {
      return window.markdownToBlocks(markdown);
    }

    // Fallback: parse manually
    const lines = markdown.split("\n");
    const blocks = [];

    for (const line of lines) {
      if (line.trim() === "---") {
        blocks.push({ object: "block", type: "divider", divider: {} });
      } else if (line.match(/^[-*+]\s/)) {
        const text = line.replace(/^[-*+]\s/, "").trim();
        blocks.push({
          object: "block",
          type: "bulleted_list",
          bulleted_list: {
            rich_text: [{ type: "text", text: { content: text } }],
          },
        });
      } else if (line.match(/!\[(.+?)\]\((.+?)\)/)) {
        const match = line.match(/!\[(.+?)\]\((.+?)\)/);
        blocks.push({
          object: "block",
          type: "image",
          image: {
            type: "external",
            external: { url: match[2] },
          },
        });
      }
    }

    return blocks;
  }

  /**
   * Send blocks to Notion
   */
  async function sendToNotion(pageId, spaceId, blocks) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "notion",
        cmd: "appendBlocks",
        params: [pageId, blocks, { spaceId }],
      });

      return {
        success: response && response.success,
        error: response && response.error,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Verify blocks were created in Notion
   */
  async function verifyInNotion(pageId, expectedBlocks) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "notion",
        cmd: "loadPageChunk",
        params: [{ pageId }],
      });

      if (!response || !response.success) {
        return {
          success: false,
          detail: "Failed to load page from Notion",
        };
      }

      const actualBlocks = response.data.recordMap.block || {};
      const blockTypes = Object.values(actualBlocks).map((b) => b.value.type);

      const expectedTypes = expectedBlocks.map((b) => b.type || b.object);
      const hasBullets = blockTypes.some((t) => t === "bulleted_list");
      const hasImages = blockTypes.some((t) => t === "image");
      const hasOnlyDividers = blockTypes.every((t) => t === "divider");

      if (hasOnlyDividers) {
        return {
          success: false,
          detail: "Only dividers found in Notion page",
          expected: expectedTypes,
          actual: blockTypes,
        };
      }

      return {
        success: hasBullets || hasImages,
        detail: "Blocks verified successfully",
        expected: expectedTypes,
        actual: blockTypes,
      };
    } catch (err) {
      return {
        success: false,
        detail: `Verification error: ${err.message}`,
      };
    }
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Export for use in console
  window.testE2ETableConversion = testE2ETableConversion;

  log("E2E Table Test loaded. Run: testE2ETableConversion(pageId, spaceId)");
})();
