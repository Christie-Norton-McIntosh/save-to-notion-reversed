/**
 * Auto-Pagination Popup Integration
 * Adds auto-pagination controls to the extension popup
 */

(function () {
  "use strict";

  const AUTO_PAGINATION_KEY = "__stn_auto_pagination";
  const AUTO_PAGINATION_STATE_KEY = "__stn_auto_pagination_state";

  /**
   * Get state from current tab's localStorage
   */
  async function getState() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) return { running: false, pageCount: 0 };

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "getAutoPaginationState",
      });

      return response || { running: false, pageCount: 0 };
    } catch (e) {
      console.debug("Could not get auto-pagination state:", e);
      return { running: false, pageCount: 0 };
    }
  }

  /**
   * Open auto-pagination settings page
   */
  function openSettings() {
    chrome.tabs.create({
      url: chrome.runtime.getURL("autoPagination.html"),
    });
  }

  /**
   * Inject auto-pagination content script if not already loaded
   */
  async function ensureScriptInjected() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) return;

      await chrome.runtime.sendMessage({
        action: "injectAutoPagination",
        tabId: tab.id,
      });
    } catch (e) {
      console.debug("Script already injected or error:", e);
    }
  }

  /**
   * Add UI controls to the popup
   */
  function addPopupUI() {
    // Wait for popup to be ready
    const checkInterval = setInterval(() => {
      // Try to find the root element
      const root = document.getElementById("root");
      if (!root || root.children.length === 0) return;

      clearInterval(checkInterval);

      // Check if we already added the button
      if (document.getElementById("auto-pagination-button")) return;

      // Create a container for auto-pagination controls
      const container = document.createElement("div");
      container.id = "auto-pagination-container";
      container.style.cssText = `
        padding: 12px 16px;
        border-top: 1px solid #e0e0e0;
        background: #f9f9f9;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      `;

      // Create button
      const button = document.createElement("button");
      button.id = "auto-pagination-button";
      button.textContent = "⚡ Auto-Pagination";
      button.style.cssText = `
        flex: 1;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 500;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;

      button.addEventListener("click", openSettings);
      button.addEventListener("mouseenter", () => {
        button.style.transform = "translateY(-1px)";
        button.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
      });
      button.addEventListener("mouseleave", () => {
        button.style.transform = "translateY(0)";
        button.style.boxShadow = "none";
      });

      // Create status indicator
      const statusIndicator = document.createElement("div");
      statusIndicator.id = "auto-pagination-status";
      statusIndicator.style.cssText = `
        font-size: 11px;
        color: #666;
        display: none;
      `;

      container.appendChild(button);
      container.appendChild(statusIndicator);

      // Try to append to the popup
      // The popup structure varies, so we'll try multiple approaches
      const possibleParents = [
        root.querySelector('[class*="container"]'),
        root.querySelector('[class*="popup"]'),
        root.querySelector("div > div"),
        root,
      ];

      for (const parent of possibleParents) {
        if (parent) {
          parent.appendChild(container);
          console.log("Auto-pagination button added to popup");
          break;
        }
      }

      // Update status
      updateStatus();
    }, 100);

    // Give up after 5 seconds
    setTimeout(() => clearInterval(checkInterval), 5000);
  }

  /**
   * Update status indicator
   */
  async function updateStatus() {
    const statusIndicator = document.getElementById("auto-pagination-status");
    if (!statusIndicator) return;

    const state = await getState();

    if (state.running) {
      statusIndicator.textContent = `Running (Page ${state.pageCount})`;
      statusIndicator.style.display = "block";
      statusIndicator.style.color = "#4CAF50";
    } else if (state.pageCount > 0) {
      statusIndicator.textContent = `${state.pageCount} pages saved`;
      statusIndicator.style.display = "block";
      statusIndicator.style.color = "#666";
    } else {
      statusIndicator.style.display = "none";
    }
  }

  /**
   * Intercept save button clicks to trigger auto-pagination
   */
  function interceptSaveActions() {
    // Listen for save complete messages
    // This would need to be integrated with the actual save logic
    // For now, we'll expose a global function that can be called
    window.__stn_notifyAutoPaginationSaveComplete = async function () {
      try {
        await ensureScriptInjected();
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tab?.id) {
          await chrome.tabs.sendMessage(tab.id, {
            action: "saveComplete",
          });
        }
      } catch (e) {
        console.error("Error notifying auto-pagination save complete:", e);
      }
    };
  }

  // Initialize when popup loads
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      addPopupUI();
      interceptSaveActions();
      ensureScriptInjected();
    });
  } else {
    addPopupUI();
    interceptSaveActions();
    ensureScriptInjected();
  }

  console.log("Auto-pagination popup integration loaded");
})();
