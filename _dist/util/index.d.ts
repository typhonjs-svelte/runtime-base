/**
 * Provides general utilities.
 *
 * @packageDocumentation
 */

/**
 * Provides cross-realm checks for DOM nodes / elements, events, and essential duck typing for any class-based object
 * with a constructor name. A realm is an execution environment with its own global object and intrinsics; values
 * created in different realms do not share prototypes, so checks like `instanceof` can fail across realms. This
 * includes sharing JS code across browser windows.
 *
 * The impetus is that certain browsers such as Chrome and Firefox behave differently when performing `instanceof`
 * checks when elements are moved between browser windows. With Firefox in particular, the entire JS runtime cannot use
 * `instanceof` checks as the instances of fundamental DOM elements differ between windows.
 *
 * TRL supports moving applications from a main central browser window and popping them out into separate standalone
 * app instances in a separate browser window. In this case, for essential DOM element and event checks, it is necessary
 * to employ the workarounds found in `CrossRealm`.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model#realms
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof#instanceof_and_multiple_realms
 * @see https://262.ecma-international.org/#sec-code-realms
 */
declare abstract class CrossRealm {
  #private;
  private constructor();
  /**
   * Convenience method to test if the given target element is the current active element.
   *
   * @param target - Element to test as current active element.
   */
  static isActiveElement(target: Element): boolean;
  /**
   * Convenience method to retrieve the `document.activeElement` value in the current Window context of a DOM Node /
   * Element, EventTarget, Document, or Window.
   *
   * @param target - DOM Node / Element, EventTarget, Document, UIEvent or Window to query.
   *
   * @param [options] - Options.
   *
   * @returns Active element or `undefined` when `throws` option is `false` and the target is invalid.
   *
   * @throws {@link TypeError} Target must be a DOM Node / Element, Document, UIEvent, or Window.
   */
  static getActiveElement(target: CrossRealm.GetTarget, { throws }?: CrossRealm.GetOptions): Element | null | undefined;
  /**
   * Convenience method to retrieve the `Document` value in the current context of a DOM Node / Element, EventTarget,
   * Document, UIEvent, or Window.
   *
   * @param target - DOM Node / Element, EventTarget, Document, UIEvent or Window to query.
   *
   * @param [options] - Options.
   *
   * @returns {Document} Active document or `undefined` when `throws` option is `false` and the target is invalid.
   *
   * @throws {@link TypeError} Target must be a DOM Node / Element, Document, UIEvent, or Window.
   */
  static getDocument(
    target: CrossRealm.GetTarget,
    {
      throws,
    }?: {
      throws?: boolean;
    },
  ): Document | undefined;
  /**
   * Convenience method to retrieve the `Window` value in the current context of a DOM Node / Element, EventTarget,
   * Document, or Window.
   *
   * @param target - DOM Node / Element, EventTarget, Document, UIEvent or Window to query.
   *
   * @param [options] - Options.
   *
   * @returns Active window or `undefined` when `throws` option is `false` and the target is invalid.
   *
   * @throws {@link TypeError} Target must be a DOM Node / Element, Document, UIEvent, or Window.
   */
  static getWindow(
    target: CrossRealm.GetTarget,
    {
      throws,
    }?: {
      throws?: boolean;
    },
  ): Window | undefined;
  /**
   * Provides basic prototype string type checking if `target` is a CSSImportRule.
   *
   * @param target - A potential CSSImportRule to test.
   *
   * @returns Is `target` a CSSImportRule.
   */
  static isCSSImportRule(target: unknown): target is CSSImportRule;
  /**
   * Provides basic prototype string type checking if `target` is a CSSLayerBlockRule.
   *
   * @param target - A potential CSSLayerBlockRule to test.
   *
   * @returns Is `target` a CSSLayerBlockRule.
   */
  static isCSSLayerBlockRule(target: unknown): target is CSSLayerBlockRule;
  /**
   * Provides basic prototype string type checking if `target` is a CSSStyleRule.
   *
   * @param target - A potential CSSStyleRule to test.
   *
   * @returns Is `target` a CSSStyleRule.
   */
  static isCSSStyleRule(target: unknown): target is CSSStyleRule;
  /**
   * Provides basic prototype string type checking if `target` is a CSSStyleSheet.
   *
   * @param target - A potential CSSStyleSheet to test.
   *
   * @returns Is `target` a CSSStyleSheet.
   */
  static isCSSStyleSheet(target: unknown): target is CSSStyleSheet;
  /**
   * Provides basic prototype string type checking if `target` is a Date.
   *
   * @param target - A potential Date to test.
   *
   * @returns Is `target` a Date.
   */
  static isDate(target: unknown): target is Date;
  /**
   * Provides basic prototype string type checking if `target` is a Document.
   *
   * @param target - A potential Document to test.
   *
   * @returns Is `target` a Document.
   */
  static isDocument(target: unknown): target is Document;
  /**
   * Provides basic prototype string type checking if `target` is a Map.
   *
   * @param target - A potential Map to test.
   *
   * @returns Is `target` a Map.
   */
  static isMap(target: unknown): target is Map<unknown, unknown>;
  /**
   * Provides basic prototype string type checking if `target` is a Promise.
   *
   * @param target - A potential Promise to test.
   *
   * @returns Is `target` a Promise.
   */
  static isPromise(target: unknown): target is Promise<unknown>;
  /**
   * Provides basic prototype string type checking if `target` is a RegExp.
   *
   * @param target - A potential RegExp to test.
   *
   * @returns Is `target` a RegExp.
   */
  static isRegExp(target: unknown): target is RegExp;
  /**
   * Provides basic prototype string type checking if `target` is a Set.
   *
   * @param target - A potential Set to test.
   *
   * @returns Is `target` a Set.
   */
  static isSet(target: unknown): target is Set<unknown>;
  /**
   * Provides basic prototype string type checking if `target` is a URL.
   *
   * @param target - A potential URL to test.
   *
   * @returns Is `target` a URL.
   */
  static isURL(target: unknown): target is URL;
  /**
   * Provides basic prototype string type checking if `target` is a Window.
   *
   * @param target - A potential Window to test.
   *
   * @returns Is `target` a Window.
   */
  static isWindow(target: unknown): target is Window;
  /**
   * Ensures that the given target is an `instanceof` all known DOM elements that are focusable. Please note that
   * additional checks are required regarding focusable state; use {@link A11yHelper.isFocusable} for a complete check.
   *
   * @param target - Target to test for `instanceof` focusable HTML element.
   *
   * @returns Is target an `instanceof` a focusable DOM element.
   */
  static isFocusableHTMLElement(target: unknown): boolean;
  /**
   * Provides precise type checking if `target` is a DocumentFragment.
   *
   * @param target - A potential DocumentFragment to test.
   *
   * @returns Is `target` a DocumentFragment.
   */
  static isDocumentFragment(target: unknown): target is DocumentFragment;
  /**
   * Provides precise type checking if `target` is an Element.
   *
   * @param target - A potential Element to test.
   *
   * @returns Is `target` an Element.
   */
  static isElement(target: unknown): target is Element;
  /**
   * Provides precise type checking if `target` is a HTMLAnchorElement.
   *
   * @param target - A potential HTMLAnchorElement to test.
   *
   * @returns Is `target` a HTMLAnchorElement.
   */
  static isHTMLAnchorElement(target: unknown): target is HTMLAnchorElement;
  /**
   * Provides precise type checking if `target` is an HTMLElement.
   *
   * @param target - A potential HTMLElement to test.
   *
   * @returns Is `target` a HTMLElement.
   */
  static isHTMLElement(target: unknown): target is HTMLElement;
  /**
   * Provides precise type checking if `target` is a Node.
   *
   * @param target - A potential Node to test.
   *
   * @returns Is `target` a DOM Node.
   */
  static isNode(target: unknown): target is Node;
  /**
   * Provides precise type checking if `target` is a ShadowRoot.
   *
   * @param target - A potential ShadowRoot to test.
   *
   * @returns Is `target` a ShadowRoot.
   */
  static isShadowRoot(target: unknown): target is ShadowRoot;
  /**
   * Provides precise type checking if `target` is a SVGElement.
   *
   * @param target - A potential SVGElement to test.
   *
   * @returns Is `target` a SVGElement.
   */
  static isSVGElement(target: unknown): target is SVGElement;
  /**
   * Provides basic duck type checking for `Event` signature and optional constructor name(s).
   *
   * @param target - A potential DOM event to test.
   *
   * @param [types] Specific constructor name or Set of constructor names to match.
   *
   * @returns Is `target` an Event with optional constructor name check.
   */
  static isEvent(target: unknown, types: string | Set<string>): target is Event;
  /**
   * Provides basic duck type checking for `Event` signature for standard mouse / pointer events including
   * `MouseEvent` and `PointerEvent`.
   *
   * @param target - A potential DOM event to test.
   *
   * @returns Is `target` a MouseEvent or PointerEvent.
   */
  static isPointerEvent(target: unknown): target is PointerEvent;
  /**
   * Provides basic duck type checking for `Event` signature for all UI events.
   *
   * @param target - A potential DOM event to test.
   *
   * @returns Is `target` a UIEvent.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/UIEvent
   */
  static isUIEvent(target: unknown): target is UIEvent;
  /**
   * Provides basic duck type checking for `Event` signature for standard user input events including `KeyboardEvent`,
   * `MouseEvent`, and `PointerEvent`.
   *
   * @param target - A potential DOM event to test.
   *
   * @returns Is `target` a Keyboard, MouseEvent, or PointerEvent.
   */
  static isUserInputEvent(target: unknown): target is KeyboardEvent | MouseEvent | PointerEvent;
  /**
   * Provides basic type checking by constructor name(s) for objects. This can be useful when checking multiple
   * constructor names against a provided Set.
   *
   * @param target - Object to test for constructor name.
   *
   * @param types Specific constructor name or Set of constructor names to match.
   *
   * @returns Does the provided object constructor name match the types provided.
   */
  static isCtorName(target: unknown, types: string | Set<string>): boolean;
  /**
   * Provides basic duck type checking and error name for {@link DOMException}.
   *
   * @param target - Error to duck type test.
   *
   * @param name - Specific error name.
   *
   * @returns Is target a DOMException matching the error name.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMException#error_names
   */
  static isDOMException(target: unknown, name: string): boolean;
}
declare namespace CrossRealm {
  /**
   * Defines the DOM API targets usable for all `get` methods.
   */
  type GetTarget = Document | EventTarget | Node | UIEvent | Window;
  /**
   * Defines options for all `get` methods.
   */
  interface GetOptions {
    /**
     * When `true` and the target is invalid, throw an exception. If `false` and the target is invalid `undefined`
     * is returned; default: `true`.
     *
     * @defaultValue `true`
     */
    throws?: boolean;
  }
}

