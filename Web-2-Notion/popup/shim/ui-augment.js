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

    wrap.append(label, select, apply);

    // --- Image-replacement one-click tester ---
    const testBtn = document.createElement("button");
    testBtn.id = "stn-image-replacement-test";
    testBtn.textContent = "Run image-replacement test";
    testBtn.style.padding = "6px 10px";
    testBtn.style.borderRadius = "8px";
    testBtn.style.border = "none";
    testBtn.style.cursor = "pointer";
    testBtn.style.background = "linear-gradient(90deg, #20c997, #38d39f)";
    testBtn.style.color = "#fff";
    testBtn.style.fontSize = "12px";
    testBtn.style.marginLeft = "6px";

    const status = document.createElement("span");
    status.id = "stn-image-replacement-status";
    status.style.marginLeft = "10px";
    status.style.fontSize = "12px";
    status.style.color = "#666";

    testBtn.addEventListener("click", async () => {
      try {
        testBtn.disabled = true;
        status.textContent = "Running…";

        // Try to reuse saved test IDs if present
        // Try to auto-discover Page ID / Space ID from several popup contexts
        let prefillPageId = localStorage.getItem("testPageId") || "";
        let prefillSpaceId = localStorage.getItem("testSpaceId") || "";

        try {
          // current-space-id is used elsewhere in the popup
          if (!prefillSpaceId && localStorage.getItem("current-space-id")) {
            prefillSpaceId = localStorage.getItem("current-space-id");
          }

          // pageViewManager may expose the current page view with notion IDs
          const pvm = window.pageViewManager || window.PageViewManager || null;
          const cur = pvm && pvm._currentPageview ? pvm._currentPageview : null;
          if (cur) {
            prefillPageId =
              prefillPageId || cur.notionPageId || cur.pageId || "";
            prefillSpaceId =
              prefillSpaceId || cur.notionSpaceId || cur.spaceId || "";
          }

          // Try a global helper if available
          if (
            (!prefillPageId || !prefillSpaceId) &&
            typeof window.getInfoFromCurrentPage === "function"
          ) {
            const info = window.getInfoFromCurrentPage();
            if (info) {
              prefillPageId =
                prefillPageId || info.notionPageId || info.pageId || "";
              prefillSpaceId =
                prefillSpaceId || info.notionSpaceId || info.spaceId || "";
            }
          }

          // Some consumers expose current form on window.__CURRENT__ or window.current
          const altCur = window.current || window.__CURRENT__ || null;
          if (altCur && altCur.form) {
            prefillPageId =
              prefillPageId || (altCur.form.page && altCur.form.page.id) || "";
            prefillSpaceId = prefillSpaceId || altCur.form.spaceId || "";
          }
        } catch (err) {
          console.debug(
            "Auto-discover page/space id failed:",
            err && err.message,
          );
        }

        const savedPageId =
          prefillPageId || localStorage.getItem("testPageId") || "";
        const savedSpaceId =
          prefillSpaceId || localStorage.getItem("testSpaceId") || "";
        const pageId =
          window.prompt("Page ID (32 hex chars):", savedPageId) || "";
        const spaceId = window.prompt("Space ID:", savedSpaceId) || "";

        if (!pageId || !spaceId) {
          status.textContent = "Cancelled — missing IDs";
          testBtn.disabled = false;
          return;
        }

        localStorage.setItem("testPageId", pageId);
        localStorage.setItem("testSpaceId", spaceId);

        if (typeof window.runAutomatedReplacementTest === "function") {
          const res = await window.runAutomatedReplacementTest(
            pageId,
            spaceId,
            { maxAttempts: 5, retryDelay: 2000 },
          );
          console.log("[stn-test] result:", res);
          if (res && res.success) {
            status.textContent = `OK — replaced ${res.replacedCount || 0}`;
            status.style.color = "#0b8043";
          } else {
            status.textContent = `Failed: ${res?.error || res?.phase || "unknown"}`;
            status.style.color = "#d44";
          }
        } else {
          status.textContent = "Runner not available in this context";
        }
      } catch (err) {
        console.error("[stn-test] error", err);
        status.textContent = `Error: ${err?.message || err}`;
        status.style.color = "#d44";
      } finally {
        testBtn.disabled = false;
        setTimeout(() => {
          status.textContent = "";
          status.style.color = "#666";
        }, 8000);
      }
    });

    wrap.append(testBtn, status);

    // Create a floating action button (FAB) for higher visibility. Clone the
    // original button so we keep a single handler (the clone delegates to the
    // original). This is resilient to React re-renders because we re-insert
    // the FAB if it is removed.
    (function createFloatingTestFab() {
      const fabId = 'stn-image-replacement-fab';
      function makeFab() {
        // Remove existing if present
        const existing = document.getElementById(fabId);
        if (existing) existing.remove();

        const fab = testBtn.cloneNode(true);
        fab.id = fabId;
        fab.textContent = 'Test images';
        fab.setAttribute('aria-label', 'Run image-replacement test');
        fab.style.position = 'fixed';
        fab.style.right = '18px';
        fab.style.bottom = '18px';
        fab.style.zIndex = 99999;
        fab.style.boxShadow = '0 6px 20px rgba(20,40,60,0.25)';
        fab.style.padding = '12px 16px';
        fab.style.borderRadius = '28px';
        fab.style.fontSize = '13px';
        fab.style.cursor = 'pointer';

        // Delegate clicks to the main button's handler to keep behavior centralized
        fab.addEventListener('click', (ev) => {
          ev.preventDefault();
          try {
            // If original button is still in DOM, trigger it; otherwise call runner directly
            if (document.body.contains(testBtn)) {
              testBtn.click();
            } else if (typeof window.runAutomatedReplacementTest === 'function') {
              // best-effort: prompt for IDs then run
              const p = localStorage.getItem('testPageId') || '';
              const s = localStorage.getItem('testSpaceId') || '';
              const pageId = window.prompt('Page ID (32 hex chars):', p) || '';
              const spaceId = window.prompt('Space ID:', s) || '';
              if (pageId && spaceId) window.runAutomatedReplacementTest(pageId, spaceId);
            }
          } catch (err) {
            console.error('FAB click handler error', err);
          }
        });

        document.body.appendChild(fab);
        return fab;
      }

      // ensure FAB exists and re-create if the popup DOM is mutated
      let fab = makeFab();
      const obs = new MutationObserver(() => {
        if (!document.getElementById(fabId)) fab = makeFab();
      });
      obs.observe(document.body, { childList: true, subtree: true });
    })();

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
