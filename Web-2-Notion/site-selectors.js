// Test if chrome APIs are available
console.log("Chrome APIs available:", typeof chrome !== "undefined");
console.log(
  "Chrome storage available:",
  typeof chrome !== "undefined" && chrome.storage,
);
console.log(
  "Chrome runtime available:",
  typeof chrome !== "undefined" && chrome.runtime,
);

// selectors schema per domain: array of { selector: string, embeddedPostFormat?: boolean }
let selectors = {};

// Ignore selectors per domain: array of selector strings
let ignoreSelectors = {};

// Format rules array: { selector: string, replacement: string, description: string }
let formatRules = [];

// Allowed replacement tags for security
const ALLOWED_REPLACEMENTS = [
  "strong",
  "em",
  "code",
  "mark",
  "u",
  "del",
  "b",
  "i",
  "blockquote",
  "p",
  "div",
];

// Helper function to normalize domain names
function normalizeDomain(domain) {
  if (!domain) return "";

  // Remove protocol if present
  domain = domain.replace(/^https?:\/\//, "");

  // Remove www. prefix
  domain = domain.replace(/^www\./, "");

  // Remove trailing slash and anything after it
  domain = domain.split("/")[0];

  // Remove port numbers
  domain = domain.split(":")[0];

  return domain.trim().toLowerCase();
}

// Load existing selectors
chrome.storage.local.get(
  ["customSiteSelectors", "customIgnoreSelectors", "customFormatRules"],
  (result) => {
    if (chrome.runtime.lastError) {
      console.error("Error loading selectors:", chrome.runtime.lastError);
      showStatus(
        "Error loading settings: " + chrome.runtime.lastError.message,
        "error",
      );
      selectors = {};
      ignoreSelectors = {};
      formatRules = [];
    } else {
      selectors = normalizeSelectorsSchema(result.customSiteSelectors || {});
      ignoreSelectors = normalizeIgnoreSelectorsSchema(
        result.customIgnoreSelectors || {},
      );
      console.log(
        "[Page Load] Loaded ignore selectors from storage:",
        result.customIgnoreSelectors,
      );
      console.log("[Page Load] After normalization:", ignoreSelectors);

      formatRules = result.customFormatRules || [
        // Default rule for ServiceNow
        {
          selector: "span.ph.uicontrol",
          replacement: "strong",
          description: "UI control elements (ServiceNow)",
        },
      ];
    }

    // Ensure default embedded post format selector for servicenow.com
    if (
      !selectors["servicenow.com"] ||
      selectors["servicenow.com"].length === 0
    ) {
      selectors["servicenow.com"] = [
        { selector: ".related-links", customHeading: "Related Links" },
      ];
    }
    renderSelectors();
    renderIgnoreSelectors();
    renderFormatRules();
  },
);

// Normalize legacy shapes (string or object) into array of objects per domain
function normalizeSelectorsSchema(rawSelectors) {
  const normalized = {};
  Object.entries(rawSelectors || {}).forEach(([domain, entry]) => {
    if (Array.isArray(entry)) {
      normalized[domain] = entry
        .map((item) => {
          if (typeof item === "string") {
            return { selector: item, customHeading: "" };
          } else {
            // Support both old (embeddedPostFormat) and new (customHeading) formats
            const customHeading =
              item.customHeading ||
              (item.embeddedPostFormat ? "Related Links" : "");
            return {
              selector: item && item.selector ? item.selector : "",
              customHeading: customHeading,
            };
          }
        })
        .filter((item) => item.selector);
    } else if (typeof entry === "string") {
      normalized[domain] = [{ selector: entry, customHeading: "" }];
    } else if (entry && typeof entry === "object") {
      // Support both old and new formats
      const customHeading =
        entry.customHeading ||
        (entry.embeddedPostFormat ? "Related Links" : "");
      normalized[domain] = [
        {
          selector: entry.selector || "",
          customHeading: customHeading,
        },
      ].filter((item) => item.selector);
    }
  });
  return normalized;
}

// Normalize ignore selectors schema (array of strings per domain)
function normalizeIgnoreSelectorsSchema(rawIgnoreSelectors) {
  const normalized = {};
  Object.entries(rawIgnoreSelectors || {}).forEach(([domain, entry]) => {
    if (Array.isArray(entry)) {
      // Array can contain strings or objects {selector, note}
      normalized[domain] = entry
        .map((item) => {
          if (typeof item === "string") {
            return { selector: item.trim(), note: "" };
          } else if (item && typeof item === "object" && item.selector) {
            return {
              selector: (item.selector || "").trim(),
              note: (item.note || "").trim(),
            };
          }
          return null;
        })
        .filter((item) => item && item.selector);
    } else if (typeof entry === "string") {
      // Single string, split by comma
      const selectors = entry
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
      normalized[domain] = selectors.map((sel) => ({
        selector: sel,
        note: "",
      }));
    }
  });
  return normalized;
}

function renderSelectors() {
  const container = document.getElementById("selectors-container");
  container.innerHTML = "";

  // Create selector items from current selectors object
  const entries = Object.entries(selectors);

  if (entries.length === 0) {
    // Add at least one empty item if no selectors exist
    addSelectorItem("", "");
  } else {
    entries.forEach(([domain, selectorList]) => {
      const list = Array.isArray(selectorList)
        ? selectorList
        : normalizeSelectorsSchema({ tmp: selectorList }).tmp || [];
      if (list.length === 0) {
        addSelectorItem(domain, "", "");
      } else {
        list.forEach((item) => {
          addSelectorItem(
            domain,
            item.selector || "",
            item.customHeading || "",
          );
        });
      }
    });
  }
}

function addSelectorItem(domain = "", selector = "", customHeading = "") {
  const container = document.getElementById("selectors-container");
  const item = document.createElement("div");
  item.className = "selector-item";
  item.draggable = true;

  // Add drag handle
  const dragHandle = document.createElement("span");
  dragHandle.className = "drag-handle";
  dragHandle.innerHTML = "⋮⋮";
  dragHandle.title = "Drag to reorder";

  // Create elements individually to avoid HTML injection issues
  const domainInput = document.createElement("input");
  domainInput.type = "text";
  domainInput.placeholder = "example.com";
  domainInput.value = domain;
  domainInput.dataset.originalDomain = domain; // Store original domain

  // Update selectors object when input changes
  domainInput.addEventListener("input", function () {
    updateFromInputs();
  });

  const selectorInput = document.createElement("input");
  selectorInput.type = "text";
  selectorInput.placeholder = "article, .content, #main";
  selectorInput.value = selector;

  // Update selectors object when input changes
  selectorInput.addEventListener("input", function () {
    updateFromInputs();
  });

  const headingInput = document.createElement("input");
  headingInput.type = "text";
  headingInput.placeholder = "Custom Heading (optional)";
  headingInput.value = customHeading || "";
  headingInput.title =
    "Add a custom heading (e.g., 'Related Links') to appear before this selector's content";
  headingInput.style.maxWidth = "200px";
  headingInput.addEventListener("input", function () {
    updateFromInputs();
  });

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", function () {
    item.remove();
    updateFromInputs();
  });

  item.appendChild(dragHandle);
  item.appendChild(domainInput);
  item.appendChild(selectorInput);
  item.appendChild(headingInput);
  item.appendChild(removeBtn);

  container.appendChild(item);
}

