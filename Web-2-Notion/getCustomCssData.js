/******/ (function (modules) {
  // webpackBootstrap
  /******/ // The module cache
  /******/ var installedModules = {};
  /******/
  /******/ // The require function
  /******/
  function __webpack_require__inject_script_fix(moduleId) {
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }
    var module = (installedModules[moduleId] = {
      i: moduleId,
      l: false,
      exports: {},
    });
    const resp = modules[moduleId].call(
      module.exports,
      module,
      module.exports,
      __webpack_require__,
    );
    module.l = true;
    return resp;
  }
  function __webpack_require__(moduleId) {
    /******/
    /******/ // Check if module is in cache
    /******/ if (installedModules[moduleId]) {
      /******/ return installedModules[moduleId].exports;
      /******/
    }
    /******/ // Create a new module (and put it into the cache)
    /******/ var module = (installedModules[moduleId] = {
      /******/ i: moduleId,
      /******/ l: false,
      /******/ exports: {},
      /******/
    });
    /******/
    /******/ // Execute the module function
    /******/ modules[moduleId].call(
      module.exports,
      module,
      module.exports,
      __webpack_require__,
    );
    /******/
    /******/ // Flag the module as loaded
    /******/ module.l = true;
    /******/
    /******/ // Return the exports of the module
    /******/ return module.exports;
    /******/
  }
  /******/
  /******/
  /******/ // expose the modules object (__webpack_modules__)
  /******/ __webpack_require__.m = modules;
  /******/
  /******/ // expose the module cache
  /******/ __webpack_require__.c = installedModules;
  /******/
  /******/ // define getter function for harmony exports
  /******/ __webpack_require__.d = function (exports, name, getter) {
    /******/ if (!__webpack_require__.o(exports, name)) {
      /******/ Object.defineProperty(exports, name, {
        enumerable: true,
        get: getter,
      });
      /******/
    }
    /******/
  };
  /******/
  /******/ // define __esModule on exports
  /******/ __webpack_require__.r = function (exports) {
    /******/ if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
      /******/ Object.defineProperty(exports, Symbol.toStringTag, {
        value: "Module",
      });
      /******/
    }
    /******/ Object.defineProperty(exports, "__esModule", { value: true });
    /******/
  };
  /******/
  /******/ // create a fake namespace object
  /******/ // mode & 1: value is a module id, require it
  /******/ // mode & 2: merge all properties of value into the ns
  /******/ // mode & 4: return value when already ns object
  /******/ // mode & 8|1: behave like require
  /******/ __webpack_require__.t = function (value, mode) {
    /******/ if (mode & 1) value = __webpack_require__(value);
    /******/ if (mode & 8) return value;
    /******/ if (
      mode & 4 &&
      typeof value === "object" &&
      value &&
      value.__esModule
    )
      return value;
    /******/ var ns = Object.create(null);
    /******/ __webpack_require__.r(ns);
    /******/ Object.defineProperty(ns, "default", {
      enumerable: true,
      value: value,
    });
    /******/ if (mode & 2 && typeof value != "string")
      for (var key in value)
        __webpack_require__.d(
          ns,
          key,
          function (key) {
            return value[key];
          }.bind(null, key),
        );
    /******/ return ns;
    /******/
  };
  /******/
  /******/ // getDefaultExport function for compatibility with non-harmony modules
  /******/ __webpack_require__.n = function (module) {
    /******/ var getter =
      module && module.__esModule
        ? /******/ function getDefault() {
            return module["default"];
          }
        : /******/ function getModuleExports() {
            return module;
          };
    /******/ __webpack_require__.d(getter, "a", getter);
    /******/ return getter;
    /******/
  };
  /******/
  /******/ // Object.prototype.hasOwnProperty.call
  /******/ __webpack_require__.o = function (object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
  };
  /******/
  /******/ // __webpack_public_path__
  /******/ __webpack_require__.p = "";
  /******/
  /******/
  /******/ // Load entry module and return exports
  /******/ return __webpack_require__inject_script_fix(
    (__webpack_require__.s = 18),
  );
  /******/
})(
  /************************************************************************/
  /******/ {
    /***/ 18: /***/ function (module, exports, __webpack_require__) {
      "use strict";

      // Recursively search shadow DOMs for an element matching the selector
      function findInShadowDOM(selector, root = document, depth = 0) {
        // Limit recursion depth to prevent infinite loops
        if (depth > 20) {
          console.warn("getData: Max shadow DOM depth reached");
          return null;
        }

        // Get all elements in the current root
        const allElements = root.querySelectorAll("*");

        for (const element of allElements) {
          if (element.shadowRoot) {
            // Commented out to reduce console noise - only log when found
            // console.debug(
            //   `getData: Checking shadow root of ${element.tagName} at depth ${depth}...`,
            // );

            // Try to find the element in this shadow root
            const match = element.shadowRoot.querySelector(selector);
            if (match) {
              console.log(
                `getData: ✓ FOUND element in shadow root of ${element.tagName} at depth ${depth}!`,
              );
              return match;
            }

            // Recurse into this shadow root
            const nestedMatch = findInShadowDOM(
              selector,
              element.shadowRoot,
              depth + 1,
            );
            if (nestedMatch) {
              return nestedMatch;
            }
          }
        }

        return null;
      }

      function getData(x) {
        var _a;
        if (x == null) return null;
        console.debug("getData: Processing selector config:", x);
        console.debug("getData: CSS selector:", x.css);

        // First try regular document.querySelector
        let node = document.querySelector(x.css);
        console.debug("getData: Found element in document:", node);

        // If not found in regular DOM, search shadow DOMs
        if (!node) {
          console.debug(
            "getData: Not found in document, searching shadow DOMs...",
          );
          node = findInShadowDOM(x.css);
          console.debug("getData: Found element in shadow DOM:", node);
        }

        if (!node) {
          console.warn("getData: Element not found with selector:", x.css);
          return "";
        }
        let v = null;
        if (x.on == "text") {
          // First try direct textContent
          v =
            (_a = node.textContent) === null || _a === void 0
              ? void 0
              : _a.trim();
          console.debug(
            "getData: Direct textContent:",
            v ? `"${v.substring(0, 100)}..."` : "(empty)",
          );

          // If empty or only whitespace, drill down to find actual text
          if (!v || v.length === 0) {
            console.debug(
              "getData: Direct textContent empty, drilling down...",
            );
            v = drillDownForText(node);
            console.debug(
              "getData: After drilling:",
              v ? `"${v.substring(0, 100)}..."` : "(empty)",
            );
          }

          // If still empty after drilling, try shadow DOM
          if (!v || v.length === 0) {
            console.debug("getData: Checking shadow DOM...");
            v = searchShadowDOMForText(node);
            console.debug(
              "getData: After shadow DOM search:",
              v ? `"${v.substring(0, 100)}..."` : "(empty)",
            );
          }

          if (v) {
            v = v.trim();
          }

          console.debug(
            "getData: Final text value:",
            v ? `"${v.substring(0, 100)}..."` : "(empty/null)",
          );
        } else {
          v = node.getAttribute(x.on);
        }
        if (x.on == "href" || (x.on == "src" && v && v.startsWith("/"))) {
          v = location.origin + v;
        }
        if (!v) return null;
        if (x.type == "number") {
          v = v
            .trim()
            .replace(/ /g, "")
            .replace(/\s/g, "")
            .match(/^\d+|\d+\b|\d+(?=\w)/i)[0];
        }
        return v;
      }

      // Recursively drill down through child elements to find text content
      function drillDownForText(element) {
        if (!element) return "";

        // Check direct text nodes (excluding whitespace-only nodes)
        for (let node of element.childNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text.length > 0) {
              console.log(
                "getData: Found text in direct text node:",
                text.substring(0, 50),
              );
              return text;
            }
          }
        }

        // Recursively check child elements
        for (let child of element.children) {
          // Skip script, style, and other non-content elements
          if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(child.tagName)) {
            continue;
          }

          const text = drillDownForText(child);
          if (text && text.length > 0) {
            console.log(
              "getData: Found text in child element:",
              child.tagName,
              text.substring(0, 50),
            );
            return text;
          }
        }

        return "";
      }

      // Search shadow DOM for text content
      function searchShadowDOMForText(element) {
        if (!element || !element.shadowRoot) return "";

        console.log("getData: Searching shadow DOM of", element.tagName);

        // Try to get text from shadow root
        const shadowText = element.shadowRoot.textContent?.trim();
        if (shadowText && shadowText.length > 0) {
          console.log(
            "getData: Found text in shadow root:",
            shadowText.substring(0, 50),
          );
          return shadowText;
        }

        // Recursively search shadow DOM children
        for (let child of element.shadowRoot.children) {
          if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(child.tagName)) {
            continue;
          }

          // Check if this child has text
          const text = drillDownForText(child);
          if (text && text.length > 0) {
            return text;
          }

          // Check if this child has a shadow root
          if (child.shadowRoot) {
            const shadowText = searchShadowDOMForText(child);
            if (shadowText && shadowText.length > 0) {
              return shadowText;
            }
          }
        }

        return "";
      }
      function getCustomCssData() {
        const customs =
          typeof __save_to_notion_customs !== "undefined"
            ? __save_to_notion_customs
            : [];
        return customs.map((x) => {
          try {
            // if it's customDataV2
            if (x.propertyType) {
              const r = getData({
                css: x.css,
                on:
                  x.on ||
                  (["image", "file"].includes(x.propertyType) ? "src" : "text"),
              });
              return r;
            } else {
              return getData(x);
            }
          } catch (e) {
            console.log("failed to get custom data", e);
            return null;
          }
        });
      }
      // @ts-ignore
      const response = getCustomCssData();
      return response;

      /***/
    },

    /******/
  },
);
