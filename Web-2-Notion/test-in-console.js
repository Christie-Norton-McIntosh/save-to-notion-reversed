/**
 * Image Replacement Test Script
 *
 * USAGE:
 * 1. Open Chrome DevTools (F12) on any page where the extension is active
 * 2. Copy and paste this entire script into the console
 * 3. Call: testImageReplacement(pageId, spaceId)
 *
 * Example:
 * testImageReplacement('f6c30c3ad4584ee4a93609be47d7481e', '1934a47f-12df-4293-bdae-bbc3308daada')
 */

window.testImageReplacement = async function (pageId, spaceId) {
  console.log("========================================");
  console.log("🧪 IMAGE REPLACEMENT TEST STARTING");
  console.log("========================================");
  console.log("Page ID:", pageId);
  console.log("Space ID:", spaceId);
  console.log("");

  // Step 1: Create test placeholders
  console.log("📝 Step 1: Creating test placeholder map...");
  const timestamp = Date.now();
  const placeholderMap = {
    [`__IMG${timestamp}_0__`]: {
      dataUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      alt: "Red pixel",
      uniqueId: `__IMG${timestamp}_0__`,
      inlinePlaceholder: "[Red pixel]",
    },
    [`__IMG${timestamp}_1__`]: {
      dataUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
      alt: "Blue pixel",
      uniqueId: `__IMG${timestamp}_1__`,
      inlinePlaceholder: "[Blue pixel]",
    },
    [`__IMG${timestamp}_2__`]: {
      dataUrl:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z'/%3E%3C/svg%3E",
      alt: "Home icon",
      uniqueId: `__IMG${timestamp}_2__`,
      inlinePlaceholder: "[Home icon]",
    },
  };

  console.log("✓ Created", Object.keys(placeholderMap).length, "placeholders:");
  for (const [id, data] of Object.entries(placeholderMap)) {
    console.log("  -", id, ":", data.inlinePlaceholder);
  }
  console.log("");

  // Step 2: Check if Chrome extension API is available
  console.log("🔌 Step 2: Checking Chrome extension API...");
  if (typeof chrome === "undefined" || !chrome.runtime) {
    console.error("❌ Chrome extension API not available!");
    console.error(
      "Make sure you are running this on a page where the extension is active.",
    );
    return { success: false, error: "Chrome extension API not available" };
  }
  console.log("✓ Chrome extension API is available");
  console.log("  Extension ID:", chrome.runtime.id);
  console.log("");

  // Step 3: Send message to service worker
  console.log("📨 Step 3: Sending message to service worker...");
  console.log("Message payload:");
  console.log("  type:", "replaceDataUrlPlaceholders");
  console.log("  pageId:", pageId);
  console.log("  spaceId:", spaceId);
  console.log("  placeholderMap:", Object.keys(placeholderMap).length, "items");
  console.log("");

  try {
    console.log("⏳ Waiting for response...");
    const response = await chrome.runtime.sendMessage({
      type: "replaceDataUrlPlaceholders",
      pageId: pageId,
      spaceId: spaceId,
      placeholderMap: placeholderMap,
    });

    console.log("");
    console.log("📬 Response received!");
    console.log("Response:", JSON.stringify(response, null, 2));
    console.log("");

    if (response && response.success) {
      console.log("========================================");
      console.log("✅ TEST PASSED!");
      console.log("========================================");
      console.log("✓ Replaced", response.replacedCount, "placeholder blocks");
      console.log("");
      console.log("Next steps:");
      console.log("1. Open the Notion page:", `https://notion.so/${pageId}`);
      console.log("2. Verify the images appear correctly");
      console.log("3. Check that no __IMG*__ text blocks remain");
      return { success: true, replacedCount: response.replacedCount };
    } else {
      console.log("========================================");
      console.log("❌ TEST FAILED");
      console.log("========================================");
      console.error("Error:", response?.error || "Unknown error");
      console.log("");
      console.log("Check the service worker console for more details:");
      console.log("1. Go to chrome://extensions");
      console.log('2. Find "Web-2-Notion"');
      console.log('3. Click "Service worker" → "inspect"');
      console.log("4. Look for error messages");
      return { success: false, error: response?.error || "Unknown error" };
    }
  } catch (error) {
    console.log("========================================");
    console.log("❌ TEST ERROR");
    console.log("========================================");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.log("");
    console.log("Troubleshooting:");
    console.log("- Make sure the extension is loaded and enabled");
    console.log("- Check if the service worker is running");
    console.log("- Verify page ID and space ID are correct");
    return { success: false, error: error.message };
  }
};

