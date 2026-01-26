// Web-2-Notion/popup/shim/preload-format.js
(() => {
  const DEBUG = false;

  // Updated keys based on repo conventions (__stn_ prefix)
  const KEYS = {
    scraped: "__stn_scraped_content",
    formatted: "__stn_formatted_content",
    formatMode: "__stn_format_mode"
  };

  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;

  function safeParse(value) {
    try { return JSON.parse(value); } catch { return null; }
  }

  function cleanText(s) {
    return (s || "")
      .replace(/[\u200B\u200C\u200D\uFEFF]/g, "") // zero-width chars
      .replace(/\r\n/g, "\n")
      .trim();
  }

  const formatters = {
    plain: (text) => cleanText(text),
    singleLine: (text) => cleanText(text).replace(/\s+/g, " "),
    bullets: (text) =>
      cleanText(text)
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => `• ${l}`)
        .join("\n"),
  };

  function getMode() {
    return originalGetItem.call(localStorage, KEYS.formatMode) || "plain";
  }

  function formatRawValue(rawValue) {
    if (!rawValue) return rawValue;

    const mode = getMode();
    const formatter = formatters[mode] || formatters.plain;

    // Handle JSON payloads (common in extensions)
    const parsed = safeParse(rawValue);
    if (parsed && typeof parsed === "object") {
      // Adjust based on actual schema.
      // Common possibilities: parsed.text, parsed.content, parsed.value
      const rawText = parsed.text || parsed.content || parsed.value || "";
      const formattedText = formatter(rawText);
      return JSON.stringify({ ...parsed, text: formattedText });
    }

    // Otherwise treat as plain string
    return formatter(rawValue);
  }

  Storage.prototype.getItem = function (key) {
    const value = originalGetItem.call(this, key);

    // Only intercept the scraped payload key
    if (key === KEYS.scraped && value) {
      const formatted = formatRawValue(value);
      if (DEBUG) console.debug("[stn-format] getItem formatted", { key, mode: getMode() });
      return formatted;
    }

    return value;
  };

  // Optional: keep a formatted copy stored for debugging and downstream use
  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);

    if (key === KEYS.scraped && value) {
      const formatted = formatRawValue(value);
      originalSetItem.call(this, KEYS.formatted, formatted);
      if (DEBUG) console.debug("[stn-format] saved formatted copy", { mode: getMode() });
    }
  };
})();
