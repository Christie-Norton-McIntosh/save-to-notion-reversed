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

  // Listen for save complete messages from popup
  if (
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    chrome.runtime.onMessage
  ) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === "saveComplete") {
        console.debug("[Auto-Pagination] Save completed, dispatching event");
        document.dispatchEvent(new CustomEvent("notionSaveComplete"));
      }
    });
  }

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
   * Falls back to localStorage if extension context is invalidated
   */
  async function getConfig() {
    // Check if chrome API is available before using it
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      try {
        const result = await chrome.storage.local.get(AUTO_PAGINATION_KEY);
        return result[AUTO_PAGINATION_KEY] || null;
      } catch (e) {
        console.warn(
          "chrome.storage.local failed, falling back to localStorage:",
          e,
        );
      }
    } else {
      console.log("chrome.storage.local not available, using localStorage");
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(AUTO_PAGINATION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (parseError) {
      console.error("Error parsing localStorage config:", parseError);
      return null;
    }
  }

  /**
   * Get auto-pagination state from chrome.storage.local
   * Falls back to localStorage if extension context is invalidated
   */
  async function getState() {
    // Check if chrome API is available before using it
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      try {
        const result = await chrome.storage.local.get(
          AUTO_PAGINATION_STATE_KEY,
        );
        return (
          result[AUTO_PAGINATION_STATE_KEY] || { running: false, pageCount: 0 }
        );
      } catch (e) {
        console.warn(
          "chrome.storage.local failed, falling back to localStorage:",
          e,
        );
      }
    } else {
      console.log("chrome.storage.local not available, using localStorage");
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(AUTO_PAGINATION_STATE_KEY);
      return stored ? JSON.parse(stored) : { running: false, pageCount: 0 };
    } catch (parseError) {
      console.error("Error parsing localStorage state:", parseError);
      return { running: false, pageCount: 0 };
    }
  }

  /**
   * Save auto-pagination state to chrome.storage.local
   * Also saves to localStorage as backup
   */
  async function setState(state) {
    // Always save to localStorage first
    try {
      localStorage.setItem(AUTO_PAGINATION_STATE_KEY, JSON.stringify(state));
      console.log("✓ State saved to localStorage:", state);
    } catch (e) {
      console.error("Error saving to localStorage:", e);
    }

    // Try to save to chrome.storage.local if available
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      try {
        await chrome.storage.local.set({ [AUTO_PAGINATION_STATE_KEY]: state });
        console.log("✓ State saved to chrome.storage.local");
      } catch (e) {
        console.warn("Could not save to chrome.storage.local:", e);
      }
    } else {
      console.log(
        "chrome.storage.local not available, using localStorage only",
      );
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
   * Create and show the floating "Save & Next" button
   */
  function createFloatingButton() {
    // Check if button already exists
    const existingButton = document.getElementById(
      "stn-auto-pagination-button",
    );
    if (existingButton) {
      console.log("Button already exists, re-enabling it");
      // Button exists from previous page, just re-enable it
      const buttonEl = existingButton.querySelector(".stn-ap-button");
      if (buttonEl) {
        buttonEl.classList.remove("disabled");
        buttonEl.classList.remove("saving");
      }
      return;
    }

    const button = document.createElement("div");
    button.id = "stn-auto-pagination-button";
    button.innerHTML = `
      <div class="stn-ap-button">
        <div class="stn-ap-icon">⚡</div>
        <div class="stn-ap-text">Save & Next</div>
        <div class="stn-ap-counter" id="stn-ap-counter"></div>
        <button class="stn-ap-stop-btn" id="stn-ap-stop-btn" title="Stop Auto-Pagination">✕</button>
      </div>
      <div class="stn-ap-status" id="stn-ap-status"></div>
    `;

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      #stn-auto-pagination-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      .stn-ap-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
        user-select: none;
      }
      
      .stn-ap-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6);
      }
      
      .stn-ap-button:active {
        transform: translateY(0);
      }
      
      .stn-ap-button.disabled {
        background: #ccc;
        cursor: not-allowed;
        opacity: 0.6;
      }
      
      .stn-ap-button.disabled:hover {
        transform: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      
      .stn-ap-button.saving {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }
      
      .stn-ap-icon {
        font-size: 20px;
      }
      
      .stn-ap-text {
        font-weight: 600;
        font-size: 14px;
      }
      
      .stn-ap-counter {
        background: rgba(255, 255, 255, 0.3);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
      
      .stn-ap-stop-btn {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.4);
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 0;
        margin-left: 4px;
      }
      
      .stn-ap-stop-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.6);
        transform: scale(1.1);
      }
      
      .stn-ap-stop-btn:active {
        transform: scale(0.95);
      }
      
      .stn-ap-status {
        margin-top: 8px;
        font-size: 12px;
        color: #666;
        text-align: center;
        background: white;
        padding: 6px 12px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: none;
      }
      
      .stn-ap-status.show {
        display: block;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(button);

    // Add click handler for main button
    const buttonEl = button.querySelector(".stn-ap-button");
    buttonEl.addEventListener("click", handleSaveAndNext);

    // Add click handler for stop button
    const stopBtn = button.querySelector(".stn-ap-stop-btn");
    stopBtn.addEventListener("click", async (e) => {
      e.stopPropagation(); // Prevent triggering the main button click
      if (confirm("Stop Auto-Pagination?")) {
        await stopAutoPagination();
        showButtonStatus("Auto-Pagination stopped", 3000);
      }
    });

    // Update counter
    updateButtonCounter();

    console.log("✓ Save & Next button created");
  }

  /**
   * Update the button counter display
   */
  async function updateButtonCounter() {
    const state = await getState();
    const counter = document.getElementById("stn-ap-counter");
    if (counter) {
      counter.textContent = `Page ${(state.pageCount || 0) + 1}`;
    }
  }

  /**
   * Show status message on the button
   */
  function showButtonStatus(message, duration = 2000) {
    const status = document.getElementById("stn-ap-status");
    if (status) {
      status.textContent = message;
      status.classList.add("show");
      setTimeout(() => {
        status.classList.remove("show");
      }, duration);
    }
  }

  /**
   * Disable the button temporarily
   */
  function disableButton(disabled = true) {
    const button = document.querySelector(".stn-ap-button");
    if (button) {
      if (disabled) {
        button.classList.add("disabled");
      } else {
        button.classList.remove("disabled");
      }
    }
  }

  /**
   * Handle Save & Next button click
   */
  async function handleSaveAndNext() {
    const button = document.querySelector(".stn-ap-button");
    if (button && button.classList.contains("disabled")) {
      return; // Button is disabled, ignore click
    }

    const config = await getConfig();
    if (!config || !config.nextButtonSelector) {
      showButtonStatus("❌ Configure selector in settings first", 3000);
      showStatus(
        "Please configure next button selector in Auto-Pagination settings",
        true,
      );
      return;
    }

    const state = await getState();

    // Check max pages limit
    if (config.maxPages && state.pageCount >= config.maxPages) {
      showButtonStatus(`✓ Complete! Saved ${state.pageCount} pages`, 3000);
      await stopAutoPagination();
      return;
    }

    disableButton(true);
    button.classList.add("saving");
    showButtonStatus("💾 Save page now, then I'll click Next...", 5000);
    showStatus("Please click 'Save Page' in the extension popup", false);

    console.log("👉 Waiting for user to save the page...");
    console.log(
      `⏱️  Will auto-advance in ${config.autoAdvanceDelay || 5000}ms`,
    );

    // User needs to manually click "Save Page" in popup
    // After they do, they should click the "Save & Next" button again
    // OR we wait and auto-proceed after a delay

    const autoAdvanceDelay = config.autoAdvanceDelay || 5000;

    setTimeout(async () => {
      console.log("⏱️ Auto-advancing after delay...");
      console.log("Current state before increment:", state);

      // Increment page count
      state.pageCount = (state.pageCount || 0) + 1;
      await setState(state);
      console.log("State after increment:", state);

      await updateButtonCounter();
      console.log("Button counter updated");

      // Click the next button
      const delay = config.delayBeforeNext || 1000;
      console.log(`Waiting ${delay}ms before clicking next button...`);

      setTimeout(() => {
        console.log("Attempting to click next button now...");
        const clicked = clickNextButton(config.nextButtonSelector);

        if (!clicked) {
          console.error("❌ Failed to click next button!");
          showButtonStatus("❌ Next button not found", 3000);
          showStatus("Next button not found - check selector", true);
          disableButton(false);
          button.classList.remove("saving");
        } else {
          console.log("✅ Successfully clicked next button!");
          showButtonStatus("✓ Navigating to next page...", 2000);
          showStatus(`Navigating to page ${state.pageCount + 1}...`, false);
          // Button will be re-enabled on next page load
        }
      }, delay);
    }, autoAdvanceDelay);
  }

  /**
   * Remove the floating button
   */
  function removeFloatingButton() {
    const button = document.getElementById("stn-auto-pagination-button");
    if (button) {
      button.remove();
    }
  }

  /**
   * Start auto-pagination workflow
   */
  async function startAutoPagination() {
    const config = await getConfig();
    if (!config || !config.nextButtonSelector) {
      console.error("No auto-pagination config found");
      showStatus("Please configure Auto-Pagination settings first", true);
      return;
    }

    console.log("🚀 Starting auto-pagination with config:", config);

    // Update state
    const state = await getState();
    state.running = true;
    state.pageCount = state.pageCount || 0;
    await setState(state);

    // Show the floating button
    createFloatingButton();

    showStatus(`Auto-pagination active - Click "Save & Next" button to begin`);
  }

  /**
   * Trigger the save action by simulating extension icon click
   * This opens the popup which will save the page
   */
  async function triggerSaveAction() {
    console.log("💾 Triggering save action...");

    // Check if chrome runtime is available
    if (
      typeof chrome === "undefined" ||
      !chrome.runtime ||
      !chrome.runtime.sendMessage
    ) {
      console.warn("Chrome runtime not available - cannot trigger save action");
      return;
    }

    // Method 1: Try to open the extension popup programmatically
    try {
      // Send message to service worker to open popup
      await chrome.runtime.sendMessage({
        action: "openPopupAndSave",
      });
    } catch (e) {
      console.debug("Could not send openPopupAndSave message:", e);
    }

    // Method 2: Trigger clipboard save (same as Ctrl+Shift+E)
    // This is the fallback that directly saves without opening popup
    try {
      // Dispatch keyboard event for add-highlights command
      await chrome.runtime.sendMessage({
        action: "triggerSaveCommand",
      });
    } catch (e) {
      console.debug("Could not trigger save command:", e);
    }
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

    console.log("📄 Save complete, preparing to navigate to next page...");

    // Check max pages limit
    if (config.maxPages && state.pageCount >= config.maxPages) {
      await stopAutoPagination();
      showStatus(
        `Auto-pagination complete - saved ${state.pageCount} pages`,
        false,
      );
      return;
    }

    // Small delay before clicking next
    const delay = config.delayBeforeNext || 2000;
    console.log(`⏳ Waiting ${delay}ms before clicking next button...`);

    setTimeout(() => {
      const clicked = clickNextButton(config.nextButtonSelector);
      if (!clicked) {
        stopAutoPagination();
        showStatus("Auto-pagination stopped - no more pages", true);
      } else {
        // Page will navigate, and we'll need to restart automation on new page
        console.log("✓ Clicked next button, page will navigate...");
        showStatus(`Navigating to page ${state.pageCount + 1}...`, false);
      }
    }, delay);
  }

  /**
   * Stop auto-pagination
   */
  async function stopAutoPagination() {
    console.log("🛑 Stopping auto-pagination");

    const state = await getState();
    state.running = false;
    await setState(state);

    removeFloatingButton();
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
  if (
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    chrome.runtime.onMessage
  ) {
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
  } else {
    console.warn(
      "chrome.runtime.onMessage not available - message listening disabled",
    );
  }

  /**
   * Check if auto-pagination should start on page load
   */
  async function checkAutoStart() {
    const state = await getState();
    const config = await getConfig();

    if (state.running && config) {
      console.log(
        `📋 Auto-pagination is running (page ${(state.pageCount || 0) + 1}), showing button...`,
      );

      // Wait for page to be fully loaded
      if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", () => {
          setTimeout(() => {
            createFloatingButton();
            // Use requestAnimationFrame to ensure button is in DOM before enabling
            requestAnimationFrame(() => {
              disableButton(false); // Re-enable button on new page
              console.log("✓ Button re-enabled on new page");

              // Auto-trigger the button if we're in the middle of auto-pagination
              if (state.pageCount > 0) {
                console.log("🤖 Auto-triggering Save & Next on new page...");
                setTimeout(() => {
                  handleSaveAndNext();
                }, 1000); // Give page a moment to settle
              }
            });
          }, 500);
        });
      } else {
        // Page already loaded
        setTimeout(() => {
          createFloatingButton();
          // Use requestAnimationFrame to ensure button is in DOM before enabling
          requestAnimationFrame(() => {
            disableButton(false); // Re-enable button on new page
            console.log("✓ Button re-enabled on new page");

            // Auto-trigger the button if we're in the middle of auto-pagination
            if (state.pageCount > 0) {
              console.log("🤖 Auto-triggering Save & Next on new page...");
              setTimeout(() => {
                handleSaveAndNext();
              }, 1000); // Give page a moment to settle
            }
          });
        }, 500);
      }
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
