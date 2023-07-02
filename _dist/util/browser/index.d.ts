interface StateMachineOptions {
    readonly allowedTags?: Set<string>;
    readonly disallowedTags?: Set<string>;
    readonly tagReplacementText: string;
    readonly encodePlaintextTagDelimiters: boolean;
}
declare function striptags(text: string, options?: Partial<StateMachineOptions>): string;

/**
 * Provides several helpful utility methods for accessibility and keyboard navigation.
 */
declare class A11yHelper {
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
    static applyFocusSource(options: A11yFocusSource | {
        focusSource: A11yFocusSource;
    }): void;
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
    static getFirstFocusableElement(element?: HTMLElement | Document, options?: {
        ignoreClasses?: Iterable<string>;
        ignoreElements?: Set<HTMLElement>;
    }): HTMLElement;
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
    static getFocusableElements(element?: HTMLElement | Document, { anchorHref, ignoreClasses, ignoreElements, selectors }?: {
        anchorHref?: boolean;
        ignoreClasses?: Iterable<string>;
        ignoreElements?: Set<HTMLElement>;
        selectors?: string;
    }): Array<HTMLElement>;
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
    static getFocusSource({ event, x, y, focusEl, debug }: {
        event?: KeyboardEvent | MouseEvent;
        debug?: boolean;
        focusEl?: HTMLElement | string;
        x?: number;
        y?: number;
    }): A11yFocusSource;
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
    static getLastFocusableElement(element?: HTMLElement | Document, options?: {
        ignoreClasses?: Iterable<string>;
        ignoreElements?: Set<HTMLElement>;
    }): HTMLElement;
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
    static isFocusable(el?: HTMLElement, { anchorHref, ignoreClasses }?: {
        anchorHref?: boolean;
        ignoreClasses?: Iterable<string>;
    }): boolean;
    /**
     * Convenience method to check if the given data is a valid focus source.
     *
     * @param {HTMLElement|string}   data - Either an HTMLElement or selector string.
     *
     * @returns {boolean} Is valid focus source.
     */
    static isFocusSource(data: HTMLElement | string): boolean;
}
/**
 * Provides essential data to return focus to an HTMLElement after a series of UI
 * actions like working with context menus and modal dialogs.
 */
type A11yFocusSource = {
    /**
     * When true logs to console the actions taken in {@link A11yHelper.applyFocusSource }.
     */
    debug?: boolean;
    /**
     * List of targets to attempt to focus.
     */
    focusEl?: Iterable<HTMLElement | string>;
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
     * @returns {Promise<string|undefined>} The current clipboard text or undefined.
     */
    static readText(): Promise<string | undefined>;
    /**
     * Uses `navigator.clipboard` if available then falls back to `document.execCommand('copy')` if available to copy
     * the given text to the clipboard.
     *
     * @param {string}   text - Text to copy to the browser clipboard.
     *
     * @returns {Promise<boolean>} Copy successful.
     */
    static writeText(text: string): Promise<boolean>;
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
declare function getStackingContext(node: Element): StackingContext;
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

export { A11yFocusSource, A11yHelper, BrowserSupports, ClipboardAccess, StackingContext, StyleParse, TJSStyleManager, getStackingContext, striptags };
