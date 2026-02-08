/* Utilities to format/validate data for the Notion public API.
 * These helpers implement a small subset of the "Notion API for Agent"
 * patterns used by the extension: property formatting, schema validation
 * and block-chunking. Keep these helpers pure and dependency-free so they
 * can be reused from background/popup/content contexts.
 */

function isReadOnlyProperty(name) {
  return [
    "created_time",
    "created_by",
    "last_edited_time",
    "last_edited_by",
    "formula",
    "rollup",
  ].includes(name);
}

function chunkArray(arr, size = 100) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function validatePropertiesAgainstSchema(props = {}, schema = {}) {
  const warnings = [];
  const formatted = {};

  for (const [k, v] of Object.entries(props)) {
    if (isReadOnlyProperty(k)) {
      warnings.push({ property: k, reason: "read-only" });
      continue;
    }
    const s = schema[k];
    if (!s) {
      warnings.push({ property: k, reason: "not-in-schema" });
      // keep it but mark as unknown so callers can decide
      formatted[k] = v;
      continue;
    }

    // simple type checks & lightweight normalization used by agents
    switch (s.type) {
      case "number":
        if (typeof v === "string" && !isNaN(Number(v)))
          formatted[k] = Number(v);
        else formatted[k] = v;
        break;
      case "date":
        // accept Date or ISO string; callers should convert to ISO if needed
        formatted[k] = v;
        break;
      case "select":
      case "status":
        if (typeof v === "string") formatted[k] = { name: v };
        else formatted[k] = v;
        break;
      case "multi_select":
        if (Array.isArray(v) && v.every((x) => typeof x === "string"))
          formatted[k] = v.map((x) => ({ name: x }));
        else formatted[k] = v;
        break;
      case "title":
      case "rich_text":
        // ensure rich text arrays for titles/rich_text
        if (typeof v === "string")
          formatted[k] = [{ type: "text", text: { content: v } }];
        else formatted[k] = v;
        break;
      default:
        formatted[k] = v;
    }
  }

  return { warnings, formatted };
}

// Convert a value into a Notion Public API property (minimal coverage)
function formatPropertyForPublicAPI(value, schemaProp) {
  if (!schemaProp) return value;
  const t = schemaProp.type;
  switch (t) {
    case "title":
      return {
        title: Array.isArray(value)
          ? value
          : [{ type: "text", text: { content: String(value) } }],
      };
    case "rich_text":
      return {
        rich_text: Array.isArray(value)
          ? value
          : [{ type: "text", text: { content: String(value) } }],
      };
    case "select":
      return { select: typeof value === "string" ? { name: value } : value };
    case "multi_select":
      return {
        multi_select: Array.isArray(value)
          ? value.map((n) => (typeof n === "string" ? { name: n } : n))
          : value,
      };
    case "date":
      // expect ISO date or {start,end}
      return { date: value };
    case "checkbox":
      return { checkbox: Boolean(value) };
    case "number":
      return { number: Number(value) };
    case "url":
      return { url: String(value) };
    case "email":
      return { email: String(value) };
    case "phone_number":
      return { phone_number: String(value) };
    case "people":
      return { people: Array.isArray(value) ? value : [value] };
    case "relation":
      return { relation: Array.isArray(value) ? value : [value] };
    case "files":
      return { files: Array.isArray(value) ? value : [value] };
    default:
      return value;
  }
}

module.exports = {
  chunkArray,
  isReadOnlyProperty,
  validatePropertiesAgainstSchema,
  formatPropertyForPublicAPI,
};
