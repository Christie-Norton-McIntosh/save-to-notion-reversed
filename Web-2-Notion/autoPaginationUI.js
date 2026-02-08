/**
 * Auto-Pagination UI Controller
 * Manages the configuration interface for auto-pagination
 */

(function () {
  "use strict";

  const AUTO_PAGINATION_KEY = "__stn_auto_pagination";
  const AUTO_PAGINATION_STATE_KEY = "__stn_auto_pagination_state";

  // DOM elements
  const form = document.getElementById("configForm");
  const selectorInput = document.getElementById("selector");
  const delayInput = document.getElementById("delay");
  const maxPagesInput = document.getElementById("maxPages");
  const statusDiv = document.getElementById("status");
  const pageCountSpan = document.getElementById("pageCount");
  const backBtnTop = document.getElementById("backBtnTop");
  const resetBtn = document.getElementById("resetBtn");

  /**
   * Load configuration from chrome.storage.local
   */
  async function loadConfig() {
    try {
      const result = await chrome.storage.local.get(AUTO_PAGINATION_KEY);
      if (result[AUTO_PAGINATION_KEY]) {
        const config = result[AUTO_PAGINATION_KEY];
        selectorInput.value = config.nextButtonSelector || "";
        delayInput.value = config.delayBeforeNext || 2000;
        maxPagesInput.value = config.maxPages || "";
      }
    } catch (e) {
      console.error("Error loading config:", e);
    }
  }

  /**
   * Save configuration to chrome.storage.local
   */
  async function saveConfig(config) {
    try {
      await chrome.storage.local.set({ [AUTO_PAGINATION_KEY]: config });
      showStatus("Configuration saved successfully!", "info");
    } catch (e) {
      console.error("Error saving config:", e);
      showStatus("Error saving configuration", "inactive");
    }
  }

  /**
   * Get current state from chrome.storage.local
   */
  async function getState() {
    try {
      const result = await chrome.storage.local.get(AUTO_PAGINATION_STATE_KEY);
      return (
        result[AUTO_PAGINATION_STATE_KEY] || { running: false, pageCount: 0 }
      );
    } catch (e) {
      console.error("Error reading state:", e);
      return { running: false, pageCount: 0 };
    }
  }

  /**
   * Update UI based on current state
   */
  async function updateUI() {
    const state = await getState();
    pageCountSpan.textContent = state.pageCount || 0;

    if (state.running) {
      showStatus("Auto-pagination is running...", "active");
    }
  }

  /**
   * Show status message
   */
  function showStatus(message, type = "info") {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
  }

  /**
   * Send message to active tab
   */
  async function sendToActiveTab(action) {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) {
        throw new Error("No active tab found");
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action });
      return response;
    } catch (e) {
      console.error("Error sending message to tab:", e);
      throw e;
    }
  }

  /**
   * Handle form submission
   */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const config = {
      nextButtonSelector: selectorInput.value.trim(),
      delayBeforeNext: parseInt(delayInput.value, 10) || 2000,
      maxPages: maxPagesInput.value ? parseInt(maxPagesInput.value, 10) : null,
    };

    if (!config.nextButtonSelector) {
      showStatus("Please enter a CSS selector", "inactive");
      return;
    }

    await saveConfig(config);
  });

  /**
   * Back button - close this tab and try to open main popup
   */
  backBtnTop.addEventListener("click", async () => {
    // Close the configuration tab
    const tab = await chrome.tabs.getCurrent();
    if (tab?.id) {
      await chrome.tabs.remove(tab.id);
    } else {
      window.close();
    }

    // Try to open the main extension popup
    try {
      chrome.action?.openPopup?.();
    } catch (e) {
      // If popup opening fails, that's okay - the options page will just close
      console.log("Could not open main interface popup");
    }
  });

  /**
   * Reset page counter
   */
  resetBtn.addEventListener("click", async () => {
    if (!confirm("Reset the page counter to 0?")) {
      return;
    }

    try {
      await sendToActiveTab("resetPagination");
      showStatus("Counter reset", "info");
      updateUI();
    } catch (e) {
      showStatus("Error resetting counter", "inactive");
      console.error(e);
    }
  });

  /**
   * Poll for state updates
   */
  function pollState() {
    updateUI();
  }

  // Initialize
  loadConfig();
  updateUI();

  // Poll for state changes every second
  setInterval(pollState, 1000);

  console.log("Auto-pagination UI loaded");
})();
