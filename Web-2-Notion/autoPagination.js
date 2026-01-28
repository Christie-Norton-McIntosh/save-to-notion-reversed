/**
 * Auto-Pagination Module
 * Automatically saves current page and navigates to next page using a CSS selector
 */

(function () {
  "use strict";

  // Prevent duplicate injection
  if (window.__stnAutoPaginationLoaded) {
    console.debug(
      "[Auto-Pagination] Script already loaded, skipping duplicate injection",
    );
    return;
  }
  window.__stnAutoPaginationLoaded = true;

  const AUTO_PAGINATION_KEY = "__stn_auto_pagination";
  const AUTO_PAGINATION_STATE_KEY = "__stn_auto_pagination_state";

  /**
   * Find element in shadow DOMs (reusing pattern from getCustomCssData.js)
   */
  function findInShadowDOM(selector, root = document, depth = 0) {
    if (depth > 20) {
      return null;
    }

    // Try in current root first
    try {
      const element = root.querySelector(selector);
      if (element) {
        return element;
      }
    } catch (e) {
      console.debug("Invalid selector in findInShadowDOM:", selector, e);
      return null;
    }

    // Search in shadow roots
    const elements = root.querySelectorAll("*");
    for (const el of elements) {
      if (el.shadowRoot) {
        console.debug(
          `Checking shadow root of ${el.tagName} at depth ${depth} for pagination button`,
        );
        const found = findInShadowDOM(selector, el.shadowRoot, depth + 1);
        if (found) {
          console.debug(
            `✓ FOUND pagination button in shadow root of ${el.tagName} at depth ${depth}!`,
          );
          return found;
        }
      }
    }

    return null;
  }

  /**
   * Get auto-pagination config from chrome.storage.local
   */
  async function getConfig() {
    try {
      const result = await chrome.storage.local.get(AUTO_PAGINATION_KEY);
      return result[AUTO_PAGINATION_KEY] || null;
    } catch (e) {
      console.error("Error reading auto-pagination config:", e);
      return null;
    }
  }

  /**
   * Get auto-pagination state from chrome.storage.local
   */
  async function getState() {
    try {
      const result = await chrome.storage.local.get(AUTO_PAGINATION_STATE_KEY);
      return (
        result[AUTO_PAGINATION_STATE_KEY] || { running: false, pageCount: 0 }
      );
    } catch (e) {
      console.error("Error reading auto-pagination state:", e);
      return { running: false, pageCount: 0 };
    }
  }

  /**
   * Save auto-pagination state to chrome.storage.local
   */
  async function setState(state) {
    try {
      await chrome.storage.local.set({ [AUTO_PAGINATION_STATE_KEY]: state });
    } catch (e) {
      console.error("Error saving auto-pagination state:", e);
    }
  }

  /**
   * Click the next button using the configured selector
   */
  function clickNextButton(selector) {
    console.log("🔍 Looking for next button with selector:", selector);

    // Try regular DOM first
    let button = document.querySelector(selector);

    // If not found, search in shadow DOMs
    if (!button) {
      console.log("Not found in document, searching shadow DOMs...");
      button = findInShadowDOM(selector);
    }

    if (!button) {
      console.error("❌ Next button not found with selector:", selector);
      return false;
    }

    console.log("✓ Found next button:", button);

    // Check if button is disabled or hidden
    if (button.disabled || button.getAttribute("disabled") !== null) {
      console.log("⚠️  Next button is disabled - reached end of pagination");
      return false;
    }

    const style = window.getComputedStyle(button);
    if (style.display === "none" || style.visibility === "hidden") {
      console.log("⚠️  Next button is hidden - reached end of pagination");
      return false;
    }

    // Click the button
    console.log("🖱️  Clicking next button...");
    button.click();
    return true;
  }

  /**
   * Start auto-pagination
   */
  /**
   * Start auto-pagination workflow
   */
  async function startAutoPagination() {
    const config = await getConfig();
    if (!config || !config.nextButtonSelector) {
      console.error("No auto-pagination config found");
      return;
    }

    console.log("🚀 Starting auto-pagination with config:", config);

    // Update state
    const state = await getState();
    state.running = true;
    state.pageCount = (state.pageCount || 0) + 1;
    await setState(state);

    // Notify user
    showStatus(`Auto-pagination active (Page ${state.pageCount})`);
  }

  /**
   * Handle save complete - navigate to next page
   */
  async function handleSaveComplete() {
    const config = await getConfig();
    const state = await getState();

    if (!state.running || !config) {
      return;
    }

    console.log("📄 Save complete, navigating to next page...");

    // Check max pages limit
    if (config.maxPages && state.pageCount >= config.maxPages) {
      await stopAutoPagination();
      showStatus(
        `Auto-pagination complete - saved ${state.pageCount} pages`,
        true,
      );
      return;
    }

    // Small delay before clicking next
    setTimeout(() => {
      const clicked = clickNextButton(config.nextButtonSelector);
      if (!clicked) {
        stopAutoPagination();
        showStatus("Auto-pagination stopped - no more pages", true);
      }
    }, config.delayBeforeNext || 2000);
  }

  /**
   * Stop auto-pagination
   */
  async function stopAutoPagination() {
    console.log("🛑 Stopping auto-pagination");

    const state = await getState();
    state.running = false;
    await setState(state);

    showStatus("Auto-pagination stopped", true);
  }

  /**
   * Reset pagination counter
   */
  async function resetPagination() {
    await setState({ running: false, pageCount: 0 });
  }

  /**
   * Show status message to user
   */
  function showStatus(message, isError = false) {
    console.log(isError ? "❌" : "✓", message);

    // Create a simple toast notification
    const toast = document.createElement("div");
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${isError ? "#f44336" : "#4CAF50"};
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 999999;
      animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease-in";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Listen for messages from popup/service worker
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startAutoPagination") {
      startAutoPagination().then(() => {
        sendResponse({ success: true });
      });
      return true;
    }

    if (message.action === "stopAutoPagination") {
      stopAutoPagination().then(() => {
        sendResponse({ success: true });
      });
      return true;
    }

    if (message.action === "resetPagination") {
      resetPagination().then(() => {
        sendResponse({ success: true });
      });
      return true;
    }

    if (message.action === "getAutoPaginationState") {
      getState().then((state) => {
        sendResponse(state);
      });
      return true;
    }

    if (message.action === "saveComplete") {
      handleSaveComplete().then(() => {
        sendResponse({ success: true });
      });
      return true;
    }
  });

  /**
   * Check if auto-pagination should start on page load
   */
  function checkAutoStart() {
    const state = getState();
    if (state.running) {
      console.log(
        "📋 Auto-pagination is running, will wait for save command...",
      );
      // Auto-pagination is running, wait for the save to trigger next navigation
      // The popup will send the save command
    }
  }

  // Add CSS for toast animations
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // Check on page load
  checkAutoStart();

  console.debug("✓ Auto-pagination module loaded");
})();
