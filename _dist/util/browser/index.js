import { isObject, isIterable } from '@typhonjs-svelte/runtime-base/util/object';

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
 * Provides several helpful utility methods for accessibility and keyboard navigation.
 */
class A11yHelper
{
   /**
    * Apply focus to the HTMLElement targets in a given A11yFocusSource data object. An iterable list `options.focusEl`
    * can contain HTMLElements or selector strings. If multiple focus targets are provided in a list then the first
    * valid target found will be focused. If focus target is a string then a lookup via `document.querySelector` is
    * performed. In this case you should provide a unique selector for the desired focus target.
    *
    * Note: The body of this method is postponed to the next clock tick to allow any changes in the DOM to occur that
    * might alter focus targets before applying.
    *
    * @param {A11yFocusSource|{ focusSource: A11yFocusSource }}   options - The focus options instance to apply.
    */
   static applyFocusSource(options)
   {
      if (!isObject(options)) { return; }

      // Handle the case of receiving an object with embedded `focusSource`.
      const focusOpts = isObject(options?.focusSource) ? options.focusSource : options;

      setTimeout(() =>
      {
         const debug = typeof focusOpts.debug === 'boolean' ? focusOpts.debug : false;

         if (isIterable(focusOpts.focusEl))
         {
            if (debug)
            {
               console.debug(`A11yHelper.applyFocusSource debug - Attempting to apply focus target: `, focusOpts.focusEl);
            }

            for (const target of focusOpts.focusEl)
            {
               if (target instanceof HTMLElement && target.isConnected)
               {
                  target.focus();
                  if (debug)
                  {
                     console.debug(`A11yHelper.applyFocusSource debug - Applied focus to target: `, target);
                  }
                  break;
               }
               else if (typeof target === 'string')
               {
                  const element = document.querySelector(target);
                  if (element instanceof HTMLElement && element.isConnected)
                  {
                     element.focus();
                     if (debug)
                     {
                        console.debug(`A11yHelper.applyFocusSource debug - Applied focus to target: `, element);
                     }
                     break;
                  }
                  else if (debug)
                  {
                     console.debug(`A11yHelper.applyFocusSource debug - Could not query selector: `, target);
                  }
               }
            }
         }
         else if (debug)
         {
            console.debug(`A11yHelper.applyFocusSource debug - No focus targets defined.`);
         }
      }, 0);
   }

   /**
    * Returns first focusable element within a specified element.
    *
    * @param {HTMLElement|Document} [element=document] - Optional element to start query.
    *
    * @param {object} [options] - Optional parameters.
    *
    * @param {Iterable<string>} [options.ignoreClasses] - Iterable list of classes to ignore elements.
    *
    * @param {Set<HTMLElement>} [options.ignoreElements] - Set of elements to ignore.
    *
    * @returns {HTMLElement} First focusable child element
    */
   static getFirstFocusableElement(element = document, options)
   {
      const focusableElements = this.getFocusableElements(element, options);

      return focusableElements.length > 0 ? focusableElements[0] : void 0;
   }