function updateFromInputs() {
  // Rebuild selectors object from all current inputs
  selectors = {};
  const items = document.querySelectorAll(".selector-item");

  items.forEach((item) => {
    const inputs = item.querySelectorAll('input[type="text"]');
    if (inputs.length >= 2) {
      const domainInput = inputs[0];
      const selectorInput = inputs[1];
      const headingInput = inputs[2]; // Third input is the custom heading

      const rawDomain = domainInput.value.trim();
      const domain = normalizeDomain(rawDomain);
      const selector = selectorInput.value.trim();
      const customHeading = headingInput ? headingInput.value.trim() : "";

      if (domain && selector) {
        if (!selectors[domain]) selectors[domain] = [];
        selectors[domain].push({ selector, customHeading });

        // Update the input to show the normalized domain
        if (domainInput.value !== domain) {
          domainInput.value = domain;
        }
      }
    }
  });

  console.log("Selectors updated:", selectors);
}

// Ignore Selectors Functions
function renderIgnoreSelectors() {
  const container = document.getElementById("ignore-selectors-container");
  if (!container) return;

  container.innerHTML = "";

  const entries = Object.entries(ignoreSelectors);

  if (entries.length === 0) {
    addIgnoreSelectorItem("", "", "");
  } else {
    entries.forEach(([domain, selectorList]) => {
      console.log(
        `[renderIgnoreSelectors] Processing domain="${domain}", selectorList=`,
        selectorList,
      );

      // Create one item per selector (matching renderSelectors pattern)
      if (Array.isArray(selectorList)) {
        if (selectorList.length === 0) {
          addIgnoreSelectorItem(domain, "", "");
        } else {
          selectorList.forEach((entry) => {
            const selector =
              typeof entry === "string" ? entry : entry.selector || "";
            const note = typeof entry === "object" ? entry.note || "" : "";
            addIgnoreSelectorItem(domain, selector, note);
          });
        }
      } else {
        // Legacy string format
        addIgnoreSelectorItem(domain, selectorList, "");
      }
    });
  }
}

