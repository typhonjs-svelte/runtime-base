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
declare class CrossWindowCheck {
  /**
   * Provides basic prototype string type checking if `map` is a Map.
   *
   * @param {unknown}  map - A potential Map to test.
   *
   * @returns {boolean} Is `map` a Map.
   */
  static isMap(map: unknown): boolean;
  /**
   * Provides basic prototype string type checking if `element` is an Element.
   *
   * @param {unknown}  set - A potential Set to test.
   *
   * @returns {boolean} Is `set` a Set.
   */
  static isSet(set: unknown): boolean;
  /**
   * Provides precise type checking if `element` is an Element.
   *
   * @param {unknown}  element - A potential Element to test.
   *
   * @returns {boolean} Is `element` an Element.
   */
  static isElement(element: unknown): boolean;
  /**
   * Provides precise type checking if `element` is a HTMLElement.
   *
   * @param {unknown}  element - A potential HTMLElement to test.
   *
   * @returns {boolean} Is `element` an HTMLElement.
   */
  static isHTMLElement(element: unknown): boolean;
  /**
   * Provides precise type checking if `element` is a Node.
   *
   * @param {unknown}  node - A potential Node to test.
   *
   * @returns {boolean} Is `node` a DOM Node.
   */
  static isNode(node: unknown): boolean;
  /**
   * Provides precise type checking if `element` is a SVGElement.
   *
   * @param {unknown}  element - A potential SVGElement to test.
   *
   * @returns {boolean} Is `element` an SVGElement.
   */
  static isSVGElement(element: unknown): boolean;
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
  static isCtorName(object: unknown, types: string | Set<string>): boolean;
  /**
   * Provides basic duck type checking for `Event` signature and optional constructor name(s).
   *
   * @param {unknown}  event - A potential DOM event to test.
   *
   * @param {string | Set<string>} [types] Specific constructor name or Set of constructor names to match.
   *
   * @returns {boolean} Is `event` an Event with optional constructor name check.
   */
  static isEvent(event: unknown, types?: string | Set<string>): boolean;
  /**
   * Provides basic duck type checking for `Event` signature for standard input events including `KeyboardEvent`,
   * `MouseEvent`, and `PointerEvent`. This method is useful when constructing a Set for constructor name testing is
   * not convenient.
   *
   * @param {unknown}  event - A potential DOM event to test.
   *
   * @returns {boolean} Is `event` a Keyboard, MouseEvent, or PointerEvent.
   */
  static isInputEvent(event: unknown): boolean;
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

export { BrowserSupports, ClipboardAccess, CrossWindowCheck, URLParser };