   /**
    * Returns all focusable elements within a specified element.
    *
    * @param {HTMLElement|Document} [element=document] Optional element to start query.
    *
    * @param {object}            [options] - Optional parameters.
    *
    * @param {boolean}           [options.anchorHref=true] - When true anchors must have an HREF.
    *
    * @param {Iterable<string>}  [options.ignoreClasses] - Iterable list of classes to ignore elements.
    *
    * @param {Set<HTMLElement>}  [options.ignoreElements] - Set of elements to ignore.
    *
    * @param {string}            [options.selectors] - Custom list of focusable selectors for `querySelectorAll`.
    *
    * @returns {Array<HTMLElement>} Child keyboard focusable
    */
   static getFocusableElements(element = document, { anchorHref = true, ignoreClasses, ignoreElements, selectors } = {})
   {
      if (!(element instanceof HTMLElement) && !(element instanceof Document))
      {
         throw new TypeError(`'element' is not a HTMLElement or Document instance.`);
      }

      if (typeof anchorHref !== 'boolean')
      {
         throw new TypeError(`'anchorHref' is not a boolean.`);
      }

      if (ignoreClasses !== void 0 && !isIterable(ignoreClasses))
      {
         throw new TypeError(`'ignoreClasses' is not an iterable list.`);
      }

      if (ignoreElements !== void 0 && !(ignoreElements instanceof Set))
      {
         throw new TypeError(`'ignoreElements' is not a Set.`);
      }

      if (selectors !== void 0 && typeof selectors !== 'string')
      {
         throw new TypeError(`'selectors' is not a string.`);
      }

      const selectorQuery = selectors ?? this.#getFocusableSelectors(anchorHref);

      const allElements = [...element.querySelectorAll(selectorQuery)];

      if (ignoreElements && ignoreClasses)
      {
         return allElements.filter((el) =>
         {
            let hasIgnoreClass = false;
            for (const ignoreClass of ignoreClasses)
            {
               if (el.classList.contains(ignoreClass))
               {
                  hasIgnoreClass = true;
                  break;
               }
            }

            return !hasIgnoreClass && !ignoreElements.has(el) && el.style.display !== 'none' &&
             el.style.visibility !== 'hidden' && !el.hasAttribute('disabled') && !el.hasAttribute('inert') &&
              el.getAttribute('aria-hidden') !== 'true';
         });
      }
      else if (ignoreClasses)
      {
         return allElements.filter((el) =>
         {
            let hasIgnoreClass = false;
            for (const ignoreClass of ignoreClasses)
            {
               if (el.classList.contains(ignoreClass))
               {
                  hasIgnoreClass = true;
                  break;
               }
            }

            return !hasIgnoreClass && el.style.display !== 'none' && el.style.visibility !== 'hidden' &&
             !el.hasAttribute('disabled') && !el.hasAttribute('inert') && el.getAttribute('aria-hidden') !== 'true';
         });
      }
      else if (ignoreElements)
      {
         return allElements.filter((el) =>
         {
            return !ignoreElements.has(el) && el.style.display !== 'none' && el.style.visibility !== 'hidden' &&
             !el.hasAttribute('disabled') && !el.hasAttribute('inert') && el.getAttribute('aria-hidden') !== 'true';
         });
      }
      else
      {
         return allElements.filter((el) =>
         {
            return el.style.display !== 'none' && el.style.visibility !== 'hidden' && !el.hasAttribute('disabled') &&
             !el.hasAttribute('inert') && el.getAttribute('aria-hidden') !== 'true';
         });
      }
   }

   /**
    * Returns the default focusable selectors query.
    *
    * @param {boolean}  [anchorHref=true] - When true anchors must have an HREF.
    *
    * @returns {string} Focusable selectors for `querySelectorAll`.
    */
   static #getFocusableSelectors(anchorHref = true)
   {
      return `button, [contenteditable=""], [contenteditable="true"], details summary:not([tabindex="-1"]), embed, a${
       anchorHref ? '[href]' : ''}, iframe, object, input:not([type=hidden]), select, textarea, ` +
        `[tabindex]:not([tabindex="-1"])`;
   }

