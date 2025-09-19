/**
 * Provides a utility to validate media file types and determine the appropriate HTML element type for rendering.
 */
declare class AssetValidator {
  #private;
  /**
   * @private
   */
  constructor();
  /**
   * Provides several readonly default media type Sets useful for the `mediaTypes` option.
   */
  static get MediaTypes(): AssetValidator.DefaultMediaTypes;
  /**
   * Parses the provided file path to determine the media type and validity based on the file extension. Certain
   * extensions can be excluded in addition to filtering by specified media types.
   *
   * @param options - Options.
   *
   * @returns The parsed asset information containing the file path, extension, element type, and whether the parsing
   *          is valid for the file extension is supported and not excluded.
   *
   * @throws {TypeError} If the provided `url` is not a string or URL, `routePrefix` is not a string,
   *         `exclude` is not a Set, or `mediaTypes` is not a Set.
   */
  static parseMedia({
    url,
    routePrefix,
    exclude,
    mediaTypes,
    raiseException,
  }: AssetValidator.Options.ParseMedia): AssetValidator.Data.ParsedMediaResult;
}
/**
 * Defines various options and data types for {@link AssetValidator}.
 */
declare namespace AssetValidator {
  /**
   * Provides several default {@link AssetValidator.Options.MediaTypes} Sets that are commonly used.
   */
  type DefaultMediaTypes = Readonly<{
    /**
     * All supported media types 'audio' | 'img' | 'svg' | 'video'.
     */
    all: ReadonlySet<AssetValidator.Options.MediaTypes>;
    /**
     * Only media type 'audio'.
     */
    audio: ReadonlySet<AssetValidator.Options.MediaTypes>;
    /**
     * Only media type 'img'.
     */
    img: ReadonlySet<AssetValidator.Options.MediaTypes>;
    /**
     * Only media types 'img' | 'svg'.
     */
    img_svg: ReadonlySet<AssetValidator.Options.MediaTypes>;
    /**
     * Only media types 'img' | 'svg' | 'video'.
     */
    img_svg_video: ReadonlySet<AssetValidator.Options.MediaTypes>;
    /**
     * Only media type 'video'.
     */
    video: ReadonlySet<AssetValidator.Options.MediaTypes>;
  }>;
  namespace Options {
    /**
     * Valid media types to parse / define for {@link AssetValidator.parseMedia}`.
     */
    type MediaTypes = 'audio' | 'img' | 'svg' | 'video';
    /**
     * Options for {@link AssetValidator.parseMedia}.
     */
    interface ParseMedia {
      /**
       * The URL of the media asset to validate.
       */
      url: string | URL;
      /**
       * A set of file extensions to exclude from validation.
       */
      exclude?: Set<string>;
      /**
       * A set of media types to validate against including: `audio`, `img`, `svg`, `video`.
       *
       * @defaultValue `'audio', 'img', 'svg', 'video'`
       */
      mediaTypes?: ReadonlySet<MediaTypes> | Set<MediaTypes>;
      /**
       * When true exceptions are thrown.
       *
       * @defaultValue `false`
       */
      raiseException?: boolean;
      /**
       * An additional route / URL prefix to add in constructing URL.
       */
      routePrefix?: string;
    }
  }
  namespace Data {
    /**
     * A non-valid parse media result.
     */
    type InvalidMediaResult = {
      /**
       * Original URL.
       */
      url: string | URL;
      /**
       * Extension type
       */
      extension?: undefined;
      /**
       * Key to indicate which element should render the URL.
       */
      elementType?: undefined;
      /**
       * Result indicating invalid.
       */
      valid: false;
    };
    /**
     * A valid parse media result.
     */
    type ValidMediaResult = {
      /**
       * Original URL.
       */
      src: string | URL;
      /**
       * Parsed URL.
       */
      url: URL;
      /**
       * Extension type
       */
      extension?: string;
      /**
       * Key to indicate which element should render the URL.
       */
      elementType?: 'img' | 'video' | 'svg' | 'audio';
      /**
       * Result indicating valid.
       */
      valid: true;
    };
    /**
     * The `parseMedia` result indicating either a valid / non-valid parse attempt.
     */
    type ParsedMediaResult = ValidMediaResult | InvalidMediaResult;
  }
}

/**
 * Provides utility methods for checking browser capabilities.
 *
 * @see https://kilianvalkhof.com/2021/web/detecting-media-query-support-in-css-and-javascript/
 *
 * @privateRemarks
 * TODO: perhaps add support for various standard media query checks for level 4 & 5.
 */
declare class BrowserSupports {
  /**
   * @private
   */
  constructor();
  /**
   * Check for container query support.
   *
   * @returns True if container queries supported.
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
   * @private
   */
  constructor();
  /**
   * Uses `navigator.clipboard` if available to read text from the clipboard.
   *
   * Note: Always returns `undefined` when `navigator.clipboard` is not available or the clipboard contains the
   * empty string.
   *
   * @param [activeWindow=window] Optional active current window.
   *
   * @returns {Promise<string|undefined>} The current clipboard text or undefined.
   */
  static readText(activeWindow?: Window): Promise<string | undefined>;
  /**
   * Uses `navigator.clipboard` if available then falls back to `document.execCommand('copy')` if available to copy
   * the given text to the clipboard.
   *
   * @param text - Text to copy to the browser clipboard.
   *
   * @param [activeWindow=window] Optional active current window.
   *
   * @returns Copy successful.
   */
  static writeText(text: string, activeWindow?: Window): Promise<boolean>;
}

/**
 * Provides cross-realm checks for DOM nodes / elements, events, and essential duck typing for any class-based object
 * with a constructor name. The impetus is that certain browsers such as Chrome and Firefox behave differently when
 * performing `instanceof` checks when elements are moved between browser windows. With Firefox in particular, the
 * entire JS runtime cannot use `instanceof` checks as the instances of fundamental DOM elements differ between
 * windows.
 *
 * TRL supports moving applications from a main central browser window and popping them out into separate standalone
 * app instances in a separate browser window. In this case, for essential DOM element and event checks, it is necessary
 * to employ the workarounds found in `CrossWindow`.
 */
declare class CrossWindow {
  #private;
  /**
   * @private
   */
  constructor();
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
  static getActiveElement(
    target: CrossWindow.GetTarget,
    { throws }?: CrossWindow.GetOptions,
  ): Element | null | undefined;
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
    target: CrossWindow.GetTarget,
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
    target: CrossWindow.GetTarget,
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
}
declare namespace CrossWindow {
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
 * Provides a utility function to parse / construct fully qualified URL instances from a URL string.
 */
declare class URLParser {
  #private;
  /**
   * @private
   */
  constructor();
  /**
   * Parses a URL string converting it to a fully qualified URL. If URL is an existing URL instance, it is returned
   * immediately. Optionally, you may construct a fully qualified URL from a relative base origin / path or with a
   * route prefix added to the current location origin.
   *
   * @param options - Options.
   *
   * @param options.url - URL string to convert to a URL.
   *
   * @param [options.base] - Optional fully qualified base path for relative URL construction.
   *
   * @param [options.routePrefix] - Optional route prefix to add to location origin for absolute URL strings
   *        when `base` is not defined.
   *
   * @returns Parsed URL or null if `url` is not parsed.
   */
  static parse({ url, base, routePrefix }: { url: string | URL; base?: string; routePrefix?: string }): URL | null;
}

export { AssetValidator, BrowserSupports, ClipboardAccess, CrossWindow, URLParser };
