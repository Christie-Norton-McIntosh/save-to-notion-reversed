#!/usr/bin/env node
// embed-kmm-image.js
// Usage: node embed-kmm-image.js <macro.kmmacros> <image.png> [output.kmmacros]
// Replaces the placeholder token __KM_IMAGE_SAVE_BUTTON_BASE64__ in the .kmmacros file

const fs = require("fs");
const path = require("path");

if (process.argv.length < 4) {
  console.error(
    "Usage: node embed-kmm-image.js <macro.kmmacros> <image.png> [output.kmmacros]",
  );
  process.exit(2);
}

const macroPath = path.resolve(process.argv[2]);
const imgPath = path.resolve(process.argv[3]);
const outPath = process.argv[4] ? path.resolve(process.argv[4]) : macroPath;

if (!fs.existsSync(macroPath)) {
  console.error("Macro file not found:", macroPath);
  process.exit(3);
}
if (!fs.existsSync(imgPath)) {
  console.error("Image file not found:", imgPath);
  process.exit(4);
}

const macro = fs.readFileSync(macroPath, "utf8");
const img = fs.readFileSync(imgPath);
const b64 = img.toString("base64");

if (macro.indexOf("__KM_IMAGE_SAVE_BUTTON_BASE64__") === -1) {
  console.error(
    "Placeholder token not found in macro file. Make sure the macro contains __KM_IMAGE_SAVE_BUTTON_BASE64__.",
  );
  process.exit(5);
}

const replaced = macro.replace(/__KM_IMAGE_SAVE_BUTTON_BASE64__/g, b64);
fs.writeFileSync(outPath, replaced, "utf8");
console.log("Wrote", outPath);
console.log("You can now import the .kmmacros into Keyboard Maestro.");
