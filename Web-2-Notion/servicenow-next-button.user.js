// ==UserScript==
// @name         ServiceNow — Floating Next Button
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds a floating "Next" button (bottom-right) that clicks ServiceNow's pagination control (selector: ft-button[forcetooltip][trailingicon]). Supports single-click, keyboard shortcut, and automatic looping with configurable delay.
// @author       GitHub Copilot
// @match        https://*.servicenow.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
  "use strict";
  if (window.__stnNextButtonInjected) return;
  window.__stnNextButtonInjected = true;

  const KEY = "__stn_next_btn_cfg_v1";
  const DEFAULT = { interval: 3000, running: false, maxFailures: 5 };

  // Safe localStorage helpers
  function loadCfg() {
    try {
      return Object.assign(
        {},
        DEFAULT,
        JSON.parse(localStorage.getItem(KEY) || "{}"),
      );
    } catch (e) {
      return Object.assign({}, DEFAULT);
    }
  }
  function saveCfg(cfg) {
    try {
      localStorage.setItem(KEY, JSON.stringify(cfg));
    } catch (e) {
      /* ignore */
    }
  }

  let cfg = loadCfg();
  let autoTimer = null;
  let consecutiveFailures = 0;

  /* Find element in light DOM or shadow DOM */
  function findInShadowDOM(selector, root = document, depth = 0) {
    if (!selector || depth > 20 || !root) return null;
    try {
      const el = root.querySelector(selector);
      if (el) return el;
    } catch (e) {
      // invalid selector for this root
    }
    const nodes = root.querySelectorAll("*");
    for (const n of nodes) {
      if (n.shadowRoot) {
        const found = findInShadowDOM(selector, n.shadowRoot, depth + 1);
        if (found) return found;
      }
    }
    return null;
  }

  function findNextButton() {
    // primary selector used by ServiceNow
    const sel = "ft-button[forcetooltip][trailingicon]";
    return findInShadowDOM(sel) || document.querySelector(sel) || null;
  }

  function simulateClick(el) {
    if (!el) return false;
    try {
      // Prefer native click, but also dispatch mouse events for robustness
      el.click?.();
      const evInit = { bubbles: true, cancelable: true, composed: true };
      el.dispatchEvent(new MouseEvent("pointerdown", evInit));
      el.dispatchEvent(new MouseEvent("mousedown", evInit));
      el.dispatchEvent(new MouseEvent("mouseup", evInit));
      el.dispatchEvent(new MouseEvent("click", evInit));
      return true;
    } catch (err) {
      console.debug("[stn-next] click failed", err);
      return false;
    }
  }

  function clickNext() {
    const btn = findNextButton();
    if (!btn) {
      console.warn("[stn-next] Next button not found");
      consecutiveFailures++;
      updateStatus("Next not found");
      return false;
    }
    const ok = simulateClick(btn);
    if (ok) {
      consecutiveFailures = 0;
      updateStatus("Clicked");
      return true;
    } else {
      consecutiveFailures++;
      updateStatus("Click failed");
      return false;
    }
  }

  /* Auto loop control */
  function startAuto() {
    if (autoTimer) return;
    cfg.running = true;
    saveCfg(cfg);
    updateControls();
    updateStatus("Running");
    consecutiveFailures = 0;
    autoTimer = setInterval(
      () => {
        const ok = clickNext();
        if (!ok && consecutiveFailures >= cfg.maxFailures) {
          stopAuto();
          updateStatus("Stopped (no button)");
        }
      },
      Math.max(500, Number(cfg.interval) || 3000),
    );
  }
  function stopAuto() {
    if (!autoTimer) return;
    clearInterval(autoTimer);
    autoTimer = null;
    cfg.running = false;
    saveCfg(cfg);
    updateControls();
    updateStatus("Stopped");
  }
  function toggleAuto() {
    if (autoTimer) stopAuto();
    else startAuto();
  }

  /* UI */
  let panel = null;
  function createPanel() {
    if (document.getElementById("stn-next-panel")) return;
    panel = document.createElement("div");
    panel.id = "stn-next-panel";
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Auto next page");
    Object.assign(panel.style, {
      position: "fixed",
      right: "14px",
      bottom: "14px",
      zIndex: 2147483647,
      background: "linear-gradient(180deg,#fff,#f6f7fb)",
      border: "1px solid rgba(0,0,0,0.08)",
      boxShadow: "0 6px 20px rgba(12,24,48,0.12)",
      borderRadius: "10px",
      padding: "8px",
      display: "flex",
      gap: "8px",
      alignItems: "center",
      minWidth: "220px",
      fontFamily: "Inter, -apple-system, system-ui, sans-serif",
      fontSize: "13px",
      color: "#0b2545",
      pointerEvents: "auto",
    });

    panel.innerHTML = `
  <button id="stn-next-single" title="Click next (⌘⇧E)" style="background:#2d6cff;color:#fff;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;">Next</button>
      <div style="display:flex;flex-direction:column;gap:6px;flex:1;">
        <div style="display:flex;align-items:center;gap:8px;">
          <button id="stn-next-toggle" style="background:linear-gradient(90deg,#10b981,#059669);color:#fff;border:none;padding:6px 10px;border-radius:8px;cursor:pointer;">Start</button>
          <div style="display:flex;gap:6px;align-items:center;font-size:12px;color:#556674;"><label for="stn-next-interval" style="margin-right:4px;color:#556674;">Delay(ms)</label><input id="stn-next-interval" type="number" min="500" step="250" style="width:82px;padding:6px;border-radius:6px;border:1px solid #e6ecf8;background:#fff;font-size:12px;" /></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
          <div id="stn-next-status" style="color:#7b8794;font-size:12px;">Stopped</div>
          <div style="color:#9aa9bf;font-size:11px;">Selector: <code style="background:#f1f5fb;padding:2px 6px;border-radius:4px;font-size:11px;color:#244">ft-button[forcetooltip][trailingicon]</code></div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    // wire up
    panel.querySelector("#stn-next-single").addEventListener("click", () => {
      clickNext();
    });
    const toggle = panel.querySelector("#stn-next-toggle");
    toggle.addEventListener("click", toggleAuto);
    const intervalEl = panel.querySelector("#stn-next-interval");
    intervalEl.value = cfg.interval;
    intervalEl.addEventListener("change", (e) => {
      const v = Math.max(500, Number(e.target.value) || DEFAULT.interval);
      cfg.interval = v;
      saveCfg(cfg);
      intervalEl.value = v;
      if (autoTimer) {
        stopAuto();
        startAuto();
      }
    });

    updateControls();
  }

  function updateControls() {
    const toggle = document.querySelector("#stn-next-toggle");
    const status = document.querySelector("#stn-next-status");
    const intervalEl = document.querySelector("#stn-next-interval");
    if (!toggle || !status || !intervalEl) return;
    toggle.textContent = cfg.running ? "Stop" : "Start";
    status.textContent = cfg.running ? "Running" : "Stopped";
    intervalEl.value = cfg.interval;
  }

  function updateStatus(txt) {
    const s = document.getElementById("stn-next-status");
    if (s) s.textContent = txt;
    console.debug("[stn-next]", txt);
  }

  // Keyboard shortcut: Command+Shift+E
  function onKey(e) {
    // Support macOS Command (metaKey) + Shift + 'E'
    if (e.key && e.key.toLowerCase() === "e" && e.metaKey && e.shiftKey) {
      e.preventDefault();
      clickNext();
    }
  }

  // Ensure panel exists and remains interactive on SPA navigations
  function ensure() {
    createPanel();
    document.removeEventListener("keydown", onKey, true);
    document.addEventListener("keydown", onKey, true);
  }

  // Observe DOM for significant changes and re-ensure the panel
  const mo = new MutationObserver(() => {
    if (!document.getElementById("stn-next-panel")) ensure();
  });
  mo.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
  });

  // Init
  ensure();

  // Expose small API
  window.__stn_clickNext = clickNext;
  window.__stn_startNextLoop = startAuto;
  window.__stn_stopNextLoop = stopAuto;

  // Clean-up on unload
  window.addEventListener("unload", () => {
    if (autoTimer) clearInterval(autoTimer);
    document.removeEventListener("keydown", onKey, true);
  });
})();
