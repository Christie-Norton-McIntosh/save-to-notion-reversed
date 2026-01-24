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

let selectors = {};

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
chrome.storage.local.get(["customSiteSelectors"], (result) => {
  if (chrome.runtime.lastError) {
    console.error("Error loading selectors:", chrome.runtime.lastError);
    showStatus(
      "Error loading settings: " + chrome.runtime.lastError.message,
      "error",
    );
    selectors = {};
  } else {
    selectors = result.customSiteSelectors || {};
  }
  renderSelectors();
});

function renderSelectors() {
  const container = document.getElementById("selectors-container");
  container.innerHTML = "";

  // Create selector items from current selectors object
  const entries = Object.entries(selectors);

  if (entries.length === 0) {
    // Add at least one empty item if no selectors exist
    addSelectorItem("", "");
  } else {
    entries.forEach(([domain, selector]) => {
      addSelectorItem(domain, selector);
    });
  }
}

function addSelectorItem(domain = "", selector = "") {
  const container = document.getElementById("selectors-container");
  const item = document.createElement("div");
  item.className = "selector-item";

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

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", function () {
    item.remove();
    updateFromInputs();
  });

  item.appendChild(domainInput);
  item.appendChild(selectorInput);
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

      const rawDomain = domainInput.value.trim();
      const domain = normalizeDomain(rawDomain);
      const selector = selectorInput.value.trim();

      if (domain && selector) {
        selectors[domain] = selector;
        // Update the input to show the normalized domain
        if (domainInput.value !== domain) {
          domainInput.value = domain;
        }
      }
    }
  });

  console.log("Selectors updated:", selectors);
}

function addSelector() {
  console.log("addSelector called");
  addSelectorItem("", "");
}

function saveSelectors() {
  console.log("saveSelectors called");

  // Update from current inputs first
  updateFromInputs();

  // Clean up empty entries and normalize domains
  const cleanedSelectors = {};
  Object.entries(selectors).forEach(([domain, selector]) => {
    const normalizedDomain = normalizeDomain(domain);
    if (normalizedDomain && selector.trim()) {
      cleanedSelectors[normalizedDomain] = selector.trim();
    }
  });

  console.log("Saving selectors:", cleanedSelectors);
  chrome.storage.local.set({ customSiteSelectors: cleanedSelectors }, () => {
    if (chrome.runtime.lastError) {
      console.error("Error saving:", chrome.runtime.lastError);
      showStatus(
        "Error saving settings: " + chrome.runtime.lastError.message,
        "error",
      );
    } else {
      console.log("Save successful");
      selectors = cleanedSelectors;

      // Show detailed success message
      const selectorCount = Object.keys(cleanedSelectors).length;
      const domains = Object.keys(cleanedSelectors).join(", ");
      showStatus(
        `✓ Saved ${selectorCount} selector(s) for: ${domains}. Reload the webpage(s) to see changes.`,
        "success",
      );
      renderSelectors();
    }
  });
}

function showStatus(message, type) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = "block";

  setTimeout(() => {
    status.style.display = "none";
  }, 3000);
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
    const stored = result.customSiteSelectors || {};
    const count = Object.keys(stored).length;

    let message = `✅ Custom Site Selectors Test\n\n`;
    message += `Chrome Storage API: Working ✓\n`;
    message += `Saved Configurations: ${count}\n`;
    message += `─────────────────────────────\n\n`;

    if (count > 0) {
      message += `📋 Your saved selectors:\n\n`;
      Object.entries(stored).forEach(([domain, selector]) => {
        message += `🌐 ${domain}\n`;
        message += `   Selector: ${selector}\n\n`;
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

  console.log("Buttons found:", {
    backBtn: !!backBtn,
    shortcutBtn: !!shortcutBtn,
    addBtn: !!addBtn,
    saveBtn: !!saveBtn,
    testBtn: !!testBtn,
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

  console.log("Event listeners attached successfully");
});
