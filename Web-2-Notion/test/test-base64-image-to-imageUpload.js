/*
 * Unit test — ensure queued base64 images (table cells) are converted into
 * imageUpload entries and the userInputMap references the resulting uploadId.
 *
 * This reproduces the small transformation implemented in the popup so the
 * behavior is safeguarded even when the full popup UI isn't exercised.
 */
const { JSDOM } = require("jsdom");

// Minimal DOM environment
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.window = dom.window;
global.document = dom.window.document;

function processQueuedBase64ImagesForTest(userInputMap, imageUploads) {
  var pidToUploadId = {};
  var map = window.__TABLE_BASE64_IMAGE_MAP__ || {};
  Object.keys(map).forEach(function (pid) {
    var entry = map[pid];
    Object.entries(userInputMap || {}).forEach(function (pair) {
      var dap = pair[1];
      if (!dap || !dap.options) return;
      var def = dap.options.defaultValue;
      if (!def) return;
      var replaced = false;
      var newDef = Array.isArray(def)
        ? def.map(function (it) {
            if (
              it &&
              (it.imgUrl === pid ||
                (typeof it.imgUrl === "string" &&
                  it.imgUrl.indexOf(pid) !== -1))
            ) {
              var uid = (Math.random().toString(36) + "000000").slice(2, 26);
              imageUploads[uid] = {
                id: uid,
                imageBase64: entry.dataUrl,
                name: entry.alt || null,
              };
              pidToUploadId[pid] = uid;
              replaced = true;
              return { uploadId: uid, width: null, height: null };
            }
            return it;
          })
        : def;
      if (replaced) dap.options.defaultValue = newDef;
    });
  });
  return pidToUploadId;
}

// Test
(function () {
  console.log("🧪 test: base64 table-image -> imageUpload conversion");

  // Arrange: queued base64 map + a userInputMap that references the placeholder
  window.__TABLE_BASE64_IMAGE_MAP__ = {
    BASE64_IMG_foo: { dataUrl: "data:image/png;base64,AAA", alt: "icon" },
  };

  const userInputMap = {
    imgField: {
      property: { id: "imgField", type: "image" },
      options: { defaultValue: [{ imgUrl: "BASE64_IMG_foo" }] },
    },
  };

  const imageUploads = {};

  // Act
  const mapping = processQueuedBase64ImagesForTest(userInputMap, imageUploads);

  // Assert
  const pid = "BASE64_IMG_foo";
  if (!mapping[pid]) {
    console.error("❌ expected placeholder to be mapped to an uploadId");
    process.exit(1);
  }

  const uid = mapping[pid];
  if (!(uid in imageUploads)) {
    console.error("❌ expected imageUploads to contain the new uploadId");
    process.exit(1);
  }

  if (imageUploads[uid].imageBase64 !== "data:image/png;base64,AAA") {
    console.error("❌ imageBase64 value was not preserved");
    process.exit(1);
  }

  const dv = userInputMap.imgField.options.defaultValue[0];
  if (!dv.uploadId || dv.uploadId !== uid) {
    console.error("❌ userInputMap was not updated to reference uploadId");
    process.exit(1);
  }

  console.log("✅ base64 -> imageUpload conversion behaves as expected");
  process.exit(0);
})();