function addIgnoreSelectorItem(domain = "", selectors = "", note = "") {
  const container = document.getElementById("ignore-selectors-container");
  if (!container) return;

  const item = document.createElement("div");
  item.className = "ignore-selector-item";
  item.draggable = true;
  item.style.display = "flex";
  item.style.gap = "10px";
  item.style.marginBottom = "15px";
  item.style.alignItems = "center";
  item.style.flexWrap = "wrap";
  item.style.borderLeft = "4px solid #dc3545";
  item.style.paddingLeft = "10px";

  // Add drag handle
  const dragHandle = document.createElement("span");
  dragHandle.className = "drag-handle";
  dragHandle.innerHTML = "⋮⋮";
  dragHandle.title = "Drag to reorder";

  const domainInput = document.createElement("input");
  domainInput.type = "text";
  domainInput.placeholder = "example.com";
  domainInput.value = domain;
  domainInput.dataset.originalDomain = domain;
  domainInput.style.flex = "0 0 200px";
  domainInput.addEventListener("input", updateIgnoreSelectorsFromInputs);

  const selectorInput = document.createElement("input");
  selectorInput.type = "text";
  selectorInput.placeholder = ".ad, .sidebar, footer";
  selectorInput.value = selectors;
  selectorInput.style.flex = "1";
  selectorInput.title = "CSS selectors to ignore (comma-separated)";
  selectorInput.addEventListener("input", updateIgnoreSelectorsFromInputs);

  const noteInput = document.createElement("input");
  noteInput.type = "text";
  noteInput.placeholder = "Note (optional)";
  noteInput.value = note || "";
  noteInput.title = "Description or note for this ignore selector";
  noteInput.style.maxWidth = "250px";
  noteInput.addEventListener("input", updateIgnoreSelectorsFromInputs);

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", function () {
    item.remove();
    updateIgnoreSelectorsFromInputs();
  });

  item.appendChild(dragHandle);
  item.appendChild(domainInput);
  item.appendChild(selectorInput);
  item.appendChild(noteInput);
  item.appendChild(removeBtn);

  container.appendChild(item);
}

function updateIgnoreSelectorsFromInputs() {
  ignoreSelectors = {};
  const items = document.querySelectorAll(".ignore-selector-item");

  console.log("[updateIgnoreSelectorsFromInputs] Found", items.length, "items");

  items.forEach((item, index) => {
    const inputs = item.querySelectorAll('input[type="text"]');
    console.log(
      `[updateIgnoreSelectorsFromInputs] Item ${index}: found ${inputs.length} inputs`,
    );

    if (inputs.length >= 3) {
      const domainInput = inputs[0];
      const selectorInput = inputs[1];
      const noteInput = inputs[2];

      const rawDomain = domainInput.value.trim();
      const domain = normalizeDomain(rawDomain);
      const selectorsString = selectorInput.value.trim();
      const note = noteInput.value.trim();

      console.log(
        `[updateIgnoreSelectorsFromInputs] Item ${index}: domain="${domain}", selectors="${selectorsString}", note="${note}"`,
      );

      if (domain && selectorsString) {
        // Split by comma and trim each selector
        const selectorList = selectorsString
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);

        if (selectorList.length > 0) {
          // If domain already exists, append to it instead of overwriting
          if (!ignoreSelectors[domain]) {
            ignoreSelectors[domain] = [];
          }

          // Add new selectors to this domain
          selectorList.forEach((sel) => {
            ignoreSelectors[domain].push({
              selector: sel,
              note,
            });
          });
        }

        // Update the input to show the normalized domain
        if (domainInput.value !== domain) {
          domainInput.value = domain;
        }
      }
    }
  });

  console.log("Ignore selectors updated:", ignoreSelectors);
}

function addIgnoreSelector() {
  console.log("addIgnoreSelector called");
  addIgnoreSelectorItem("", "");
}

