const u = require("../Web-2-Notion/lib/notion-api-utils");

// chunkArray
let arr = Array.from({ length: 250 }, (_, i) => i);
let chunks = u.chunkArray(arr, 100);
console.assert(chunks.length === 3, "chunkArray should split into 3 chunks");
console.assert(
  chunks[0].length === 100 && chunks[2].length === 50,
  "chunk sizes are correct",
);

// validatePropertiesAgainstSchema: basic cases
const schema = {
  Price: { type: "number" },
  Status: { type: "select" },
  Tags: { type: "multi_select" },
  Name: { type: "title" },
};
let { warnings, formatted } = u.validatePropertiesAgainstSchema(
  {
    Price: "12.5",
    Status: "In Progress",
    Tags: ["A", "B"],
    Name: "Hello",
    Extra: "x",
  },
  schema,
);
console.assert(
  Array.isArray(warnings) && warnings.some((w) => w.property === "Extra"),
  "unknown prop should warn",
);
console.assert(
  typeof formatted.Price === "number",
  "number-as-string should be coerced",
);
console.assert(
  Array.isArray(formatted.Tags) && formatted.Tags[0].name === "A",
  "multi_select strings coerced",
);
console.assert(
  Array.isArray(formatted.Name) && formatted.Name[0].text.content === "Hello",
  "title coerced to rich text array",
);

// formatPropertyForPublicAPI minimal
let p = u.formatPropertyForPublicAPI("Task", { type: "title" });
console.assert(p.title && p.title[0].text.content === "Task", "format title");

console.log("test-notion-api-utils: OK");
