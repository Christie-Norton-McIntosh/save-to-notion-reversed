/* Utilities for table->list image handling.
 * Exported both as a browser-global (window.STN_tableToListImageUtils)
 * and as CommonJS for unit tests.
 */
(function () {
  "use strict";

  function _isString(s) {
    return typeof s === "string" && s.length > 0;
  }

  function looksLikeImageUrl(url) {
    if (!_isString(url)) return false;
    var u = url.toLowerCase();
    if (u.startsWith("data:image/")) return true;
    return (
      u.indexOf(".png") !== -1 ||
      u.indexOf(".jpg") !== -1 ||
      u.indexOf(".jpeg") !== -1 ||
      u.indexOf(".gif") !== -1 ||
      u.indexOf(".svg") !== -1 ||
      u.indexOf(".webp") !== -1 ||
      u.indexOf(".bmp") !== -1 ||
      u.indexOf(".tif") !== -1 ||
      u.indexOf(".tiff") !== -1 ||
      u.indexOf(".heic") !== -1
    );
  }

  // Resolve an image source from an element-like object.
  // Accepts either a DOM Element or a plain object with getAttribute/src/parentElement.
  function resolveImageSrc(imgLike, baseHref) {
    try {
      var src =
        (imgLike &&
          imgLike.getAttribute &&
          imgLike.getAttribute("data-original-src")) ||
        (imgLike && imgLike.getAttribute && imgLike.getAttribute("src")) ||
        (imgLike && imgLike.src) ||
        "";

      // Prefer anchor href if it points to an image
      var parent = imgLike && imgLike.parentElement;
      var anchorHref = null;
      if (parent && parent.tagName === "A") {
        anchorHref =
          (parent.getAttribute && parent.getAttribute("href")) ||
          parent.href ||
          null;
      }

      if (_isString(anchorHref)) {
        try {
          // If relative, make absolute using baseHref when provided
          if (!anchorHref.startsWith("http") && _isString(baseHref)) {
            anchorHref = new URL(anchorHref, baseHref).href;
          }
        } catch (err) {
          /* ignore resolution errors */
        }
        if (looksLikeImageUrl(anchorHref)) return anchorHref;
      }

      // Resolve relative src against baseHref
      if (
        _isString(src) &&
        !_isString(baseHref) &&
        src &&
        !src.startsWith("http") &&
        !src.startsWith("data:")
      ) {
        try {
          src = new URL(src, window && window.location && window.location.href)
            .href;
        } catch (err) {
          /* ignore */
        }
      } else if (
        _isString(src) &&
        _isString(baseHref) &&
        !src.startsWith("http") &&
        !src.startsWith("data:")
      ) {
        try {
          src = new URL(src, baseHref).href;
        } catch (err) {}
      }

      return src || "";
    } catch (err) {
      return "";
    }
  }

  function imageMarkdown(alt, src, title) {
    alt = alt || "";
    src = src || "";
    var titlePart = title
      ? ' "' + String(title).replace(/"/g, '\\"') + '"'
      : "";
    return "![" + alt + "](" + src + titlePart + ")";
  }

  // Replace an <img> element (or img-like object) with a visible bullet placeholder
  // Returns the placeholder text node (or string in non-DOM environments).
  function replaceImgWithPlaceholder(imgLike, alt) {
    var placeholder = " • " + (alt || "") + " • ";
    try {
      if (imgLike && imgLike.replaceWith && typeof document !== "undefined") {
        imgLike.replaceWith(document.createTextNode(placeholder));
        return placeholder;
      }
    } catch (err) {
      // fall through
    }
    return placeholder;
  }

  var api = {
    looksLikeImageUrl: looksLikeImageUrl,
    resolveImageSrc: resolveImageSrc,
    imageMarkdown: imageMarkdown,
    replaceImgWithPlaceholder: replaceImgWithPlaceholder,
  };

  if (typeof window !== "undefined") window.STN_tableToListImageUtils = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
