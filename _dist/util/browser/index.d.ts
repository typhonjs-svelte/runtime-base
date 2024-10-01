interface StateMachineOptions {
  readonly allowedTags?: Set<string>;
  readonly disallowedTags?: Set<string>;
  readonly tagReplacementText: string;
  readonly encodePlaintextTagDelimiters: boolean;
}
declare function striptags(text: string, options?: Partial<StateMachineOptions>): string;

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
declare function processHTML({
  html,
  process,
  selector,
  containerElement,
  firstMatchOnly,
  namespaceURI,
}: {
  html: string;
  process: (HTMLElement: any) => void;
  selector: string;
  containerElement?: string;
  firstMatchOnly?: boolean;
  namespaceURI?: string;
}): string;

/**
 * Provides resources for parsing style strings.
 */
declare class StyleParse {
  /**
   * Parses a pixel string / computed styles. Ex. `100px` returns `100`.
   *
   * @param {string}   value - Value to parse.
   *
   * @returns {number|undefined} The integer component of a pixel string.
   */
  static pixels(value: string): number | undefined;
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
  static remPixels(
    multiplier?: number,
    {
      targetDocument,
    }?: {
      targetDocument?: Document;
    },
  ): number;
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
declare class TJSStyleManager {
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
  constructor({
    docKey,
    selector,
    document,
    version,
  }?: {
    docKey: string;
    selector?: string;
    document?: Document;
    version?: number;
  });
  /**
   * @returns {string} Provides an accessor to get the `cssText` for the style sheet.
   */
  get cssText(): string;
  /**
   * @returns {number} Returns the version of this instance.
   */
  get version(): number;
  /**
   * Provides a copy constructor to duplicate an existing TJSStyleManager instance into a new document.
   *
   * Note: This is used to support the `PopOut` module.
   *
   * @param {Document} [document] Target browser document to clone into.
   *
   * @returns {TJSStyleManager} New style manager instance.
   */
  clone(document?: Document): TJSStyleManager;
  get(): {};
  /**
   * Gets a particular CSS variable.
   *
   * @param {string}   key - CSS variable property key.
   *
   * @returns {string} Returns CSS variable value.
   */
  getProperty(key: string): string;
  /**
   * Set rules by property / value; useful for CSS variables.
   *
   * @param {{ [key: string]: string }}  rules - An object with property / value string pairs to load.
   *
   * @param {boolean}                 [overwrite=true] - When true overwrites any existing values.
   */
  setProperties(
    rules: {
      [key: string]: string;
    },
    overwrite?: boolean,
  ): void;
  /**
   * Sets a particular property.
   *
   * @param {string}   key - CSS variable property key.
   *
   * @param {string}   value - CSS variable value.
   *
   * @param {boolean}  [overwrite=true] - Overwrite any existing value.
   */
  setProperty(key: string, value: string, overwrite?: boolean): void;
  /**
   * Removes the property keys specified. If `keys` is an iterable list then all property keys in the list are removed.
   *
   * @param {Iterable<string>} keys - The property keys to remove.
   */
  removeProperties(keys: Iterable<string>): void;
  /**
   * Removes a particular CSS variable.
   *
   * @param {string}   key - CSS variable property key.
   *
   * @returns {string} CSS variable value when removed.
   */
  removeProperty(key: string): string;
  #private;
}

/**
 * Provides utility methods for checking browser capabilities.
 *
 * @see https://kilianvalkhof.com/2021/web/detecting-media-query-support-in-css-and-javascript/
 * TODO: perhaps add support for various standard media query checks for level 4 & 5.
 */
declare class BrowserSupports {
  /**
   * Check for container query support.
   *
   * @returns {boolean} True if container queries supported.
   */
  static get containerQueries(): boolean;
}

/**
 * Provides access to the Clipboard API for reading / writing text strings. This requires a secure context.
 *
 * Note: `writeText` will attempt to use the older `execCommand` if available when `navigator.clipboard` is not
 * available.
 */
declare class ClipboardAccess {
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
  static readText(activeWindow?: Window): Promise<string | undefined>;
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
  static writeText(text: string, activeWindow?: Window): Promise<boolean>;
}

/**
 * Provides utility functions for retrieving data about images.
 */
declare class ImageData {
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
  static getDimensions(
    urls:
      | string
      | {
          url?: string;
        }
      | Iterable<
          | string
          | {
              url?: string;
            }
        >,
    {
      accessor,
      warn,
    }?: {
      accessor?: string;
      warn?: boolean;
    },
  ): Promise<{
    fulfilled: {
      url: string;
      width: number;
      height: number;
    }[];
    rejected: {
      url: string;
    }[];
  }>;
}

/**
 * Provides a utility function to parse / construct fully qualified URL instances from a URL string.
 */
declare class URLParser {
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
  static parse({ url, base, routePrefix }: { url: string | URL; base?: string; routePrefix?: string }): URL | null;
}

export { BrowserSupports, ClipboardAccess, ImageData, StyleParse, TJSStyleManager, URLParser, processHTML, striptags };
