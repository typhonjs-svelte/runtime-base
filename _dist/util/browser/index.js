import { isObject } from '@typhonjs-svelte/runtime-base/util/object';

/**
 * Provides utility methods for checking browser capabilities.
 *
 * @see https://kilianvalkhof.com/2021/web/detecting-media-query-support-in-css-and-javascript/
 *
 * @privateRemarks
 * TODO: perhaps add support for various standard media query checks for level 4 & 5.
 */
class BrowserSupports
{
   /**
    * Check for container query support.
    *
    * @returns {boolean} True if container queries supported.
    */
   static get containerQueries()
   {
      return 'container' in document.documentElement.style;
   }
}

/**
 * Provides cross window checks for DOM nodes / elements, events, and essential duck typing for any class based object
 * with a constructor name. The impetus is that certain browsers such as Chrome and Firefox behave differently when
 * performing `instanceof` checks when elements are moved between browser windows. With Firefox in particular the
 * entire JS runtime can not use `instanceof` checks as the instances of fundamental DOM elements differ between
 * windows.
 *
 * TRL supports moving applications from a main central browser window and popping them out into separate standalone
 * app instances in a separate browser window. In this case for essential DOM element and event checks it is necessary
 * to employ the workarounds found in `CrossWindow`.
 */
class CrossWindow
{
   /**
    * @private
    */
   constructor() {} // eslint-disable-line no-useless-constructor