function renderFormatRules() {
  const container = document.getElementById("format-rules-container");
  if (!container) return;

  container.innerHTML = "";

  if (formatRules.length === 0) {
    // Add at least one empty rule
    addFormatRuleItem("", "strong", "");
  } else {
    formatRules.forEach((rule) => {
      addFormatRuleItem(
        rule.selector || "",
        rule.replacement || "strong",
        rule.description || "",
      );
    });
  }
}

function addFormatRuleItem(
  selector = "",
  replacement = "strong",
  description = "",
) {
  const container = document.getElementById("format-rules-container");
  if (!container) return;

  const item = document.createElement("div");
  item.className = "format-rule-item";
  item.draggable = true;
  item.style.borderLeft = "4px solid #17a2b8";
  item.style.paddingLeft = "10px";

  // Add drag handle
  const dragHandle = document.createElement("span");
  dragHandle.className = "drag-handle";
  dragHandle.innerHTML = "⋮⋮";
  dragHandle.title = "Drag to reorder";

  const selectorInput = document.createElement("input");
  selectorInput.type = "text";
  selectorInput.placeholder = "span.ph.uicontrol";
  selectorInput.value = selector;
  selectorInput.title = "CSS selector to match elements";
  selectorInput.addEventListener("input", updateFormatRulesFromInputs);

  const replacementSelect = document.createElement("select");
  replacementSelect.style.padding = "8px 12px";
  replacementSelect.style.border = "1px solid #ddd";
  replacementSelect.style.borderRadius = "4px";
  replacementSelect.style.fontSize = "14px";
  replacementSelect.style.minWidth = "120px";
  replacementSelect.title = "HTML tag to replace with";

  ALLOWED_REPLACEMENTS.forEach((tag) => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = `<${tag}>`;
    if (tag === replacement) option.selected = true;
    replacementSelect.appendChild(option);
  });
  replacementSelect.addEventListener("change", updateFormatRulesFromInputs);

  const descInput = document.createElement("input");
  descInput.type = "text";
  descInput.placeholder = "Description (e.g., 'UI controls')";
  descInput.value = description || "";
  descInput.title = "Description of what this rule does";
  descInput.style.maxWidth = "250px";
  descInput.addEventListener("input", updateFormatRulesFromInputs);

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", function () {
    item.remove();
    updateFormatRulesFromInputs();
  });

  item.appendChild(dragHandle);
  item.appendChild(selectorInput);
  item.appendChild(replacementSelect);
  item.appendChild(descInput);
  item.appendChild(removeBtn);

  container.appendChild(item);
}

function updateFormatRulesFromInputs() {
  formatRules = [];
  const items = document.querySelectorAll(
    "#format-rules-container .format-rule-item",
  );

  items.forEach((item) => {
    const selectorInput = item.querySelector('input[type="text"]');
    const replacementSelect = item.querySelector("select");
    const descInput = item.querySelectorAll('input[type="text"]')[1];

    const selector = selectorInput?.value.trim();
    const replacement = replacementSelect?.value.trim();
    const description = descInput?.value.trim();

    if (selector && replacement && ALLOWED_REPLACEMENTS.includes(replacement)) {
      formatRules.push({ selector, replacement, description });
    }
  });

  console.log("Format rules updated:", formatRules);
}

function addFormatRule() {
  console.log("addFormatRule called");
  addFormatRuleItem("", "strong", "");
}

function addSelector() {
  console.log("addSelector called");
  addSelectorItem("", "");
}

