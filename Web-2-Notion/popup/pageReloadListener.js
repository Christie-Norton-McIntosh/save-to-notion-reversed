/**
 * Page Reload Listener
 * Reloads the popup when the active tab reloads or navigates to a new page
 */

(function () {
  "use strict";

  let currentTabId = null;
  let currentUrl = null;

  /**
   * Get the current active tab
   */
  async function getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      return tab;
    } catch (e) {
      console.debug("Could not get current tab:", e);
      return null;
    }
  }

  /**
   * Reload the popup
   */
  function reloadPopup() {
    console.debug("[PageReloadListener] Reloading popup due to page change");
    window.location.reload();
  }

  /**
   * Initialize the listener
   */
  async function init() {
    const tab = await getCurrentTab();
    if (!tab) return;

    currentTabId = tab.id;
    currentUrl = tab.url;

    // Listen for tab updates (reloads, navigations)
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      // Only react to changes on the current tab
      if (tabId !== currentTabId) return;

      // Check if the page has completed loading and the URL has changed
      if (changeInfo.status === "complete") {
        const newUrl = tab.url;

        // Reload popup if URL changed (navigation) or if it's the same URL (reload)
        if (newUrl !== currentUrl || changeInfo.url) {
          console.debug(
            "[PageReloadListener] Page changed:",
            currentUrl,
            "->",
            newUrl,
          );
          currentUrl = newUrl;
          reloadPopup();
        }
      }
    });

    // Listen for tab replacement (e.g., when a tab is replaced during navigation)
    chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
      if (removedTabId === currentTabId) {
        console.debug("[PageReloadListener] Tab replaced, reloading popup");
        currentTabId = addedTabId;
        reloadPopup();
      }
    });

    // Listen for active tab changes
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      if (activeInfo.tabId !== currentTabId) {
        console.debug(
          "[PageReloadListener] Active tab changed, reloading popup",
        );
        const tab = await getCurrentTab();
        if (tab) {
          currentTabId = tab.id;
          currentUrl = tab.url;
          reloadPopup();
        }
      }
    });

    console.debug("[PageReloadListener] Initialized for tab:", currentTabId);
  }

  // Initialize when the popup loads
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
