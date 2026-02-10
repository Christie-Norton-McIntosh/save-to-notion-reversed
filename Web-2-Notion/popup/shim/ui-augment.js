// Web-2-Notion/popup/shim/ui-augment.js
(() => {
  const DEBUG = false;

  const KEYS = {
    formatMode: "__stn_format_mode",
  };

  function ready(fn) {
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    )
      fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function ensureControls() {
    if (document.querySelector("#stn-format-controls")) return;

    const root = document.querySelector("#root") || document.body;

    const wrap = document.createElement("div");
    wrap.id = "stn-format-controls";
    wrap.style.display = "flex";
    wrap.style.gap = "8px";
    wrap.style.alignItems = "center";
    wrap.style.margin = "8px 0";

    const label = document.createElement("label");
    label.textContent = "Format:";
    label.style.fontSize = "12px";

    const select = document.createElement("select");
    select.id = "stn-format-mode";
    select.style.flex = "1";
    select.style.fontSize = "12px";
    select.style.padding = "6px";
    select.style.borderRadius = "6px";

    const modes = [
      { value: "plain", label: "Plain" },
      { value: "singleLine", label: "Single line" },
      { value: "bullets", label: "Bullets" },
    ];

    for (const m of modes) {
      const opt = document.createElement("option");
      opt.value = m.value;
      opt.textContent = m.label;
      select.appendChild(opt);
    }

    const saved = localStorage.getItem(KEYS.formatMode) || "plain";
    select.value = saved;

    select.addEventListener("change", () => {
      localStorage.setItem(KEYS.formatMode, select.value);
      if (DEBUG) console.debug("[stn-format] mode changed", select.value);
    });

    const apply = document.createElement("button");
    apply.textContent = "Apply";
    // Match the extension's gradient button style from main.css
    apply.style.padding = "6px 10px";
    apply.style.borderRadius = "8px";
    apply.style.border = "none";
    apply.style.cursor = "pointer";
    apply.style.background = "linear-gradient(90deg, #6a5af9, #8b5cf6)";
    apply.style.color = "#fff";
    apply.style.fontSize = "12px";

    apply.addEventListener("click", () => {
      // Reload to re-trigger the preload shim with new formatting mode.
      // Note: A full reload is necessary because the preload script runs before
      // the main bundle, so we need to restart the page initialization to apply
      // the new formatting mode to localStorage reads.
      window.location.reload();
    });

    // Developer convenience: one-click helper to prepare the local restore command.
    // This does NOT run git locally from the popup (impossible from a web context) —
    // it simply copies the recommended command so a developer can paste it into a
    // terminal, and pairs with the repository's VS Code task / npm script.
    const restoreBtn = document.createElement("button");
    restoreBtn.textContent = "Create restore tag";
    restoreBtn.title =
      "Copy `npm run restore:tag` to clipboard (run in repo root)";
    restoreBtn.style.padding = "6px 10px";
    restoreBtn.style.borderRadius = "8px";
    restoreBtn.style.border = "1px solid rgba(0,0,0,0.06)";
    restoreBtn.style.cursor = "pointer";
    restoreBtn.style.background = "#fff";
    restoreBtn.style.color = "#333";
    restoreBtn.style.fontSize = "12px";
    restoreBtn.style.display = "inline-flex";
    restoreBtn.style.alignItems = "center";

    const status = document.createElement("span");
    status.style.marginLeft = "8px";
    status.style.fontSize = "12px";
    status.style.color = "#666";

    restoreBtn.addEventListener("click", async () => {
      const cmd = "npm run restore:tag";
      try {
        await navigator.clipboard.writeText(cmd);
        status.textContent = "Copied — paste into a terminal in the repo root";
        restoreBtn.disabled = true;
        setTimeout(() => {
          status.textContent = "";
          restoreBtn.disabled = false;
        }, 3000);
      } catch (err) {
        status.textContent = "Copy failed — run: npm run restore:tag";
        console.warn("failed to copy restore command", err);
      }
    });

    wrap.append(label, select, apply);
    wrap.append(restoreBtn, status);

    // Image-replacement tester UI removed from popups (no visible test button/FAB).
    // The underlying test runner (if present) remains exposed on
    // window.runAutomatedReplacementTest for console/e2e use.

    // Insert above the existing UI
    root.prepend(wrap);

    if (DEBUG) console.debug("[stn-format] controls injected");
  }

  ready(() => {
    ensureControls();

    // React/minified UI may re-render; keep controls present.
    const obs = new MutationObserver(() => ensureControls());
    obs.observe(document.body, { childList: true, subtree: true });
  });
})();

// Expose a lightweight automated replacement test helper on popup pages.
// This mirrors the more feature-complete console runner but is safe to
// call from the popup context (defensive checks, no UI blocking).
/*
  Usage:
    window.runAutomatedReplacementTest(pageId, spaceId, { maxAttempts, retryDelay })
  Returns a promise resolving to { success, phase?, detail? }
*/
(function () {
  function _noopResult() {
    return { success: false, error: "not-available" };
  }

  window.runAutomatedReplacementTest = async function (pageId, spaceId, opts) {
    opts = opts || {};
    const maxAttempts = Math.max(1, opts.maxAttempts || 5);
    const retryDelay = Math.max(100, opts.retryDelay || 2000);

    if (typeof chrome === "undefined" || !chrome.runtime) {
      console.warn("[AutomatedTest] chrome.runtime not available");
      return _noopResult();
    }

    if (!pageId || !spaceId) {
      console.warn("[AutomatedTest] missing pageId/spaceId");
      return { success: false, error: "missing-ids" };
    }

    try {
      // First, run the lightweight in-service-worker unit test if available.
      try {
        const unit = await chrome.runtime.sendMessage({
          type: "runDataUrlReplacementUnitTest",
        });
        if (!unit || !unit.success) {
          console.info(
            "[AutomatedTest] unit test failed — continuing to live attempts",
            unit && unit.error,
          );
        }
      } catch (err) {
        // non-fatal — unit test is best-effort
        console.info(
          "[AutomatedTest] unit test unavailable",
          err && err.message,
        );
      }

      // Then perform live replacement attempts against the provided IDs.
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.debug(`[AutomatedTest] live attempt ${attempt}/${maxAttempts}`);
        try {
          const res = await chrome.runtime.sendMessage({
            type: "replaceDataUrlPlaceholders",
            pageId,
            spaceId,
            placeholderMap: window.__dataUrlPlaceholders || {},
          });

          console.debug(
            "[AutomatedTest] replaceDataUrlPlaceholders response:",
            res,
          );
          if (res && res.success && res.replacedCount > 0)
            return { success: true, replacedCount: res.replacedCount };
        } catch (err) {
          console.debug(
            "[AutomatedTest] live attempt error",
            err && err.message,
          );
        }

        if (attempt < maxAttempts)
          await new Promise((r) => setTimeout(r, retryDelay));
      }

      return { success: false, phase: "live", error: "max-attempts-exceeded" };
    } catch (err) {
      console.error("[AutomatedTest] unexpected error", err);
      return { success: false, error: err && err.message };
    }
  };
})();