function saveSelectors() {
  console.log("saveSelectors called");

  // Update from current inputs first
  updateFromInputs();
  updateIgnoreSelectorsFromInputs();
  updateFormatRulesFromInputs();

  // Clean up empty entries and normalize domains
  const cleanedSelectors = {};
  Object.entries(selectors).forEach(([domain, selectorList]) => {
    const normalizedDomain = normalizeDomain(domain);
    if (!normalizedDomain) return;

    const list = Array.isArray(selectorList)
      ? selectorList
      : normalizeSelectorsSchema({ tmp: selectorList }).tmp || [];

    const cleanedList = list
      .map((entry) => ({
        selector: (entry.selector || "").trim(),
        customHeading: (entry.customHeading || "").trim(),
      }))
      .filter((entry) => entry.selector);

    if (cleanedList.length > 0) {
      cleanedSelectors[normalizedDomain] = cleanedList;
    }
  });

  // Clean up ignore selectors
  const cleanedIgnoreSelectors = {};
  Object.entries(ignoreSelectors).forEach(([domain, selectorList]) => {
    const normalizedDomain = normalizeDomain(domain);
    if (!normalizedDomain) return;

    const cleanedList = Array.isArray(selectorList)
      ? selectorList
          .map((entry) => {
            if (typeof entry === "string") {
              return { selector: entry.trim(), note: "" };
            } else {
              return {
                selector: (entry.selector || "").trim(),
                note: (entry.note || "").trim(),
              };
            }
          })
          .filter((entry) => entry.selector)
      : [];

    // Deduplicate selectors (same selector string)
    const seen = new Set();
    const dedupedList = cleanedList.filter((entry) => {
      const key = entry.selector.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    if (dedupedList.length > 0) {
      cleanedIgnoreSelectors[normalizedDomain] = dedupedList;
    }
  });

  // Clean up format rules
  const cleanedFormatRules = formatRules
    .map((rule) => ({
      selector: (rule.selector || "").trim(),
      replacement: (rule.replacement || "").trim(),
      description: (rule.description || "").trim(),
    }))
    .filter(
      (rule) =>
        rule.selector &&
        rule.replacement &&
        ALLOWED_REPLACEMENTS.includes(rule.replacement),
    );

  console.log("Saving selectors:", cleanedSelectors);
  console.log("Saving ignore selectors:", cleanedIgnoreSelectors);
  console.log("Saving format rules:", cleanedFormatRules);

  chrome.storage.local.set(
    {
      customSiteSelectors: cleanedSelectors,
      customIgnoreSelectors: cleanedIgnoreSelectors,
      customFormatRules: cleanedFormatRules,
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving:", chrome.runtime.lastError);
        showStatus(
          "Error saving settings: " + chrome.runtime.lastError.message,
          "error",
        );
      } else {
        console.log("Save successful");
        console.log("Verifying what was saved - reading back from storage...");

        // Verify by reading back immediately
        chrome.storage.local.get(["customIgnoreSelectors"], (verification) => {
          console.log(
            "Verification - ignore selectors in storage:",
            verification.customIgnoreSelectors,
          );
        });

        selectors = cleanedSelectors;
        ignoreSelectors = cleanedIgnoreSelectors;
        formatRules = cleanedFormatRules;

        // Show detailed success message
        const selectorCount = Object.keys(cleanedSelectors).length;
        const ignoreCount = Object.keys(cleanedIgnoreSelectors).length;
        const domains = Object.keys(cleanedSelectors).join(", ");
        const ruleCount = cleanedFormatRules.length;
        showStatus(
          `✓ Saved ${selectorCount} selector(s) for: ${domains}. Saved ${ignoreCount} ignore selector(s). Saved ${ruleCount} formatting rule(s). Reload the webpage(s) to see changes.`,
          "success",
        );
        renderSelectors();
        renderIgnoreSelectors();
        renderFormatRules();
      }
    },
  );
}

function showStatus(message, type) {
  const statusEl = document.getElementById("status");
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.style.display = "block";

  // Auto-hide after 5 seconds
  setTimeout(() => {
    statusEl.style.display = "none";
  }, 5000);
}

function showShortcutInfo() {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const shortcut = isMac ? "⌘+Shift+C" : "Ctrl+Shift+C";
  const platform = isMac ? "Mac" : "Windows/Linux";

  showStatus(
    `Keyboard shortcut: ${shortcut} (on ${platform}) - Opens this configuration page from any webpage`,
    "success",
  );
}

function testFunction() {
  console.log("Test function called");

  // Show current state
  chrome.storage.local.get(["customSiteSelectors"], (result) => {
    const stored = normalizeSelectorsSchema(result.customSiteSelectors || {});
    const count = Object.keys(stored).length;

    let message = `✅ Custom Site Selectors Test\n\n`;
    message += `Chrome Storage API: Working ✓\n`;
    message += `Saved Configurations: ${count}\n`;
    message += `─────────────────────────────\n\n`;

    if (count > 0) {
      message += `📋 Your saved selectors:\n\n`;
      Object.entries(stored).forEach(([domain, selectorList]) => {
        message += `🌐 ${domain}\n`;
        selectorList.forEach((entry, idx) => {
          message += `   #${idx + 1} Selector: ${entry.selector}\n`;
          if (entry.embeddedPostFormat) {
            message += `      Format: Embedded Post (callout)\n`;
          }
          message += "\n";
        });
      });
      message += `─────────────────────────────\n`;
      message += `📌 How to use:\n`;
      message += `1. Go to one of the websites above\n`;
      message += `2. RELOAD the page (Cmd/Ctrl+R)\n`;
      message += `3. Click extension → "Save Webpage Content"\n`;
      message += `4. Check browser console for debug logs`;
    } else {
      message += `No selectors configured yet.\n\n`;
      message += `Add a selector above and click Save.`;
    }

    alert(message);
    console.log("=== Stored Custom Selectors ===");
    console.table(stored);
    console.log(
      "To use: Visit a configured site, reload, then use 'Save Webpage Content'",
    );
  });
}

function goBackToMainInterface() {
  // Close the options page
  window.close();

  // Try to open the main extension popup/action
  // This will work if the extension has an action defined
  try {
    chrome.action?.openPopup?.();
  } catch (e) {
    // If popup opening fails, that's okay - the options page will just close
    console.log("Could not open main interface popup");
  }
}

// Add event listeners after DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, setting up event listeners...");

  // Add event listeners for static buttons with error checking
  const backBtn = document.querySelector(".back-btn");
  const shortcutBtn = document.querySelector(".shortcut-btn");
  const addBtn = document.querySelector(".add-btn");
  const saveBtn = document.querySelector(".save-btn");
  const testBtn = document.querySelector(".test-btn");
  const addIgnoreSelectorBtn = document.getElementById(
    "add-ignore-selector-btn",
  );
  const addFormatRuleBtn = document.getElementById("add-format-rule-btn");

  console.log("Buttons found:", {
    backBtn: !!backBtn,
    shortcutBtn: !!shortcutBtn,
    addBtn: !!addBtn,
    saveBtn: !!saveBtn,
    testBtn: !!testBtn,
    addIgnoreSelectorBtn: !!addIgnoreSelectorBtn,
    addFormatRuleBtn: !!addFormatRuleBtn,
  });

  if (backBtn) backBtn.addEventListener("click", goBackToMainInterface);
  if (shortcutBtn) shortcutBtn.addEventListener("click", showShortcutInfo);
  if (addBtn) addBtn.addEventListener("click", addSelector);
  if (saveBtn) saveBtn.addEventListener("click", saveSelectors);
  if (testBtn) {
    testBtn.addEventListener("click", testFunction);
    console.log("Test button listener attached");
  } else {
    console.error("Test button not found!");
  }
  if (addIgnoreSelectorBtn) {
    addIgnoreSelectorBtn.addEventListener("click", addIgnoreSelector);
    console.log("Add ignore selector button listener attached");
  } else {
    console.error("Add ignore selector button not found!");
  }
  if (addFormatRuleBtn) {
    addFormatRuleBtn.addEventListener("click", addFormatRule);
    console.log("Add format rule button listener attached");
  } else {
    console.error("Add format rule button not found!");
  }

  console.log("Event listeners attached successfully");

  // Initialize drag-and-drop for all sections
  initDragAndDrop();
});

