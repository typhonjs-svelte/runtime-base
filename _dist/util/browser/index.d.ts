import { Writable } from 'svelte/store';

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
 * Provides various type aliases used by {@link ResizeObserverManager}.
 */
declare namespace ResizeObserverData {
  /**
   * A function that receives offset / content height & width changes.
   */
  type ResizeFunction = (
    offsetWidth: number,
    offsetHeight: number,
    contentWidth?: number,
    contentHeight?: number,
  ) => unknown;
  /**
   * An object to update as a target for {@link ResizeObserverManager} resize updates.
   */
  type ResizeObject = {
    /** Stores `contentHeight` attribute. */
    contentHeight?: number;
    /** Stores `contentWidth` attribute. */
    contentWidth?: number;
    /** Stores `offsetHeight` attribute. */
    offsetHeight?: number;
    /** Stores `offsetWidth` attribute. */
    offsetWidth?: number;
  };
  /**
   * An extended object type defining various ways to create a valid target for {@link ResizeObserverManager}.
   */
  type ResizeObjectExtended = {
    /** Either a function or a writable store to receive resize updates. */
    resizeObserved?: Writable<ResizeObject> | ResizeFunction;
    /** A function that is invoked with content width & height changes. */
    setContentBounds?: (contentWidth: number, contentHeight: number) => unknown;
    /** A function that is invoked with offset width & height changes. */
    setDimension?: (offsetWidth: number, offsetHeight: number) => unknown;
    /** An object with a `stores` attribute and subsequent `resizeObserved` writable store. */
    stores?: {
      resizeObserved: Writable<ResizeObject>;
    };
  };
  /**
   * The receiving target for observed resize data associated with {@link ResizeObserverManager}. Just one of the
   * mechanisms defined is required to conform to a valid target.
   */
  type ResizeTarget = ResizeObject | ResizeObjectExtended | ResizeFunction;
}

/**
 * Provides an instance of {@link ResizeObserver} that can manage multiple elements and notify a wide range of
 * {@link ResizeObserverData.ResizeTarget} listeners. Offset width and height is also provided through caching the
 * margin and padding styles of the target element.
 *
 * The action, {@link resizeObserver}, utilizes ResizeObserverManager for automatic registration and removal
 * via Svelte.
 */
