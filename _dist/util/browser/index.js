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

      if (Object.prototype.toString.call(activeWindow) !== '[object Window]')
      {
         throw new TypeError(`ClipboardAccess.readText error: 'activeWindow' is not a Window or WindowProxy.`);
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

      if (Object.prototype.toString.call(activeWindow) !== '[object Window]')
      {
         throw new TypeError(`ClipboardAccess.writeText error: 'activeWindow' is not a Window or WindowProxy.`);
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
      else if (activeWindow?.document?.execCommand instanceof Function)
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
 * Provides cross window checks for DOM elements, events, and essential duck typing for any class based object with a
 * constructor name. The impetus is that certain browsers such as Chrome and Firefox behave differently when
 * performing `instanceof` checks when elements are moved between browser windows. With Firefox in particular the
 * entire JS runtime can not use `instanceof` checks as the instances of fundamental DOM elements differ between
 * windows.
 *
 * TRL supports moving applications from a main central browser window and popping them out into separate standalone
 * app instances in a separate browser window. In this case for essential DOM element and event checks it's necessary to
 * employ the workarounds found in `CrossWindowCheck`.
 */
class CrossWindowCheck
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

   // Collection typing ----------------------------------------------------------------------------------------------

   /**
    * Provides basic prototype string type checking if `map` is a Map.
    *
    * @param {unknown}  map - A potential Map to test.
    *
    * @returns {boolean} Is `map` a Map.
    */
   static isMap(map)
   {
      return isObject(map) && Object.prototype.toString.call(map) === '[object Map]';
   }

   /**
    * Provides basic prototype string type checking if `element` is an Element.
    *
    * @param {unknown}  set - A potential Set to test.
    *
    * @returns {boolean} Is `set` a Set.
    */
   static isSet(set)
   {
      return isObject(set) && Object.prototype.toString.call(set) === '[object Set]';
   }

   // DOM Element typing ---------------------------------------------------------------------------------------------

   /**
    * Provides precise type checking if `element` is an Element.
    *
    * @param {unknown}  element - A potential Element to test.
    *
    * @returns {boolean} Is `element` an Element.
    */
   static isElement(element)
   {
      if (element?.nodeType !== 1) { return false; }

      if (element instanceof this.#Element) { return true; }

      const OwnerElement = element?.ownerDocument?.defaultView?.Element;

      return OwnerElement && element instanceof OwnerElement;
   }

   /**
    * Provides precise type checking if `element` is a HTMLElement.
    *
    * @param {unknown}  element - A potential HTMLElement to test.
    *
    * @returns {boolean} Is `element` an HTMLElement.
    */
   static isHTMLElement(element)
   {
      if (element?.nodeType !== 1) { return false; }

      if (element instanceof this.#HTMLElement) { return true; }

      const OwnerHTMLElement = element?.ownerDocument?.defaultView?.HTMLElement;

      return OwnerHTMLElement && element instanceof OwnerHTMLElement;
   }

   /**
    * Provides precise type checking if `element` is a Node.
    *
    * @param {unknown}  node - A potential Node to test.
    *
    * @returns {boolean} Is `node` a DOM Node.
    */
   static isNode(node)
   {
      if (typeof node?.nodeType !== 'number') { return false; }

      if (node instanceof this.#Node) { return true; }

      const OwnerNode = node?.ownerDocument?.defaultView?.Node;

      return OwnerNode && node instanceof OwnerNode;
   }

   /**
    * Provides precise type checking if `element` is a SVGElement.
    *
    * @param {unknown}  element - A potential SVGElement to test.
    *
    * @returns {boolean} Is `element` an SVGElement.
    */
   static isSVGElement(element)
   {
      if (element?.nodeType !== 1) { return false; }

      if (element instanceof this.#SVGElement) { return true; }

      const OwnerSVGElement = element?.ownerDocument?.defaultView?.SVGElement;

      return OwnerSVGElement && element instanceof OwnerSVGElement;
   }

   // Generic typing -------------------------------------------------------------------------------------------------

   /**
    * Provides basic type checking by constructor name(s) for objects. This can be useful when checking multiple
    * constructor names against a provided Set.
    *
    * @param {unknown}  object - Object to test for constructor name.
    *
    * @param {string | Set<string>} types Specific constructor name or Set of constructor names to match.
    *
    * @returns {boolean} Does the provided object constructor name match the types provided.
    */
   static isCtorName(object, types)
   {
      if (!isObject(object)) { return false; }

      if (typeof types === 'string' && object?.constructor?.name === types) { return true; }

      return !!types?.has(object?.constructor?.name);
   }

   /**
    * Provides basic duck type checking for `Event` signature and optional constructor name(s).
    *
    * @param {unknown}  event - A potential DOM event to test.
    *
    * @param {string | Set<string>} [types] Specific constructor name or Set of constructor names to match.
    *
    * @returns {boolean} Is `event` an Event with optional constructor name check.
    */
   static isEvent(event, types)
   {
      if (typeof event?.type !== 'string' || typeof event?.defaultPrevented !== 'boolean' ||
       typeof event?.stopPropagation !== 'function')
      {
         return false;
      }

      return types !== void 0 ? this.isCtorName(event, types) : true;
   }

   /**
    * Provides basic duck type checking for `Event` signature for standard input events including `KeyboardEvent`,
    * `MouseEvent`, and `PointerEvent`. This method is useful when constructing a Set for constructor name testing is
    * not convenient.
    *
    * @param {unknown}  event - A potential DOM event to test.
    *
    * @returns {boolean} Is `event` a Keyboard, MouseEvent, or PointerEvent.
    */
   static isInputEvent(event)
   {
      return this.isEvent(event, this.#InputEventSet);
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
      if (url instanceof URL) { return url; }

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

export { BrowserSupports, ClipboardAccess, CrossWindowCheck, URLParser };
//# sourceMappingURL=index.js.map
