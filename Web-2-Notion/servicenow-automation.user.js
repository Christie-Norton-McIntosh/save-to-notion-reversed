// ==UserScript==
// @name         ServiceNow Auto-Pagination with Keyboard Maestro
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Floating panel for ServiceNow auto-pagination. Uses visual indicators for Keyboard Maestro to handle Web-2-Notion extension interactions.
// @author       GitHub Copilot
// @match        https://*.servicenow.com/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Configuration
  let config = {
    saveDelay: 2000, // Delay after opening popup before assuming user clicked save (ms)
    nextDelay: 3000, // Delay after clicking next before starting next cycle (ms)
    autoLoop: false,
    // If true, the page will attempt to synthesize Option+Shift+E when signalling save.
    // Most browsers/extensions ignore synthetic events; this is a best-effort convenience only.
    trySyntheticKeystroke: false,
  };

  // State
  let isRunning = false;
  let loopInterval = null;
  let saveInProgress = false;

  // Listen for save completion from extension
  document.addEventListener("notionSaveComplete", () => {
    console.log("[Workaround] Save completed");
    saveInProgress = false;
    removeSaveIndicator();
    updateStatus("Save completed");
    if (config.autoLoop && isRunning) {
      setTimeout(() => {
        handleNext();
      }, 1000);
    }
  });

  // Create floating panel
  function createPanel() {
    const panel = document.createElement("div");
    panel.id = "stn-workaround-panel";
    panel.style.cssText = `
      position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 2147483647;
      background: rgba(255, 255, 255, 0.95);
      border: 2px solid #333;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      min-width: 250px;
      pointer-events: auto; /* ensure clicks reach the panel */
      -webkit-user-select: none;
      touch-action: manipulation;
    `;

    panel.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold; color: #333;">
                Web-2-Notion + Keyboard Maestro
            </div>
            <div style="display: flex; gap: 8px; margin-bottom: 10px;">
        <button id="save-btn" role="button" tabindex="0" aria-label="Signal Save" style="
                    flex: 1;
                    padding: 8px 12px;
                    background: linear-gradient(90deg, #6a5af9, #8b5cf6);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                ">Signal Save</button>
        <button id="next-btn" role="button" tabindex="0" aria-label="Next Page" style="
                    flex: 1;
                    padding: 8px 12px;
                    background: linear-gradient(90deg, #10b981, #059669);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                ">Next Page</button>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                <label for="auto-toggle" style="font-size: 12px; color: #555;">Auto Loop:</label>
                <input type="checkbox" id="auto-toggle" style="cursor: pointer;" aria-label="Auto Loop">
                <span id="status" aria-live="polite" style="font-size: 11px; color: #666; flex: 1;">Stopped</span>
            </div>
            <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                <label style="font-size: 11px; color: #555;">Save Delay (ms):</label>
                <input type="number" id="save-delay" value="${config.saveDelay}" min="500" max="10000" step="500" style="width: 80px; font-size: 11px; padding: 2px;">
            </div>
            <div style="display: flex; gap: 8px;">
                <label style="font-size: 11px; color: #555;">Next Delay (ms):</label>
                <input type="number" id="next-delay" value="${config.nextDelay}" min="1000" max="20000" step="500" style="width: 80px; font-size: 11px; padding: 2px;">
            </div>
        `;

    document.body.appendChild(panel);

    // Wait for next tick to ensure DOM is updated, then add event listeners
    setTimeout(() => {
      const saveBtn = document.getElementById("save-btn");
      const nextBtn = document.getElementById("next-btn");
      const autoToggle = document.getElementById("auto-toggle");
      const saveDelay = document.getElementById("save-delay");
      const nextDelay = document.getElementById("next-delay");

      if (saveBtn) saveBtn.addEventListener("click", handleSave);
      if (nextBtn) nextBtn.addEventListener("click", handleNext);
      if (autoToggle) autoToggle.addEventListener("change", handleAutoToggle);
      if (saveDelay)
        saveDelay.addEventListener("change", (e) => {
          config.saveDelay = parseInt(e.target.value);
        });
      if (nextDelay)
        nextDelay.addEventListener("change", (e) => {
          config.nextDelay = parseInt(e.target.value);
        });

      console.log("[Workaround] Event listeners attached");
    }, 0);
  }

  // Handle Save Page button
  function handleSave() {
    if (saveInProgress) return;
    saveInProgress = true;
    console.log("[Workaround] Indicating time to save...");
    updateStatus("Waiting for Keyboard Maestro to save...");

    // Add visual indicator for Keyboard Maestro to detect
    addSaveIndicator();

    // Best-effort: try to open extension popup by synthesizing Option+Shift+E
    if (config.trySyntheticKeystroke) {
      try {
        console.debug(
          "[Workaround] dispatching synthetic Option+Shift+E (best-effort)",
        );
        const kd = new KeyboardEvent("keydown", {
          key: "E",
          code: "KeyE",
          keyCode: 69,
          which: 69,
          altKey: true,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        });
        window.dispatchEvent(kd);
        const ku = new KeyboardEvent("keyup", {
          key: "E",
          code: "KeyE",
          keyCode: 69,
          which: 69,
          altKey: true,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        });
        window.dispatchEvent(ku);
      } catch (e) {
        console.debug("[Workaround] synthetic keystroke failed", e);
      }
    }
  }

  // Handle Next Page button
  function handleNext() {
    console.log("[Workaround] Clicking next page button...");
    updateStatus("Clicking next...");

    // Find and click the ServiceNow next button
    const nextButton = document.querySelector(
      "ft-button[forcetooltip][trailingicon]",
    );
    if (nextButton) {
      nextButton.click();
      console.log("[Workaround] Next button clicked");

      setTimeout(() => {
        updateStatus("Next page loaded");
        if (config.autoLoop && isRunning) {
          setTimeout(() => {
            handleSave();
          }, 1000); // Brief pause before save
        }
      }, config.nextDelay);
    } else {
      console.error("[Workaround] Next button not found");
      updateStatus("Next button not found!");
      stopAutoLoop();
    }
  }

  // Handle auto loop toggle
  function handleAutoToggle(e) {
    config.autoLoop = e.target.checked;
    if (config.autoLoop) {
      startAutoLoop();
    } else {
      stopAutoLoop();
    }
  }

  // Start auto loop
  function startAutoLoop() {
    if (isRunning) return;
    isRunning = true;
    updateStatus("Auto loop started");
    console.log("[Workaround] Auto loop started");

    // Start with save
    handleSave();
  }

  // Stop auto loop
  function stopAutoLoop() {
    isRunning = false;
    if (loopInterval) {
      clearInterval(loopInterval);
      loopInterval = null;
    }
    updateStatus("Stopped");
    console.log("[Workaround] Auto loop stopped");
  }

  // Add visual indicator for Keyboard Maestro
  function addSaveIndicator() {
    let indicator = document.getElementById("km-save-indicator");
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "km-save-indicator";
      indicator.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        width: 20px;
        height: 20px;
        background: red;
        border-radius: 50%;
        z-index: 9999;
        display: block;
      `;
      document.body.appendChild(indicator);
      console.log("[Workaround] Save indicator created");
    }
    indicator.style.display = "block";
    console.log(
      "[Workaround] Save indicator shown - Keyboard Maestro should detect this",
    );
  }

  // Remove visual indicator
  function removeSaveIndicator() {
    const indicator = document.getElementById("km-save-indicator");
    if (indicator) {
      indicator.style.display = "none";
    }
  }

  // Update small status text in the panel (safe no-op if element missing)
  function updateStatus(text, timeoutMs) {
    try {
      const el = document.getElementById("status");
      if (el) el.textContent = text || "";
    } catch (e) {
      console.debug("[Workaround] updateStatus failed:", e);
    }
    if (timeoutMs && text) {
      setTimeout(() => {
        try {
          const el = document.getElementById("status");
          if (el) el.textContent = "";
        } catch (e) {
          /* nothing */
        }
      }, timeoutMs);
    }
  }

  // Ensure the panel's event listeners remain attached if the page re-renders
  function ensurePanelPresent() {
    const panel = document.getElementById("stn-workaround-panel");
    if (!panel) {
      createPanel();
      return;
    }

    // Make sure pointer events are enabled (some pages set pointer-events:none globally)
    panel.style.pointerEvents = "auto";
    panel.querySelectorAll("button, input").forEach((n) => {
      n.style.pointerEvents = "auto";
      n.tabIndex = 0;
    });
  }

  // Fallback: if something blocks native clicks (overlay), respond to mousedown inside panel
  function installClickFallback() {
    document.addEventListener(
      "pointerdown",
      (ev) => {
        try {
          const panel = document.getElementById("stn-workaround-panel");
          if (!panel) return;
          if (!panel.contains(ev.target)) return;

          // find closest actionable element
          const btn = ev.target.closest(
            "button[id='save-btn'], button[id='next-btn']",
          );
          if (btn) {
            ev.preventDefault();
            ev.stopPropagation();
            // call handlers directly to avoid relying on synthetic click propagation
            if (btn.id === "save-btn") {
              console.debug("[Workaround] Fallback triggered: save-btn");
              handleSave();
            } else if (btn.id === "next-btn") {
              console.debug("[Workaround] Fallback triggered: next-btn");
              handleNext();
            }
          }
        } catch (e) {
          console.debug("[Workaround] click fallback error", e);
        }
      },
      { capture: true, passive: false },
    );
  }

  // Initialize
  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", createPanel);
    } else {
      createPanel();
    }
    // Make the panel robust to SPA re-renders and install fallbacks
    ensurePanelPresent();
    installClickFallback();

    // If the page removes or replaces our panel, recreate it
    const mo = new MutationObserver(() => {
      if (!document.getElementById("stn-workaround-panel")) {
        console.debug("[Workaround] panel removed — recreating");
        createPanel();
        ensurePanelPresent();
      }
    });
    mo.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
    });
  }

  init();

  // Expose small API for external automation (Keyboard Maestro can Execute JavaScript)
  window.__stn_signalSave = function () {
    try {
      handleSave();
      return true;
    } catch (e) {
      console.debug("[Workaround] __stn_signalSave error", e);
      return false;
    }
  };
  window.__stn_nextPage = function () {
    try {
      handleNext();
      return true;
    } catch (e) {
      console.debug("[Workaround] __stn_nextPage error", e);
      return false;
    }
  };
  window.__stn_getStatus = function () {
    const el = document.getElementById("status");
    return el ? el.textContent : null;
  };
  window.__stn_setOption = function (key, value) {
    try {
      if (key in config) {
        config[key] = value;
        return true;
      }
      return false;
    } catch (e) {
      console.debug("[Workaround] __stn_setOption error", e);
      return false;
    }
  };
})();