// Drag and drop functionality
function initDragAndDrop() {
  const containers = [
    document.getElementById("selectors-container"),
    document.getElementById("ignore-selectors-container"),
    document.getElementById("format-rules-container"),
  ];

  containers.forEach((container) => {
    if (!container) return;

    container.addEventListener("dragstart", handleDragStart);
    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("drop", handleDrop);
    container.addEventListener("dragend", handleDragEnd);
  });
}

let draggedElement = null;

function handleDragStart(e) {
  if (
    !e.target.classList.contains("selector-item") &&
    !e.target.classList.contains("ignore-selector-item") &&
    !e.target.classList.contains("format-rule-item")
  ) {
    return;
  }

  draggedElement = e.target;
  e.target.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/html", e.target.innerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }

  e.dataTransfer.dropEffect = "move";

  const afterElement = getDragAfterElement(e.currentTarget, e.clientY);
  const dragging = document.querySelector(".dragging");

  if (afterElement == null) {
    e.currentTarget.appendChild(dragging);
  } else {
    e.currentTarget.insertBefore(dragging, afterElement);
  }

  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  // Update the underlying data based on new order
  if (e.currentTarget.id === "selectors-container") {
    updateFromInputs();
  } else if (e.currentTarget.id === "ignore-selectors-container") {
    updateIgnoreSelectorsFromInputs();
  } else if (e.currentTarget.id === "format-rules-container") {
    updateFormatRulesFromInputs();
  }

  return false;
}

function handleDragEnd(e) {
  e.target.classList.remove("dragging");
  draggedElement = null;
}

function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll(
      ".selector-item:not(.dragging), .ignore-selector-item:not(.dragging), .format-rule-item:not(.dragging)",
    ),
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY },
  ).element;
}
