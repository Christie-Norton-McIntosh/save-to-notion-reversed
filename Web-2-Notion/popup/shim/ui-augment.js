// Web-2-Notion/popup/shim/ui-augment.js
(() => {
  const DEBUG = false;

  const KEYS = {
    formatMode: "__stn_format_mode"
  };

  function ready(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") fn();
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
      { value: "bullets", label: "Bullets" }
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
