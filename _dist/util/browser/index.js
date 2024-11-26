import { isObject } from '@typhonjs-svelte/runtime-base/util/object';

/**
 * Provides utility methods for checking browser capabilities.
 *
 * @see https://kilianvalkhof.com/2021/web/detecting-media-query-support-in-css-and-javascript/
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
 * Provides cross window checks for DOM elements, events, and essential duck typing for any class based object with a
 * constructor name. The impetus is that certain browsers such as Chrome and Firefox behave differently when
 * performing `instanceof` checks when elements are moved between browser windows. With Firefox in particular the
 * entire JS runtime can not use `instanceof` checks as the instances of fundamental DOM elements differ between
 * windows.
 *
 * TRL supports moving applications from a main central browser window and popping them out into separate standalone
 * app instances in a separate browser window. In this case for essential DOM element and event checks it's necessary to
 * employ the workarounds found in `CrossWindow`.
 */
class CrossWindow
{
   /**
    * @private
    */
   constructor() {} // eslint-disable-line no-useless-constructor

   // Cached DOM nodes from initial `globalThis` reference / originating window.
   static #Element = globalThis.Element;
   static #HTMLElement = globalThis.HTMLElement;
   static #Node = globalThis.Node;
   static #SVGElement = globalThis.SVGElement;

   static #InputEventSet = new Set(['KeyboardEvent', 'MouseEvent', 'PointerEvent']);

   // ES / Browser API typing ----------------------------------------------------------------------------------------

   /**
    * Provides basic prototype string type checking if `target` is a Document.
    *
    * @param {unknown}  target - A potential Document to test.
    *
    * @returns {boolean} Is `target` a Document.
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
    * @returns {boolean} Is `target` a Map.
    */
   static isMap(target)
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object Map]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a Set.
    *
    * @param {unknown}  target - A potential Set to test.
    *
    * @returns {boolean} Is `target` a Set.
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
    * @returns {boolean} Is `target` a URL.
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
    * @returns {boolean} Is `target` a Window.
    */
   static isWindow(target)
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object Window]';
   }

   // DOM Querying ---------------------------------------------------------------------------------------------------

   /**
    * Convenience method to retrieve the `document.activeElement` value in the current Window context of a DOM Node /
    * Element, EventTarget, Document, or Window.
    *
    * @param {Document | EventTarget | Node | Window}  target - DOM Node / Element, EventTarget, Document, or Window to
    *        query.
    *
    * @returns {Element | null} Active element.
    */
   static getActiveElement(target)
   {
      // Duck type if target is a Node / Element.
      if (typeof target?.nodeType === 'number') { return target?.ownerDocument?.activeElement ?? null; }

      // Duck type if target is a Document.
      if (isObject(target?.defaultView)) { return target?.activeElement ?? null; }

      // Duck type if target is a Window.
      if (isObject(target?.document) && isObject(target?.location)) { return target?.document?.activeElement ?? null; }

      throw new TypeError(`'target' must be a DOM Node / Element, Document, or Window.`);
   }

   /**
    * Convenience method to retrieve the `Document` value in the current context of a DOM Node / Element, EventTarget,
    * Document, or Window.
    *
    * @param {Document | EventTarget | Node | Window}  target - DOM Node / Element, EventTarget, Document, or Window to
    *        query.
    *
    * @returns {Document} Active document.
    */
   static getDocument(target)
   {
      // Duck type if target is a Node / Element.
      if (typeof target?.nodeType === 'number') { return target?.ownerDocument; }

      // Duck type if target is a Document.
      if (isObject(target?.defaultView)) { return target; }

      // Duck type if target is a Window.
      if (isObject(target?.document) && isObject(target?.location)) { return target?.document; }

      throw new TypeError(`'target' must be a DOM Node / Element, Document, or Window.`);
   }

   /**
    * Convenience method to retrieve the `Window` value in the current context of a DOM Node / Element, EventTarget,
    * Document, or Window.
    *
    * @param {Document | EventTarget | Node | Window}  target - DOM Node / Element, EventTarget, Document, or Window to
    *        query.
    *
    * @returns {Window} Active window.
    */
   static getWindow(target)
   {
      // Duck type if target is a Node / Element.
      if (typeof target?.nodeType === 'number') { return target.ownerDocument?.defaultView ?? globalThis; }

      // Duck type if target is a Document.
      if (isObject(target?.defaultView)) { return target.defaultView ?? globalThis; }

      // Duck type if target is a Window.
      if (isObject(target?.document) && isObject(target?.location)) { return target; }

      throw new TypeError(`'target' must be a DOM Node / Element, Document, or Window.`);
   }

   // DOM Element typing ---------------------------------------------------------------------------------------------

   /**
    * Provides precise type checking if `target` is an Element.
    *
    * @param {unknown}  target - A potential Element to test.
    *
    * @returns {boolean} Is `target` an Element.
    */
   static isElement(target)
   {
      if (target?.nodeType !== 1) { return false; }

      if (target instanceof this.#Element) { return true; }

      const OwnerElement = target?.ownerDocument?.defaultView?.Element;

      return OwnerElement && target instanceof OwnerElement;
   }

   /**
    * Provides precise type checking if `target` is a HTMLElement.
    *
    * @param {unknown}  target - A potential HTMLElement to test.
    *
    * @returns {boolean} Is `target` an HTMLElement.
    */
   static isHTMLElement(target)
   {
      if (target?.nodeType !== 1) { return false; }

      if (target instanceof this.#HTMLElement) { return true; }

      const OwnerHTMLElement = target?.ownerDocument?.defaultView?.HTMLElement;

      return OwnerHTMLElement && target instanceof OwnerHTMLElement;
   }

   /**
    * Provides precise type checking if `target` is a Node.
    *
    * @param {unknown}  target - A potential Node to test.
    *
    * @returns {boolean} Is `target` a DOM Node.
    */
   static isNode(target)
   {
      if (typeof target?.nodeType !== 'number') { return false; }

      if (target instanceof this.#Node) { return true; }

      const OwnerNode = target?.ownerDocument?.defaultView?.Node;

      return OwnerNode && target instanceof OwnerNode;
   }

   /**
    * Provides precise type checking if `target` is a SVGElement.
    *
    * @param {unknown}  target - A potential SVGElement to test.
    *
    * @returns {boolean} Is `target` an SVGElement.
    */
   static isSVGElement(target)
   {
      if (target?.nodeType !== 1) { return false; }

      if (target instanceof this.#SVGElement) { return true; }

      const OwnerSVGElement = target?.ownerDocument?.defaultView?.SVGElement;

      return OwnerSVGElement && target instanceof OwnerSVGElement;
   }

   // Event typing ---------------------------------------------------------------------------------------------------

   /**
    * Provides basic duck type checking for `Event` signature and optional constructor name(s).
    *
    * @param {unknown}  target - A potential DOM event to test.
    *
    * @param {string | Set<string>} [types] Specific constructor name or Set of constructor names to match.
    *
    * @returns {boolean} Is `target` an Event with optional constructor name check.
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
    * Provides basic duck type checking for `Event` signature for standard input events including `KeyboardEvent`,
    * `MouseEvent`, and `PointerEvent`. This method is useful when constructing a Set for constructor name testing is
    * not convenient.
    *
    * @param {unknown}  target - A potential DOM event to test.
    *
    * @returns {boolean} Is `target` a Keyboard, MouseEvent, or PointerEvent.
    */
   static isInputEvent(target)
   {
      return this.isEvent(target, this.#InputEventSet);
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
