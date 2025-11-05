import { isObject } from '@typhonjs-svelte/runtime-base/util/object';

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
 *
 * @groupDescription Browser
 * Methods that perform realm-safe checks for DOM elements, browser globals, and Web Platform APIs.
 *
 * @groupDescription Core
 * Methods that perform realm-safe checks for built-in JavaScript types and core ECMAScript language objects.
 */
class CrossRealm {
    constructor() {
        throw new Error('CrossRealm constructor: This is a static class and should not be constructed.');
    }
    /**
     * Class names for all focusable element types.
     */
    static #FocusableElementClassNames = ['HTMLAnchorElement', 'HTMLButtonElement', 'HTMLDetailsElement',
        'HTMLEmbedElement', 'HTMLIFrameElement', 'HTMLInputElement', 'HTMLObjectElement', 'HTMLSelectElement',
        'HTMLTextAreaElement'];
    /**
     * DOM nodes with defined `ownerDocument` property.
     */
    static #NodesWithOwnerDocument = new Set([Node.ELEMENT_NODE, Node.TEXT_NODE, Node.COMMENT_NODE,
        Node.DOCUMENT_FRAGMENT_NODE]);
    // Various UIEvent sets for duck typing by constructor name.
    /**
     * Duck typing class names for pointer events.
     */
    static #PointerEventSet = new Set(['MouseEvent', 'PointerEvent']);
    /**
     * Duck typing class names for all UIEvents.
     */
    static #UIEventSet = new Set(['UIEvent', 'FocusEvent', 'MouseEvent', 'WheelEvent', 'KeyboardEvent', 'PointerEvent',
        'TouchEvent', 'InputEvent', 'CompositionEvent', 'DragEvent']);
    /**
     * Duck typing class names for events considered as user input.
     */
    static #UserInputEventSet = new Set(['KeyboardEvent', 'MouseEvent', 'PointerEvent']);
    /**
     * Internal options used by `#checkDOMInstanceType` when retrieving the Window reference from a Node that doesn't
     * define `ownerDocument`.
     */
    static #optionsInternalCheckDOM = { throws: false };
    // Browser DOM Querying -------------------------------------------------------------------------------------------
    /**
     * Convenience method to test if the given target element is the current active element.
     *
     * @param target - Element to test as current active element.
     *
     * @group Browser
     */
    static isActiveElement(target) {
        // Duck type if target has known defined `ownerDocument` property.
        if (this.#hasOwnerDocument(target)) {
            return target?.ownerDocument?.activeElement === target;
        }
        return false;
    }
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
     *
     * @group Browser
     */
    static getActiveElement(target, { throws = true } = {}) {
        // Duck type if target has known defined `ownerDocument` property.
        if (this.#hasOwnerDocument(target)) {
            return target?.ownerDocument?.activeElement ?? null;
        }
        // Duck type if target is a UIEvent.
        if (this.isUIEvent(target) && isObject(target?.view)) {
            return target?.view?.document?.activeElement ?? null;
        }
        // Duck type if target is a Document.
        if (this.isDocument(target)) {
            return target?.activeElement ?? null;
        }
        // Duck type if target is a Window.
        if (this.isWindow(target)) {
            return target?.document?.activeElement ?? null;
        }
        if (throws) {
            throw new TypeError(`'target' must be a DOM Node / Element, Document, UIEvent, or Window.`);
        }
        return void 0;
    }
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
     *
     * @group Browser
     */
    static getDocument(target, { throws = true } = {}) {
        // Duck type if target has known defined `ownerDocument` property.
        if (this.#hasOwnerDocument(target)) {
            return target?.ownerDocument;
        }
        // Duck type if target is a UIEvent.
        if (this.isUIEvent(target) && isObject(target?.view)) {
            return target?.view?.document;
        }
        // Duck type if target is a Document.
        if (this.isDocument(target)) {
            return target;
        }
        // Duck type if target is a Window.
        if (this.isWindow(target)) {
            return target?.document;
        }
        if (throws) {
            throw new TypeError(`'target' must be a DOM Node / Element, Document, UIEvent, or Window.`);
        }
        return void 0;
    }
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
     *
     * @group Browser
     */
    static getWindow(target, { throws = true } = {}) {
        // Duck type if target has known defined `ownerDocument` property.
        if (this.#hasOwnerDocument(target)) {
            return target.ownerDocument?.defaultView ?? globalThis;
        }
        // Duck type if target is a UIEvent.
        if (this.isUIEvent(target) && isObject(target?.view)) {
            return target.view ?? globalThis;
        }
        // Duck type if target is a Document.
        if (this.isDocument(target)) {
            return target.defaultView ?? globalThis;
        }
        // Duck type if target is a Window.
        if (this.isWindow(target)) {
            return target;
        }
        if (throws) {
            throw new TypeError(`'target' must be a DOM Node / Element, Document, UIEvent, or Window.`);
        }
        return void 0;
    }
    // Browser API basic prototype tests ------------------------------------------------------------------------------
    /**
     * Provides basic prototype string type checking if `target` is a CSSImportRule.
     *
     * @param target - A potential CSSImportRule to test.
     *
     * @returns Is `target` a CSSImportRule.
     *
     * @group Browser
     */
    static isCSSImportRule(target) {
        return isObject(target) && Object.prototype.toString.call(target) === '[object CSSImportRule]';
    }
    /**
     * Provides basic prototype string type checking if `target` is a CSSLayerBlockRule.
     *
     * @param target - A potential CSSLayerBlockRule to test.
     *
     * @returns Is `target` a CSSLayerBlockRule.
     *
     * @group Browser
     */
    static isCSSLayerBlockRule(target) {
        return isObject(target) && Object.prototype.toString.call(target) === '[object CSSLayerBlockRule]';
    }
    /**
     * Provides basic prototype string type checking if `target` is a CSSStyleRule.
     *
     * @param target - A potential CSSStyleRule to test.
     *
     * @returns Is `target` a CSSStyleRule.
     *
     * @group Browser
     */
    static isCSSStyleRule(target) {
        return isObject(target) && Object.prototype.toString.call(target) === '[object CSSStyleRule]';
    }
    /**
     * Provides basic prototype string type checking if `target` is a CSSStyleSheet.
     *
     * @param target - A potential CSSStyleSheet to test.
     *
     * @returns Is `target` a CSSStyleSheet.
     *
     * @group Browser
     */
    static isCSSStyleSheet(target) {
        return isObject(target) && Object.prototype.toString.call(target) === '[object CSSStyleSheet]';
    }
    /**
     * Provides basic prototype string type checking if `target` is a Document.
     *
     * @param target - A potential Document to test.
     *
     * @returns Is `target` a Document.
     *
     * @group Browser
     */
    static isDocument(target) {
        // Match any DOM Document object by its default @@toStringTag.
        // - HTMLDocument (`[object HTMLDocument]` in modern browsers & JSDOM)
        // - generic Document (`[object Document]` in older or XML contexts)
        return isObject(target) && /^\[object (HTML)?Document]$/.test(Object.prototype.toString.call(target));
    }
    /**
     * Provides basic prototype string type checking if `target` is a URL.
     *
     * @param target - A potential URL to test.
     *
     * @returns Is `target` a URL.
     *
     * @group Browser
     */
    static isURL(target) {
        return isObject(target) && Object.prototype.toString.call(target) === '[object URL]';
    }
    /**
     * Provides basic prototype string type checking if `target` is a Window.
     *
     * @param target - A potential Window to test.
     *
     * @returns Is `target` a Window.
     *
     * @group Browser
     */
    static isWindow(target) {
        return isObject(target) && Object.prototype.toString.call(target) === '[object Window]';
    }
    // Browser DOM Element typing -------------------------------------------------------------------------------------
    /**
     * Ensures that the given target is an `instanceof` all known DOM elements that are focusable. Please note that
     * additional checks are required regarding focusable state; use {@link A11yHelper.isFocusable} for a complete check.
     *
     * @param target - Target to test for `instanceof` focusable HTML element.
     *
     * @returns Is target an `instanceof` a focusable DOM element.
     *
     * @group Browser
     */
    static isFocusableHTMLElement(target) {
        for (let cntr = this.#FocusableElementClassNames.length; --cntr >= 0;) {
            if (this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, this.#FocusableElementClassNames[cntr])) {
                return true;
            }
        }
        return false;
    }
    /**
     * Provides precise type checking if `target` is a DocumentFragment.
     *
     * @param target - A potential DocumentFragment to test.
     *
     * @returns Is `target` a DocumentFragment.
     *
     * @group Browser
     */
    static isDocumentFragment(target) {
        return this.#checkDOMInstanceType(target, Node.DOCUMENT_FRAGMENT_NODE, 'DocumentFragment');
    }
    /**
     * Provides precise type checking if `target` is an Element.
     *
     * @param target - A potential Element to test.
     *
     * @returns Is `target` an Element.
     *
     * @group Browser
     */
    static isElement(target) {
        return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'Element');
    }
    /**
     * Provides precise type checking if `target` is a HTMLAnchorElement.
     *
     * @param target - A potential HTMLAnchorElement to test.
     *
     * @returns Is `target` a HTMLAnchorElement.
     *
     * @group Browser
     */
    static isHTMLAnchorElement(target) {
        return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'HTMLAnchorElement');
    }
    /**
     * Provides precise type checking if `target` is an HTMLElement.
     *
     * @param target - A potential HTMLElement to test.
     *
     * @returns Is `target` a HTMLElement.
     *
     * @group Browser
     */
    static isHTMLElement(target) {
        return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'HTMLElement');
    }
    /**
     * Provides precise type checking if `target` is a Node.
     *
     * @param target - A potential Node to test.
     *
     * @returns Is `target` a DOM Node.
     *
     * @group Browser
     */
    static isNode(target) {
        if (typeof target?.nodeType !== 'number') {
            return false;
        }
        if (target instanceof globalThis.Node) {
            return true;
        }
        // Must retrieve the window by a more thorough duck type via `getWindow` as not all Nodes have `ownerDocument`
        // defined.
        const activeWindow = this.getWindow(target, this.#optionsInternalCheckDOM);
        const TargetNode = activeWindow?.Node;
        return TargetNode && target instanceof TargetNode;
    }
    /**
     * Provides precise type checking if `target` is a ShadowRoot.
     *
     * @param target - A potential ShadowRoot to test.
     *
     * @returns Is `target` a ShadowRoot.
     *
     * @group Browser
     */
    static isShadowRoot(target) {
        // ShadowRoot is a specialized type of DocumentFragment.
        return this.#checkDOMInstanceType(target, Node.DOCUMENT_FRAGMENT_NODE, 'ShadowRoot');
    }
    /**
     * Provides precise type checking if `target` is a SVGElement.
     *
     * @param target - A potential SVGElement to test.
     *
     * @returns Is `target` a SVGElement.
     *
     * @group Browser
     */
    static isSVGElement(target) {
        return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'SVGElement');
    }
    // Browser Event typing -------------------------------------------------------------------------------------------
    /**
     * Provides basic duck type checking for `Event` signature and optional constructor name(s).
     *
     * @param target - A potential DOM event to test.
     *
     * @param [types] Specific constructor name or Set of constructor names to match.
     *
     * @returns Is `target` an Event with optional constructor name check.
     *
     * @group Browser
     */
    static isEvent(target, types) {
        if (typeof target?.type !== 'string' || typeof target?.defaultPrevented !== 'boolean' ||
            typeof target?.stopPropagation !== 'function') {
            return false;
        }
        return types !== void 0 ? this.isCtorName(target, types) : true;
    }
    /**
     * Provides basic duck type checking for `Event` signature for standard mouse / pointer events including
     * `MouseEvent` and `PointerEvent`.
     *
     * @param target - A potential DOM event to test.
     *
     * @returns Is `target` a MouseEvent or PointerEvent.
     *
     * @group Browser
     */
    static isPointerEvent(target) {
        return this.isEvent(target, this.#PointerEventSet);
    }
    /**
     * Provides basic duck type checking for `Event` signature for all UI events.
     *
     * @param target - A potential DOM event to test.
     *
     * @returns Is `target` a UIEvent.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/UIEvent
     *
     * @group Browser
     */
    static isUIEvent(target) {
        return this.isEvent(target, this.#UIEventSet);
    }
    /**
     * Provides basic duck type checking for `Event` signature for standard user input events including `KeyboardEvent`,
     * `MouseEvent`, and `PointerEvent`.
     *
     * @param target - A potential DOM event to test.
     *
     * @returns Is `target` a Keyboard, MouseEvent, or PointerEvent.
     *
     * @group Browser
     */
    static isUserInputEvent(target) {
        return this.isEvent(target, this.#UserInputEventSet);
    }
    // Browser Errors -------------------------------------------------------------------------------------------------
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
     *
     * @group Browser
     */
    static isDOMException(target, name) {
        return isObject(target) && Object.prototype.toString.call(target) === '[object DOMException]' &&
            target.name === name;
    }
    // Core language typing -------------------------------------------------------------------------------------------
    /**
     * Provides basic type checking by constructor name(s) for objects. This can be useful when checking multiple
     * constructor names against a provided Set.
     *
     * @param target - Object to test for constructor name.
     *
     * @param types Specific constructor name or Set of constructor names to match.
     *
     * @returns Does the provided object constructor name match the types provided.
     *
     * @group Core
     */
    static isCtorName(target, types) {
        if (!isObject(target)) {
            return false;
        }
        if (typeof types === 'string' && target?.constructor?.name === types) {
            return true;
        }
        return !!types?.has(target?.constructor?.name);
    }
    /**
     * Provides basic prototype string type checking if `target` is a Date.
     *
     * @param target - A potential Date to test.
     *
     * @returns Is `target` a Date.
     *
     * @group Core
     */
    static isDate(target) {
        return isObject(target) && Object.prototype.toString.call(target) === '[object Date]';
    }
    /**
     * Provides basic prototype string type checking if `target` is a Map.
     *
     * @param target - A potential Map to test.
     *
     * @returns Is `target` a Map.
     *
     * @group Core
     */
    static isMap(target) {
        return isObject(target) && Object.prototype.toString.call(target) === '[object Map]';
    }
    /**
     * Provides basic prototype string type checking if `target` is a Promise.
     *
     * @param target - A potential Promise to test.
     *
     * @returns Is `target` a Promise.
     *
     * @group Core
     */
    static isPromise(target) {
        return isObject(target) && Object.prototype.toString.call(target) === '[object Promise]';
    }
    /**
     * Provides basic prototype string type checking if `target` is a RegExp.
     *
     * @param target - A potential RegExp to test.
     *
     * @returns Is `target` a RegExp.
     *
     * @group Core
     */
    static isRegExp(target) {
        return isObject(target) && Object.prototype.toString.call(target) === '[object RegExp]';
    }
    /**
     * Provides basic prototype string type checking if `target` is a Set.
     *
     * @param target - A potential Set to test.
     *
     * @returns Is `target` a Set.
     *
     * @group Core
     */
    static isSet(target) {
        return isObject(target) && Object.prototype.toString.call(target) === '[object Set]';
    }
    // Internal implementation ----------------------------------------------------------------------------------------
    /**
     * Internal generic DOM `instanceof` check. First will attempt to find the class name by `globalThis` falling back
     * to the {@link Window} associated with the DOM node.
     *
     * @param target - Target to test.
     *
     * @param nodeType - Node type constant.
     *
     * @param className - DOM classname for instanceof check.
     *
     * @returns Is the target the given nodeType and instance of class name.
     */
    static #checkDOMInstanceType(target, nodeType, className) {
        if (!isObject(target)) {
            return false;
        }
        if (target.nodeType !== nodeType) {
            return false;
        }
        const GlobalClass = window[className];
        if (GlobalClass && target instanceof GlobalClass) {
            return true;
        }
        const activeWindow = this.#hasOwnerDocument(target) ?
            target?.ownerDocument?.defaultView :
            // @ts-ignore: Safe in this context.
            this.getWindow(target, this.#optionsInternalCheckDOM);
        const TargetClass = activeWindow?.[className];
        return TargetClass && target instanceof TargetClass;
    }
    static #hasOwnerDocument(target) {
        return typeof target === 'object' && target !== null &&
            this.#NodesWithOwnerDocument.has(target?.nodeType);
    }
}

/**
 * Provides strictly readonly collections at runtime including {@link ReadonlyMap} and {@link ReadonlySet}.
 *
 * The protection level provided is for accidental modification. A determined caller could still mutate via
 * `Map.prototype.set.call(frozenMap, ...)` or `Set.prototype.add.call(frozenSet, ...)`.
 */
class Frozen {
    constructor() {
        throw new Error('Frozen constructor: This is a static class and should not be constructed.');
    }
    /**
     * @param [entries] - Target Map or iterable of [key, value] pairs.
     *
     * @returns A strictly ReadonlyMap.
     */
    static Map(entries) {
        const result = new Map(entries);
        // @ts-expect-error
        result.set = void 0;
        // @ts-expect-error
        result.delete = void 0;
        // @ts-expect-error
        result.clear = void 0;
        return result;
    }
    /**
     * @param [data] - Target Set or iterable list.
     *
     * @returns A strictly ReadonlySet.
     */
    static Set(data) {
        const result = new Set(data);
        // @ts-expect-error
        result.add = void 0;
        // @ts-expect-error
        result.delete = void 0;
        // @ts-expect-error
        result.clear = void 0;
        return result;
    }
}
Object.freeze(Frozen);

/**
 * Provides various utilities for generating hash codes for strings and UUIDs.
 */
class Hashing {
    static #cryptoBuffer = new Uint8Array(1);
    static #regexUuidv4 = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
    static #regexUuidReplace = /[018]/g;
    static #uuidTemplate = '10000000-1000-4000-8000-100000000000';
    constructor() {
        throw new Error('Hashing constructor: This is a static class and should not be constructed.');
    }
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
    static hashCode(str, seed = 0) {
        if (typeof str !== 'string') {
            return 0;
        }
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        for (let ch, i = 0; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    }
    /**
     * Validates that the given string is formatted as a UUIDv4 string.
     *
     * @param uuid - UUID string to test.
     *
     * @returns Is UUIDv4 string.
     */
    static isUuidv4(uuid) {
        return typeof uuid === 'string' && this.#regexUuidv4.test(uuid);
    }
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
    static uuidv4() {
        return this.#uuidTemplate.replace(this.#regexUuidReplace, (c) => (Number(c) ^ (globalThis.crypto ?? globalThis.msCrypto).getRandomValues(this.#cryptoBuffer)[0] & 15 >> Number(c) / 4).toString(16));
    }
}

/**
 * Provides utility functions for strings.
 *
 * This class should not be constructed as it only contains static methods.
 */
class Strings {
    static #regexEscape = /[-/\\^$*+?.()|[\]{}]/g;
    static #regexNormalize = /[\x00-\x1F]/gm;
    static #regexReplacement = '\\$&';
    constructor() {
        throw new Error('Strings constructor: This is a static class and should not be constructed.');
    }
    /**
     * Escape a given input string prefacing special characters with backslashes for use in a regular expression.
     *
     * @param str - An un-escaped input string.
     *
     * @returns The escaped string suitable for use in a regular expression.
     */
    static escape(str) {
        return str.replace(this.#regexEscape, this.#regexReplacement);
    }
    /**
     * Normalizes a string.
     *
     * @param str - A string to normalize for comparisons.
     *
     * @returns Cleaned string.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
     */
    static normalize(str) {
        return str.trim().normalize('NFD').replace(this.#regexNormalize, '');
    }
}

/**
 * Provides timing related higher-order functions.
 */
class Timing {
    constructor() {
        throw new Error('Timing constructor: This is a static class and should not be constructed.');
    }
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
    static debounce(callback, delay) {
        if (typeof callback !== 'function') {
            throw new TypeError(`'callback' must be a function.`);
        }
        if (!Number.isInteger(delay) || delay < 0) {
            throw new TypeError(`'delay' must be a positive integer representing milliseconds.`);
        }
        let timeoutId;
        return function (...args) {
            globalThis.clearTimeout(timeoutId);
            timeoutId = globalThis.setTimeout(() => { callback.apply(this, args); }, delay);
        };
    }
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
    static doubleClick({ single, double, delay = 400 }) {
        if (single !== void 0 && typeof single !== 'function') {
            throw new TypeError(`'single' must be a function.`);
        }
        if (double !== void 0 && typeof double !== 'function') {
            throw new TypeError(`'double' must be a function.`);
        }
        if (!Number.isInteger(delay) || delay < 0) {
            throw new TypeError(`'delay' must be a positive integer representing milliseconds.`);
        }
        let clicks = 0;
        let timeoutId;
        return (event) => {
            globalThis.clearTimeout(timeoutId);
            clicks++;
            if (clicks === 1) {
                timeoutId = globalThis.setTimeout(() => {
                    if (typeof single === 'function') {
                        single(event);
                    }
                    clicks = 0;
                }, delay);
            }
            else {
                if (typeof double === 'function') {
                    double(event);
                }
                clicks = 0;
            }
        };
    }
}

export { CrossRealm, Frozen, Hashing, Strings, Timing };
//# sourceMappingURL=index.js.map