   /**
    * Gets a A11yFocusSource object from the given DOM event allowing for optional X / Y screen space overrides.
    * Browsers (Firefox / Chrome) forwards a mouse event for the context menu keyboard button. Provides detection of
    * when the context menu event is from the keyboard. Firefox as of (1/23) does not provide the correct screen space
    * coordinates, so for keyboard context menu presses coordinates are generated from the centroid point of the
    * element.
    *
    * A default fallback element or selector string may be provided to provide the focus target. If the event comes from
    * the keyboard however the source focused element is inserted as the target with the fallback value appended to the
    * list of focus targets. When A11yFocusSource is applied by {@link A11yHelper.applyFocusSource} the target focus
    * list is iterated through until a connected target is found and focus applied.
    *
    * @param {object} options - Options
    *
    * @param {KeyboardEvent|MouseEvent}   [options.event] - The source DOM event.
    *
    * @param {boolean} [options.debug] - When true {@link A11yHelper.applyFocusSource} logs focus target data.
    *
    * @param {HTMLElement|string} [options.focusEl] - A specific HTMLElement or selector string as the focus target.
    *
    * @param {number}   [options.x] - Used when an event isn't provided; integer of event source in screen space.
    *
    * @param {number}   [options.y] - Used when an event isn't provided; integer of event source in screen space.
    *
    * @returns {A11yFocusSource} A A11yFocusSource object.
    *
    * @see https://bugzilla.mozilla.org/show_bug.cgi?id=1426671
    * @see https://bugzilla.mozilla.org/show_bug.cgi?id=314314
    *
    * TODO: Evaluate / test against touch input devices.
    */
   static getFocusSource({ event, x, y, focusEl, debug = false })
   {
      if (focusEl !== void 0 && !(focusEl instanceof HTMLElement) && typeof focusEl !== 'string')
      {
         throw new TypeError(
          `A11yHelper.getFocusSource error: 'focusEl' is not a HTMLElement or string.`);
      }

      if (debug !== void 0 && typeof debug !== 'boolean')
      {
         throw new TypeError(`A11yHelper.getFocusSource error: 'debug' is not a boolean.`);
      }

      // Handle the case when no event is provided and x, y, or focusEl is explicitly defined.
      if (event === void 0)
      {
         if (typeof x !== 'number')
         {
            throw new TypeError(`A11yHelper.getFocusSource error: 'event' not defined and 'x' is not a number.`);
         }

         if (typeof y !== 'number')
         {
            throw new TypeError(`A11yHelper.getFocusSource error: 'event' not defined and 'y' is not a number.`);
         }

         return {
            debug,
            focusEl: focusEl !== void 0 ? [focusEl] : void 0,
            x,
            y,
         };
      }

      if (!(event instanceof KeyboardEvent) && !(event instanceof MouseEvent))
      {
         throw new TypeError(`A11yHelper.getFocusSource error: 'event' is not a KeyboardEvent or MouseEvent.`);
      }

      if (x !== void 0 && !Number.isInteger(x))
      {
         throw new TypeError(`A11yHelper.getFocusSource error: 'x' is not a number.`);
      }

      if (y !== void 0 && !Number.isInteger(y))
      {
         throw new TypeError(`A11yHelper.getFocusSource error: 'y' is not a number.`);
      }

      /** @type {HTMLElement} */
      const targetEl = event.target;

      if (!(targetEl instanceof HTMLElement))
      {
         throw new TypeError(`A11yHelper.getFocusSource error: 'event.target' is not an HTMLElement.`);
      }

      const result = { debug };

      if (event instanceof MouseEvent)
      {
         // Firefox currently (1/23) does not correctly determine the location of a keyboard originated
         // context menu location, so calculate position from middle of the event target.
         // Firefox fires a mouse event for the context menu key.
         if (event?.button !== 2 && event.type === 'contextmenu')
         {
            const rect = targetEl.getBoundingClientRect();
            result.x = x ?? rect.left + (rect.width / 2);
            result.y = y ?? rect.top + (rect.height / 2);
            result.focusEl = focusEl !== void 0 ? [targetEl, focusEl] : [targetEl];
            result.source = 'keyboard';
         }
         else
         {
            result.x = x ?? event.pageX;
            result.y = y ?? event.pageY;
            result.focusEl = focusEl !== void 0 ? [focusEl] : void 0;
         }
      }
      else
      {
         const rect = targetEl.getBoundingClientRect();
         result.x = x ?? rect.left + (rect.width / 2);
         result.y = y ?? rect.top + (rect.height / 2);
         result.focusEl = focusEl !== void 0 ? [targetEl, focusEl] : [targetEl];
         result.source = 'keyboard';
      }

      return result;
   }

   /**
    * Returns first focusable element within a specified element.
    *
    * @param {HTMLElement|Document} [element=document] - Optional element to start query.
    *
    * @param {object} [options] - Optional parameters.
    *
    * @param {Iterable<string>} [options.ignoreClasses] - Iterable list of classes to ignore elements.
    *
    * @param {Set<HTMLElement>} [options.ignoreElements] - Set of elements to ignore.
    *
    * @returns {HTMLElement} First focusable child element
    */
   static getLastFocusableElement(element = document, options)
   {
      const focusableElements = this.getFocusableElements(element, options);

      return focusableElements.length > 0 ? focusableElements[focusableElements.length - 1] : void 0;
   }

