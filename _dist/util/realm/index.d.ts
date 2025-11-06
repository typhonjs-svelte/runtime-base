/**
 * Methods that perform realm-safe checks for DOM elements, browser globals, and Web Platform APIs.
 */
declare abstract class CrossRealmBrowser {
  #private;
  private constructor();
  /**
   * {@link CrossRealmBrowser.API.isActiveElement}
   */
  static isActiveElement(target: Element): boolean;
  /**
   * {@link CrossRealmBrowser.API.getActiveElement}
   */
  static getActiveElement(
    target: CrossRealmBrowser.Options.GetTarget,
    { throws }?: CrossRealmBrowser.Options.GetMethod,
  ): Element | null | undefined;
  /**
   * {@link CrossRealmBrowser.API.getDocument}
   */
  static getDocument(
    target: CrossRealmBrowser.Options.GetTarget,
    { throws }?: CrossRealmBrowser.Options.GetMethod,
  ): Document | undefined;
  /**
   * {@link CrossRealmBrowser.API.getWindow}
   */
  static getWindow(
    target: CrossRealmBrowser.Options.GetTarget,
    { throws }?: CrossRealmBrowser.Options.GetMethod,
  ): Window | undefined;
  /**
   * {@link CrossRealmBrowser.API.isCSSImportRule}
   */
  static isCSSImportRule(target: unknown): target is CSSImportRule;
  /**
   * {@link CrossRealmBrowser.API.isCSSLayerBlockRule}
   */
  static isCSSLayerBlockRule(target: unknown): target is CSSLayerBlockRule;
  /**
   * {@link CrossRealmBrowser.API.isCSSStyleRule}
   */
  static isCSSStyleRule(target: unknown): target is CSSStyleRule;
  /**
   * {@link CrossRealmBrowser.API.isCSSStyleSheet}
   */
  static isCSSStyleSheet(target: unknown): target is CSSStyleSheet;
  /**
   * {@link CrossRealmBrowser.API.isDocument}
   */
  static isDocument(target: unknown): target is Document;
  /**
   * {@link CrossRealmBrowser.API.isURL}
   */
  static isURL(target: unknown): target is URL;
  /**
   * {@link CrossRealmBrowser.API.isWindow}
   */
  static isWindow(target: unknown): target is Window;
  /**
   * {@link CrossRealmBrowser.API.isFocusableHTMLElement}
   */
  static isFocusableHTMLElement(target: unknown): boolean;
  /**
   * {@link CrossRealmBrowser.API.isDocumentFragment}
   */
  static isDocumentFragment(target: unknown): target is DocumentFragment;
  /**
   * {@link CrossRealmBrowser.API.isElement}
   */
  static isElement(target: unknown): target is Element;
  /**
   * {@link CrossRealmBrowser.API.isHTMLAnchorElement}
   */
  static isHTMLAnchorElement(target: unknown): target is HTMLAnchorElement;
  /**
   * {@link CrossRealmBrowser.API.isHTMLElement}
   */
  static isHTMLElement(target: unknown): target is HTMLElement;
  /**
   * {@link CrossRealmBrowser.API.isNode}
   */
  static isNode(target: unknown): target is Node;
  /**
   * {@link CrossRealmBrowser.API.isShadowRoot}
   */
  static isShadowRoot(target: unknown): target is ShadowRoot;
  /**
   * {@link CrossRealmBrowser.API.isSVGElement}
   */
  static isSVGElement(target: unknown): target is SVGElement;
  /**
   * {@link CrossRealmBrowser.API.isEvent}
   */
  static isEvent(target: unknown, types: string | Set<string>): target is Event;
  /**
   * {@link CrossRealmBrowser.API.isPointerEvent}
   */
  static isPointerEvent(target: unknown): target is PointerEvent;
  /**
   * {@link CrossRealmBrowser.API.isUIEvent}
   */
  static isUIEvent(target: unknown): target is UIEvent;
  /**
   * {@link CrossRealmBrowser.API.isUserInputEvent}
   */
  static isUserInputEvent(target: unknown): target is KeyboardEvent | MouseEvent | PointerEvent;
  /**
   * {@link CrossRealmBrowser.API.isDOMException}
   */
  static isDOMException(target: unknown, name: string): boolean;
}
declare namespace CrossRealmBrowser {
  interface API {
    /**
     * Test if the given target element is the current active element.
     *
     * @param target - Element to test as current active element.
     *
     * @returns Whether the given element is the active element.
     */
    isActiveElement(target: Element): boolean;
    /**
     * Get `document.activeElement` value for a given DOM or event target.
     *
     * @param target - DOM Node / Element, EventTarget, Document, UIEvent or Window to query.
     *
     * @param [options] - Options.
     *
     * @returns Active element or `undefined` when `throws` option is `false` and the target is invalid.
     *
     * @throws {@link TypeError} Target must be a DOM Node / Element, Document, UIEvent, or Window.
     */
    getActiveElement(
      target: CrossRealmBrowser.Options.GetTarget,
      options?: CrossRealmBrowser.Options.GetMethod,
    ): Element | null | undefined;
    /**
     * Get the `Document` value in for a given DOM or event target.
     *
     * @param target - DOM Node / Element, EventTarget, Document, UIEvent or Window to query.
     *
     * @param [options] - Options.
     *
     * @returns {Document} Active document or `undefined` when `throws` option is `false` and the target is invalid.
     *
     * @throws {@link TypeError} Target must be a DOM Node / Element, Document, UIEvent, or Window.
     */
    getDocument(
      target: CrossRealmBrowser.Options.GetTarget,
      options?: CrossRealmBrowser.Options.GetMethod,
    ): Document | undefined;
    /**
     * Get the `Window` value for a given DOM or event target.
     *
     * @param target - DOM Node / Element, EventTarget, Document, UIEvent or Window to query.
     *
     * @param [options] - Options.
     *
     * @returns Active window or `undefined` when `throws` option is `false` and the target is invalid.
     *
     * @throws {@link TypeError} Target must be a DOM Node / Element, Document, UIEvent, or Window.
     */
    getWindow(
      target: CrossRealmBrowser.Options.GetTarget,
      options?: CrossRealmBrowser.Options.GetMethod,
    ): Window | undefined;
    /**
     * Provides basic prototype string type checking if `target` is a CSSImportRule.
     *
     * @param target - A potential CSSImportRule to test.
     *
     * @returns Is `target` a CSSImportRule.
     */
    isCSSImportRule(target: unknown): target is CSSImportRule;
    /**
     * Provides basic prototype string type checking if `target` is a CSSLayerBlockRule.
     *
     * @param target - A potential CSSLayerBlockRule to test.
     *
     * @returns Is `target` a CSSLayerBlockRule.
     */
    isCSSLayerBlockRule(target: unknown): target is CSSLayerBlockRule;
    /**
     * Provides basic prototype string type checking if `target` is a CSSStyleRule.
     *
     * @param target - A potential CSSStyleRule to test.
     *
     * @returns Is `target` a CSSStyleRule.
     */
    isCSSStyleRule(target: unknown): target is CSSStyleRule;
    /**
     * Provides basic prototype string type checking if `target` is a CSSStyleSheet.
     *
     * @param target - A potential CSSStyleSheet to test.
     *
     * @returns Is `target` a CSSStyleSheet.
     */
    isCSSStyleSheet(target: unknown): target is CSSStyleSheet;
    /**
     * Provides basic prototype string type checking if `target` is a Document.
     *
     * @param target - A potential Document to test.
     *
     * @returns Is `target` a Document.
     */
    isDocument(target: unknown): target is Document;
    /**
     * Provides basic prototype string type checking if `target` is a URL.
     *
     * @param target - A potential URL to test.
     *
     * @returns Is `target` a URL.
     */
    isURL(target: unknown): target is URL;
    /**
     * Provides basic prototype string type checking if `target` is a Window.
     *
     * @param target - A potential Window to test.
     *
     * @returns Is `target` a Window.
     */
    isWindow(target: unknown): target is Window;
    /**
     * Ensures that the given target is an `instanceof` all known DOM elements that are focusable. Please note that
     * additional checks are required regarding focusable state; use
     * {@link #runtime/util/a11y!A11yHelper.isFocusable} for a complete check.
     *
     * @param target - Target to test for `instanceof` focusable HTML element.
     *
     * @returns Is target an `instanceof` a focusable DOM element.
     */
    isFocusableHTMLElement(target: unknown): boolean;
    /**
     * Provides precise type checking if `target` is a DocumentFragment.
     *
     * @param target - A potential DocumentFragment to test.
     *
     * @returns Is `target` a DocumentFragment.
     */
    isDocumentFragment(target: unknown): target is DocumentFragment;
    /**
     * Provides precise type checking if `target` is an Element.
     *
     * @param target - A potential Element to test.
     *
     * @returns Is `target` an Element.
     */
    isElement(target: unknown): target is Element;
    /**
     * Provides precise type checking if `target` is a HTMLAnchorElement.
     *
     * @param target - A potential HTMLAnchorElement to test.
     *
     * @returns Is `target` a HTMLAnchorElement.
     */
    isHTMLAnchorElement(target: unknown): target is HTMLAnchorElement;
    /**
     * Provides precise type checking if `target` is an HTMLElement.
     *
     * @param target - A potential HTMLElement to test.
     *
     * @returns Is `target` a HTMLElement.
     */
    isHTMLElement(target: unknown): target is HTMLElement;
    /**
     * Provides precise type checking if `target` is a Node.
     *
     * @param target - A potential Node to test.
     *
     * @returns Is `target` a DOM Node.
     */
    isNode(target: unknown): target is Node;
    /**
     * Provides precise type checking if `target` is a ShadowRoot.
     *
     * @param target - A potential ShadowRoot to test.
     *
     * @returns Is `target` a ShadowRoot.
     */
    isShadowRoot(target: unknown): target is ShadowRoot;
    /**
     * Provides precise type checking if `target` is a SVGElement.
     *
     * @param target - A potential SVGElement to test.
     *
     * @returns Is `target` a SVGElement.
     */
    isSVGElement(target: unknown): target is SVGElement;
    /**
     * Provides basic duck type checking for `Event` signature and optional constructor name(s).
     *
     * @param target - A potential DOM event to test.
     *
     * @param [types] Specific constructor name or Set of constructor names to match.
     *
     * @returns Is `target` an Event with optional constructor name check.
     */
    isEvent(target: unknown, types: string | Set<string>): target is Event;
    /**
     * Provides basic duck type checking for `Event` signature for standard mouse / pointer events including
     * `MouseEvent` and `PointerEvent`.
     *
     * @param target - A potential DOM event to test.
     *
     * @returns Is `target` a MouseEvent or PointerEvent.
     */
    isPointerEvent(target: unknown): target is PointerEvent;
    /**
     * Provides basic duck type checking for `Event` signature for all UI events.
     *
     * @param target - A potential DOM event to test.
     *
     * @returns Is `target` a UIEvent.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/UIEvent
     */
    isUIEvent(target: unknown): target is UIEvent;
    /**
     * Provides basic duck type checking for `Event` signature for standard user input events including
     * `KeyboardEvent`, `MouseEvent`, and `PointerEvent`.
     *
     * @param target - A potential DOM event to test.
     *
     * @returns Is `target` a Keyboard, MouseEvent, or PointerEvent.
     */
    isUserInputEvent(target: unknown): target is KeyboardEvent | MouseEvent | PointerEvent;
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
    isDOMException(target: unknown, name: string): boolean;
  }
  namespace Options {
    /**
     * Defines the DOM API targets usable for all `get` methods.
     */
    type GetTarget = Document | EventTarget | Node | UIEvent | Window;
    /**
     * Defines options for all `get` methods.
     */
    interface GetMethod {
      /**
       * When `true` and the target is invalid, throw an exception. If `false` and the target is invalid `undefined`
       * is returned; default: `true`.
       *
       * @defaultValue `true`
       */
      throws?: boolean;
    }
  }
}