/**
 * Provides strictly readonly collections at runtime including {@link ReadonlyMap} and {@link ReadonlySet}.
 *
 * The protection level provided is for accidental modification. A determined caller could still mutate via
 * `Map.prototype.set.call(frozenMap, ...)` or `Set.prototype.add.call(frozenSet, ...)`.
 */
declare abstract class Frozen {
  private constructor();
  /**
   * @param [entries] - Target Map or iterable of [key, value] pairs.
   *
   * @returns A strictly ReadonlyMap.
   */
  static Map<K, V>(entries?: Iterable<[K, V]>): ReadonlyMap<K, V>;
  /**
   * @param [data] - Target Set or iterable list.
   *
   * @returns A strictly ReadonlySet.
   */
  static Set<T>(data?: Iterable<T>): ReadonlySet<T>;
}

/**
 * Provides various utilities for generating hash codes for strings and UUIDs.
 */
declare abstract class Hashing {
  #private;
  private constructor();
  /**
   * Provides a solid string hashing algorithm.
   *
   * Sourced from: https://stackoverflow.com/a/52171480
   *
   * @param str - String to hash.
   *
   * @param [seed=0] - A seed value altering the hash; default value: `0`.
   *
   * @returns Hash code.
   */
  static hashCode(str: string, seed?: number): number;
  /**
   * Validates that the given string is formatted as a UUIDv4 string.
   *
   * @param uuid - UUID string to test.
   *
   * @returns Is UUIDv4 string.
   */
  static isUuidv4(uuid: unknown): uuid is string;
  /**
   * Generates a UUID v4 compliant ID. Please use a complete UUID generation package for guaranteed compliance.
   *
   * This code is an evolution of the `Jed UUID` from the following Gist.
   * https://gist.github.com/jed/982883
   *
   * There is a public domain / free copy license attached to it that is not a standard OSS license...
   * https://gist.github.com/jed/982883#file-license-txt
   *
   * @privateRemarks
   * The code golfing was removed in the implementation below.
   *
   * @returns UUIDv4
   */
  static uuidv4(): string;
}