   /**
    * Tests if the given element is focusable.
    *
    * @param {HTMLElement} [el] - Element to test.
    *
    * @param {object} [options] - Optional parameters.
    *
    * @param {boolean} [options.anchorHref=true] - When true anchors must have an HREF.
    *
    * @param {Iterable<string>} [options.ignoreClasses] - Iterable list of classes to ignore elements.
    *
    * @returns {boolean} Element is focusable.
    */
   static isFocusable(el, { anchorHref = true, ignoreClasses } = {})
   {
      if (el === void 0 || el === null || !(el instanceof HTMLElement) || el?.hidden || !el?.isConnected)
      {
         return false;
      }

      if (typeof anchorHref !== 'boolean')
      {
         throw new TypeError(`'anchorHref' is not a boolean.`);
      }

      if (ignoreClasses !== void 0 && !isIterable(ignoreClasses))
      {
         throw new TypeError(`'ignoreClasses' is not an iterable list.`);
      }

      const contenteditableAttr = el.getAttribute('contenteditable');
      const contenteditableFocusable = typeof contenteditableAttr === 'string' &&
       (contenteditableAttr === '' || contenteditableAttr === 'true');

      const tabindexAttr = el.getAttribute('tabindex');
      const tabindexFocusable = typeof tabindexAttr === 'string' && tabindexAttr !== '-1';

      const isAnchor = el instanceof HTMLAnchorElement;

      if (contenteditableFocusable || tabindexFocusable || isAnchor || el instanceof HTMLButtonElement ||
       el instanceof HTMLDetailsElement || el instanceof HTMLEmbedElement || el instanceof HTMLIFrameElement ||
        el instanceof HTMLInputElement || el instanceof HTMLObjectElement || el instanceof HTMLSelectElement ||
         el instanceof HTMLTextAreaElement)
      {
         if (isAnchor && anchorHref && typeof el.getAttribute('href') !== 'string')
         {
            return false;
         }

         return el.style.display !== 'none' && el.style.visibility !== 'hidden' && !el.hasAttribute('disabled') &&
          !el.hasAttribute('inert') && el.getAttribute('aria-hidden') !== 'true';
      }

      return false;
   }

   /**
    * Convenience method to check if the given data is a valid focus source.
    *
    * @param {HTMLElement|string}   data - Either an HTMLElement or selector string.
    *
    * @returns {boolean} Is valid focus source.
    */
   static isFocusSource(data)
   {
      return data instanceof HTMLElement || typeof data === 'string';
   }
}