/**
 * Methods that perform realm-safe checks for built-in JavaScript types and core ECMAScript language objects.
 */
declare abstract class CrossRealmLanguage {
  private constructor();
  /**
   * {@link CrossRealmLanguage.API.isCtorName}
   */
  static isCtorName(target: unknown, types: string | Set<string>): boolean;
  /**
   * {@link CrossRealmLanguage.API.isDate}
   */
  static isDate(target: unknown): target is Date;
  /**
   * {@link CrossRealmLanguage.API.isMap}
   */
  static isMap(target: unknown): target is Map<unknown, unknown>;
  /**
   * {@link CrossRealmLanguage.API.isPromise}
   */
  static isPromise(target: unknown): target is Promise<unknown>;
  /**
   * {@link CrossRealmLanguage.API.isRegExp}
   */
  static isRegExp(target: unknown): target is RegExp;
  /**
   * {@link CrossRealmLanguage.API.isSet}
   */
  static isSet(target: unknown): target is Set<unknown>;
}
declare namespace CrossRealmLanguage {
  interface API {
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
    isCtorName(target: unknown, types: string | Set<string>): boolean;
    /**
     * Provides basic prototype string type checking if `target` is a Date.
     *
     * @param target - A potential Date to test.
     *
     * @returns Is `target` a Date.
     */
    isDate(target: unknown): target is Date;
    /**
     * Provides basic prototype string type checking if `target` is a Map.
     *
     * @param target - A potential Map to test.
     *
     * @returns Is `target` a Map.
     */
    isMap(target: unknown): target is Map<unknown, unknown>;
    /**
     * Provides basic prototype string type checking if `target` is a Promise.
     *
     * @param target - A potential Promise to test.
     *
     * @returns Is `target` a Promise.
     */
    isPromise(target: unknown): target is Promise<unknown>;
    /**
     * Provides basic prototype string type checking if `target` is a RegExp.
     *
     * @param target - A potential RegExp to test.
     *
     * @returns Is `target` a RegExp.
     */
    isRegExp(target: unknown): target is RegExp;
    /**
     * Provides basic prototype string type checking if `target` is a Set.
     *
     * @param target - A potential Set to test.
     *
     * @returns Is `target` a Set.
     */
    isSet(target: unknown): target is Set<unknown>;
  }
}

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
  private constructor();
  /**
   * @returns Methods that perform realm-safe checks for DOM elements, browser globals, and Web Platform APIs.
   */
  static get browser(): CrossRealm.Browser.API;
  /**
   * @returns Methods that perform realm-safe checks for built-in JavaScript types and core ECMAScript language
   *          objects.
   */
  static get lang(): CrossRealm.Language.API;
}
declare namespace CrossRealm {
  namespace Browser {
    export import Options = CrossRealmBrowser.Options;
    export import API = CrossRealmBrowser.API;
  }
  namespace Language {
    export import API = CrossRealmLanguage.API;
  }
}

export { CrossRealm };
