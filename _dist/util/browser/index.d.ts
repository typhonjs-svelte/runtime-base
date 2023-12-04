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
declare function processHTML({ html, process, selector, containerElement, firstMatchOnly, namespaceURI }: {
    html: string;
    process: (HTMLElement: any) => void;
    selector: string;
    containerElement?: string;
    firstMatchOnly?: boolean;
    namespaceURI?: string;
}): string;

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
    constructor({ docKey, selector, document, version }?: {
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
    setProperties(rules: {
        [key: string]: string;
    }, overwrite?: boolean): void;
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
    static set debug(arg: boolean);
    /**
     * @returns {boolean} Global debugging enabled.
     */
    static get debug(): boolean;
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
    static applyFocusSource(options: A11yFocusSource | {
        focusSource: A11yFocusSource;
    }): void;
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
     * @returns {Element} First focusable child element.
     */
    static getFirstFocusableElement(element?: Element | Document, options?: {
        ignoreClasses?: Iterable<string>;
        ignoreElements?: Set<Element>;
    }): Element;
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
     * @param {Set<Element>}  [options.ignoreElements] - Set of elements to ignore.
     *
     * @param {string}            [options.selectors] - Custom list of focusable selectors for `querySelectorAll`.
     *
     * @returns {Array<Element>} Child keyboard focusable
     */
    static getFocusableElements(element?: Element | Document, { anchorHref, ignoreClasses, ignoreElements, selectors }?: {
        anchorHref?: boolean;
        ignoreClasses?: Iterable<string>;
        ignoreElements?: Set<Element>;
        selectors?: string;
    }): Array<Element>;
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
     * @param {Element | string} [options.focusEl] - A specific HTMLElement / SVGElement or selector
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
    static getFocusSource({ event, x, y, focusEl, debug }: {
        event?: KeyboardEvent | MouseEvent;
        debug?: boolean;
        focusEl?: Element | string;
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
     * @returns {Element} Last focusable child element.
     */
    static getLastFocusableElement(element?: Element | Document, options?: {
        ignoreClasses?: Iterable<string>;
        ignoreElements?: Set<Element>;
    }): Element;
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
    static isFocusable(el: Element, { anchorHref, ignoreClasses }?: {
        anchorHref?: boolean;
        ignoreClasses?: Iterable<string>;
    }): boolean;
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
 * Provides essential data to return focus to an HTMLElement / SVGElement after a
 * series of UI actions like working with context menus and modal dialogs.
 */
type A11yFocusSource = {
    /**
     * When true logs to console the actions taken in {@link A11yHelper.applyFocusSource }.
     */
    debug?: boolean;
    /**
     * List of targets to attempt to focus.
     */
    focusEl?: Iterable<Element | string>;
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

export { type A11yFocusSource, A11yHelper, BrowserSupports, ClipboardAccess, type StackingContext, StyleParse, TJSStyleManager, getStackingContext, processHTML, striptags };
