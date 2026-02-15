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
    (__webpack_require__.s = 22),
  );
  /******/
})(
  /************************************************************************/
  /******/ [
    /* 0 */
    /***/ function (module, exports, __webpack_require__) {
      "use strict";

      // License: MIT
      // Author: Anton Medvedev <anton@medv.io>
      // Source: https://github.com/antonmedv/finder
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.finder = void 0;
      let config;
      let rootDocument;
      function finder(input, options) {
        if (input.nodeType !== Node.ELEMENT_NODE) {
          throw new Error(
            `Can't generate CSS selector for non-element node type.`,
          );
        }
        if ("html" === input.tagName.toLowerCase()) {
          return "html";
        }
        const defaults = {
          root: document.body,
          idName: (name) => true,
          className: (name) => true,
          tagName: (name) => true,
          attr: (name, value) => false,
          seedMinLength: 1,
          optimizedMinLength: 2,
          threshold: 1000,
          maxNumberOfTries: 10000,
        };
        config = Object.assign(Object.assign({}, defaults), options);
        rootDocument = findRootDocument(config.root, defaults);
        let path = bottomUpSearch(input, "all", () =>
          bottomUpSearch(input, "two", () =>
            bottomUpSearch(input, "one", () => bottomUpSearch(input, "none")),
          ),
        );
        if (path) {
          const optimized = sort(optimize(path, input));
          if (optimized.length > 0) {
            path = optimized[0];
          }
          return selector(path);
        } else {
          throw new Error(`Selector was not found.`);
        }
      }
      exports.finder = finder;
      function findRootDocument(rootNode, defaults) {
        if (rootNode.nodeType === Node.DOCUMENT_NODE) {
          return rootNode;
        }
        if (rootNode === defaults.root) {
          return rootNode.ownerDocument;
        }
        return rootNode;
      }
      function bottomUpSearch(input, limit, fallback) {
        let path = null;
        let stack = [];
        let current = input;
        let i = 0;
        while (current) {
          let level = maybe(id(current)) ||
            maybe(...attr(current)) ||
            maybe(...classNames(current)) ||
            maybe(tagName(current)) || [any()];
          const nth = index(current);
          if (limit == "all") {
            if (nth) {
              level = level.concat(
                level.filter(dispensableNth).map((node) => nthChild(node, nth)),
              );
            }
          } else if (limit == "two") {
            level = level.slice(0, 1);
            if (nth) {
              level = level.concat(
                level.filter(dispensableNth).map((node) => nthChild(node, nth)),
              );
            }
          } else if (limit == "one") {
            const [node] = (level = level.slice(0, 1));
            if (nth && dispensableNth(node)) {
              level = [nthChild(node, nth)];
            }
          } else if (limit == "none") {
            level = [any()];
            if (nth) {
              level = [nthChild(level[0], nth)];
            }
          }
          for (let node of level) {
            node.level = i;
          }
          stack.push(level);
          if (stack.length >= config.seedMinLength) {
            path = findUniquePath(stack, fallback);
            if (path) {
              break;
            }
          }
          current = current.parentElement;
          i++;
        }
        if (!path) {
          path = findUniquePath(stack, fallback);
        }
        if (!path && fallback) {
          return fallback();
        }
        return path;
      }
      function findUniquePath(stack, fallback) {
        const paths = sort(combinations(stack));
        if (paths.length > config.threshold) {
          return fallback ? fallback() : null;
        }
        for (let candidate of paths) {
          if (unique(candidate)) {
            return candidate;
          }
        }
        return null;
      }
      function selector(path) {
        let node = path[0];
        let query = node.name;
        for (let i = 1; i < path.length; i++) {
          const level = path[i].level || 0;
          if (node.level === level - 1) {
            query = `${path[i].name} > ${query}`;
          } else {
            query = `${path[i].name} ${query}`;
          }
          node = path[i];
        }
        return query;
      }
      function penalty(path) {
        return path.map((node) => node.penalty).reduce((acc, i) => acc + i, 0);
      }

      // Helper function to count elements matching a selector, including in shadow DOMs
      function countMatchingElements(selector, root = document, depth = 0) {
        if (depth > 20) return 0; // Prevent infinite recursion

        let count = 0;

        // Count matches in current root
        try {
          count += root.querySelectorAll(selector).length;
        } catch (e) {
          // Invalid selector, return 0
          return 0;
        }

        // Count matches in shadow DOMs
        const allElements = root.querySelectorAll("*");
        for (const element of allElements) {
          if (element.shadowRoot) {
            count += countMatchingElements(
              selector,
              element.shadowRoot,
              depth + 1,
            );
          }
        }

        return count;
      }

      function unique(path) {
        const css = selector(path);
        const matchCount = countMatchingElements(css, rootDocument);

        switch (matchCount) {
          case 0:
            throw new Error(`Can't select any node with this selector: ${css}`);
          case 1:
            return true;
          default:
            return false;
        }
      }
      function id(input) {
        const elementId = input.getAttribute("id");
        if (elementId && config.idName(elementId)) {
          return {
            name: "#" + CSS.escape(elementId),
            penalty: 0,
          };
        }
        return null;
      }
      function attr(input) {
        const attrs = Array.from(input.attributes).filter((attr) =>
          config.attr(attr.name, attr.value),
        );
        return attrs.map((attr) => ({
          name: `[${CSS.escape(attr.name)}="${CSS.escape(attr.value)}"]`,
          penalty: 0.5,
        }));
      }
      function classNames(input) {
        const names = Array.from(input.classList).filter(config.className);
        return names.map((name) => ({
          name: "." + CSS.escape(name),
          penalty: 1,
        }));
      }
      function tagName(input) {
        const name = input.tagName.toLowerCase();
        if (config.tagName(name)) {
          return {
            name,
            penalty: 2,
          };
        }
        return null;
      }
      function any() {
        return {
          name: "*",
          penalty: 3,
        };
      }
      function index(input) {
        const parent = input.parentNode;
        if (!parent) {
          return null;
        }
        let child = parent.firstChild;
        if (!child) {
          return null;
        }
        let i = 0;
        while (child) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            i++;
          }
          if (child === input) {
            break;
          }
          child = child.nextSibling;
        }
        return i;
      }
      function nthChild(node, i) {
        return {
          name: node.name + `:nth-child(${i})`,
          penalty: node.penalty + 1,
        };
      }
      function dispensableNth(node) {
        return node.name !== "html" && !node.name.startsWith("#");
      }
      function maybe(...level) {
        const list = level.filter(notEmpty);
        if (list.length > 0) {
          return list;
        }
        return null;
      }
      function notEmpty(value) {
        return value !== null && value !== undefined;
      }
      function* combinations(stack, path = []) {
        if (stack.length > 0) {
          for (let node of stack[0]) {
            yield* combinations(
              stack.slice(1, stack.length),
              path.concat(node),
            );
          }
        } else {
          yield path;
        }
      }
      function sort(paths) {
        return [...paths].sort((a, b) => penalty(a) - penalty(b));
      }
      function* optimize(
        path,
        input,
        scope = {
          counter: 0,
          visited: new Map(),
        },
      ) {
        if (path.length > 2 && path.length > config.optimizedMinLength) {
          for (let i = 1; i < path.length - 1; i++) {
            if (scope.counter > config.maxNumberOfTries) {
              return; // Okay At least I tried!
            }
            scope.counter += 1;
            const newPath = [...path];
            newPath.splice(i, 1);
            const newPathKey = selector(newPath);
            if (scope.visited.has(newPathKey)) {
              return;
            }
            if (unique(newPath) && same(newPath, input)) {
              yield newPath;
              scope.visited.set(newPathKey, true);
              yield* optimize(newPath, input, scope);
            }
          }
        }
      }
      function same(path, input) {
        return rootDocument.querySelector(selector(path)) === input;
      }

      /***/
    },
    /* 1 */
    /***/ function (module, exports, __webpack_require__) {
      "use strict";

      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getNodeCss = void 0;
      const finder_1 = __webpack_require__(0);
      function getNodeCss(node) {
        if (node.nodeType == Node.TEXT_NODE) {
          return getNodeCss(node.parentNode);
        }
        return (0, finder_1.finder)(node);
      }
      exports.getNodeCss = getNodeCss;

      /***/
    },
    /* 2 */
    /***/ function (module, exports, __webpack_require__) {
      "use strict";

      Object.defineProperty(exports, "__esModule", { value: true });
      exports.convertSvgElementToImageSource = void 0;
      function convertSvgElementToImageSource(svgEl) {
        let svgData = new XMLSerializer().serializeToString(svgEl);
        let img = new Image();
        img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgData));
        return img.src;
      }
      exports.convertSvgElementToImageSource = convertSvgElementToImageSource;

      /***/
    },
    ,
    /* 3 */ /* 4 */
    /***/ function (module, exports, __webpack_require__) {
      "use strict";

      Object.defineProperty(exports, "__esModule", { value: true });
      exports.comp2El = exports.addCss2 = exports.htmlString2El = void 0;
      function htmlString2El(s) {
        var wrapper = document.createElement("div");
        wrapper.innerHTML = s;
        return wrapper.children[0];
      }
      exports.htmlString2El = htmlString2El;
      function addCss2(rule) {
        let css = document.createElement("style");
        css.type = "text/css";
        css.appendChild(document.createTextNode(rule)); // Support for the rest
        document.getElementsByTagName("head")[0].appendChild(css);
      }
      exports.addCss2 = addCss2;
      function comp2El(comp, vars) {
        const el = htmlString2El(comp.html(vars));
        addCss2(typeof comp.css == "function" ? comp.css(vars) : comp.css);
        return el;
      }
      exports.comp2El = comp2El;

      /***/
    },
    /* 5 */
    /***/ function (module, exports) {
      var g;

      // This works in non-strict mode
      g = (function () {
        return this;
      })();

      try {
        // This works if eval is allowed (see CSP)
        g = g || new Function("return this")();
      } catch (e) {
        // This works if the window reference is available
        if (typeof window === "object") g = window;
      }

      // g can still be undefined, but nothing to do about it...
      // We return undefined, instead of nothing here, so it's
      // easier to handle this case. if(!global) { ...}

      module.exports = g;

      /***/
    },
    ,
    /* 6 */ /* 7 */
    /***/ function (module, exports, __webpack_require__) {
      "use strict";
      /* WEBPACK VAR INJECTION */ (function (global) {
        /* eslint-disable no-param-reassign */
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.destroy =
          exports.rescale =
          exports.draw =
          exports.clear =
          exports.init =
            void 0;
        function getDocumentWidthAndHeight() {
          return {
            width: global.document.documentElement.clientWidth,
            height: global.document.documentElement.clientHeight,
          };
        }
        function createCanvas() {
          const canvas = global.document.createElement("canvas");
          canvas.id = "stn-clip-content-canvas";
          const context = canvas.getContext("2d");
          // Set canvas width & height
          const { width, height } = getDocumentWidthAndHeight();
          setCanvasWidthAndHeight(canvas, context, { width, height });
          // Position canvas
          canvas.style.position = "fixed";
          canvas.style.left = "0";
          canvas.style.top = "0";
          canvas.style.zIndex = "2147483644";
          // Disable any user interactions
          canvas.style.pointerEvents = "none";
          global.document.body.appendChild(canvas);
          return { canvas, context, width, height };
        }
        function setCanvasWidthAndHeight(canvas, context, { width, height }) {
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
          // Scale
          const scale = global.window.devicePixelRatio;
          canvas.width = Math.floor(width * scale);
          canvas.height = Math.floor(height * scale);
          // Normalize coordinate system to use css pixels.
          context.scale(scale, scale);
        }
        let state = {};
        function init() {
          if (!state.canvas) {
            state = createCanvas();
          }
        }
        exports.init = init;
        function clear() {
          if (state.context) {
            state.context.clearRect(0, 0, state.width, state.height);
          }
        }
        exports.clear = clear;
        function draw(callback) {
          clear();
          callback(state.context);
        }
        exports.draw = draw;
        function rescale() {
          // First reset so that the canvas size doesn't impact the container size
          setCanvasWidthAndHeight(state.canvas, state.context, {
            width: 0,
            height: 0,
          });
          const { width, height } = getDocumentWidthAndHeight();
          setCanvasWidthAndHeight(state.canvas, state.context, {
            width,
            height,
          });
          // update state
          state.width = width;
          state.height = height;
        }
        exports.rescale = rescale;
        function destroy() {
          if (state.canvas) {
            clear();
            state.canvas.parentNode.removeChild(state.canvas);
            state = {};
          }
        }
        exports.destroy = destroy;

        /* WEBPACK VAR INJECTION */
      }).call(this, __webpack_require__(5));

      /***/
    },
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    /* 8 */ /* 9 */ /* 10 */ /* 11 */ /* 12 */ /* 13 */ /* 14 */ /* 15 */ /* 16 */ /* 17 */ /* 18 */ /* 19 */ /* 20 */ /* 21 */ /* 22 */
    /***/ function (module, exports, __webpack_require__) {
      "use strict";

      var __awaiter =
        (this && this.__awaiter) ||
        function (thisArg, _arguments, P, generator) {
          function adopt(value) {
            return value instanceof P
              ? value
              : new P(function (resolve) {
                  resolve(value);
                });
          }
          return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
              try {
                step(generator.next(value));
              } catch (e) {
                reject(e);
              }
            }
            function rejected(value) {
              try {
                step(generator["throw"](value));
              } catch (e) {
                reject(e);
              }
            }
            function step(result) {
              result.done
                ? resolve(result.value)
                : adopt(result.value).then(fulfilled, rejected);
            }
            step(
              (generator = generator.apply(thisArg, _arguments || [])).next(),
            );
          });
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      // import { htmlString2El, addCss2, comp2El } from '../clipper/clipperUtil'
      const cancelSnackBar_1 = __webpack_require__(23);
      const canvas_1 = __webpack_require__(7);
      const visualizer_1 = __webpack_require__(24);
      const utils_1 = __webpack_require__(25);
      const confirmSelectionDialog_1 = __webpack_require__(26);
      const getNodeCss_1 = __webpack_require__(1);
      const getMatchingElements_1 = __webpack_require__(27);
      const listFeature_1 = __webpack_require__(28);
      function htmlString2El(s) {
        var wrapper = document.createElement("div");
        wrapper.innerHTML = s;
        return wrapper.children[0];
      }
      function addCss2(rule) {
        let css = document.createElement("style");
        css.type = "text/css";
        css.appendChild(document.createTextNode(rule)); // Support for the rest
        document.getElementsByTagName("head")[0].appendChild(css);
      }
      function comp2El(comp, vars) {
        const el = htmlString2El(comp.html(vars));
        addCss2(typeof comp.css == "function" ? comp.css(vars) : comp.css);
        return el;
      }
      // declare var action: keyof Actions
      // declare var props: Actions[keyof Actions]
      // const topleftBoxContainer = {
      //     css: ``,
      //     html: ({}) => `<div id="clipcontent" style="
      //     all:unset;
      //     cursor: pointer;
      //     justify-items: center;
      //     display: flex;
      //     flex-direction: row;
      //     position:absolute;
      //     align-items: center;
      //     width: fit-content;
      //     background-color:transparent;
      //     left:10px;
      //     top:10px;
      //     gap:8px;
      //     ">
      //     </div>
      // `,
      // }
      let currentNode;
      const pointer = { x: 0, y: 0 };
      const FORBIDDEN_PARENT_IDS = [`cancelsnackbar-${idName}`];
      function hasForbiddenParents(a, forbiddenParentIds) {
        let node = a;
        let forbiddenParentIdsMap = Object.fromEntries(
          forbiddenParentIds.map((x) => [x, true]),
        );
        while (node) {
          if (node.id in forbiddenParentIdsMap) {
            return true;
          }
          node = node.parentElement;
        }
        return false;
      }
      function selectAndDrawElement(element) {
        currentNode = element;
        (0, visualizer_1.drawSelectedElement)(currentNode);
      }
      function findAndDrawElement(x, y, forbiddenParentIds) {
        currentNode = (0, utils_1.deepElementFromPoint)(x, y);
        if (hasForbiddenParents(currentNode, forbiddenParentIds)) {
          selectAndDrawElement(null);
          return;
        }
        selectAndDrawElement(currentNode);
      }
      // function debounce(func: (...args: any[]) => any, wait, immediate=false, context?) {
      //     var result
      //     var timeout = null
      //     return function (...args) {
      //         var later = function () {
      //             timeout = null
      //             if (!immediate) result = func(...args)
      //         }
      //         var callNow = immediate && !timeout
      //         // Tant que la fonction est appelée, on reset le timeout.
      //         clearTimeout(timeout)
      //         timeout = setTimeout(later, wait)
      //         if (callNow) result = func(...args)
      //         return result
      //     }
      // }
      // const findAndDrawElementDebounced = debounce(findAndDrawElement, 100)
      let stack = [];
      function drawParent() {
        if (currentNode) {
          stack.push(currentNode);
          selectAndDrawElement(
            findFirstParentWithDifferentDimension(currentNode),
          );
        }
      }
      function findFirstParentWithDifferentDimension(node) {
        let parent = node.parentElement;
        const bound = node.getBoundingClientRect();
        while (parent) {
          const parentBound = parent.getBoundingClientRect();
          if (
            parentBound.width != bound.width ||
            parentBound.height != bound.height ||
            parentBound.x != bound.x ||
            parentBound.y != bound.y
          ) {
            return parent;
          }
          parent = parent.parentElement;
        }
        return null;
      }
      function drawNextInStack() {
        if (stack.length) {
          const x = stack.pop();
          selectAndDrawElement(x);
        } else {
          selectAndDrawElement(currentNode.firstElementChild);
        }
      }
      const onMouseOver = (event) => {
        // Only highlight on hover for field selection and content selection modes
        // For basic clipContent, highlighting happens on click instead
        if (
          manager.status === "field-selection" ||
          manager.status === "content-selection"
        ) {
          window.requestAnimationFrame(() => {
            event.stopPropagation();
            findAndDrawElement(
              event.clientX,
              event.clientY,
              FORBIDDEN_PARENT_IDS,
            );
          });
        }
      };
      const onMouseMove = (event) => {
        window.requestAnimationFrame(() => {
          event.stopPropagation();
          pointer.x = event.clientX;
          pointer.y = event.clientY;
        });
      };
      function onMouseClick(event) {
        if (hasForbiddenParents(event.target, FORBIDDEN_PARENT_IDS)) {
          return;
        }
        // Highlight the clicked element
        findAndDrawElement(event.clientX, event.clientY, FORBIDDEN_PARENT_IDS);
        event.stopPropagation();
        event.preventDefault();
        manager.startConfirmSelection({ x: event.clientX, y: event.clientY });
        return true;
      }
      function onFieldClick(event) {
        if (hasForbiddenParents(event.target, FORBIDDEN_PARENT_IDS)) {
          return;
        }
        event.stopPropagation();
        event.preventDefault();
        manager.startFieldConfirmSelection({
          x: event.clientX,
          y: event.clientY,
        });
        return true;
      }
      function onContentClick(event) {
        console.log("[onContentClick] Content click detected");
        if (hasForbiddenParents(event.target, FORBIDDEN_PARENT_IDS)) {
          console.log("[onContentClick] Forbidden parent detected, ignoring");
          return;
        }
        event.stopPropagation();
        event.preventDefault();
        console.log(
          "[onContentClick] Calling startContentConfirmSelection",
          event.clientX,
          event.clientY,
        );
        manager.startContentConfirmSelection({
          x: event.clientX,
          y: event.clientY,
        });
        return true;
      }
      const confirmState = {
        _confirmCallback: null,
        onMouseClick(event) {
          var _a;
          // check if its outside the confirm selection box
          // if yes, cancel
          if (
            ((_a = event.target.closest(`#confirm-selection-${idName}`)) ===
              null || _a === void 0
              ? void 0
              : _a.id) != `confirm-selection-${idName}`
          ) {
            confirmState.cancel();
          }
        },
        onKeyDown(event) {
          if (event.key === "Enter" || event.key === "Return") {
            event.preventDefault();
            event.stopPropagation();
            if (confirmState._confirmCallback) {
              confirmState._confirmCallback();
            }
          }
        },
        clipContent() {
          confirmState._cancelConfirmSelectionDialog();
          manager.clipContent();
        },
        _startListenEvents() {
          document.addEventListener("click", confirmState.onMouseClick);
          document.addEventListener("keydown", confirmState.onKeyDown, true);
        },
        _stopListenEvents() {
          document.removeEventListener("click", confirmState.onMouseClick);
          document.removeEventListener("keydown", confirmState.onKeyDown, true);
        },
        _resetStack() {
          stack = [];
        },
        _disableButton(name) {
          document
            .getElementById(`confirm-selection-${idName}`)
            .querySelector(`#stn-${name}-button`)
            .setAttribute("disabled", "true");
        },
        _enableButton(name) {
          document
            .getElementById(`confirm-selection-${idName}`)
            .querySelector(`#stn-${name}-button`)
            .removeAttribute("disabled");
        },
        _updatePlusMinusButton() {
          console.log("update", currentNode.firstElementChild);
          if (!currentNode.firstElementChild) {
            console.log("can't go plus");
            confirmState._disableButton("plus");
          } else {
            confirmState._enableButton("plus");
          }
          if (currentNode == document.body) {
            confirmState._disableButton("minus");
          } else {
            confirmState._enableButton("minus");
          }
        },
        _onClickMinusButton(cb) {
          drawParent();
          confirmState._updatePlusMinusButton();
          cb === null || cb === void 0 ? void 0 : cb();
        },
        _onClickPlusButton(cb) {
          drawNextInStack();
          confirmState._updatePlusMinusButton();
          cb === null || cb === void 0 ? void 0 : cb();
        },
        _onClickConfirmButton() {
          // extract current content
        },
        _addConfirmSelectionDialog(p) {
          var _a;
          const confirmSelectionDialogEl = comp2El(
            confirmSelectionDialog_1.confirmSelectionDialog,
            {
              idName,
            },
          );
          confirmSelectionDialogEl.style.top = `${p.y - 55}px`;
          confirmSelectionDialogEl.style.left = `${p.x - Math.floor(186 / 2)}px`;
          const minusButtonEl =
            confirmSelectionDialogEl.querySelector("#stn-minus-button");
          minusButtonEl.addEventListener("click", () =>
            confirmState._onClickMinusButton(p.refreshCallbackOnPlusMinus),
          );
          const plusButtonEl =
            confirmSelectionDialogEl.querySelector("#stn-plus-button");
          plusButtonEl.addEventListener("click", () =>
            confirmState._onClickPlusButton(p.refreshCallbackOnPlusMinus),
          );
          if ((_a = p.actions) === null || _a === void 0 ? void 0 : _a.length) {
            const confirmButtonEl = confirmSelectionDialogEl.querySelector(
              "#stn-confirm-button",
            );
            const textEl = confirmButtonEl.querySelector(
              "#stn-confirmselection",
            );
            textEl.innerHTML = p.actions[0].name;
            confirmButtonEl.addEventListener("click", p.actions[0].callback);
            // Store the callback for Enter key
            confirmState._confirmCallback = p.actions[0].callback;
            // now duplicate the confirmButtonEl and append it below
            const confirmButtonEl2 = confirmButtonEl.cloneNode(true);
            // append it next to confirmButtonEl
            confirmButtonEl.parentNode.insertBefore(
              confirmButtonEl2,
              confirmButtonEl.nextSibling,
            );
            const textEl2 = confirmButtonEl2.querySelector(
              "#stn-confirmselection",
            );
            textEl2.innerHTML = p.actions[1].name;
            confirmButtonEl2.addEventListener("click", p.actions[1].callback);
          } else {
            const confirmButtonEl = confirmSelectionDialogEl.querySelector(
              "#stn-confirm-button",
            );
            confirmButtonEl.addEventListener(
              "click",
              confirmState._onClickConfirmButton,
            );
            confirmButtonEl.addEventListener("click", confirmState.clipContent);
            // Store the callback for Enter key
            confirmState._confirmCallback = confirmState.clipContent;
          }
          document.body.appendChild(confirmSelectionDialogEl);
          confirmState._updatePlusMinusButton();
          return confirmSelectionDialogEl;
        },
        _removeConfirmSelectionDialog() {
          const confirmSelectionDialog = document.querySelector(
            `#confirm-selection-${idName}`,
          );
          confirmSelectionDialog === null || confirmSelectionDialog === void 0
            ? void 0
            : confirmSelectionDialog.remove();
        },
        setup(p) {
          console.log("open confirm selection dialog");
          confirmState._resetStack();
          confirmState._startListenEvents();
          return confirmState._addConfirmSelectionDialog(p);
        },
        _cancelConfirmSelectionDialog() {
          confirmState._stopListenEvents();
          confirmState._removeConfirmSelectionDialog();
          confirmState._resetStack();
          confirmState._confirmCallback = null;
        },
        cancel() {
          confirmState._cancelConfirmSelectionDialog();
          manager.stopClipZone(false);
          manager.startSelectZone();
          (0, listFeature_1.cleanupPoppers)();
        },
      };
      const selectZoneState = {
        setup() {},
      };
      function hidePopupIframe() {
        let d = document.querySelector(`#floating-dialog-stn`);
        if (d) {
          d.style.removeProperty("display");
          d.style.display = "none";
        }
      }
      function showPopupIframe() {
        let d = document.querySelector(`#floating-dialog-stn`);
        if (d) {
          d.style.removeProperty("display");
          d.style.display = "block";
          chrome.runtime.sendMessage({
            popup: {
              name: "showPopupIframe",
              args: {},
            },
          });
        }
      }
      function onUserPressEscape(event) {
        if (event.key == "Escape") {
          event.stopPropagation();
          event.preventDefault();
          manager.stopClipZone(true, null, false);
        }
      }
      let done = null;
      function returnResponseToBackground(data) {
        const message = Object.assign({ asyncId, type: "asyncExec" }, data);
        return new Promise((resolve) => {
          chrome.runtime.sendMessage(message, function (response) {
            console.log(
              "[clipContent] returnResponseToBackground response:",
              response,
            );
            done === null || done === void 0 ? void 0 : done(response);
            done = null;
            resolve(response);
          });
          // done = resolve
        });
      }
      function cleanupFieldOverlays() {
        if (window.fieldOverlays) {
          window.fieldOverlays.forEach(({ overlay, label }) => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            if (label.parentNode) label.parentNode.removeChild(label);
          });
          window.fieldOverlays = [];
        }
      }
      const manager = {
        status: "stopped",
        confirmState,
        selectZoneState,
        startSelectZone() {
          (0, canvas_1.init)();
          manager._startListenSelectZoneEvents();
          manager._hideDialogAndShowCancelButton();
          manager.status = "select-zone";
        },
        success(payload) {
          // just send response back
          returnResponseToBackground({ success: true, payload });
        },
        cancel() {
          returnResponseToBackground({ success: false });
        },
        _showCancelButton(msg) {
          const cancelSnackBarEl = comp2El(cancelSnackBar_1.cancelSnackBar, {
            idName,
            msg: (msg !== null && msg !== void 0 ? msg : action == "pickData")
              ? "Click on the data you would like to extract"
              : action == "pickList"
                ? "Select a item of the list"
                : action == "pickFields"
                  ? "Click on the fields you would like to extract"
                  : action == "pickContent"
                    ? "Click on the content area you would like to extract"
                    : "Click on the area you would like to clip",
          });
          cancelSnackBarEl
            .querySelector(`#btn-actionCancel`)
            .addEventListener("click", () =>
              manager.stopClipZone(true, null, false),
            );
          setTimeout(
            () => document.querySelector(`#cancelsnackbar-${idName}`).focus(),
            50,
          );
          document.body.appendChild(cancelSnackBarEl);
        },
        _hideDialogAndShowCancelButton() {
          hidePopupIframe();
          this._showCancelButton();
          document.addEventListener("keydown", onUserPressEscape);
        },
        _removeCancelButton() {
          let el = document.querySelector(`#cancelsnackbar-${idName}`);
          el === null || el === void 0 ? void 0 : el.parentNode.removeChild(el);
          document.removeEventListener("keydown", onUserPressEscape);
        },
        _showCancelButtonWithContinueButton() {
          this._showCancelButton("Select at least 1 item");
        },
        // this wall is to prevent hover effect
        _addWall() {
          // const el = htmlString2El(`<div style="position:fixed !important; height:100vh !important; width:100vw !important; background:rgba(0,0,0,0.0) !important; top:0 !important; left:0 !important; z-index:199999999997 !important;" id="stn-clip-content-wall"></div>`)
          // document.body.appendChild(el)
        },
        _removeWall() {
          // const el = document.querySelector('#stn-clip-content-wall')
          // el?.parentNode.removeChild(el)
        },
        _startListenSelectZoneEvents() {
          this._addWall();
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseover", onMouseOver);
          document.addEventListener("click", onMouseClick, true);
        },
        _stopListenSelectZoneEvents() {
          this._removeWall();
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseover", onMouseOver);
          document.removeEventListener("click", onMouseClick, true);
        },
        startConfirmSelection({ x, y }) {
          manager._stopListenSelectZoneEvents();
          if (action == "pickList") {
            const similarItems = (0, getMatchingElements_1.getMatchingElements)(
              currentNode,
            );
            (0, listFeature_1.displayListAugmentation)(
              similarItems.slice(0, 30),
            );
            const confirmSelectionDialogEl = manager.confirmState.setup({
              x,
              y,
              actions: [
                {
                  name: `Select All (${similarItems.length})`,
                  callback: () => {
                    // move the code from clipper
                    confirmState._cancelConfirmSelectionDialog();
                    manager.stopClipZone(
                      true,
                      (0, listFeature_1.continueWithListAugmentation)(
                        similarItems,
                      ),
                    );
                    // select all items and open the extension
                  },
                },
                {
                  name: `Select Manually`,
                  callback: () => {
                    confirmState._cancelConfirmSelectionDialog();
                    this._stopClipArea();
                    (0, listFeature_1.startListFeature)(
                      similarItems,
                      (items) => {
                        manager.stopClipZone(
                          true,
                          (0, listFeature_1.continueWithListAugmentation)(
                            items,
                          ),
                        );
                      },
                    );
                    manager.stopClipZone(false);
                    manager._showCancelButtonWithContinueButton();
                  },
                },
              ],
              refreshCallbackOnPlusMinus: () => {
                const similarItems = (0,
                getMatchingElements_1.getMatchingElements)(currentNode);
                console.log("refresh page", similarItems.length);
                (0, listFeature_1.displayListAugmentation)(
                  similarItems.slice(0, 30),
                );
                const confirmButtonEl = confirmSelectionDialogEl.querySelector(
                  "#stn-confirm-button",
                );
                const textEl = confirmButtonEl.querySelector(
                  "#stn-confirmselection",
                );
                textEl.innerHTML = `Select All (${similarItems.length})`;
              },
            });
          } else {
            manager.confirmState.setup({ x, y });
          }
          manager.status = "confirm-selection";
        },
        _stopClipArea() {
          manager._stopListenSelectZoneEvents();
          manager._stopListenFieldSelectionEvents();
          manager._stopListenContentSelectionEvents();
          (0, canvas_1.destroy)();
          cleanupFieldOverlays();
          manager.status = "stopped";
        },
        stopClipZone(showIframe = true, payload = null, sendResponse = true) {
          this._stopClipArea();
          manager._removeCancelButton();
          if (showIframe) {
            showPopupIframe();
            if (sendResponse) {
              if (payload) {
                manager.success(payload);
              } else {
                manager.cancel();
              }
            }
          }
        },
        clipContent() {
          var _a;
          return __awaiter(this, void 0, void 0, function* () {
            if (!currentNode) {
              console.error("[clipContent] currentNode is null/undefined");
              manager.stopClipZone(true, null);
              return;
            }
            if (action == "pickData") {
              console.log("[clipContent] pickData action triggered");
              const css = (0, getNodeCss_1.getNodeCss)(currentNode);
              console.log("[clipContent] Generated CSS selector:", css);
              const payload = {
                css,
                domain: window.location.hostname || "unknown",
                faviconImageBase64: null,
              };
              console.log("[clipContent] Sending payload:", payload);
              // Legacy: send via chrome.runtime.sendMessage for old code paths
              chrome.runtime.sendMessage({
                popup: {
                  name: "pickDataAdded",
                  args: payload,
                },
              });
              console.log("[clipContent] Legacy message sent");
              // New: return payload via bgAsk response
              manager.stopClipZone(true, payload);
              console.log("[clipContent] stopClipZone called with payload");
            } else if (action == "pickFields") {
              manager.extractFields();
            } else if (action == "pickContent") {
              manager.extractContent();
            } else {
              const html =
                currentNode === null || currentNode === void 0
                  ? void 0
                  : currentNode.outerHTML;
              const payload = {
                html,
                previewString:
                  ((_a =
                    currentNode === null || currentNode === void 0
                      ? void 0
                      : currentNode.innerText) === null || _a === void 0
                    ? void 0
                    : _a.substring(0, 1024)) || "",
                pageUrl: window.location.href,
              };
              console.log("[clipContent] startClipContent payload:", payload);

              // Log detailed information about the selected element
              if (currentNode) {
                console.log("====== SELECTED ELEMENT DETAILS ======");
                console.log("Tag name:", currentNode.tagName);
                console.log("ID:", currentNode.id || "(none)");
                console.log("Classes:", currentNode.className || "(none)");

                // Generate CSS selector for this element
                let cssSelector = "";
                try {
                  const getNodeCss = __webpack_require__(1).getNodeCss;
                  cssSelector = getNodeCss(currentNode);
                } catch (e) {
                  // Fallback if webpack require fails
                  cssSelector = currentNode.tagName.toLowerCase();
                  if (currentNode.id) cssSelector += `#${currentNode.id}`;
                  if (currentNode.className)
                    cssSelector += `.${currentNode.className.split(" ").join(".")}`;
                }
                console.log("CSS Selector:", cssSelector);

                console.log(
                  "Text content length:",
                  currentNode.innerText?.length || 0,
                );
                console.log(
                  "Text content preview (first 200 chars):",
                  currentNode.innerText?.substring(0, 200),
                );
                console.log("HTML length:", currentNode.outerHTML?.length || 0);

                // Check if it's in shadow DOM
                let shadowInfo = "Not in Shadow DOM";
                let node = currentNode;
                while (node) {
                  if (node.getRootNode && node.getRootNode() !== document) {
                    const root = node.getRootNode();
                    if (root instanceof ShadowRoot) {
                      shadowInfo = `In Shadow DOM of: ${root.host.tagName}`;
                      if (root.host.id) shadowInfo += `#${root.host.id}`;
                      if (root.host.className)
                        shadowInfo += `.${root.host.className}`;
                      break;
                    }
                  }
                  node = node.parentElement;
                }
                console.log("Shadow DOM:", shadowInfo);
                console.log("======================================");

                // Automatically save this selector to custom site selectors
                // Simplify the selector - use just classes if available, otherwise use the full selector
                let selectorToSave = cssSelector;
                if (currentNode.className && currentNode.className.trim()) {
                  // Use a simplified class-based selector
                  const classes = currentNode.className
                    .trim()
                    .split(/\s+/)
                    .join(".");
                  selectorToSave = `.${classes}`;
                  console.log(
                    `[clipContent] Simplified selector: ${selectorToSave}`,
                  );
                }

                if (
                  selectorToSave &&
                  selectorToSave !== currentNode.tagName.toLowerCase()
                ) {
                  const hostname = window.location.hostname.replace(
                    /^www\./,
                    "",
                  );
                  console.log(
                    `[clipContent] Auto-saving selector "${selectorToSave}" for domain "${hostname}"`,
                  );

                  // Load existing selectors
                  chrome.storage.local.get(
                    ["customSiteSelectors"],
                    function (result) {
                      const selectors = result.customSiteSelectors || {};

                      const existingEntry = selectors[hostname];
                      const existingList = Array.isArray(existingEntry)
                        ? existingEntry
                        : existingEntry
                          ? [existingEntry]
                          : [];

                      const alreadySaved = existingList.some(
                        (item) => item && item.selector === selectorToSave,
                      );

                      if (!alreadySaved) {
                        const embeddedPostFormat = existingList.find(
                          (item) => item && item.embeddedPostFormat,
                        )
                          ? true
                          : false;

                        const updatedList = [
                          ...existingList,
                          { selector: selectorToSave, embeddedPostFormat },
                        ];

                        selectors[hostname] = updatedList;

                        chrome.storage.local.set(
                          { customSiteSelectors: selectors },
                          function () {
                            console.log(
                              `[clipContent] Successfully saved selector for ${hostname}`,
                            );
                            console.log(
                              `[clipContent] Current selectors:`,
                              selectors,
                            );
                          },
                        );
                      } else {
                        console.log(
                          `[clipContent] Selector already saved for ${hostname}`,
                        );
                      }
                    },
                  );
                }
              }

              // Legacy: send via chrome.runtime.sendMessage for old code paths
              chrome.runtime.sendMessage({
                popup: {
                  name: "clipContentAdded",
                  args: payload,
                },
              });
              // New: return payload via bgAsk response
              manager.stopClipZone(true, payload);
            }
          });
        },
        startFieldSelection() {
          (0, canvas_1.init)();
          manager._startListenFieldSelectionEvents();
          manager._hideDialogAndShowCancelButton();
          manager.status = "field-selection";
        },
        startContentSelection() {
          (0, canvas_1.init)();
          manager._startListenContentSelectionEvents();
          manager._hideDialogAndShowCancelButton();
          manager.status = "content-selection";
        },
        _startListenFieldSelectionEvents() {
          this._addWall();
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseover", onMouseOver);
          document.addEventListener("click", onFieldClick, true);
        },
        _stopListenFieldSelectionEvents() {
          this._removeWall();
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseover", onMouseOver);
          document.removeEventListener("click", onFieldClick, true);
        },
        _startListenContentSelectionEvents() {
          this._addWall();
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseover", onMouseOver);
          document.addEventListener("click", onContentClick, true);
        },
        _stopListenContentSelectionEvents() {
          this._removeWall();
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseover", onMouseOver);
          document.removeEventListener("click", onContentClick, true);
        },
        startFieldConfirmSelection({ x, y }) {
          manager._stopListenFieldSelectionEvents();
          const fieldElements = detectFieldElements(currentNode);
          if (fieldElements.length > 0) {
            displayFieldAugmentation(fieldElements.slice(0, 20));
            const confirmSelectionDialogEl = manager.confirmState.setup({
              x,
              y,
              actions: [
                {
                  name: `Select All Fields (${fieldElements.length})`,
                  callback: () => {
                    confirmState._cancelConfirmSelectionDialog();
                    manager.stopClipZone(
                      true,
                      continueWithFieldSelection(fieldElements),
                    );
                  },
                },
                {
                  name: `Select Manually`,
                  callback: () => {
                    confirmState._cancelConfirmSelectionDialog();
                    this._stopClipArea();
                    startManualFieldSelection(
                      fieldElements,
                      (selectedFields) => {
                        manager.stopClipZone(
                          true,
                          continueWithFieldSelection(selectedFields),
                        );
                      },
                    );
                    manager.stopClipZone(false);
                    manager._showCancelButtonWithContinueButton();
                  },
                },
              ],
              refreshCallbackOnPlusMinus: () => {
                const fieldElements = detectFieldElements(currentNode);
                displayFieldAugmentation(fieldElements.slice(0, 20));
                const confirmButtonEl = confirmSelectionDialogEl.querySelector(
                  "#stn-confirm-button",
                );
                const textEl = confirmButtonEl.querySelector(
                  "#stn-confirmselection",
                );
                textEl.innerHTML = `Select All Fields (${fieldElements.length})`;
              },
            });
          } else {
            manager.confirmState.setup({ x, y });
          }
          manager.status = "field-confirm-selection";
        },
        startContentConfirmSelection({ x, y }) {
          return __awaiter(this, void 0, void 0, function* () {
            console.log(
              "[startContentConfirmSelection] Starting content confirm selection",
            );
            manager._stopListenContentSelectionEvents();
            console.log(
              "[startContentConfirmSelection] About to load custom selector",
            );
            const selectorEntries = yield getCustomSelectorsForCurrentDomain();
            console.log(
              "[startContentConfirmSelection] Custom selectors loaded:",
              selectorEntries,
            );
            console.log(
              "[startContentConfirmSelection] Current node:",
              currentNode,
            );
            const contentData = buildContentFromSelectors(
              currentNode,
              selectorEntries,
            );

            // If we used custom selectors, visually highlight the elements that
            // matched so the user can see the full section(s) the selector will
            // capture.  This mirrors the field/list augmentation behaviour used
            // elsewhere in the picker UI.
            try {
              if (selectorEntries && selectorEntries.length > 0) {
                const matching = new Set();
                selectorEntries.forEach((entry) => {
                  if (!entry || !entry.selector) return;
                  const sel = String(entry.selector).trim();
                  try {
                    // Prefer document-level matches, then root-scoped matches,
                    // then shadow-root if available (same strategy as
                    // extractContentData).
                    const docMatches = Array.from(
                      document.querySelectorAll(sel || ""),
                    );
                    if (docMatches && docMatches.length) {
                      docMatches.forEach((m) => matching.add(m));
                      return;
                    }
                  } catch (err) {
                    // invalid selectors will be ignored here — extraction will
                    // already have handled validation.
                  }

                  try {
                    const rootMatches = Array.from(
                      (currentNode && currentNode.querySelectorAll(sel)) || [],
                    );
                    if (rootMatches && rootMatches.length) {
                      rootMatches.forEach((m) => matching.add(m));
                      return;
                    }
                  } catch (err) {
                    /* ignore */
                  }

                  try {
                    if (currentNode && currentNode.getRootNode) {
                      const root = currentNode.getRootNode();
                      if (root instanceof ShadowRoot) {
                        const shadowMatches = Array.from(
                          root.querySelectorAll(sel),
                        );
                        if (shadowMatches && shadowMatches.length) {
                          shadowMatches.forEach((m) => matching.add(m));
                          return;
                        }
                      }
                    }
                  } catch (err) {
                    /* ignore */
                  }
                });

                const matchingElements = Array.from(matching).slice(0, 20);

                // If selectors existed but produced no DOM matches, fall back to
                // highlighting a reasonable container so users still get visual
                // feedback (article or the selected node).
                if (
                  matchingElements.length === 0 &&
                  contentData &&
                  contentData.elementCount > 0
                ) {
                  const fallbackEl =
                    (currentNode &&
                      currentNode.closest &&
                      currentNode.closest("article")) ||
                    document.querySelector("article") ||
                    currentNode ||
                    document.body;
                  if (fallbackEl) matchingElements.push(fallbackEl);
                }

                if (matchingElements.length > 0) {
                  // displayFieldAugmentation will create overlays and they'll be
                  // cleaned up automatically when the picker closes.
                  displayFieldAugmentation(matchingElements);
                }
              }
            } catch (err) {
              console.warn(
                "[startContentConfirmSelection] failed to highlight selectors:",
                err,
              );
            }
            console.log(
              "[startContentConfirmSelection] Content data:",
              contentData,
            );
            if (contentData) {
              const confirmSelectionDialogEl = manager.confirmState.setup({
                x,
                y,
                actions: [
                  {
                    name: `Extract Content (${contentData.textContent.length} chars)`,
                    callback: () => {
                      // Close the small confirm dialog immediately so the UI
                      // responds. Run extractContent and ensure we always
                      // close the picker even if extraction fails.
                      confirmState._cancelConfirmSelectionDialog();
                      try {
                        // manager.extractContent is async; guard errors so a
                        // rejected promise doesn't leave the picker open.
                        const p = manager.extractContent();
                        if (p && typeof p.catch === "function") {
                          p.catch((err) => {
                            console.error(
                              "manager.extractContent failed:",
                              err,
                            );
                            try {
                              manager.stopClipZone(true, null);
                            } catch (e) {
                              /* tolerate */
                            }
                          });
                        }
                      } catch (err) {
                        console.error("manager.extractContent threw:", err);
                        try {
                          manager.stopClipZone(true, null);
                        } catch (e) {
                          /* tolerate */
                        }
                      }
                    },
                  },
                ],
              });
            } else {
              manager.confirmState.setup({ x, y });
            }
            manager.status = "content-confirm-selection";
          });
        },
        extractFields() {
          return __awaiter(this, void 0, void 0, function* () {
            if (!currentNode) {
              console.error(
                "[clipContent] currentNode is null/undefined for field extraction",
              );
              manager.stopClipZone(true, null);
              return;
            }

            const fieldElements = detectFieldElements(currentNode);
            const fields = fieldElements.map((field, index) => ({
              id: `field-${index + 1}`,
              name: getFieldName(field),
              type: getFieldType(field),
              selector: (0, getNodeCss_1.getNodeCss)(field),
              value: getFieldValue(field),
              attributes: getFieldAttributes(field),
            }));

            const payload = {
              fields,
              domain: window.location.hostname || "unknown",
              pageUrl: window.location.href,
              totalFields: fields.length,
            };

            // Protect against synchronous failures in sendMessage (can
            // happen if the extension background/service-worker restarts).
            try {
              chrome.runtime.sendMessage({
                popup: {
                  name: "pickFieldsAdded",
                  args: payload,
                },
              });
            } catch (err) {
              console.warn(
                "extractFields: chrome.runtime.sendMessage threw",
                err,
              );
            }

            manager.stopClipZone(true, payload);
          });
        },
        extractContent() {
          return __awaiter(this, void 0, void 0, function* () {
            if (!currentNode) {
              console.error(
                "[clipContent] currentNode is null/undefined for content extraction",
              );
              manager.stopClipZone(true, null);
              return;
            }

            const selectorEntries = yield getCustomSelectorsForCurrentDomain();
            const contentData = buildContentFromSelectors(
              currentNode,
              selectorEntries,
            );
            if (!contentData) {
              console.error("[clipContent] No content found to extract");
              manager.stopClipZone(true, null);
              return;
            }

            const payload = continueWithContentSelection(
              contentData,
              contentData.embeddedPostFormat,
            );

            console.log("[clipContent] Sending clipContentAdded payload:");
            console.log("  - Title:", payload.title);
            console.log("  - Content length:", payload.content?.length || 0);
            console.log(
              "  - Text content length:",
              payload.textContent?.length || 0,
            );
            console.log(
              "  - Content preview (first 200 chars):",
              payload.content?.substring(0, 200),
            );
            console.log("  - Element count:", payload.elementCount);
            console.log(
              "  - Embedded post format:",
              payload.embeddedPostFormat,
            );
            console.log("  - Full payload keys:", Object.keys(payload));

            // Ensure popup message failures don't prevent the picker from
            // closing — wrap sendMessage so synchronous exceptions are
            // handled and the picker still calls stopClipZone.
            try {
              chrome.runtime.sendMessage({
                popup: {
                  name: "clipContentAdded",
                  args: payload,
                },
              });
            } catch (err) {
              console.warn(
                "extractContent: chrome.runtime.sendMessage threw",
                err,
              );
            }

            manager.stopClipZone(true, payload);
          });
        },
      };
      // function injectStartStop() {
      //     const x = comp2El(topleftBoxContainer, {})
      //     const startButtonEl = comp2El(startButton, {})
      //     const stopButtonEl = comp2El(stopButton, {})
      //     startButtonEl.addEventListener('click', () => {
      //         manager.startSelectZone()
      //     })
      //     stopButtonEl.addEventListener('click', () => {
      //         manager.stopClipZone()
      //     })
      //     x.appendChild(startButtonEl)
      //     x.appendChild(stopButtonEl)
      //     document.body.appendChild(x)
      // }
      // in small dimension: 10x10, fetch as chrome extension
      // async function getCurrentPageFaviconAsBase64(): Promise<{
      //     success: boolean
      //     imageBase64?: string
      // }> {
      // return new Promise((resolve, reject) => {
      //     chrome.runtime.sendMessage({ action: 'getFavicon' }, function (
      //         response
      //     ) {
      //         console.log(response)
      //         resolve({ success: true, imageBase64: response })
      //     })
      //     chrome.tabs.query({ active: true, currentWindow: true }, function (
      //         tabs
      //     ) {
      //     })
      // if (faviconEl) {
      //     const faviconUrl = faviconEl.getAttribute('href')
      //     if (faviconUrl) {
      //         try {
      //             const favicon = new Image()
      //             favicon.crossOrigin = 'anonymous'
      //             favicon.src = faviconUrl
      //             favicon.onload = () => {
      //                 const canvas = document.createElement('canvas')
      //                 canvas.width = favicon.width
      //                 canvas.height = favicon.height
      //                 const ctx = canvas.getContext('2d')
      //                 // reduce size to 10x10
      //                 ctx.drawImage(favicon, 0, 0, 10, 10)
      //                 const dataURL = canvas.toDataURL('image/png')
      //                 resolve({ success: true, imageBase64: dataURL })
      //             }
      //             favicon.onerror = () => {
      //                 resolve({ success: false })
      //             }
      //         } catch (e) {
      //             console.error(e)
      //             resolve({ success: false })
      //         }
      //     }
      // } else {
      //     console.log("can't find favicon")
      //     resolve({ success: false })
      // }
      // })
      // }
      function clipContent(action, props) {
        switch (action) {
          case "startClipContent":
            return manager.startSelectZone();
          case "pickList":
            return manager.startSelectZone();
          case "pickData":
            return manager.startSelectZone();
          case "pickFields":
            return manager.startFieldSelection();
          case "pickContent":
            return manager.startContentSelection();
        }
      }
      clipContent(action, props);

      /***/
    },
    /* 23 */
    /***/ function (module, exports, __webpack_require__) {
      "use strict";

      Object.defineProperty(exports, "__esModule", { value: true });
      exports.cancelSnackBar = void 0;
      exports.cancelSnackBar = {
        css: (p) => `
  .outlined-button-small-${p.idName} {
      all:unset;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      height: 32px !important;
      padding: 0 16px !important;
      border-style: solid !important;
      border-width: 1px !important;
      border-color: rgba(255, 255, 255, 0.2) !important;
      border-radius: 8px !important;
      background-color: rgba(255, 255, 255, 0.1) !important;
      color: #FFFFFF !important;
      text-decoration: none !important;
      cursor: pointer !important;
      margin: 0 !important;
      width: auto !important;
      overflow: visible !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      line-height: normal !important;
      transition: all 0.2s ease-out !important;
      -webkit-font-smoothing: antialiased !important;
      -moz-osx-font-smoothing: grayscale !important;
      -webkit-appearance: none !important;
    }
    
    .outlined-button-small-${p.idName}:hover {
      background-color: rgba(255, 255, 255, 0.15) !important;
      border-color: rgba(255, 255, 255, 0.3) !important;
    }
    
    .outlined-button-small-${p.idName}:active {
      background-color: rgba(255, 255, 255, 0.2) !important;
      border-color: rgba(255, 255, 255, 0.4) !important;
    }
    
    .outlined-button-small-${p.idName}:focus {
      background-color: rgba(255, 255, 255, 0.15) !important;
      outline: none !important;
    }

  `,
        html: (p) => `
  <div id="${`cancelsnackbar-${p.idName}`}" class="sym-injectable-select-image" style="
  all:unset;
  z-index: 2147483648 !important;
  position: fixed;
  left: 0%;
  top: auto;
  right: 0%;
  bottom: 0%;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  padding: 20px 10px;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  ">
        <div class="oklm flex" style="
        all:unset;
        padding: 14px 20px;
        border-radius: 12px;
        background-color: rgba(30, 30, 30, 0.95);
        color: #FFFFFF;
        font-size: 14px;
        font-weight: 400;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        text-align: center;
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        gap: 16px;
        -webkit-box-align: center;
        -webkit-align-items: center;
        -ms-flex-align: center;
        align-items: center;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1);
        ">
        <div class="mr5 cancelsnackbar-label" style="
    margin: 0;
    line-height: 1.5;
    opacity: 0.95;
            ">${p.msg || "Click on an image on the page"}, <span style="opacity: 0.7;">press "Escape" to cancel</span></div>
            <button class="mr5 cancelsnackbar-button" style="
    margin: 0;
    display:none;
            ">Continue</button>
          <div class="g-cancel-button"><button id="btn-actionCancel" class="outlined-button-small-${p.idName}"
          >
              <div class="v-text">Cancel</div>
            </button></div>
        </div>
  </div>

  `,
      };

      /***/
    },
    /* 24 */
    /***/ function (module, exports, __webpack_require__) {
      "use strict";
      /* WEBPACK VAR INJECTION */ (function (global) {
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.drawSelectedElement = void 0;
        /* eslint-disable operator-assignment */
        /**
         * Based on https://gist.github.com/awestbro/e668c12662ad354f02a413205b65fce7
         */
        const canvas_1 = __webpack_require__(7);
        const colors = {
          // margin: '#f6b26ba8',
          // border: '#ffe599a8',
          // padding: '#93c47d8c',
          margin: "rgba(59, 130, 246, 0.12)",
          border: "rgba(59, 130, 246, 0.12)",
          padding: "rgba(59, 130, 246, 0.12)",
          content: "rgba(59, 130, 246, 0.12)",
        };
        const SMALL_NODE_SIZE = 30;
        function pxToNumber(px) {
          return parseInt(px.replace("px", ""), 10);
        }
        function round(value) {
          return Number.isInteger(value) ? value : value.toFixed(2);
        }
        // function filterZeroValues(labels: LabelStack): LabelStack {
        //     return labels.filter((l) => l.text !== 0 && l.text !== '0')
        // }
        // function floatingAlignment(extremities: Extremities): FloatingAlignment {
        //     const windowExtremities = {
        //         top: global.window.scrollY,
        //         bottom: global.window.scrollY + global.window.innerHeight,
        //         left: global.window.scrollX,
        //         right: global.window.scrollX + global.window.innerWidth,
        //     }
        //     const distances = {
        //         top: Math.abs(windowExtremities.top - extremities.top),
        //         bottom: Math.abs(windowExtremities.bottom - extremities.bottom),
        //         left: Math.abs(windowExtremities.left - extremities.left),
        //         right: Math.abs(windowExtremities.right - extremities.right),
        //     }
        //     return {
        //         x: distances.left > distances.right ? 'left' : 'right',
        //         y: distances.top > distances.bottom ? 'top' : 'bottom',
        //     }
        // }
        function measureElement(element) {
          const style = global.getComputedStyle(element);
          // eslint-disable-next-line prefer-const
          let { top, left, right, bottom, width, height } =
            element.getBoundingClientRect();
          const {
            marginTop,
            marginBottom,
            marginLeft,
            marginRight,
            paddingTop,
            paddingBottom,
            paddingLeft,
            paddingRight,
            borderBottomWidth,
            borderTopWidth,
            borderLeftWidth,
            borderRightWidth,
          } = style;
          // top = top + global.window.scrollY
          // left = left + global.window.scrollX
          // bottom = bottom + global.window.scrollY
          // right = right + global.window.scrollX
          const margin = {
            top: pxToNumber(marginTop),
            bottom: pxToNumber(marginBottom),
            left: pxToNumber(marginLeft),
            right: pxToNumber(marginRight),
          };
          const padding = {
            top: pxToNumber(paddingTop),
            bottom: pxToNumber(paddingBottom),
            left: pxToNumber(paddingLeft),
            right: pxToNumber(paddingRight),
          };
          const border = {
            top: pxToNumber(borderTopWidth),
            bottom: pxToNumber(borderBottomWidth),
            left: pxToNumber(borderLeftWidth),
            right: pxToNumber(borderRightWidth),
          };
          const extremities = {
            top: top - margin.top,
            bottom: bottom + margin.bottom,
            left: left - margin.left,
            right: right + margin.right,
          };
          return {
            margin,
            padding,
            border,
            top,
            left,
            bottom,
            right,
            width,
            height,
            extremities,
            // floatingAlignment: floatingAlignment(extremities),
          };
        }
        function drawMargin(
          context,
          { margin, width, height, top, left, bottom, right },
        ) {
          // Draw Margin
          const marginHeight = height + margin.bottom + margin.top;
          context.fillStyle = colors.margin;
          // Top margin rect
          context.fillRect(left, top - margin.top, width, margin.top);
          // Right margin rect
          context.fillRect(right, top - margin.top, margin.right, marginHeight);
          // Bottom margin rect
          context.fillRect(left, bottom, width, margin.bottom);
          // Left margin rect
          context.fillRect(
            left - margin.left,
            top - margin.top,
            margin.left,
            marginHeight,
          );
          // const marginLabels: LabelStack = [
          //     {
          //         type: 'margin',
          //         text: round(margin.top),
          //         position: 'top',
          //     },
          //     {
          //         type: 'margin',
          //         text: round(margin.right),
          //         position: 'right',
          //     },
          //     {
          //         type: 'margin',
          //         text: round(margin.bottom),
          //         position: 'bottom',
          //     },
          //     {
          //         type: 'margin',
          //         text: round(margin.left),
          //         position: 'left',
          //     },
          // ]
          // return filterZeroValues(marginLabels)
        }
        function drawPadding(
          context,
          { padding, border, width, height, top, left, bottom, right },
        ) {
          const paddingWidth = width - border.left - border.right;
          const paddingHeight =
            height - padding.top - padding.bottom - border.top - border.bottom;
          context.fillStyle = colors.padding;
          // Top padding rect
          context.fillRect(
            left + border.left,
            top + border.top,
            paddingWidth,
            padding.top,
          );
          // Right padding rect
          context.fillRect(
            right - padding.right - border.right,
            top + padding.top + border.top,
            padding.right,
            paddingHeight,
          );
          // Bottom padding rect
          context.fillRect(
            left + border.left,
            bottom - padding.bottom - border.bottom,
            paddingWidth,
            padding.bottom,
          );
          // Left padding rect
          context.fillRect(
            left + border.left,
            top + padding.top + border.top,
            padding.left,
            paddingHeight,
          );
          // const paddingLabels: LabelStack = [
          //     {
          //         type: 'padding',
          //         text: padding.top,
          //         position: 'top',
          //     },
          //     {
          //         type: 'padding',
          //         text: padding.right,
          //         position: 'right',
          //     },
          //     {
          //         type: 'padding',
          //         text: padding.bottom,
          //         position: 'bottom',
          //     },
          //     {
          //         type: 'padding',
          //         text: padding.left,
          //         position: 'left',
          //     },
          // ]
          // return filterZeroValues(paddingLabels)
        }
        function drawBorder(
          context,
          { border, width, height, top, left, bottom, right },
        ) {
          const borderHeight = height - border.top - border.bottom;
          context.fillStyle = colors.border;
          // Top border rect
          context.fillRect(left, top, width, border.top);
          // Bottom border rect
          context.fillRect(left, bottom - border.bottom, width, border.bottom);
          // Left border rect
          context.fillRect(left, top + border.top, border.left, borderHeight);
          // Right border rect
          context.fillRect(
            right - border.right,
            top + border.top,
            border.right,
            borderHeight,
          );
          // const borderLabels: LabelStack = [
          //     {
          //         type: 'border',
          //         text: border.top,
          //         position: 'top',
          //     },
          //     {
          //         type: 'border',
          //         text: border.right,
          //         position: 'right',
          //     },
          //     {
          //         type: 'border',
          //         text: border.bottom,
          //         position: 'bottom',
          //     },
          //     {
          //         type: 'border',
          //         text: border.left,
          //         position: 'left',
          //     },
          // ]
          // return filterZeroValues(borderLabels)
        }
        function drawContent(
          context,
          { padding, border, width, height, top, left },
        ) {
          const contentWidth =
            width - border.left - border.right - padding.left - padding.right;
          const contentHeight =
            height - padding.top - padding.bottom - border.top - border.bottom;
          context.fillStyle = colors.content;
          // content rect
          context.fillRect(
            left + border.left + padding.left,
            top + border.top + padding.top,
            contentWidth,
            contentHeight,
          );
          // Dimension label
          // return [
          //     {
          //         type: 'content',
          //         position: 'center',
          //         text: `${round(contentWidth)} x ${round(contentHeight)}`,
          //     },
          // ]
        }
        function drawBoxModel(element) {
          return (context) => {
            if (element && context) {
              const measurements = measureElement(element);
              // drawMargin(context, measurements)
              drawPadding(context, measurements);
              drawBorder(context, measurements);
              drawContent(context, measurements);
              // Draw modern blue border with rounded corners effect
              const { top, left, width, height } = measurements;
              context.strokeStyle = "rgba(59, 130, 246, 0.9)";
              context.lineWidth = 2;
              context.strokeRect(left, top, width, height);
              // const externalLabels =
              //     measurements.width <= SMALL_NODE_SIZE * 3 ||
              //     measurements.height <= SMALL_NODE_SIZE
              // labelStacks(
              //     context,
              //     measurements,
              //     [
              //         ...contentLabels,
              //         ...paddingLabels,
              //         ...borderLabels,
              //         ...marginLabels,
              //     ],
              //     externalLabels
              // )
            }
          };
        }
        function drawSelectedElement(element) {
          console.log("drawSelectedElement", element);
          (0, canvas_1.draw)(drawBoxModel(element));
        }
        exports.drawSelectedElement = drawSelectedElement;

        /* WEBPACK VAR INJECTION */
      }).call(this, __webpack_require__(5));

      /***/
    },
    /* 25 */
    /***/ function (module, exports, __webpack_require__) {
      "use strict";
      /* WEBPACK VAR INJECTION */ (function (global) {
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.deepElementFromPoint = void 0;
        function sleep(ms) {
          return new Promise((resolve) => setTimeout(resolve, ms));
        }
        function deepElementFromPoint(x, y) {
          // turn off quickly
          // const clipContentWall:HTMLElement = document.querySelector('#stn-clip-content-wall');
          // clipContentWall.style.display = "none";
          const element = global.document.elementFromPoint(x, y);
          // clipContentWall.style.display = "block";
          const crawlShadows = (node) => {
            if (node && node.shadowRoot) {
              // elementFromPoint() doesn't exist in ShadowRoot type
              const nestedElement = node.shadowRoot.elementFromPoint(x, y);
              // Nested node is same as the root one
              if (node.isEqualNode(nestedElement)) {
                return node;
              }
              // The nested node has shadow DOM too so continue crawling
              if (nestedElement.shadowRoot) {
                return crawlShadows(nestedElement);
              }
              // No more shadow DOM
              return nestedElement;
            }
            return node;
          };
          const shadowElement = crawlShadows(element);
          return shadowElement || element;
        }
        exports.deepElementFromPoint = deepElementFromPoint;

        /* WEBPACK VAR INJECTION */
      }).call(this, __webpack_require__(5));

      /***/
    },
    /* 26 */
    /***/ function (module, exports, __webpack_require__) {
      "use strict";

      Object.defineProperty(exports, "__esModule", { value: true });
      exports.confirmSelectionDialog = void 0;
      exports.confirmSelectionDialog = {
        css: ({ idName }) => `

.stn-touchable-secondary:hover #stn-content,
.stn-touchable-secondary:hover #stn-content2 {
  background-color: #F5F5F4 !important;
  border-color: #A8A29E !important;
}

.stn-touchable-secondary:active #stn-content,
.stn-touchable-secondary:active #stn-content2 {
  background-color: #E7E5E4 !important;
}

.stn-touchable-secondary:disabled > div {
  opacity:0.5 !important;
  background-color: #fff !important;
}

.stn-touchable-primary:hover #stn-content3 {
  background-color: #1C7ED6 !important;
}

.stn-touchable-primary:active #stn-content3 {
  background-color: #1971C2 !important;
}

.stn-touchable-primary:disabled #stn-content3 {
  opacity: 0.5 !important;
}

#stn-leftpanel
{
  all:unset;
height:32px !important;
width:66px !important;
align-self:center !important;
padding:0px !important;
display:flex;
flex-direction:row;
justify-content:flex-start;
align-items:center;
gap:2px !important;
}

#stn-minus-button
{
  all:unset;
height:32px !important;
width:32px !important;
padding:0px !important;
display:flex;
flex-direction:row;
justify-content:center;
align-items:center;
position:relative;
cursor: pointer;
}
#stn-content
{
  all:unset;
height:32px !important;
width:32px !important;
border-radius:8px;
display:flex;
flex-direction:row;
flex-wrap:nowrap;
justify-content:center;
align-items:center;
position:relative;
border: 1px solid #D6D3D1;
background-color: #FFFFFF;
transition: all 0.2s ease-out;
}
#stn-minusicon
{
  all:unset;
height:14px !important;
width:14px !important;
align-self:center;
padding:0px;
}
#stn-plus-button
{
  all:unset;
height:32px !important;
width:32px !important;
align-self:center;
padding:0px !important;
display:flex;
flex-direction:row;
justify-content:center;
align-items:center;
cursor: pointer;
}
#stn-content2
{
  all:unset;
height:32px !important;
width:32px !important;
border-radius:8px;
padding:0px !important;
display:flex;
flex-direction:row;
flex-wrap:nowrap;
justify-content:center;
align-items:center;
position:relative;
border: 1px solid #D6D3D1;
background-color: #FFFFFF;
transition: all 0.2s ease-out;
}
#stn-plusicon
{
height:14px;
width:14px;
align-self:center;
padding:0px;
}
#stn-confirm-button
{
  all:unset;
height:32px !important;
width:fit-content !important;
align-self:center !important;
padding:0px !important;
display:flex !important;
flex-direction:row !important;
justify-content:center !important;
align-items:center !important;
cursor: pointer;
}
#stn-content3
{
  all:unset;
height:32px;
width:fit-content;
min-width:107px;
border-radius:8px;
padding-left:16px;
padding-right:16px;
display:flex;
flex-direction:row;
flex-wrap:nowrap;
justify-content:center;
align-items:center;
position:relative;
background-color: #228BE6;
border-radius: 8px;
transition: all 0.2s ease-out;
}
#stn-confirmselection
{
  all:unset;
color: #FFFFFF;
text-align:center;
vertical-align:text-middle;
font-size:13px;
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
font-weight: 500;
align-self:center;
line-height:150%;
}
    `,
        html: ({ idName }) => `
    <div id="confirm-selection-${idName}" style="
    all:unset;
    cursor: pointer; 
    position:fixed;
    align-items: center;
    left:10px;
    top:-35px;
    gap:6px;
    z-index: 2147483645;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 8px;
    gap: 8px;
    border-radius: 12px;
    isolation: isolate;
    height: fit-content;
    border-radius: 12px;
    background: #FFFFFF;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.05);
    flex: none;
    order: 0;
    flex-grow: 0;
    width: fit-content !important;
    ">

    <div  id='stn-leftpanel'>
			<button class='stn-touchable-secondary' id='stn-minus-button' x-title='Select parent element'>
			<div  id='stn-content'>
        <svg width="11" height="2" viewBox="0 0 11 2" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.75 0.125H0.25V1.875H10.75V0.125Z" fill="#78716C"/>
        </svg>
			</div></button><button class='stn-touchable-secondary' id='stn-plus-button' x-title='Select child element'>
			<div  id='stn-content2'>
        <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.47987 13.0926C6.836 13.0926 7.1335 12.8091 7.1335 12.46V7.62999H11.8252C12.1744 7.62999 12.4727 7.33249 12.4727 6.97637C12.4709 6.80537 12.4021 6.64192 12.281 6.52116C12.1599 6.4004 11.9963 6.33198 11.8252 6.33062H7.1335V1.49274C7.1335 1.14449 6.836 0.860992 6.47987 0.860992C6.31045 0.859356 6.14728 0.924917 6.02609 1.04332C5.9049 1.16173 5.83556 1.32333 5.83325 1.49274V6.33062H1.1345C0.963496 6.33198 0.799858 6.4004 0.678773 6.52116C0.557688 6.64192 0.488828 6.80537 0.487 6.97637C0.487 7.33249 0.785375 7.62999 1.1345 7.62999H5.83325V12.46C5.83325 12.8091 6.12375 13.0926 6.47987 13.0926Z" fill="#78716C"/>
        </svg>
			</div></button>
		</div>
    <button class='stn-touchable-primary' id='stn-confirm-button'>
		<div id='stn-content3'>
			<div  id='stn-confirmselection'>
				Confirm Selection
			</div>
		</div>
    </button>
    <div style="
    all:unset;
    position: absolute;
width: 6.93px;
height: 5.25px;
left: 90.5px;
bottom: -5px;

/* Inside auto layout */
flex: none;
order: 2;
flex-grow: 0;
z-index: 2;
    ">
    <svg style="all:unset; position:absolute; top:0px; left:0px;" width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5 8L8.36626e-08 -1.49012e-07H10L5 8Z" fill="white"/>
</svg>

    </div>
    </div>
    `,
      };

      /***/
    },
    /* 27 */
    /***/ function (module, exports, __webpack_require__) {
      "use strict";

      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getMatchingElements = void 0;
      function getMatchingElements(currentNode) {
        let tmp = currentNode;
        const t = {
          elementMatches: [],
          selectorChosenFinal: null,
          selectorsScopeListContainer: null,
        };
        // Traverse up the DOM tree until a parent with a class is found
        while ((tmp = tmp.parentElement) && !tmp.classList.length);
        // Determine the selector based on whether a suitable parent was found
        const selector = tmp
          ? generateSelector(tmp)
          : currentNode.parentNode.tagName.toLowerCase();
        // Generate selector for the current node
        const currentSelector = generateSelector(currentNode);
        // Query the DOM using the combined selector of the parent and current node
        t.elementMatches = Array.from(
          document.querySelectorAll(`${selector} ${currentSelector}`),
        );
        return t.elementMatches;
      }
      exports.getMatchingElements = getMatchingElements;
      function generateSelector(node) {
        let selectorParts = [node.tagName.toLowerCase()];
        try {
          for (const attribute of node.attributes) {
            if (attribute.name.startsWith("data-")) {
              const attrSelector = `[${escapeSelector(attribute.name)}="${escapeSelector(attribute.value)}"]`;
              selectorParts.push(attrSelector);
            }
          }
        } catch (error) {
          console.error("Error processing attributes:", error);
          throw error; // Re-throw the error after logging
        }
        const validClasses = Array.from(node.classList).filter(
          isValidClassName,
        );
        if (validClasses.length > 0) {
          const classSelector = `.${validClasses.map(escapeSelector).join(".")}`;
          selectorParts.push(classSelector);
        }
        return selectorParts.join("");
      }
      const escapeSelector = (e) => {
        return e
          .replace(/([:[])/g, "\\$1")
          .replace(/\.(?=\d)/g, "\\.")
          .replace(/\//g, "\\/");
      };
      const isValidClassName = (e) => {
        const invalidChars = ["[", "]", "(", ")", ".", "}"];
        return (
          !invalidChars.some((char) => e.includes(char)) && !/\d/.test(e[0])
        );
      };

      /***/
    },
    /* 28 */
    /***/ function (module, exports, __webpack_require__) {
      "use strict";

      Object.defineProperty(exports, "__esModule", { value: true });
      exports.displayListAugmentation =
        exports.startListFeature =
        exports.continueWithListAugmentation =
        exports.cancelListsAugmentation =
        exports.cleanupPoppers =
        exports.detectAndAugmentLists =
        exports.updateStatusBar =
          void 0;
      const clipperUtil_1 = __webpack_require__(4);
      const convertSvgElementToImageSource_1 = __webpack_require__(2);
      // @ts-ignore
      if (!window.Popper) {
        window.Popper = {};
        // (window as any).Popper = Popper
      }
      // @ts-ignore
      if (!window.Items) {
        window.Items = {
          selectedItems: [],
          lists: [],
          initialized: false,
        };
      }
      let Items = window.Items;
      function addItemToList(itemEl, popover, listObj) {
        // add item to list of selected items
        Items.selectedItems.push(itemEl);
        // update popover
        popover.classList.add("selected");
        popover.querySelector(".stn-list-item-popover-content").innerHTML =
          "Remove from list";
        if (Items.selectedItems.length == 1) {
          // remove all lists poppers
          cleanupPoppersListExceptOne(listObj);
        }
        updateStatusBar(Items.selectedItems.length);
      }
      function updateStatusBar(itemsCount) {
        let el = document.querySelector(`#cancelsnackbar-${idName}`);
        const buttonEl = el.querySelector(".cancelsnackbar-button");
        const labelEl = el.querySelector(".cancelsnackbar-label");
        if (itemsCount == 0) {
          // hide cancelsnackbar-button, show cancelsnackbar-label
          buttonEl.style.display = "none";
          labelEl.style.display = "block";
        } else {
          // show cancelsnackbar-button, hide cancelsnackbar-label
          buttonEl.style.display = "block";
          buttonEl.style.textDecoration = "underline";
          labelEl.style.display = "none";
          // add on click
          buttonEl.onclick = function () {
            callbackOnDone === null || callbackOnDone === void 0
              ? void 0
              : callbackOnDone(Items.selectedItems);
          };
          buttonEl.innerHTML = `Continue with ${itemsCount} item${itemsCount > 1 ? "s" : ""}`;
        }
      }
      exports.updateStatusBar = updateStatusBar;
      function removeItemFromList(itemEl, popover) {
        // remove item from list of selected items
        Items.selectedItems = Items.selectedItems.filter((el) => el != itemEl);
        // update popover
        popover.classList.remove("selected");
        popover.querySelector(".stn-list-item-popover-content").innerHTML =
          "Add to List";
        updateStatusBar(Items.selectedItems.length);
        if (Items.selectedItems.length == 0) {
          // re-augment all lists
          detectAndAugmentLists();
        }
      }
      function augmentList(listEl) {
        // const tooltip = htmlString2El(`<div id="tooltip" style="background-color: #333;color: white;padding: 5px 10px;border-radius: 4px;font-size: 13px;" role="tooltip">I'm a tooltip</div>`);
        // document.body.appendChild(tooltip);
        // Popper.createPopper(listEl, tooltip, {
        //     placement: 'top',
        // });
      }
      function augmentItem(itemEl, listObj) {
        // get size of item
        const rect = itemEl.getBoundingClientRect();
        // create a new div with a centered text "Add to list" using flexbox
        const popover = (0,
        clipperUtil_1.htmlString2El)(`<div class="stn-list-item-popover" style="
    width:${rect.width}px;
    height:${rect.height}px;
    "
    ><div class="stn-list-item-popover-content">Add to List</div></div>`);
        document.body.appendChild(popover);
        listObj.popovers.push(popover);
        // add event on click
        popover.addEventListener("click", function (e) {
          if (popover.classList.contains("selected")) {
            removeItemFromList(itemEl, popover);
          } else {
            addItemToList(itemEl, popover, listObj);
          }
        });
        listObj.poppers.push(
          window.Popper.createPopper(itemEl, popover, {
            // start top
            placement: "top-start",
            // add offset so it fit itemEl
            modifiers: [
              {
                name: "offset",
                options: {
                  offset: [0, -rect.height],
                },
              },
            ],
          }),
        );
      }
      function getListElementsOnPage() {
        return [...document.querySelectorAll(`ul, ol, .grid`)];
      }
      function getItemsFromList(el) {
        if (["ul", "ol"].includes(el.tagName.toLowerCase())) {
          return [...el.querySelectorAll("li")];
        }
        // just all direct children
        return [...el.children];
      }
      function scanLists() {
        getListElementsOnPage().forEach((ul) => {
          console.log("list", ul);
          if (Items.lists.find((listObj) => listObj.ul == ul)) {
            return;
          }
          const listObj = {
            ul,
            poppers: [],
            popovers: [],
          };
          Items.lists.push(listObj);
          augmentList(ul);
          // attach ui to item
          getItemsFromList(ul).forEach((itemEl) =>
            augmentItem(itemEl, listObj),
          );
        });
      }
      function init() {
        if (!Items.initialized) {
          console.log("initialize popper...", Items);
          Items.initialized = true;
          (0, clipperUtil_1.addCss2)(`
        .stn-list-item-popover {
            box-shadow: rgba(0, 0, 0, 0.25) 0px 0px 0px 5px;
            border-radius: 5px;
            font-size: 13px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            cursor: pointer;
        }
        .stn-list-item-popover-content {
            opacity: 0;
            border-radius: 5px;
            transition: opacity 0.2s ease-in-out;
            display: none;
            background: rgba(0, 0, 0, 0.3) !important;
            width: 100%;
            height: 100%;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-size: 13px;
            font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
            font-weight: 700;
            color: white;
        }
        .stn-list-item-popover:hover .stn-list-item-popover-content
        {
            opacity: 1 !important;
            display: flex !important;
        }

        .stn-list-item-popover.selected {
            box-shadow: rgba(0, 0, 255, 0.25) 0px 0px 0px 5px !important;
        }
        `);
        }
      }
      function detectAndAugmentLists() {
        Items.selectedItems = [];
        init();
        console.log("start scanning...");
        scanLists();
        // think of an algorithm to detect all list on the pages
        // for now super simple one that just detects ul / li
      }
      exports.detectAndAugmentLists = detectAndAugmentLists;
      function cleanupPoppers(exceptOne) {
        var _a;
        let arr = [];
        // remove all poppers
        (_a = Items.lists) === null || _a === void 0
          ? void 0
          : _a.forEach((listObj) => {
              if (listObj != exceptOne) {
                listObj.poppers.forEach((p) => p.destroy());
                listObj.popovers.forEach((el) => {
                  el.remove();
                });
              } else {
                arr.push(listObj);
              }
            });
        Items.lists = arr;
      }
      exports.cleanupPoppers = cleanupPoppers;
      function cleanupPoppersListExceptOne(listObj) {
        cleanupPoppers(listObj);
      }
      function cancelListsAugmentation() {
        cleanupPoppers();
        // remove all selected items
        Items.selectedItems = [];
      }
      exports.cancelListsAugmentation = cancelListsAugmentation;
      function continueWithListAugmentation(items) {
        const outItems =
          items !== null && items !== void 0 ? items : Items.selectedItems;
        cleanupPoppers();
        const payload = {
          itemsCount: outItems.length,
          data: getData(outItems[0]),
          items: outItems.map((el, index) => ({
            html: el.outerHTML,
            extracted: Object.fromEntries(
              getData(el).map((e) => [e.id, e.valueForFirst]),
            ),
          })),
        };
        return payload;
      }
      exports.continueWithListAugmentation = continueWithListAugmentation;
      let callbackOnDone = null;
      function startListFeature(matchingElements, cb) {
        displayListAugmentation(matchingElements);
        updateStatusBar(Items.selectedItems.length);
        callbackOnDone = cb !== null && cb !== void 0 ? cb : null;
      }
      exports.startListFeature = startListFeature;
      function displayListAugmentation(matchingElements) {
        init();
        // display the list augmentation
        // remove all poppers
        cleanupPoppers();
        // remove all selected items
        Items.selectedItems = [];
        Items.lists = [
          {
            ul: null,
            poppers: [],
            popovers: [],
          },
        ];
        const listObj = Items.lists[0];
        matchingElements.forEach((el) => {
          augmentItem(el, listObj);
        });
      }
      exports.displayListAugmentation = displayListAugmentation;
      function getData(selectedItem) {
        // simple dummy algorithm that will do multiple things
        const data = [];
        console.log("get data", selectedItem);
        data.push(...extractTextBlocks(selectedItem));
        data.push(...extractImageBlocks(selectedItem));
        data.push(...extractUrlBlocks(selectedItem));
        return data;
      }
      function extractTextBlocks(element) {
        let textBlocks = [];
        function traverse(node) {
          var _a;
          // Check if the node is a text node and not just whitespace
          if (
            node.nodeType === Node.TEXT_NODE &&
            ((_a = node.textContent) === null || _a === void 0
              ? void 0
              : _a.trim())
          ) {
            textBlocks.push({
              id: `text-${textBlocks.length + 1}`,
              name: `Text #${textBlocks.length + 1}`,
              type: "text",
              valueForFirst: node.textContent.trim(),
            });
          }
          // If the node is an element, traverse its children
          if (node.nodeType === Node.ELEMENT_NODE) {
            Array.from(node.childNodes).forEach(traverse);
          }
        }
        traverse(element);
        return textBlocks;
      }
      function extractImageBlocks(element) {
        let imageBlocks = [];
        function traverse(node) {
          // If the node is an element, traverse its children
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.nodeName.toLowerCase() == "img") {
              imageBlocks.push({
                id: `image-${imageBlocks.length + 1}`,
                name: `Image #${imageBlocks.length + 1}`,
                type: "image",
                valueForFirst: node.src,
              });
            }
            // also suppport svg
            if (node.nodeName.toLowerCase() == "svg") {
              imageBlocks.push({
                id: `svg-${imageBlocks.length + 1}`,
                name: `Image #${imageBlocks.length + 1}`,
                type: "image",
                valueForFirst: (0,
                convertSvgElementToImageSource_1.convertSvgElementToImageSource)(
                  node,
                ),
              });
            }
            Array.from(node.childNodes).forEach(traverse);
          }
        }
        traverse(element);
        return imageBlocks;
      }
      function extractUrlBlocks(element) {
        let urlBlocks = [];
        function traverse(node) {
          // If the node is an element, traverse its children
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.nodeName.toLowerCase() == "a") {
              urlBlocks.push({
                id: `url-${urlBlocks.length + 1}`,
                name: `Url #${urlBlocks.length + 1}`,
                type: "url",
                valueForFirst: node.href,
              });
            }
            Array.from(node.childNodes).forEach(traverse);
          }
        }
        traverse(element);
        return urlBlocks;
      }
      function detectFieldElements(rootElement) {
        const fieldElements = [];
        // Find form inputs
        const inputs = rootElement.querySelectorAll("input, textarea, select");
        inputs.forEach((input) => fieldElements.push(input));
        // Find elements with common data attributes
        const dataElements = rootElement.querySelectorAll(
          "[data-field], [data-value], [data-name], [data-label]",
        );
        dataElements.forEach((element) => {
          if (!fieldElements.includes(element)) {
            fieldElements.push(element);
          }
        });
        // Find elements with specific classes or attributes that indicate data fields
        const potentialFields = rootElement.querySelectorAll(
          '[class*="field"], [class*="input"], [class*="data"], [id*="field"], [id*="input"]',
        );
        potentialFields.forEach((element) => {
          if (!fieldElements.includes(element) && isLikelyDataField(element)) {
            fieldElements.push(element);
          }
        });
        return fieldElements;
      }
      function isLikelyDataField(element) {
        // Check if element contains text or has attributes suggesting it's a data field
        const hasText =
          element.textContent && element.textContent.trim().length > 0;
        const hasDataAttrs = Array.from(element.attributes).some(
          (attr) =>
            attr.name.startsWith("data-") ||
            ["value", "placeholder", "label"].includes(attr.name),
        );
        const isInteractive = [
          "input",
          "textarea",
          "select",
          "button",
        ].includes(element.tagName.toLowerCase());
        return hasText || hasDataAttrs || isInteractive;
      }
      function getFieldName(element) {
        // Try different ways to get a meaningful name for the field
        if (element.id) return element.id;
        if (element.name) return element.name;
        if (element.getAttribute("data-field"))
          return element.getAttribute("data-field");
        if (element.getAttribute("data-name"))
          return element.getAttribute("data-name");
        if (element.placeholder) return element.placeholder;
        if (element.getAttribute("aria-label"))
          return element.getAttribute("aria-label");
        // Look for associated label
        const label = document.querySelector(`label[for="${element.id}"]`);
        if (label) return label.textContent.trim();
        // Use text content or tag name as fallback
        return element.textContent.trim() || element.tagName.toLowerCase();
      }
      function getFieldType(element) {
        const tagName = element.tagName.toLowerCase();
        if (tagName === "input") {
          return element.type || "text";
        } else if (tagName === "textarea") {
          return "textarea";
        } else if (tagName === "select") {
          return "select";
        } else if (element.getAttribute("data-type")) {
          return element.getAttribute("data-type");
        } else {
          return "data";
        }
      }
      function getFieldValue(element) {
        const tagName = element.tagName.toLowerCase();
        if (
          tagName === "input" ||
          tagName === "textarea" ||
          tagName === "select"
        ) {
          return element.value || element.textContent || "";
        } else {
          return (
            element.textContent.trim() ||
            element.getAttribute("data-value") ||
            ""
          );
        }
      }
      function getFieldAttributes(element) {
        const attributes = {};
        Array.from(element.attributes).forEach((attr) => {
          attributes[attr.name] = attr.value;
        });
        return attributes;
      }
      function displayFieldAugmentation(fieldElements) {
        // Similar to list augmentation but for fields
        fieldElements.forEach((field, index) => {
          const rect = field.getBoundingClientRect();
          const overlay = document.createElement("div");
          overlay.className = "stn-field-overlay";
          overlay.style.cssText = `
            position: absolute;
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            background: rgba(59, 130, 246, 0.1);
            border: 2px solid rgba(59, 130, 246, 0.5);
            border-radius: 4px;
            pointer-events: none;
            z-index: 2147483646;
          `;
          const label = document.createElement("div");
          label.textContent = `${getFieldName(field)} (${getFieldType(field)})`;
          label.style.cssText = `
            position: absolute;
            top: ${rect.top - 25}px;
            left: ${rect.left}px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
            font-family: monospace;
            white-space: nowrap;
            z-index: 2147483647;
          `;
          document.body.appendChild(overlay);
          document.body.appendChild(label);
          // Store references for cleanup
          if (!window.fieldOverlays) window.fieldOverlays = [];
          window.fieldOverlays.push({ overlay, label });
        });
      }
      // Helper function to normalize domain names (same as in site-selectors.js)
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

      // Find selectors for a hostname by matching the stored selector keys
      // and progressively falling back from most-specific (full host) to
      // less-specific (strip left-most subdomains). Returned value is an
      // array of normalized selector entries: {selector, embeddedPostFormat}.
      function findSelectorsForHostname(allSelectors, hostname) {
        if (!hostname) return [];
        const parts = hostname.split(".").filter(Boolean);
        for (let i = 0; i <= Math.max(0, parts.length - 2); i++) {
          const candidate = parts.slice(i).join(".");
          const entry = allSelectors[candidate];
          if (entry) {
            if (Array.isArray(entry)) {
              return entry
                .filter((it) => it && it.selector)
                .map((it) => ({
                  selector: it.selector,
                  embeddedPostFormat: !!it.embeddedPostFormat,
                }));
            }
            if (typeof entry === "string") {
              return [{ selector: entry, embeddedPostFormat: false }];
            }
            if (entry && typeof entry === "object") {
              return [
                {
                  selector: entry.selector || null,
                  embeddedPostFormat: !!entry.embeddedPostFormat,
                },
              ].filter((it) => it.selector);
            }
          }
        }
        return [];
      }
      // Helper function to get custom selectors for current domain (supports multiple entries)
      function getCustomSelectorsForCurrentDomain() {
        return new Promise((resolve) => {
          const currentDomain = normalizeDomain(window.location.hostname);
          console.log(
            "[getCustomSelectorsForCurrentDomain] Current domain:",
            currentDomain,
          );

          chrome.storage.local.get(["customSiteSelectors"], function (result) {
            const selectors = result.customSiteSelectors || {};
            console.log(
              "[getCustomSelectorsForCurrentDomain] All saved selectors:",
              selectors,
            );

            // Use top-level helper to locate selectors for this hostname
            try {
              window.__stn_findSelectorsForHostname = findSelectorsForHostname;
            } catch (e) {
              /* ignore in non-browser test runners */
            }

            const selectorArray = findSelectorsForHostname(
              selectors,
              currentDomain,
            );

            console.log(
              "[getCustomSelectorsForCurrentDomain] Resolved selectors for",
              currentDomain,
              ":",
              selectorArray,
            );

            resolve(selectorArray);
          });
        });
      }

      function buildContentFromSelectors(rootElement, selectorEntries = []) {
        console.log("[buildContentFromSelectors] === STARTING ===");
        console.log(
          "  Root element:",
          rootElement?.tagName,
          rootElement?.className,
        );
        console.log(
          "  Selector entries:",
          selectorEntries.length,
          selectorEntries,
        );
        const results = [];

        selectorEntries.forEach((entry) => {
          if (!entry || !entry.selector) return;
          const data = extractContentData(rootElement, entry.selector);
          if (data) {
            results.push({
              ...data,
              embeddedPostFormat: !!entry.embeddedPostFormat,
            });
          }
        });

        if (results.length === 0) {
          if (selectorEntries.length === 0) {
            console.log(
              "[buildContentFromSelectors] No custom selectors configured for this domain - using default extraction",
            );
          } else {
            console.warn(
              "[buildContentFromSelectors] No content found for configured selectors:",
              selectorEntries.map((e) => e.selector).join(", "),
              "- Falling back to default extraction",
            );
          }

          // Fallback: extract content from rootElement without custom selector
          const fallbackData = extractContentData(rootElement, null);
          if (fallbackData) {
            console.log(
              "[buildContentFromSelectors] ✓ Fallback extraction succeeded",
            );
            console.log("  - Title:", fallbackData.title);
            console.log(
              "  - Content length:",
              fallbackData.content?.length || 0,
            );
            console.log(
              "  - Text length:",
              fallbackData.textContent?.length || 0,
            );
            return {
              ...fallbackData,
              embeddedPostFormat: false,
            };
          }

          console.error(
            "[buildContentFromSelectors] Fallback extraction also failed - no content available",
          );
          return null;
        }

        const combinedContent = results
          .map((item, idx) => {
            const header =
              results.length > 1
                ? `<div data-stn-selector-block>Selector #${idx + 1}</div>`
                : "";
            return `${header}${item.content}`;
          })
          .join("\n\n");

        const combinedText = results
          .map((item) => item.textContent)
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ");

        return {
          title: results[0].title,
          content: combinedContent,
          textContent: combinedText,
          url: results[0].url,
          elementCount: results.reduce(
            (sum, item) => sum + (item.elementCount || 0),
            0,
          ),
          embeddedPostFormat: results.some((item) => item.embeddedPostFormat),
        };
      }
      function extractContentData(rootElement, customSelector = null) {
        console.log(
          "[extractContentData] Starting extraction with custom selector:",
          customSelector,
        );
        console.log("[extractContentData] Root element:", rootElement);

        // Try to find structured content using custom selector first, then fall back to 'article'
        let article = null;

        if (customSelector) {
          console.log(
            "[extractContentData] Trying custom selector:",
            customSelector,
          );

          // Validate and clean the selector before using it
          try {
            // Remove invalid patterns
            customSelector = customSelector
              .replace(/\.\./g, ".") // Fix double dots (..)
              .replace(/\.,/g, ",") // Fix ., patterns
              .replace(/,\./g, ",") // Fix ,. patterns
              .replace(/,\s*,/g, ",") // Fix multiple commas
              .replace(/^,|,$/g, "") // Remove leading/trailing commas
              .trim();

            // Test if selector is valid by trying to create a dummy query
            document
              .createDocumentFragment()
              .querySelector(customSelector.split(",")[0].trim());

            console.log(
              "[extractContentData] Cleaned selector:",
              customSelector,
            );
          } catch (validationError) {
            console.error(
              "[extractContentData] Invalid selector after cleaning:",
              customSelector,
              validationError,
            );
            // Fall through to use article fallback
            customSelector = null;
          }
        }

        if (customSelector) {
          try {
            // Check if this is a comma-separated list of selectors
            const isMultipleSelectors = customSelector.includes(",");

            if (isMultipleSelectors) {
              console.log(
                "[extractContentData] Multiple selectors detected, will combine results",
              );

              // Create a container to hold all matched elements
              const container = document.createElement("div");
              container.className = "combined-content-selection";

              // Try each strategy to find all matching elements
              let allMatches = [];

              // Strategy 1: Search from document root (most reliable)
              const docMatches = document.querySelectorAll(customSelector);
              if (docMatches.length > 0) {
                allMatches = Array.from(docMatches);
                console.log(
                  `[extractContentData] Found ${docMatches.length} elements via document.querySelectorAll()`,
                );
              }

              // Strategy 2: Search within rootElement if no doc matches
              if (allMatches.length === 0) {
                const rootMatches =
                  rootElement.querySelectorAll(customSelector);
                if (rootMatches.length > 0) {
                  allMatches = Array.from(rootMatches);
                  console.log(
                    `[extractContentData] Found ${rootMatches.length} elements via rootElement.querySelectorAll()`,
                  );
                }
              }

              // Strategy 3: Search in Shadow DOM if still no matches
              if (allMatches.length === 0 && rootElement.getRootNode) {
                const root = rootElement.getRootNode();
                if (root instanceof ShadowRoot) {
                  const shadowMatches = root.querySelectorAll(customSelector);
                  if (shadowMatches.length > 0) {
                    allMatches = Array.from(shadowMatches);
                    console.log(
                      `[extractContentData] Found ${shadowMatches.length} elements via shadowRoot.querySelectorAll()`,
                    );
                  }
                }
              }

              // Combine all matched elements into the container
              if (allMatches.length > 0) {
                // Track seen elements to avoid duplicates
                const seenElements = new Set();
                const addedElements = []; // Track actual elements to check containment
                let duplicateCount = 0;

                // Enable detailed logging: set to true in console via: window.__STN_DEBUG_DEDUP = true
                const DEBUG_DEDUP = window.__STN_DEBUG_DEDUP || false;

                function getElementSignature(el) {
                  // For images: normalize src (remove query params and hash) and include alt text
                  if (el.tagName === "IMG" && el.src) {
                    const normalizedSrc = el.src.split("?")[0].split("#")[0];
                    const altText = el.alt || "";
                    const dimensions = `${el.width || 0}x${el.height || 0}`;
                    return `img:${normalizedSrc}:${altText}:${dimensions}`;
                  }
                  // For elements with src (like iframes, videos): normalize src
                  if (el.src) {
                    const normalizedSrc = el.src.split("?")[0].split("#")[0];
                    return `${el.tagName.toLowerCase()}:${normalizedSrc}`;
                  }
                  // For tables: use full innerHTML for better comparison + text content length
                  if (el.tagName === "TABLE") {
                    const textContent = el.textContent?.trim() || "";
                    const cellCount = el.querySelectorAll("td, th").length;
                    const rowCount = el.querySelectorAll("tr").length;
                    // Use first 500 chars of innerHTML + structure info
                    const content = el.innerHTML?.substring(0, 500) || "";
                    return `table:${rowCount}x${cellCount}:${textContent.length}:${content}`;
                  }
                  // For other elements: use more innerHTML (500 chars) + text length
                  const textLength = el.textContent?.trim().length || 0;
                  const content = el.innerHTML?.substring(0, 500) || "";
                  return `${el.tagName.toLowerCase()}:${textLength}:${content}`;
                }

                function isContainedInAny(element, otherElements) {
                  // Check if this element is contained within any already-added element
                  for (const other of otherElements) {
                    if (other.contains(element) && other !== element) {
                      return other;
                    }
                  }
                  return null;
                }

                function containsAnyAdded(element, otherElements) {
                  // Check if this element contains any already-added element
                  for (const other of otherElements) {
                    if (element.contains(other) && element !== other) {
                      return other;
                    }
                  }
                  return null;
                }

                allMatches.forEach((match, index) => {
                  const signature = getElementSignature(match);

                  if (DEBUG_DEDUP) {
                    console.log(
                      `[extractContentData:DEDUP] 🔍 Checking ${index + 1}: ${match.tagName}.${match.className}`,
                    );
                  }

                  // Check 1: Exact duplicate by signature
                  if (seenElements.has(signature)) {
                    duplicateCount++;
                    if (DEBUG_DEDUP) {
                      console.log(
                        `[extractContentData:DEDUP] ⚠️ SKIP (signature) ${index + 1}: ${match.tagName}`,
                      );
                    }
                    return;
                  }

                  // Check 2: Is contained within already-added element?
                  const containingElement = isContainedInAny(
                    match,
                    addedElements,
                  );
                  if (containingElement) {
                    duplicateCount++;
                    if (DEBUG_DEDUP) {
                      console.log(
                        `[extractContentData:DEDUP] ⚠️ SKIP (nested) ${index + 1}: ${match.tagName}`,
                      );
                    }
                    return;
                  }

                  // Check 3: Contains already-added element? Replace child with parent
                  const containedElement = containsAnyAdded(
                    match,
                    addedElements,
                  );
                  if (containedElement) {
                    if (DEBUG_DEDUP) {
                      console.log(
                        `[extractContentData:DEDUP] ⚠️ REPLACE child with parent ${index + 1}`,
                      );
                    }
                    const childClone = Array.from(container.children).find(
                      (child) => {
                        return (
                          child.tagName === containedElement.tagName &&
                          child.className === containedElement.className
                        );
                      },
                    );
                    if (childClone) {
                      container.removeChild(childClone);
                      const childIndex =
                        addedElements.indexOf(containedElement);
                      if (childIndex > -1) {
                        addedElements.splice(childIndex, 1);
                      }
                    }
                  }

                  seenElements.add(signature);
                  addedElements.push(match);
                  if (DEBUG_DEDUP) {
                    console.log(
                      `[extractContentData:DEDUP] ✅ ADD ${index + 1}: ${match.tagName} (total: ${addedElements.length})`,
                    );
                  }
                  container.appendChild(match.cloneNode(true));
                });

                console.log(
                  `[extractContentData:DEDUP] Found: ${allMatches.length} | Added: ${addedElements.length} | Skipped: ${duplicateCount}`,
                );

                if (duplicateCount > 0) {
                  console.log(
                    `[extractContentData:DEDUP] ✓ Removed ${duplicateCount} duplicates`,
                  );
                }

                article = container;
                console.log(
                  `[extractContentData] Combined ${allMatches.length - duplicateCount} unique elements into container`,
                );
              } else {
                console.log(
                  "[extractContentData] No matches found for multiple selectors",
                );
              }
            } else {
              // Single selector - use original logic
              // First try the element itself
              article = rootElement.closest(customSelector);
              console.log(
                "[extractContentData] closest() result:",
                article ? "Found" : "Not found",
              );

              // If not found, try searching from document root
              if (!article) {
                article = document.querySelector(customSelector);
                console.log(
                  "[extractContentData] document.querySelector() result:",
                  article ? "Found" : "Not found",
                );
              }

              // If still not found, try searching within the rootElement
              if (!article) {
                article = rootElement.querySelector(customSelector);
                console.log(
                  "[extractContentData] rootElement.querySelector() result:",
                  article ? "Found" : "Not found",
                );
              }

              // If still not found and rootElement is in Shadow DOM, try searching the shadow root
              if (!article && rootElement.getRootNode) {
                const root = rootElement.getRootNode();
                if (root instanceof ShadowRoot) {
                  console.log(
                    "[extractContentData] Searching in Shadow DOM root",
                  );
                  article = root.querySelector(customSelector);
                  console.log(
                    "[extractContentData] shadowRoot.querySelector() result:",
                    article ? "Found" : "Not found",
                  );
                }
              }
            }

            console.log(
              "[extractContentData] Final custom selector result:",
              article ? "Found" : "Not found",
            );
          } catch (e) {
            console.error(
              "[extractContentData] Invalid custom selector:",
              customSelector,
              e,
            );
          }
        }

        // Fall back to 'article' if no custom selector or custom selector didn't work
        if (!article) {
          console.log("[extractContentData] Falling back to article selector");
          article =
            rootElement.closest("article") ||
            document.querySelector("article") ||
            rootElement.querySelector("article");
        }

        if (article) {
          // Extract title
          const title =
            article.querySelector("h1")?.textContent?.trim() ||
            document.querySelector("h1")?.textContent?.trim() ||
            document.title ||
            "Unknown Title";

          // Find content after metadata (like "1 minute to read") but before feedback
          const allContentElements = Array.from(
            article.querySelectorAll(
              "p, h2, h3, h4, h5, h6, div, section, table, ul, ol",
            ),
          );
          const contentElements = [];
          let foundMetadata = false;

          for (const el of allContentElements) {
            const text = el.textContent?.trim();
            if (!text) continue;

            // Start collecting after we find metadata markers
            if (
              text.includes("minute to read") ||
              text.includes("Updated") ||
              text.includes("Published")
            ) {
              foundMetadata = true;
              continue;
            }

            // Stop when we reach feedback section
            if (
              text.includes("Was this topic helpful?") ||
              text.includes("Helpful?") ||
              text.includes("Rate this") ||
              text.includes("feedback")
            ) {
              break;
            }

            // Collect content elements after metadata
            if (foundMetadata || contentElements.length === 0) {
              // Include meaningful content elements
              if (
                el.tagName === "P" ||
                el.tagName.match(/^H[2-6]$/) ||
                el.tagName === "TABLE" ||
                el.tagName === "UL" ||
                el.tagName === "OL" ||
                (el.tagName === "DIV" && el.textContent.length > 50)
              ) {
                contentElements.push(el);
              }
            }
          }

          // If we found obvious content elements, return them. If not,
          // attempt a deeper "drill-down" search: many sites wrap text in
          // several layers of DIVs (or use application-generated wrappers)
          // so look for meaningful descendant nodes and use those.
          if (contentElements.length === 0) {
            console.log(
              "[extractContentData] No direct contentElements found — running deep-drill to locate meaningful descendants",
            );
            try {
              const deepCandidates = Array.from(
                article.querySelectorAll(
                  "p, h2, h3, h4, h5, h6, li, td, th, div, section",
                ),
              )
                .map((el) => ({
                  el,
                  len: (el.textContent || "").trim().length,
                }))
                .filter((it) => it.len > 20) // require a small minimum
                .sort((a, b) => b.len - a.len)
                .map((it) => it.el);

              // Deduplicate by containment: prefer parents that contain
              // smaller matches so we don't return nested fragments.
              const selected = [];
              for (const cand of deepCandidates) {
                if (
                  !selected.some((s) => s.contains(cand) || cand.contains(s))
                ) {
                  selected.push(cand);
                }
                if (selected.length >= 10) break;
              }

              if (selected.length > 0) {
                console.log(
                  `[extractContentData] Deep-drill found ${selected.length} candidate(s)`,
                );
                contentElements.push(...selected);
              }
            } catch (err) {
              console.warn("[extractContentData] deep-drill failed:", err);
            }
          }

          if (contentElements.length > 0) {
            return {
              title: title,
              content: contentElements.map((el) => el.outerHTML).join("\n"),
              textContent: contentElements
                .map((el) => el.textContent.trim())
                .join(" ")
                .replace(/\s+/g, " "),
              url: window.location.href,
              elementCount: contentElements.length,
            };
          }
        }

        // Fallback: extract content from the selected element itself
        console.log(
          "[extractContentData] Final fallback: extracting from rootElement directly",
        );
        const text = rootElement.textContent?.trim();
        // If the runtime annotation helper exists, run it on a clone so we can
        // serialize a version that contains XCELLIDX/placeholders without
        // mutating the live DOM.
        let html;
        try {
          // Operate on a clone so we never mutate the live DOM.
          const work = (function () {
            try {
              const c = rootElement.cloneNode(true);
              if (typeof window.__stn_annotateTableCells === "function") {
                window.__stn_annotateTableCells(c);
              }
              return c;
            } catch (err) {
              return rootElement.cloneNode(true);
            }
          })();

          // Conservative cleanup only when the cloned fragment contains
          // images/placeholders — remove explicit empty parentheses and
          // handle split-paren cases across adjacent text nodes.
          try {
            if (
              work.querySelector &&
              (work.querySelector("img, svg") ||
                /XCELLIDX\(|data-stn-preserve|stn-inline-image|<svg\b/i.test(
                  work.innerHTML,
                ))
            ) {
              const SHOW_TEXT =
                (typeof NodeFilter !== "undefined" && NodeFilter.SHOW_TEXT) ||
                4;
              const walker = document.createTreeWalker(
                work,
                SHOW_TEXT,
                null,
                false,
              );
              const toRemove = [];
              while (walker.nextNode()) {
                const tn = walker.currentNode;
                if (!tn || !tn.textContent) continue;
                // Replace empty-parens with a single space so words don't
                // run together; normalize repeated spaces afterward.
                const cleaned = tn.textContent
                  .replace(/\(\s*\)/g, " ")
                  .replace(/\s{2,}/g, " ");
                if (cleaned !== tn.textContent) tn.textContent = cleaned;
                if (!tn.textContent.trim()) toRemove.push(tn);
              }
              toRemove.forEach(
                (n) => n.parentNode && n.parentNode.removeChild(n),
              );

              // split-paren pass
              try {
                const tw = document.createTreeWalker(
                  work,
                  SHOW_TEXT,
                  null,
                  false,
                );
                const seq = [];
                while (tw.nextNode()) seq.push(tw.currentNode);
                for (let i = 0; i < seq.length - 1; i++) {
                  const a = seq[i];
                  const b = seq[i + 1];
                  if (!a || !b) continue;
                  const aText = String(a.textContent || "");
                  const bText = String(b.textContent || "");
                  if (/\(\s*$/.test(aText) && /^\s*\)/.test(bText)) {
                    // Insert a single space when removing split parens so
                    // the surrounding words remain separated.
                    a.textContent = aText.replace(/\(\s*$/, " ");
                    b.textContent = bText.replace(/^\s*\)/, " ");
                    if (!a.textContent.trim())
                      a.parentNode && a.parentNode.removeChild(a);
                    if (!b.textContent.trim())
                      b.parentNode && b.parentNode.removeChild(b);
                  }
                }
              } catch (err) {
                /* tolerant */
              }
            }
          } catch (err) {
            /* tolerant */
          }

          html = work.outerHTML;
        } catch (err) {
          html = rootElement.outerHTML;
        }

        // Accept any element with content (lowered threshold from 100 to 10 characters)
        if (text && text.length > 10 && html) {
          console.log(
            `[extractContentData] ✓ Fallback succeeded - found ${text.length} characters of text content`,
          );
          return {
            title: document.title || "Unknown Title",
            content: html,
            textContent: text.replace(/\s+/g, " "),
            url: window.location.href,
            elementCount: 1,
          };
        }

        // Even if text is short, try to extract HTML if available
        if (html && html.length > 50) {
          console.log(
            `[extractContentData] ✓ Fallback using HTML content (${html.length} chars)`,
          );
          return {
            title: document.title || "Unknown Title",
            content: html,
            textContent: text || "(No text content)",
            url: window.location.href,
            elementCount: 1,
          };
        }

        console.error(
          "[extractContentData] ✗ All extraction strategies failed - no valid content found",
        );
        return null;
      }
      function continueWithFieldSelection(selectedFields) {
        const fields = selectedFields.map((field, index) => ({
          id: `field-${index + 1}`,
          name: getFieldName(field),
          type: getFieldType(field),
          selector: (0, finder_1.finder)(field),
          value: getFieldValue(field),
          attributes: getFieldAttributes(field),
        }));
        return {
          fields,
          domain: window.location.hostname || "unknown",
          pageUrl: window.location.href,
          totalFields: fields.length,
        };
      }
      function continueWithContentSelection(
        contentData,
        embeddedPostFormat = false,
      ) {
        return {
          title: contentData.title,
          content: contentData.content,
          textContent: contentData.textContent,
          url: contentData.url,
          domain: window.location.hostname || "unknown",
          pageUrl: window.location.href,
          elementCount: contentData.elementCount,
          embeddedPostFormat,
          // Hint downstream formatter to render as callout when embedded flag is set
          ...(embeddedPostFormat
            ? { highlightFormat: "callout", calloutIcon: "📎" }
            : {}),
        };
      }
      function startManualFieldSelection(fieldElements, callback) {
        let selectedFields = [];
        function toggleFieldSelection(field) {
          const index = selectedFields.indexOf(field);
          if (index > -1) {
            selectedFields.splice(index, 1);
            field.style.outline = "";
          } else {
            selectedFields.push(field);
            field.style.outline = "3px solid #3b82f6";
          }
          updateFieldStatus(selectedFields.length);
        }
        function updateFieldStatus(count) {
          let el = document.querySelector(`#cancelsnackbar-${idName}`);
          const buttonEl = el.querySelector(".cancelsnackbar-button");
          const labelEl = el.querySelector(".cancelsnackbar-label");
          if (count == 0) {
            buttonEl.style.display = "none";
            labelEl.style.display = "block";
          } else {
            buttonEl.style.display = "block";
            buttonEl.style.textDecoration = "underline";
            labelEl.style.display = "none";
            buttonEl.innerHTML = `Continue with ${count} field${count > 1 ? "s" : ""}`;
          }
        }
        // Add click handlers to fields
        fieldElements.forEach((field) => {
          field.addEventListener(
            "click",
            (e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFieldSelection(field);
            },
            true,
          );
        });
        // Override the cancel button to use our callback
        let el = document.querySelector(`#cancelsnackbar-${idName}`);
        const buttonEl = el.querySelector(".cancelsnackbar-button");
        buttonEl.onclick = function () {
          callback(selectedFields);
        };
      }

      /***/
    },
    /******/
  ],
);