/**
 * @typedef {object} A11yFocusSource - Provides essential data to return focus to an HTMLElement after a series of UI
 * actions like working with context menus and modal dialogs.
 *
 * @property {boolean} [debug] - When true logs to console the actions taken in {@link A11yHelper.applyFocusSource}.
 *
 * @property {Iterable<HTMLElement|string>} [focusEl] - List of targets to attempt to focus.
 *
 * @property {string} [source] - The source of the event: 'keyboard' for instance.
 *
 * @property {number} [x] - Potential X coordinate of initial event.
 *
 * @property {number} [y] - Potential Y coordinate of initial event.
 */

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
    * @returns {Promise<string|undefined>} The current clipboard text or undefined.
    */
   static async readText()
   {
      let result;

      if (globalThis?.navigator?.clipboard)
      {
         try
         {
            result = await globalThis.navigator.clipboard.readText();
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
    * @returns {Promise<boolean>} Copy successful.
    */
   static async writeText(text)
   {
      if (typeof text !== 'string')
      {
         throw new TypeError(`ClipboardAccess.writeText error: 'text' is not a string.`);
      }

      let success = false;

      if (globalThis?.navigator?.clipboard)
      {
         try
         {
            await globalThis.navigator.clipboard.writeText(text);
            success = true;
         }
         catch (err) { /**/ }
      }
      else if (globalThis?.document?.execCommand instanceof Function)
      {
         const textArea = globalThis.document.createElement('textarea');

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

         globalThis.document.body.appendChild(textArea);
         textArea.focus();
         textArea.select();

         try
         {
            success = document.execCommand('copy');
         }
         catch (err) { /**/ }

         document.body.removeChild(textArea);
      }

      return success;
   }
}

/**
 * Recursive function that finds the closest parent stacking context.
 * See also https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context
 *
 * Original author: Kerry Liu / https://github.com/gwwar
 *
 * @see https://github.com/gwwar/z-context/blob/master/content-script.js
 * @see https://github.com/gwwar/z-context/blob/master/LICENSE
 *
 * @param {Element} node -
 *
 * @returns {StackingContext} The closest parent stacking context
 */
function getStackingContext(node)
{
   // the root element (HTML).
   if (!node || node.nodeName === 'HTML')
   {
      return { node: document.documentElement, reason: 'root' };
   }

   // handle shadow root elements.
   if (node.nodeName === '#document-fragment')
   {
      return getStackingContext(node.host);
   }

   const computedStyle = globalThis.getComputedStyle(node);

   // position: fixed or sticky.
   if (computedStyle.position === 'fixed' || computedStyle.position === 'sticky')
   {
      return { node, reason: `position: ${computedStyle.position}` };
   }

   // positioned (absolutely or relatively) with a z-index value other than "auto".
   if (computedStyle.zIndex !== 'auto' && computedStyle.position !== 'static')
   {
      return { node, reason: `position: ${computedStyle.position}; z-index: ${computedStyle.zIndex}` };
   }

   // elements with an opacity value less than 1.
   if (computedStyle.opacity !== '1')
   {
      return { node, reason: `opacity: ${computedStyle.opacity}` };
   }

   // elements with a transform value other than "none".
   if (computedStyle.transform !== 'none')
   {
      return { node, reason: `transform: ${computedStyle.transform}` };
   }

   // elements with a mix-blend-mode value other than "normal".
   if (computedStyle.mixBlendMode !== 'normal')
   {
      return { node, reason: `mixBlendMode: ${computedStyle.mixBlendMode}` };
   }

   // elements with a filter value other than "none".
   if (computedStyle.filter !== 'none')
   {
      return { node, reason: `filter: ${computedStyle.filter}` };
   }

   // elements with a perspective value other than "none".
   if (computedStyle.perspective !== 'none')
   {
      return { node, reason: `perspective: ${computedStyle.perspective}` };
   }

   // elements with a clip-path value other than "none".
   if (computedStyle.clipPath !== 'none')
   {
      return { node, reason: `clip-path: ${computedStyle.clipPath} ` };
   }

   // elements with a mask value other than "none".
   const mask = computedStyle.mask || computedStyle.webkitMask;
   if (mask !== 'none' && mask !== undefined)
   {
      return { node, reason: `mask:  ${mask}` };
   }

   // elements with a mask-image value other than "none".
   const maskImage = computedStyle.maskImage || computedStyle.webkitMaskImage;
   if (maskImage !== 'none' && maskImage !== undefined)
   {
      return { node, reason: `mask-image: ${maskImage}` };
   }

   // elements with a mask-border value other than "none".
   const maskBorder = computedStyle.maskBorder || computedStyle.webkitMaskBorder;
   if (maskBorder !== 'none' && maskBorder !== undefined)
   {
      return { node, reason: `mask-border: ${maskBorder}` };
   }

   // elements with isolation set to "isolate".
   if (computedStyle.isolation === 'isolate')
   {
      return { node, reason: `isolation: ${computedStyle.isolation}` };
   }

   // transform or opacity in will-change even if you don't specify values for these attributes directly.
   if (computedStyle.willChange === 'transform' || computedStyle.willChange === 'opacity')
   {
      return { node, reason: `willChange: ${computedStyle.willChange}` };
   }

   // elements with -webkit-overflow-scrolling set to "touch".
   if (computedStyle.webkitOverflowScrolling === 'touch')
   {
      return { node, reason: '-webkit-overflow-scrolling: touch' };
   }

   // an item with a z-index value other than "auto".
   if (computedStyle.zIndex !== 'auto')
   {
      const parentStyle = globalThis.getComputedStyle(node.parentNode);
      // with a flex|inline-flex parent.
      if (parentStyle.display === 'flex' || parentStyle.display === 'inline-flex')
      {
         return { node, reason: `flex-item; z-index: ${computedStyle.zIndex}` };
         // with a grid parent.
      }
      else if (parentStyle.grid !== 'none / none / none / row / auto / auto')
      {
         return { node, reason: `child of grid container; z-index: ${computedStyle.zIndex}` };
      }
   }

   // contain with a value of layout, or paint, or a composite value that includes either of them
   const contain = computedStyle.contain;
   if (['layout', 'paint', 'strict', 'content'].indexOf(contain) > -1 ||
    contain.indexOf('paint') > -1 ||
    contain.indexOf('layout') > -1
   )
   {
      return { node, reason: `contain: ${contain}` };
   }

   return getStackingContext(node.parentNode);
}

/**
 * @typedef {object} StackingContext
 *
 * @property {Element} node - A DOM Element.
 *
 * @property {string}  reason - Reason for why a stacking context was created.
 */

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

      // TODO: Verify 'document' type from Popout FVTT module. For some reason the popout document trips this
      //  unintentionally.
      // if (!(document instanceof Document))
      // {
      //    throw new TypeError(`TJSStyleManager error: 'document' is not an instance of Document.`);
      // }

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

export { A11yHelper, BrowserSupports, ClipboardAccess, StyleParse, TJSStyleManager, getStackingContext, striptags };
//# sourceMappingURL=index.js.map
