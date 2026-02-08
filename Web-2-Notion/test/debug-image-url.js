const { JSDOM } = require("jsdom");

// Debug: check if the image URL is considered valid
const html = '<img src="data:image/png;base64,iVBORw0K" alt="List icon">';
const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
const img = dom.window.document.querySelector("img");

const src = img.getAttribute("src") || img.src || "";
console.log("Image src:", src.substring(0, 50));
console.log("Starts with http://", src.startsWith("http://"));
console.log("Starts with https://", src.startsWith("https://"));
console.log("Starts with data:", src.startsWith("data:"));
console.log("");
console.log(
  "Is valid URL (http/https)?",
  src && (src.startsWith("http://") || src.startsWith("https://")),
);
console.log("");
console.log("⚠️  This is a DATA URL (base64), not an HTTP/HTTPS URL!");
console.log("The code will skip this image because isValidUrl === false");
console.log("");
console.log("Looking at user HTML, the image is inside an anchor:");
console.log('<a href="https://www.servicenow.com/docs/viewer/attachment/...">');
console.log('  <img src="data:image/png;base64,..." alt="List icon">');
console.log("</a>");
console.log("");
console.log(
  "The code should check if parentAnchor.href exists and use THAT as the image URL!",
);
