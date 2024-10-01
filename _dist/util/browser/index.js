import { isObject, isIterable, safeAccess } from '@typhonjs-svelte/runtime-base/util/object';

function isSpace(character) {
    return character == " " || character == "\n" || character == "\r" || character == "\t";
}
function isQuote(character) {
    return character == '"' || character == "'";
}
const TAG_START = "<";
const TAG_END = ">";
const ENCODED_TAG_START = "&lt;";
const ENCODED_TAG_END = "&gt;";
class InPlaintextState {
    constructor(options) {
        this.options = options;
    }
    consume(character, transition) {
        if (character == TAG_START) {
            transition(new InTagNameState(this.options));
            return "";
        }
        else if (character == TAG_END && this.options.encodePlaintextTagDelimiters) {
            return ENCODED_TAG_END;
        }
        return character;
    }
}
class InTagNameState {
    constructor(options) {
        this.options = options;
        this.nameBuffer = "";
        this.isClosingTag = false;
    }
    consume(character, transition) {
        if (this.nameBuffer.length == 0) {
            if (isSpace(character)) {
                transition(new InPlaintextState(this.options));
                return ((this.options.encodePlaintextTagDelimiters ? ENCODED_TAG_START : "<") +
                    character);
            }
            if (character == "/") {
                this.isClosingTag = true;
                return "";
            }
        }
        if (isSpace(character)) {
            if (this.isNameBufferAnAllowedTag()) {
                transition(new InTagState(0 /* TagMode.Allowed */, this.options));
                return TAG_START + (this.isClosingTag ? "/" : "") + this.nameBuffer + character;
            }
            else {
                transition(new InTagState(1 /* TagMode.Disallowed */, this.options));
                return this.options.tagReplacementText;
            }
        }
        if (character == TAG_START) {
            this.nameBuffer += ENCODED_TAG_START;
            return "";
        }
        if (character == TAG_END) {
            transition(new InPlaintextState(this.options));
            if (this.isNameBufferAnAllowedTag()) {
                return TAG_START + (this.isClosingTag ? "/" : "") + this.nameBuffer + character;
            }
            else {
                return this.options.tagReplacementText;
            }
        }
        if (character == "-" && this.nameBuffer == "!-") {
            transition(new InCommentState(this.options));
            return "";
        }
        this.nameBuffer += character;
        return "";
    }
    isNameBufferAnAllowedTag() {
        const tagName = this.nameBuffer.toLowerCase();
        if (this.options.allowedTags) {
            return this.options.allowedTags.has(tagName);
        }
        else if (this.options.disallowedTags) {
            return !this.options.disallowedTags.has(tagName);
        }
        else {
            return false;
        }
    }
}
class InTagState {
    constructor(mode, options) {
        this.mode = mode;
        this.options = options;
    }
    consume(character, transition) {
        if (character == TAG_END) {
            transition(new InPlaintextState(this.options));
        }
        else if (isQuote(character)) {
            transition(new InQuotedStringInTagState(this.mode, character, this.options));
        }
        if (this.mode == 1 /* TagMode.Disallowed */) {
            return "";
        }
        if (character == TAG_START) {
            return ENCODED_TAG_START;
        }
        else {
            return character;
        }
    }
}
class InQuotedStringInTagState {
    constructor(mode, quoteCharacter, options) {
        this.mode = mode;
        this.quoteCharacter = quoteCharacter;
        this.options = options;
    }
    consume(character, transition) {
        if (character == this.quoteCharacter) {
            transition(new InTagState(this.mode, this.options));
        }
        if (this.mode == 1 /* TagMode.Disallowed */) {
            return "";
        }
        if (character == TAG_START) {
            return ENCODED_TAG_START;
        }
        else if (character == TAG_END) {
            return ENCODED_TAG_END;
        }
        else {
            return character;
        }
    }
}
class InCommentState {
    constructor(options) {
        this.options = options;
        this.consecutiveHyphens = 0;
    }
    consume(character, transition) {
        if (character == ">" && this.consecutiveHyphens >= 2) {
            transition(new InPlaintextState(this.options));
        }
        else if (character == "-") {
            this.consecutiveHyphens++;
        }
        else {
            this.consecutiveHyphens = 0;
        }
        return "";
    }
}

