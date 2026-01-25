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

      function getData(x) {
        var _a;
        if (x == null) return null;
        console.log("getData", x, x.css);
        console.debug("getData", x, x.css);

        // Check localStorage for stored preview data (accessible in popup context)
        try {
          var storageKey =
            "__stn_picked_" + x.css.replace(/[^a-zA-Z0-9]/g, "_");
          var stored = localStorage.getItem(storageKey);
          // If not found, try storage key for selector without nth-child (common fallback)
          if (!stored) {
            try {
              const plain = x.css.replace(/:nth-child\([^)]*\)/g, "");
              if (plain !== x.css) {
                const altKey =
                  "__stn_picked_" + plain.replace(/[^a-zA-Z0-9]/g, "_");
                stored = localStorage.getItem(altKey) || stored;
                if (stored) {
                  console.log(
                    "getData - found stored preview data under stripped selector key:",
                    altKey,
                  );
                }
              }
            } catch (err) {
              // ignore
            }
          }
          if (stored) {
            var storedData = JSON.parse(stored);
            console.debug(
              "getData - found stored preview data from localStorage:",
              storedData,
            );
            if (x.on === "text" && storedData.textContent) {
              console.debug(
                "getData - returning stored textContent:",
                storedData.textContent,
              );
              return storedData.textContent;
            }
            if (x.on === "preview" && storedData.preview) {
              console.debug(
                "getData - returning stored preview:",
                storedData.preview,
              );
              return storedData.preview;
            }
          }
        } catch (err) {
          console.debug("getData - error checking localStorage:", err);
        }

        // Try regular document query first
        let node = document.querySelector(x.css);
        console.debug("getData - found node:", node);

        // If not found, try deeper strategies: search shadow DOMs and try simplified selectors
        if (!node) {
          console.debug(
            "getData - selector didn't match, trying deep search and fallbacks for:",
            x.css,
          );

          // Helper: search through document and all shadow roots for a selector
          function querySelectorDeep(selector) {
            const roots = [document];
            while (roots.length) {
              const root = roots.shift();
              try {
                const found = root.querySelector(selector);
                if (found) return found;
              } catch (err) {
                // ignore invalid selector errors
              }
              // enqueue all shadow roots found under this root
              try {
                const elems = root.querySelectorAll("*");
                for (let el of elems) {
                  if (el.shadowRoot) roots.push(el.shadowRoot);
                }
              } catch (err) {
                // ignore
              }
            }
            return null;
          }

          // Try deep search using original selector
          node = querySelectorDeep(x.css);
          if (node) {
            console.debug("getData - found node via deep shadow search:", node);
          }

          // If still not found, remove :nth-child(...) from selector and try again
          if (!node) {
            const stripped = x.css.replace(/:nth-child\([^)]*\)/g, "");
            if (stripped !== x.css) {
              console.debug(
                "getData - trying selector without nth-child:",
                stripped,
              );
              node =
                document.querySelector(stripped) || querySelectorDeep(stripped);
              if (node)
                console.debug(
                  "getData - found node after stripping nth-child:",
                  node,
                );
            }
          }

          // As a last resort, try only the last simple token of the selector (e.g., tag.class or #id)
          if (!node) {
            try {
              const tokens = x.css.split(/\s+/);
              const last = tokens[tokens.length - 1].replace(
                /\:nth-child\([^)]*\)/g,
                "",
              );
              if (last && last !== x.css) {
                console.debug("getData - trying last token of selector:", last);
                node = document.querySelector(last) || querySelectorDeep(last);
                if (node)
                  console.debug("getData - found node via last token:", node);
              }
            } catch (err) {
              // ignore
            }
          }

          if (!node) {
            console.debug(
              "getData - no node found after fallbacks, returning empty string",
            );
            return "";
          }
        }
        let v = null;
        if (x.on == "text") {
          v =
            (_a = node.textContent) === null || _a === void 0
              ? void 0
              : _a.trim();
          console.debug("getData - extracted text:", v);
        } else {
          v = node.getAttribute(x.on);
          console.debug("getData - extracted attribute:", x.on, "=", v);
        }
        if (x.on == "href" || (x.on == "src" && v.startsWith("/"))) {
          v = location.origin + v;
        }
        if (!v) {
          console.debug("getData - value is empty/null, returning null");
          return null;
        }
        if (x.type == "number") {
          v = v
            .trim()
            .replace(/ /g, "")
            .replace(/\s/g, "")
            .match(/^\d+|\d+\b|\d+(?=\w)/i)[0];
        }
        console.debug("getData - final value:", v);
        return v;
      }
      function getCustomCssData() {
        let customs = __save_to_notion_customs;
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