/**
 * Provides utility functions for strings.
 *
 * This class should not be constructed as it only contains static methods.
 */
declare abstract class Strings {
  #private;
  private constructor();
  /**
   * Escape a given input string prefacing special characters with backslashes for use in a regular expression.
   *
   * @param str - An un-escaped input string.
   *
   * @returns The escaped string suitable for use in a regular expression.
   */
  static escape(str: string): string;
  /**
   * Normalizes a string.
   *
   * @param str - A string to normalize for comparisons.
   *
   * @returns Cleaned string.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
   */
  static normalize(str: string): string;
}

/**
 * Provides timing related higher-order functions.
 */
declare abstract class Timing {
  private constructor();
  /**
   * Wraps a callback in a debounced timeout. Delay execution of the callback function until the function has not been
   * called for the given delay in milliseconds.
   *
   * @param callback - A function to execute once the debounced threshold has been passed.
   *
   * @param delay - An amount of time in milliseconds to delay.
   *
   * @returns A wrapped function that can be called to debounce execution.
   *
   * @example
   * /**
   *  * Debounce the update invocation by 500ms.
   *  *\/
   * const updateDebounced = Timing.debounce(() => doc.update(), 500);
   *
   * // Use the function like:
   * updateDebounced();
   *
   * @example
   * /**
   *  * Debounce the update invocation by 500ms.
   *  *
   *  * \@param {string} value - A value to update.
   *  *\/
   * const updateDebounced = Timing.debounce((value) => doc.update(value), 500);
   *
   * // Use the function like:
   * updateDebounced('new value');
   */
  static debounce<Args extends unknown[] = unknown[]>(
    callback: (...args: Args) => void,
    delay: number,
  ): (...args: Args) => void;
  /**
   * Creates a double click event handler that distinguishes between single and double clicks. Calls the `single`
   * callback on a single click and the `double` callback on a double click. The default double click delay to invoke
   * the `double` callback is 400 milliseconds.
   *
   * @param opts - Optional parameters.
   *
   * @param [opts.single] - Single click callback.
   *
   * @param [opts.double] - Double click callback.
   *
   * @param [opts.delay=400] - Double click delay.
   *
   * @returns The gated double-click handler.
   *
   * @example
   * // Given a button element.
   * button.addEventListener('click', Timing.doubleClick({
   *    single: (event) => console.log('Single click: ', event),
   *    double: (event) => console.log('Double click: ', event)
   * });
   */
  static doubleClick<E extends Event = Event>({
    single,
    double,
    delay,
  }: {
    single: (event: E) => void;
    double: (event: E) => void;
    delay: number;
  }): (event: E) => void;
}

export { CrossRealm, Frozen, Hashing, Strings, Timing };