const DefaultStateMachineOptions = {
    tagReplacementText: "",
    encodePlaintextTagDelimiters: true,
};
class StateMachine {
    constructor(partialOptions = {}) {
        this.state = new InPlaintextState(Object.assign(Object.assign({}, DefaultStateMachineOptions), partialOptions));
        this.transitionFunction = ((next) => {
            this.state = next;
        }).bind(this);
    }
    consume(text) {
        let outputBuffer = "";
        for (const character of text) {
            outputBuffer += this.state.consume(character, this.transitionFunction);
        }
        return outputBuffer;
    }
}
function striptags(text, options = {}) {
    return new StateMachine(options).consume(text);
}

/**
 * Processes the given HTML by creating by running a CSS selector query with all matched elements being passed through
 * the provided `process` function.
 *
 * @param {object}                  opts - Options
 *
 * @param {string}                  opts.html - The HTML to process.
 *
 * @param {(HTMLElement) => void}   opts.process - The selected element processing function.
 *
 * @param {string}                  opts.selector - The CSS selector query.
 *
 * @param {string}                  [opts.containerElement='div'] - Use a specific container element.
 *
 * @param {boolean}                 [opts.firstMatchOnly=false] - When true `querySelector` is invoked to process the
 *        first matching element only.
 *
 * @param {string}                  [opts.namespaceURI] - The namespace URI of the elements to select.
 *
 * @returns {string} The processed HTML.
 */
function processHTML({ html, process, selector, containerElement = 'div', firstMatchOnly = false, namespaceURI })
{
   if (typeof html !== 'string') { throw new TypeError(`processHTML error: 'html' is not a string.`); }
   if (typeof process !== 'function') { throw new TypeError(`processHTML error: 'process' is not a function.`); }
   if (typeof selector !== 'string') { throw new TypeError(`processHTML error: 'selector' is not a string.`); }

   if (typeof containerElement !== 'string')
   {
      throw new TypeError(`processHTML error: 'containerElement' is not a string.`);
   }

   if (typeof firstMatchOnly !== 'boolean')
   {
      throw new TypeError(`processHTML error: 'firstMatchOnly' is not a boolean.`);
   }

   if (namespaceURI !== void 0 && typeof namespaceURI !== 'string')
   {
      throw new TypeError(`processHTML error: 'namespaceURI' is not a string.`);
   }

   const resolveSelector = namespaceURI ? `${namespaceURI}|${selector}` : selector;

   const container = document.createElement(containerElement);
   container.innerHTML = html;

   if (firstMatchOnly)
   {
      const element = container.querySelector(resolveSelector);
      if (element) { process(element); }
   }
   else
   {
      const elements = container.querySelectorAll(resolveSelector);
      if (elements)
      {
         for (const element of elements) { process(element); }
      }
   }

   return container.innerHTML;
}

/**
 * Provides resources for parsing style strings.
 */
class StyleParse
{
   static #regexPixels = /(\d+)\s*px/;

   /**
    * Parses a pixel string / computed styles. Ex. `100px` returns `100`.
    *
    * @param {string}   value - Value to parse.
    *
    * @returns {number|undefined} The integer component of a pixel string.
    */
   static pixels(value)
   {
      if (typeof value !== 'string') { return void 0; }

      const isPixels = this.#regexPixels.test(value);
      const number = parseInt(value);

      return isPixels && Number.isFinite(number) ? number : void 0;
   }

   /**
    * Returns the pixel value for `1rem` based on the root document element. You may apply an optional multiplier.
    *
    * @param {number} [multiplier=1] - Optional multiplier to apply to `rem` pixel value; default: 1.
    *
    * @param {object} [options] - Optional parameters.
    *
    * @param {Document} [options.targetDocument=document] The target DOM {@link Document} if different from the main
    *        browser global `document`.
    *
    * @returns {number} The pixel value for `1rem` with or without a multiplier based on the root document element.
    */
   static remPixels(multiplier = 1, { targetDocument = document } = {})
   {
      return targetDocument?.documentElement ?
       multiplier * parseFloat(globalThis.getComputedStyle(targetDocument.documentElement).fontSize) : void 0;
   }
}

/**
 * Provides a managed dynamic style sheet / element useful in configuring global CSS variables. When creating an
 * instance of TJSStyleManager you must provide a "document key" / string for the style element added. The style element
 * can be accessed via `document[docKey]`.
 *
 * Instances of TJSStyleManager can also be versioned by supplying a positive integer greater than or equal to `1` via
 * the 'version' option. This version number is assigned to the associated style element. When a TJSStyleManager
 * instance is created and there is an existing instance with a version that is lower than the current instance all CSS
 * rules are removed letting the higher version to take precedence. This isn't a perfect system and requires thoughtful
 * construction of CSS variables exposed, but allows multiple independently compiled TRL packages to load the latest
 * CSS variables. It is recommended to always set `overwrite` option of {@link TJSStyleManager.setProperty} and
 * {@link TJSStyleManager.setProperties} to `false` when loading initial values.
 */