declare class ResizeObserverManager {
  /**
   * Add an {@link HTMLElement} and {@link ResizeObserverData.ResizeTarget} instance for monitoring. Create cached
   * style attributes for the given element include border & padding dimensions for offset width / height calculations.
   *
   * @param {HTMLElement}    el - The element to observe.
   *
   * @param {import('./types').ResizeObserverData.ResizeTarget} target - A target that contains one of several
   *        mechanisms for updating resize data.
   */
  add(el: HTMLElement, target: ResizeObserverData.ResizeTarget): void;
  /**
   * Clears and unobserves all currently tracked elements and managed targets.
   */
  clear(): void;
  /**
   * Removes all {@link ResizeObserverData.ResizeTarget} instances for the given element from monitoring when just an
   * element is provided otherwise removes a specific target from the monitoring map. If no more targets remain then
   * the element is removed from monitoring.
   *
   * @param {HTMLElement} el - Element to remove from monitoring.
   *
   * @param {import('./types').ResizeObserverData.ResizeTarget} [target] - A specific target to remove from monitoring.
   */
  remove(el: HTMLElement, target?: ResizeObserverData.ResizeTarget): void;
  /**
   * Provides a function that when invoked with an element updates the cached styles for each subscriber of the
   * element.
   *
   * The style attributes cached to calculate offset height / width include border & padding dimensions. You only need
   * to update the cache if you change border or padding attributes of the element.
   *
   * @param {HTMLElement} el - A HTML element.
   */
  updateCache(el: HTMLElement): void;
  #private;
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
 * @param {Window} [activeWindow=globalThis] The target active window as applicable.
 *
 * @returns {StackingContext | undefined} The closest parent stacking context or undefined if none.
 *
 */
declare function getStackingContext(node: Element, activeWindow?: Window): StackingContext | undefined;
type StackingContext = {
  /**
   * - A DOM Element.
   */
  node: Element;
  /**
   * - Reason for why a stacking context was created.
   */
  reason: string;
};

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
 * Provides several helpful utility methods for accessibility and keyboard navigation.
 *
 * Note: Global debugging can be enabled by setting `A11yHelper.debug = true`.
 */
declare class A11yHelper {
  /**
   * @param {boolean}  debug - Global debug enabled
   */
  static set debug(debug: boolean);
  /**
   * @returns {boolean} Global debugging enabled.
   */
  static get debug(): boolean;
  /**
   * Runs a media query to determine if the user / OS configuration is set up for reduced motion / animation.
   *
   * @returns {boolean} User prefers reduced motion.
   */
  static get prefersReducedMotion(): boolean;
  /**
   * Apply focus to the HTMLElement / SVGElement targets in a given A11yFocusSource data object. An iterable list
   * `options.focusEl` can contain HTMLElement / SVGElements or selector strings. If multiple focus targets are
   * provided in a list then the first valid target found will be focused. If focus target is a string then a lookup
   * via `document.querySelector` is performed. In this case you should provide a unique selector for the desired
   * focus target.
   *
   * Note: The body of this method is postponed to the next clock tick to allow any changes in the DOM to occur that
   * might alter focus targets before applying.
   *
   * @param {A11yFocusSource | { focusSource: A11yFocusSource }}   options - The focus options instance to apply.
   */
  static applyFocusSource(
    options:
      | A11yFocusSource
      | {
          focusSource: A11yFocusSource;
        },
  ): void;
  /**
   * Returns first focusable element within a specified element.
   *
   * @param {Element | Document} [element=document] - Optional element to start query.
   *
   * @param {object}            [options] - Optional parameters.
   *
   * @param {Iterable<string>}  [options.ignoreClasses] - Iterable list of classes to ignore elements.
   *
   * @param {Set<Element>}      [options.ignoreElements] - Set of elements to ignore.
   *
   * @returns {FocusableElement} First focusable child element.
   */
  static getFirstFocusableElement(
    element?: Element | Document,
    options?: {
      ignoreClasses?: Iterable<string>;
      ignoreElements?: Set<Element>;
    },
  ): FocusableElement;
  /**
   * Returns all focusable elements within a specified element.
   *
   * @param {Element | Document} [element=document] Optional element to start query.
   *
   * @param {object}            [options] - Optional parameters.
   *
   * @param {boolean}           [options.anchorHref=true] - When true anchors must have an HREF.
   *
   * @param {Iterable<string>}  [options.ignoreClasses] - Iterable list of classes to ignore elements.
   *
   * @param {Set<Element>}      [options.ignoreElements] - Set of elements to ignore.
   *
   * @param {string}            [options.selectors] - Custom list of focusable selectors for `querySelectorAll`.
   *
   * @returns {Array<FocusableElement>} Child keyboard focusable elements.
   */
  static getFocusableElements(
    element?: Element | Document,
    {
      anchorHref,
      ignoreClasses,
      ignoreElements,
      selectors,
    }?: {
      anchorHref?: boolean;
      ignoreClasses?: Iterable<string>;
      ignoreElements?: Set<Element>;
      selectors?: string;
    },
  ): Array<FocusableElement>;
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
   * @param {KeyboardEvent | MouseEvent}   [options.event] - The source DOM event.
   *
   * @param {boolean} [options.debug] - When true {@link A11yHelper.applyFocusSource} logs focus target data.
   *
   * @param {FocusableElement | string} [options.focusEl] - A specific HTMLElement / SVGElement or selector
   *        string as the focus target.
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
  static getFocusSource({
    event,
    x,
    y,
    focusEl,
    debug,
  }: {
    event?: KeyboardEvent | MouseEvent;
    debug?: boolean;
    focusEl?: FocusableElement | string;
    x?: number;
    y?: number;
  }): A11yFocusSource;
  /**
   * Returns first focusable element within a specified element.
   *
   * @param {Element | Document} [element=document] - Optional element to start query.
   *
   * @param {object} [options] - Optional parameters.
   *
   * @param {Iterable<string>} [options.ignoreClasses] - Iterable list of classes to ignore elements.
   *
   * @param {Set<Element>} [options.ignoreElements] - Set of elements to ignore.
   *
   * @returns {FocusableElement} Last focusable child element.
   */
  static getLastFocusableElement(
    element?: Element | Document,
    options?: {
      ignoreClasses?: Iterable<string>;
      ignoreElements?: Set<Element>;
    },
  ): FocusableElement;
  /**
   * Tests if the given element is focusable.
   *
   * @param {Element} el - Element to test.
   *
   * @param {object} [options] - Optional parameters.
   *
   * @param {boolean} [options.anchorHref=true] - When true anchors must have an HREF.
   *
   * @param {Iterable<string>} [options.ignoreClasses] - Iterable list of classes to ignore elements.
   *
   * @returns {boolean} Element is focusable.
   */
  static isFocusable(
    el: Element,
    {
      anchorHref,
      ignoreClasses,
    }?: {
      anchorHref?: boolean;
      ignoreClasses?: Iterable<string>;
    },
  ): boolean;
  /**
   * Convenience method to check if the given data is a valid focus source.
   *
   * @param {Element | string}   data - Either an HTMLElement, SVGElement, or selector string.
   *
   * @returns {boolean} Is valid focus source.
   */
  static isFocusSource(data: Element | string): boolean;
  /**
   * Tests if the given `element` is a Element node and has a `focus` method.
   *
   * @param {Element}  element - Element to test for focus method.
   *
   * @returns {boolean} Whether the element has a focus method.
   */
  static isFocusTarget(element: Element): boolean;
  /**
   * Perform a parent traversal from the current active element attempting to match the given element to test whether
   * current active element is within that element.
   *
   * @param {Element}  element - An element to match in parent traversal from the active element.
   *
   * @param {Window}   [activeWindow=globalThis] The active window to use for the current active element.
   *
   * @returns {boolean} Whether there is focus within the given element.
   */
  static isFocusWithin(element: Element, activeWindow?: Window): boolean;
}
/**
 * A focusable element; either HTMLElement or SvgElement.
 */
type FocusableElement = Element & HTMLOrSVGElement;
/**
 * Provides essential data to return focus to an HTMLElement / SVGElement after a
 * series of UI actions like working with context menus and modal dialogs.
 */
type A11yFocusSource = {
  /**
   * When true logs to console the actions taken in {@link A11yHelper.applyFocusSource}.
   */
  debug?: boolean;
  /**
   * List of targets to attempt to focus.
   */
  focusEl?: Iterable<FocusableElement | string>;
  /**
   * The source of the event: 'keyboard' for instance.
   */
  source?: string;
  /**
   * Potential X coordinate of initial event.
   */
  x?: number;
  /**
   * Potential Y coordinate of initial event.
   */
  y?: number;
};

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

export {
  type A11yFocusSource,
  A11yHelper,
  BrowserSupports,
  ClipboardAccess,
  type FocusableElement,
  ImageData,
  ResizeObserverData,
  ResizeObserverManager,
  type StackingContext,
  StyleParse,
  TJSStyleManager,
  URLParser,
  getStackingContext,
  processHTML,
  striptags,
};