// Run the in-service-worker unit test (fast, does not touch Notion)
window.runReplaceUnitTest = async function (
  opts = { attempts: 3, delayMs: 500 },
) {
  const attempts = opts.attempts || 3;
  const delayMs = opts.delayMs || 500;
  console.log(
    "🔬 Running in-service-worker unit test (will retry on failure)...",
  );

  for (let i = 1; i <= attempts; i++) {
    try {
      console.log(
        `Attempt ${i}/${attempts} — invoking runDataUrlReplacementUnitTest`,
      );
      const res = await chrome.runtime.sendMessage({
        type: "runDataUrlReplacementUnitTest",
      });
      console.log("Unit test response:", res);
      if (res && res.success) {
        console.log("✅ Unit test passed");
        return res;
      }
      console.warn("Unit test failed:", res && res.error);
    } catch (err) {
      console.error("Error calling unit test:", err);
    }

    if (i < attempts) {
      console.log(`Waiting ${delayMs}ms before retrying...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  throw new Error("Unit test failed after retries");
};

// Fully automated end-to-end runner: runs unit test, then runs live replacement until success or timeout.
window.testImageReplacementAuto = async function (pageId, spaceId, opts = {}) {
  const maxAttempts = opts.maxAttempts || 5;
  const retryDelay = opts.retryDelay || 2000;

  console.log("🚦 Starting automated end-to-end image-replacement test");

  // Step A: quick in-worker unit test
  try {
    await window.runReplaceUnitTest({ attempts: 3, delayMs: 400 });
  } catch (err) {
    console.error("Unit test failed — aborting E2E test:", err.message || err);
    return { success: false, phase: "unit-test", error: err.message || err };
  }

  // Step B: live replacement attempts against provided pageId
  console.log("▶ Now running live replacement attempts against page:", pageId);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(
      `Live attempt ${attempt}/${maxAttempts} — sending replaceDataUrlPlaceholders`,
    );
    try {
      const placeholderResult = await chrome.runtime.sendMessage({
        type: "replaceDataUrlPlaceholders",
        pageId,
        spaceId,
        placeholderMap: window.__dataUrlPlaceholders || {},
      });
      console.log("replaceDataUrlPlaceholders response:", placeholderResult);
      if (
        placeholderResult &&
        placeholderResult.success &&
        placeholderResult.replacedCount > 0
      ) {
        console.log("✅ Live replacement succeeded");
        return {
          success: true,
          replacedCount: placeholderResult.replacedCount,
        };
      }
      console.warn(
        "Live replacement did not replace images:",
        placeholderResult && placeholderResult.error,
      );
    } catch (err) {
      console.error("Error during live replacement attempt:", err);
    }

    if (attempt < maxAttempts) {
      console.log(`Waiting ${retryDelay}ms before next attempt...`);
      await new Promise((r) => setTimeout(r, retryDelay));
    }
  }

  console.error("✗ Automated E2E test failed after all attempts");
  return {
    success: false,
    phase: "live-replace",
    error: "max-attempts-exceeded",
  };
};

// Auto-display instructions
console.log("========================================");
console.log("📋 IMAGE REPLACEMENT TEST LOADED");
console.log("========================================");
console.log("");
console.log("To run the test:");
console.log("");
console.log("  testImageReplacement(pageId, spaceId)");
console.log("");
console.log("Example:");
console.log("  testImageReplacement(");
console.log('    "f6c30c3ad4584ee4a93609be47d7481e",');
console.log('    "1934a47f-12df-4293-bdae-bbc3308daada"');
console.log("  )");
console.log("");
console.log("Get your IDs:");
console.log("- Page ID: From Notion page URL (32 hex chars)");
console.log("- Space ID: From extension settings");
console.log("");
console.log("========================================");