class TJSStyleManager
{
   /** @type {CSSStyleRule} */
   #cssRule;

   /** @type {string} */
   #docKey;

   /** @type {string} */
   #selector;

   /** @type {HTMLStyleElement} */
   #styleElement;

   /** @type {number} */
   #version;

   /**
    *
    * @param {object}   opts - Options.
    *
    * @param {string}   opts.docKey - Required key providing a link to a specific style sheet element.
    *
    * @param {string}   [opts.selector=:root] - Selector element.
    *
    * @param {Document} [opts.document] - Target document to load styles into.
    *
    * @param {number}   [opts.version] - An integer representing the version / level of styles being managed.
    */
   constructor({ docKey, selector = ':root', document = globalThis.document, version } = {})
   {
      if (typeof docKey !== 'string') { throw new TypeError(`StyleManager error: 'docKey' is not a string.`); }

      if (Object.prototype.toString.call(document) !== '[object HTMLDocument]')
      {
         throw new TypeError(`TJSStyleManager error: 'document' is not an instance of HTMLDocument.`);
      }

      if (typeof selector !== 'string') { throw new TypeError(`StyleManager error: 'selector' is not a string.`); }

      if (version !== void 0 && !Number.isSafeInteger(version) && version < 1)
      {
         throw new TypeError(`StyleManager error: 'version' is defined and is not a positive integer >= 1.`);
      }

      this.#selector = selector;
      this.#docKey = docKey;
      this.#version = version;

      if (document[this.#docKey] === void 0)
      {
         this.#styleElement = document.createElement('style');

         document.head.append(this.#styleElement);

         // Set initial style manager version if any supplied.
         this.#styleElement._STYLE_MANAGER_VERSION = version;

         this.#styleElement.sheet.insertRule(`${selector} {}`, 0);

         this.#cssRule = this.#styleElement.sheet.cssRules[0];

         document[docKey] = this.#styleElement;
      }
      else
      {
         this.#styleElement = document[docKey];
         this.#cssRule = this.#styleElement.sheet.cssRules[0];

         if (version)
         {
            const existingVersion = this.#styleElement._STYLE_MANAGER_VERSION ?? 0;

            // Remove all existing CSS rules / text if version is greater than existing version.
            if (version > existingVersion)
            {
               this.#cssRule.style.cssText = '';
            }
         }
      }
   }

   /**
    * @returns {string} Provides an accessor to get the `cssText` for the style sheet.
    */
   get cssText()
   {
      return this.#cssRule.style.cssText;
   }

   /**
    * @returns {number} Returns the version of this instance.
    */
   get version()
   {
      return this.#version;
   }

   /**
    * Provides a copy constructor to duplicate an existing TJSStyleManager instance into a new document.
    *
    * Note: This is used to support the `PopOut` module.
    *
    * @param {Document} [document] Target browser document to clone into.
    *
    * @returns {TJSStyleManager} New style manager instance.
    */
   clone(document = globalThis.document)
   {
      const newStyleManager = new TJSStyleManager({
         selector: this.#selector,
         docKey: this.#docKey,
         document,
         version: this.#version
      });

      newStyleManager.#cssRule.style.cssText = this.#cssRule.style.cssText;

      return newStyleManager;
   }

   get()
   {
      const cssText = this.#cssRule.style.cssText;

      const result = {};

      if (cssText !== '')
      {
         for (const entry of cssText.split(';'))
         {
            if (entry !== '')
            {
               const values = entry.split(':');
               result[values[0].trim()] = values[1];
            }
         }
      }

      return result;
   }

   /**
    * Gets a particular CSS variable.
    *
    * @param {string}   key - CSS variable property key.
    *
    * @returns {string} Returns CSS variable value.
    */
   getProperty(key)
   {
      if (typeof key !== 'string') { throw new TypeError(`StyleManager error: 'key' is not a string.`); }

      return this.#cssRule.style.getPropertyValue(key);
   }

   /**
    * Set rules by property / value; useful for CSS variables.
    *
    * @param {{ [key: string]: string }}  rules - An object with property / value string pairs to load.
    *
    * @param {boolean}                 [overwrite=true] - When true overwrites any existing values.
    */
   setProperties(rules, overwrite = true)
   {
      if (!isObject(rules)) { throw new TypeError(`StyleManager error: 'rules' is not an object.`); }

      if (typeof overwrite !== 'boolean') { throw new TypeError(`StyleManager error: 'overwrite' is not a boolean.`); }

      if (overwrite)
      {
         for (const [key, value] of Object.entries(rules))
         {
            this.#cssRule.style.setProperty(key, value);
         }
      }
      else
      {
         // Only set property keys for entries that don't have an existing rule set.
         for (const [key, value] of Object.entries(rules))
         {
            if (this.#cssRule.style.getPropertyValue(key) === '')
            {
               this.#cssRule.style.setProperty(key, value);
            }
         }
      }
   }

   /**
    * Sets a particular property.
    *
    * @param {string}   key - CSS variable property key.
    *
    * @param {string}   value - CSS variable value.
    *
    * @param {boolean}  [overwrite=true] - Overwrite any existing value.
    */
   setProperty(key, value, overwrite = true)
   {
      if (typeof key !== 'string') { throw new TypeError(`StyleManager error: 'key' is not a string.`); }

      if (typeof value !== 'string') { throw new TypeError(`StyleManager error: 'value' is not a string.`); }

      if (typeof overwrite !== 'boolean') { throw new TypeError(`StyleManager error: 'overwrite' is not a boolean.`); }

      if (overwrite)
      {
         this.#cssRule.style.setProperty(key, value);
      }
      else
      {
         if (this.#cssRule.style.getPropertyValue(key) === '')
         {
            this.#cssRule.style.setProperty(key, value);
         }
      }
   }

   /**
    * Removes the property keys specified. If `keys` is an iterable list then all property keys in the list are removed.
    *
    * @param {Iterable<string>} keys - The property keys to remove.
    */
   removeProperties(keys)
   {
      if (!isIterable(keys)) { throw new TypeError(`StyleManager error: 'keys' is not an iterable list.`); }

      for (const key of keys)
      {
         if (typeof key === 'string') { this.#cssRule.style.removeProperty(key); }
      }
   }

   /**
    * Removes a particular CSS variable.
    *
    * @param {string}   key - CSS variable property key.
    *
    * @returns {string} CSS variable value when removed.
    */
   removeProperty(key)
   {
      if (typeof key !== 'string') { throw new TypeError(`StyleManager error: 'key' is not a string.`); }

      return this.#cssRule.style.removeProperty(key);
   }
}

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
 * Provides utility functions for retrieving data about images.
 */
class ImageData
{
   /**
    * Loads given URLs into image elements returning those that resolved with width & height dimensions. This is useful
    * when the size of an image is necessary before usage.
    *
    * @param {string | { url?: string } | Iterable<string | { url?: string }>} urls - A list of image URLS to load or
    *        object with an `url` property.
    *
    * @param {object} [options] - Optional options.
    *
    * @param {string} [options.accessor='url'] - Accessor string to access child attribute when `urls` entry contains
    *        objects.
    *
    * @param {boolean} [options.warn=false] - Log debug warnings when a target URL can not be determined; default: false.
    *
    * @returns {(Promise<{
    *    fulfilled: { url: string, width: number, height: number }[],
    *    rejected: { url: string }[]
    * }>)} An object with `fulfilled` and `rejected` requests.
    */
   static async getDimensions(urls, { accessor = 'url', warn = false } = {})
   {
      const promises = [];
      const fulfilled = [];
      const rejected = [];

      const targetURLs = isIterable(urls) ? urls : [urls];

      for (const url of targetURLs)
      {
         let targetURL;

         if (typeof url === 'string')
         {
            targetURL = url;
         }
         else if (isObject(url))
         {
            targetURL = safeAccess(url, accessor);
         }

         if (typeof targetURL !== 'string')
         {
            if (warn)
            {
               console.warn('ImageData.getDimensions warning: Failed to locate target URL.');
            }

            continue;
         }

         promises.push(new Promise((resolve, reject) =>
         {
            const img = new Image();
            img.src = targetURL;

            // Get the actual width / height of the image.
            img.onload = () => resolve({ url: targetURL, width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => reject({ url: targetURL });
         }));
      }

      const promiseResults = await Promise.allSettled(promises);

      for (const result of promiseResults)
      {
         switch (result.status)
         {
            case 'fulfilled':
               fulfilled.push(result.value);
               break;

            case 'rejected':
               rejected.push(result.reason);
               break;
         }
      }

      return { fulfilled, rejected };
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

export { BrowserSupports, ClipboardAccess, ImageData, StyleParse, TJSStyleManager, URLParser, processHTML, striptags };
//# sourceMappingURL=index.js.map
