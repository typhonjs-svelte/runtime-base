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
 * employ the workarounds found in `CrossWindow`.
 */
declare class CrossWindow {
  /**
   * Provides basic prototype string type checking if `target` is a Document.
   *
   * @param {unknown}  target - A potential Document to test.
   *
   * @returns {boolean} Is `target` a Document.
   */
  static isDocument(target: unknown): boolean;
  /**
   * Provides basic prototype string type checking if `target` is a Map.
   *
   * @param {unknown}  target - A potential Map to test.
   *
   * @returns {boolean} Is `target` a Map.
   */
  static isMap(target: unknown): boolean;
  /**
   * Provides basic prototype string type checking if `target` is a Set.
   *
   * @param {unknown}  target - A potential Set to test.
   *
   * @returns {boolean} Is `target` a Set.
   */
  static isSet(target: unknown): boolean;
  /**
   * Provides basic prototype string type checking if `target` is a URL.
   *
   * @param {unknown}  target - A potential URL to test.
   *
   * @returns {boolean} Is `target` a URL.
   */
  static isURL(target: unknown): boolean;
  /**
   * Provides basic prototype string type checking if `target` is a Window.
   *
   * @param {unknown}  target - A potential Window to test.
   *
   * @returns {boolean} Is `target` a Window.
   */
  static isWindow(target: unknown): boolean;
  /**
   * Convenience method to retrieve the `document.activeElement` value in the current Window context of a DOM Node /
   * Element, EventTarget, Document, or Window.
   *
   * @param {Document | EventTarget | Node | Window}  target - DOM Node / Element, EventTarget, Document, or Window to
   *        query.
   *
   * @returns {Element | null} Active element.
   */
  static getActiveElement(target: Document | EventTarget | Node | Window): Element | null;
  /**
   * Convenience method to retrieve the `Document` value in the current context of a DOM Node / Element, EventTarget,
   * Document, or Window.
   *
   * @param {Document | EventTarget | Node | Window}  target - DOM Node / Element, EventTarget, Document, or Window to
   *        query.
   *
   * @returns {Document} Active document.
   */
  static getDocument(target: Document | EventTarget | Node | Window): Document;
  /**
   * Convenience method to retrieve the `Window` value in the current context of a DOM Node / Element, EventTarget,
   * Document, or Window.
   *
   * @param {Document | EventTarget | Node | Window}  target - DOM Node / Element, EventTarget, Document, or Window to
   *        query.
   *
   * @returns {Window} Active window.
   */
  static getWindow(target: Document | EventTarget | Node | Window): Window;
  /**
   * Provides precise type checking if `target` is an Element.
   *
   * @param {unknown}  target - A potential Element to test.
   *
   * @returns {boolean} Is `target` an Element.
   */
  static isElement(target: unknown): boolean;
  /**
   * Provides precise type checking if `target` is a HTMLElement.
   *
   * @param {unknown}  target - A potential HTMLElement to test.
   *
   * @returns {boolean} Is `target` an HTMLElement.
   */
  static isHTMLElement(target: unknown): boolean;
  /**
   * Provides precise type checking if `target` is a Node.
   *
   * @param {unknown}  target - A potential Node to test.
   *
   * @returns {boolean} Is `target` a DOM Node.
   */
  static isNode(target: unknown): boolean;
  /**
   * Provides precise type checking if `target` is a SVGElement.
   *
   * @param {unknown}  target - A potential SVGElement to test.
   *
   * @returns {boolean} Is `target` an SVGElement.
   */
  static isSVGElement(target: unknown): boolean;
  /**
   * Provides basic duck type checking for `Event` signature and optional constructor name(s).
   *
   * @param {unknown}  target - A potential DOM event to test.
   *
   * @param {string | Set<string>} [types] Specific constructor name or Set of constructor names to match.
   *
   * @returns {boolean} Is `target` an Event with optional constructor name check.
   */
  static isEvent(target: unknown, types?: string | Set<string>): boolean;
  /**
   * Provides basic duck type checking for `Event` signature for standard input events including `KeyboardEvent`,
   * `MouseEvent`, and `PointerEvent`. This method is useful when constructing a Set for constructor name testing is
   * not convenient.
   *
   * @param {unknown}  target - A potential DOM event to test.
   *
   * @returns {boolean} Is `target` a Keyboard, MouseEvent, or PointerEvent.
   */
  static isInputEvent(target: unknown): boolean;
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
  static isCtorName(target: unknown, types: string | Set<string>): boolean;
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

export { BrowserSupports, ClipboardAccess, CrossWindow, URLParser };