   /**
    * Class names for all focusable element types.
    *
    * @type {string[]}
    */
   static #FocusableElementClassNames = ['HTMLAnchorElement', 'HTMLButtonElement', 'HTMLDetailsElement',
    'HTMLEmbedElement', 'HTMLIFrameElement', 'HTMLInputElement', 'HTMLObjectElement', 'HTMLSelectElement',
     'HTMLTextAreaElement'];

   /**
    * DOM nodes with defined `ownerDocument` property.
    *
    * @type {Set<number>}
    */
   static #NodesWithOwnerDocument = new Set([Node.ELEMENT_NODE, Node.TEXT_NODE, Node.COMMENT_NODE,
    Node.DOCUMENT_FRAGMENT_NODE]);

   // Various UI Event sets for duck typing by constructor name.
   /**
    * Duck typing class names for pointer events.
    *
    * @type {Set<string>}
    */
   static #PointerEventSet = new Set(['MouseEvent', 'PointerEvent']);

   /**
    * Duck typing class names for all UIEvents.
    *
    * @type {Set<string>}
    */
   static #UIEventSet = new Set(['UIEvent', 'FocusEvent', 'MouseEvent', 'WheelEvent', 'KeyboardEvent', 'PointerEvent',
    'TouchEvent', 'InputEvent', 'CompositionEvent', 'DragEvent']);

   /**
    * Duck typing class names for events considered as user input.
    *
    * @type {Set<string>}
    */
   static #UserInputEventSet = new Set(['KeyboardEvent', 'MouseEvent', 'PointerEvent']);

   /**
    * Internal options used by `#checkDOMInstanceType` when retrieving the Window reference from a Node that doesn't
    * define `ownerDocument`.
    *
    * @type {{throws: boolean}}
    */
   static #optionsInternalCheckDOM = { throws: false };

   // DOM Querying ---------------------------------------------------------------------------------------------------

   /**
    * Convenience method to retrieve the `document.activeElement` value in the current Window context of a DOM Node /
    * Element, EventTarget, Document, or Window.
    *
    * @param {Document | EventTarget | Node | UIEvent | Window}  target - DOM Node / Element, EventTarget, Document,
    *        UIEvent or Window to query.
    *
    * @param {object} [options] - Options.
    *
    * @param {boolean} [options.throws=true] - When `true` and target is invalid throw an exception. If `false` and the
    *        target is invalid `undefined` is returned; default: `true`.
    *
    * @returns {Element | null} Active element or `undefined` when `throws` option is `false` and the target is invalid.
    *
    * @throws {@link TypeError} Target must be a DOM Node / Element, Document, UIEvent, or Window.
    */
   static getActiveElement(target, { throws = true } = {})
   {
      // Duck type if target has known defined `ownerDocument` property.
      if (this.#NodesWithOwnerDocument.has(target?.nodeType)) { return target?.ownerDocument?.activeElement ?? null; }

      // Duck type if target is a UIEvent.
      if (this.isUIEvent(target) && isObject(target?.view)) { return target?.view?.document?.activeElement ?? null; }

      // Duck type if target is a Document.
      if (isObject(target?.defaultView)) { return target?.activeElement ?? null; }

      // Duck type if target is a Window.
      if (isObject(target?.document) && isObject(target?.location)) { return target?.document?.activeElement ?? null; }

      if (throws) { throw new TypeError(`'target' must be a DOM Node / Element, Document, UIEvent, or Window.`); }

      return void 0;
   }

   /**
    * Convenience method to retrieve the `Document` value in the current context of a DOM Node / Element, EventTarget,
    * Document, UIEvent, or Window.
    *
    * @param {Document | EventTarget | Node | UIEvent | Window}  target - DOM Node / Element, EventTarget, Document,
    *        UIEvent or Window to query.
    *
    * @param {object} [options] - Options.
    *
    * @param {boolean} [options.throws=true] - When `true` and target is invalid throw an exception. If `false` and the
    *        target is invalid `undefined` is returned; default: `true`.
    *
    * @returns {Document} Active document or `undefined` when `throws` option is `false` and the target is invalid.
    *
    * @throws {@link TypeError} Target must be a DOM Node / Element, Document, UIEvent, or Window.
    */
   static getDocument(target, { throws = true } = {})
   {
      // Duck type if target has known defined `ownerDocument` property.
      if (this.#NodesWithOwnerDocument.has(target?.nodeType)) { return target?.ownerDocument; }

      // Duck type if target is a UIEvent.
      if (this.isUIEvent(target) && isObject(target?.view)) { return target?.view?.document; }

      // Duck type if target is a Document.
      if (isObject(target?.defaultView)) { return target; }

      // Duck type if target is a Window.
      if (isObject(target?.document) && isObject(target?.location)) { return target?.document; }

      if (throws) { throw new TypeError(`'target' must be a DOM Node / Element, Document, UIEvent, or Window.`); }

      return void 0;
   }

   /**
    * Convenience method to retrieve the `Window` value in the current context of a DOM Node / Element, EventTarget,
    * Document, or Window.
    *
    * @param {Document | EventTarget | Node | UIEvent | Window}  target - DOM Node / Element, EventTarget, Document,
    *        UIEvent or Window to query.
    *
    * @param {object} [options] - Options.
    *
    * @param {boolean} [options.throws=true] - When `true` and target is invalid throw an exception. If `false` and the
    *        target is invalid `undefined` is returned; default: `true`.
    *
    * @returns {Window} Active window or `undefined` when `throws` option is `false` and the target is invalid.
    *
    * @throws {@link TypeError} Target must be a DOM Node / Element, Document, UIEvent, or Window.
    */
   static getWindow(target, { throws = true } = {})
   {
      // Duck type if target has known defined `ownerDocument` property.
      if (this.#NodesWithOwnerDocument.has(target?.nodeType))
      {
         return target.ownerDocument?.defaultView ?? globalThis;
      }

      // Duck type if target is a UIEvent.
      if (this.isUIEvent(target) && isObject(target?.view)) { return target.view ?? globalThis; }

      // Duck type if target is a Document.
      if (isObject(target?.defaultView)) { return target.defaultView ?? globalThis; }

      // Duck type if target is a Window.
      if (isObject(target?.document) && isObject(target?.location)) { return target; }

      if (throws) { throw new TypeError(`'target' must be a DOM Node / Element, Document, UIEvent, or Window.`); }

      return void 0;
   }

   // ES / Browser API basic prototype tests -------------------------------------------------------------------------

   /**
    * Provides basic prototype string type checking if `target` is a Document.
    *
    * @param {unknown}  target - A potential Document to test.
    *
    * @returns {target is Document} Is `target` a Document.
    */
   static isDocument(target)
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object Document]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a Map.
    *
    * @param {unknown}  target - A potential Map to test.
    *
    * @returns {target is Map} Is `target` a Map.
    */
   static isMap(target)
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object Map]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a Promise.
    *
    * @param {unknown}  target - A potential Promise to test.
    *
    * @returns {target is Promise} Is `target` a Promise.
    */
   static isPromise(target)
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object Promise]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a RegExp.
    *
    * @param {unknown}  target - A potential RegExp to test.
    *
    * @returns {target is RegExp} Is `target` a RegExp.
    */
   static isRegExp(target)
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object RegExp]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a Set.
    *
    * @param {unknown}  target - A potential Set to test.
    *
    * @returns {target is Set} Is `target` a Set.
    */
   static isSet(target)
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object Set]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a URL.
    *
    * @param {unknown}  target - A potential URL to test.
    *
    * @returns {target is URL} Is `target` a URL.
    */
   static isURL(target)
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object URL]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a Window.
    *
    * @param {unknown}  target - A potential Window to test.
    *
    * @returns {target is Window} Is `target` a Window.
    */
   static isWindow(target)
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object Window]';
   }

   // DOM Element typing ---------------------------------------------------------------------------------------------

   /**
    * Ensures that the given target is an `instanceof` all known DOM elements that are focusable. Please note that
    * additional checks are required regarding focusable state; use {@link A11yHelper.isFocusable} for a complete check.
    *
    * @param {unknown}  target - Target to test for `instanceof` focusable HTML element.
    *
    * @returns {boolean} Is target an `instanceof` a focusable DOM element.
    */
   static isFocusableHTMLElement(target)
   {
      for (let cntr = this.#FocusableElementClassNames.length; --cntr >= 0;)
      {
         if (this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, this.#FocusableElementClassNames[cntr]))
         {
            return true;
         }
      }

      return false;
   }

   /**
    * Provides precise type checking if `target` is a DocumentFragment.
    *
    * @param {unknown}  target - A potential DocumentFragment to test.
    *
    * @returns {target is DocumentFragment} Is `target` a DocumentFragment.
    */
   static isDocumentFragment(target)
   {
      return this.#checkDOMInstanceType(target, Node.DOCUMENT_FRAGMENT_NODE, 'DocumentFragment');
   }

   /**
    * Provides precise type checking if `target` is an Element.
    *
    * @param {unknown}  target - A potential Element to test.
    *
    * @returns {target is Element} Is `target` an Element.
    */
   static isElement(target)
   {
      return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'Element');
   }

   /**
    * Provides precise type checking if `target` is a HTMLAnchorElement.
    *
    * @param {unknown}  target - A potential HTMLAnchorElement to test.
    *
    * @returns {target is HTMLAnchorElement} Is `target` a HTMLAnchorElement.
    */
   static isHTMLAnchorElement(target)
   {
      return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'HTMLAnchorElement');
   }

   /**
    * Provides precise type checking if `target` is a HTMLElement.
    *
    * @param {unknown}  target - A potential HTMLElement to test.
    *
    * @returns {target is HTMLElement} Is `target` a HTMLElement.
    */
   static isHTMLElement(target)
   {
      return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'HTMLElement');
   }

   /**
    * Provides precise type checking if `target` is a Node.
    *
    * @param {unknown}  target - A potential Node to test.
    *
    * @returns {target is Node} Is `target` a DOM Node.
    */
   static isNode(target)
   {
      if (typeof target?.nodeType !== 'number') { return false; }

      if (target instanceof globalThis.Node) { return true; }

      // Must retrieve window by a more thorough duck type via `getWindow` as not all Nodes have `ownerDocument`
      // defined.
      const activeWindow = this.getWindow(target, this.#optionsInternalCheckDOM);

      const TargetNode = activeWindow?.Node;
      return TargetNode && target instanceof TargetNode;
   }

   /**
    * Provides precise type checking if `target` is a ShadowRoot.
    *
    * @param {unknown}  target - A potential ShadowRoot to test.
    *
    * @returns {target is ShadowRoot} Is `target` a ShadowRoot.
    */
   static isShadowRoot(target)
   {
      // ShadowRoot is a specialized type of DocumentFragment.
      return this.#checkDOMInstanceType(target, Node.DOCUMENT_FRAGMENT_NODE, 'ShadowRoot');
   }

   /**
    * Provides precise type checking if `target` is a SVGElement.
    *
    * @param {unknown}  target - A potential SVGElement to test.
    *
    * @returns {target is SVGElement} Is `target` a SVGElement.
    */
   static isSVGElement(target)
   {
      return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'SVGElement');
   }

   // Event typing ---------------------------------------------------------------------------------------------------

   /**
    * Provides basic duck type checking for `Event` signature and optional constructor name(s).
    *
    * @param {unknown}  target - A potential DOM event to test.
    *
    * @param {string | Set<string>} [types] Specific constructor name or Set of constructor names to match.
    *
    * @returns {target is Event} Is `target` an Event with optional constructor name check.
    */
   static isEvent(target, types)
   {
      if (typeof target?.type !== 'string' || typeof target?.defaultPrevented !== 'boolean' ||
         typeof target?.stopPropagation !== 'function')
      {
         return false;
      }

      return types !== void 0 ? this.isCtorName(target, types) : true;
   }

   /**
    * Provides basic duck type checking for `Event` signature for standard mouse / pointer events including
    * `MouseEvent` and `PointerEvent`.
    *
    * @param {unknown}  target - A potential DOM event to test.
    *
    * @returns {target is PointerEvent} Is `target` a MouseEvent or PointerEvent.
    */
   static isPointerEvent(target)
   {
      return this.isEvent(target, this.#PointerEventSet);
   }

   /**
    * Provides basic duck type checking for `Event` signature for all UI events.
    *
    * @param {unknown}  target - A potential DOM event to test.
    *
    * @returns {target is UIEvent} Is `target` a UIEvent.
    * @see https://developer.mozilla.org/en-US/docs/Web/API/UIEvent
    */
   static isUIEvent(target)
   {
      return this.isEvent(target, this.#UIEventSet);
   }

   /**
    * Provides basic duck type checking for `Event` signature for standard user input events including `KeyboardEvent`,
    * `MouseEvent`, and `PointerEvent`.
    *
    * @param {unknown}  target - A potential DOM event to test.
    *
    * @returns {target is KeyboardEvent | MouseEvent | PointerEvent} Is `target` a Keyboard, MouseEvent, or
    *          PointerEvent.
    */
   static isUserInputEvent(target)
   {
      return this.isEvent(target, this.#UserInputEventSet);
   }

   // Generic typing -------------------------------------------------------------------------------------------------

   /**
    * Provides basic type checking by constructor name(s) for objects. This can be useful when checking multiple
    * constructor names against a provided Set.
    *
    * @param {unknown}  target - Object to test for constructor name.
    *
    * @param {string | Set<string>} types Specific constructor name or Set of constructor names to match.
    *
    * @returns {boolean} Does the provided object constructor name match the types provided.
    */
   static isCtorName(target, types)
   {
      if (!isObject(target)) { return false; }

      if (typeof types === 'string' && target?.constructor?.name === types) { return true; }

      return !!types?.has(target?.constructor?.name);
   }

   // Internal implementation ----------------------------------------------------------------------------------------

   /**
    * Internal generic DOM `instanceof` check. First will attempt to find the class name by `globalThis` falling back
    * to the {@link Window} associated with the DOM node.
    *
    * @param {unknown}  target - Target to test.
    *
    * @param {number}   nodeType - Node type constant.
    *
    * @param {string}   className - DOM class name for instanceof check.
    *
    * @returns {boolean} Is the target the given nodeType and instance of class name.
    */
   static #checkDOMInstanceType(target, nodeType, className)
   {
      if (!isObject(target)) { return false; }

      if (target.nodeType !== nodeType) { return false; }

      const GlobalClass = globalThis[className];

      if (GlobalClass && target instanceof GlobalClass) { return true; }

      const activeWindow = this.#NodesWithOwnerDocument.has(target.nodeType) ? target?.ownerDocument?.defaultView :
       this.getWindow(target, this.#optionsInternalCheckDOM);

      const TargetClass = activeWindow?.[className];

      return TargetClass && target instanceof TargetClass;
   }
}

/**
 * Provides access to the Clipboard API for reading / writing text strings. This requires a secure context.
 *
 * Note: `writeText` will attempt to use the older `execCommand` if available when `navigator.clipboard` is not
 * available.
 */
class ClipboardAccess
{
   /**
    * Uses `navigator.clipboard` if available to read text from the clipboard.
    *
    * Note: Always returns `undefined` when `navigator.clipboard` is not available or the clipboard contains the
    * empty string.
    *
    * @param {Window} [activeWindow=globalThis] Optional active current window.
    *
    * @returns {Promise<string|undefined>} The current clipboard text or undefined.
    */
   static async readText(activeWindow = globalThis)
   {
      let result;

      if (!CrossWindow.isWindow(activeWindow))
      {
         throw new TypeError(`ClipboardAccess.readText error: 'activeWindow' is not a Window.`);
      }

      if (activeWindow?.navigator?.clipboard)
      {
         try
         {
            result = await activeWindow.navigator.clipboard.readText();
         }
         catch (err) { /**/ }
      }

      return result === '' ? void 0 : result;
   }

   /**
    * Uses `navigator.clipboard` if available then falls back to `document.execCommand('copy')` if available to copy
    * the given text to the clipboard.
    *
    * @param {string}   text - Text to copy to the browser clipboard.
    *
    * @param {Window} [activeWindow=globalThis] Optional active current window.
    *
    * @returns {Promise<boolean>} Copy successful.
    */
   static async writeText(text, activeWindow = globalThis)
   {
      if (typeof text !== 'string')
      {
         throw new TypeError(`ClipboardAccess.writeText error: 'text' is not a string.`);
      }

      if (!CrossWindow.isWindow(activeWindow))
      {
         throw new TypeError(`ClipboardAccess.writeText error: 'activeWindow' is not a Window.`);
      }

      let success = false;

      if (activeWindow?.navigator?.clipboard)
      {
         try
         {
            await activeWindow.navigator.clipboard.writeText(text);
            success = true;
         }
         catch (err) { /**/ }
      }
      else if (typeof activeWindow?.document?.execCommand === 'function')
      {
         const textArea = activeWindow.document.createElement('textarea');

         // Place in the top-left corner of screen regardless of scroll position.
         textArea.style.position = 'fixed';
         textArea.style.top = '0';
         textArea.style.left = '0';

         // Ensure it has a small width and height. Setting to 1px / 1em
         // doesn't work as this gives a negative w/h on some browsers.
         textArea.style.width = '2em';
         textArea.style.height = '2em';

         // We don't need padding, reducing the size if it does flash render.
         textArea.style.padding = '0';

         // Clean up any borders.
         textArea.style.border = 'none';
         textArea.style.outline = 'none';
         textArea.style.boxShadow = 'none';

         // Avoid flash of the white box if rendered for any reason.
         textArea.style.background = 'transparent';

         textArea.value = text;

         activeWindow.document.body.appendChild(textArea);
         textArea.focus();
         textArea.select();

         try
         {
            success = activeWindow.document.execCommand('copy');
         }
         catch (err) { /**/ }

         activeWindow.document.body.removeChild(textArea);
      }

      return success;
   }
}

/**
 * Provides a utility function to parse / construct fully qualified URL instances from a URL string.
 */
class URLParser
{
   /**
    * Parses a URL string converting it to a fully qualified URL. If URL is an existing URL instance it is returned
    * immediately. Optionally you may construct a fully qualified URL from a relative base origin / path or with a
    * route prefix added to the current location origin.
    *
    * @param {object} options - Options.
    *
    * @param {string | URL}   options.url - URL string to convert to a URL.
    *
    * @param {string}   [options.base] - Optional fully qualified base path for relative URL construction.
    *
    * @param {string}   [options.routePrefix] - Optional route prefix to add to location origin for absolute URL strings
    *        when `base` is not defined.
    *
    * @returns {URL | null} Parsed URL or null if `url` is not parsed.
    */
   static parse({ url, base, routePrefix })
   {
      if (CrossWindow.isURL(url)) { return url; }

      if (typeof url !== 'string') { return null; }

      if (base !== void 0 && typeof base !== 'string') { return null; }

      if (routePrefix !== void 0 && typeof routePrefix !== 'string') { return null; }

      const targetURL = this.#createURL(url);

      // Parse and return already fully qualified `url` string.
      if (targetURL) { return targetURL; }

      let targetBase;

      // Parse relative url string.
      if (url.startsWith('./') || url.startsWith('../'))
      {
         // Relative from provided `base` or current path.
         targetBase = base ? base : `${globalThis.location.origin}${globalThis.location.pathname}`;
      }
      else
      {
         let targetRoutePrefix = '';

         // Relative to current origin, but include any defined route prefix.
         if (routePrefix)
         {
            // Ensure route prefix starts and ends with `/` for proper URL parsing.
            targetRoutePrefix = routePrefix.startsWith('/') ? routePrefix : `/${routePrefix}`;
            targetRoutePrefix = targetRoutePrefix.endsWith('/') ? targetRoutePrefix : `${targetRoutePrefix}/`;
         }

         targetBase = `${globalThis.location.origin}${targetRoutePrefix}`;
      }

      return this.#createURL(url, targetBase);
   }

   // Internal implementation ----------------------------------------------------------------------------------------

   /**
    * Helper to create a URL and catch any exception. Useful until `URL.parse` and `URL.canParse` are more widespread.
    *
    * @param {string}   url - URL string.
    *
    * @param {string}   base - Base origin / path.
    *
    * @returns {URL | null} Valid URL or null.
    */
   static #createURL(url, base = '')
   {
      try { return new URL(url, base); }
      catch(err) { return null; }
   }
}

export { BrowserSupports, ClipboardAccess, CrossWindow, URLParser };
//# sourceMappingURL=index.js.map
