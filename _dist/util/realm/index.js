import { isObject } from '@typhonjs-svelte/runtime-base/util/object';

class CrossRealmUtil {
    static isTagged(target, tag) {
        return isObject(target) && Object.prototype.toString.call(target) === `[object ${tag}]`;
    }
    static isTaggedAny(target, ...tags) {
        if (!isObject(target)) {
            return false;
        }
        const tag = Object.prototype.toString.call(target);
        return tags.some((entry) => tag === `[object ${entry}]`);
    }
}

/**
 * Methods that perform realm-safe checks for built-in JavaScript types and core ECMAScript language objects.
 */
class CrossRealmLanguage {
    constructor() {
        throw new Error('CrossRealmLanguage constructor: This is a static class and should not be constructed.');
    }
    /**
     * {@link CrossRealmLanguage.API.isCtorName}
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
     * {@link CrossRealmLanguage.API.isDate}
     */
    static isDate(target) {
        return CrossRealmUtil.isTagged(target, 'Date');
    }
    /**
     * {@link CrossRealmLanguage.API.isMap}
     */
    static isMap(target) {
        return CrossRealmUtil.isTagged(target, 'Map');
    }
    /**
     * {@link CrossRealmLanguage.API.isPromise}
     */
    static isPromise(target) {
        return CrossRealmUtil.isTagged(target, 'Promise');
    }
    /**
     * {@link CrossRealmLanguage.API.isRegExp}
     */
    static isRegExp(target) {
        return CrossRealmUtil.isTagged(target, 'RegExp');
    }
    /**
     * {@link CrossRealmLanguage.API.isSet}
     */
    static isSet(target) {
        return CrossRealmUtil.isTagged(target, 'Set');
    }
}

/**
 * Methods that perform realm-safe checks for DOM elements, browser globals, and Web Platform APIs.
 */
class CrossRealmBrowser {
    constructor() {
        throw new Error('CrossRealmBrowser constructor: This is a static class and should not be constructed.');
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
    static #UIEventSet = new Set(['UIEvent', 'FocusEvent', 'MouseEvent', 'WheelEvent', 'KeyboardEvent',
        'PointerEvent', 'TouchEvent', 'InputEvent', 'CompositionEvent', 'DragEvent']);
    /**
     * Duck typing class names for events considered as user input.
     */
    static #UserInputEventSet = new Set(['KeyboardEvent', 'MouseEvent', 'PointerEvent']);
    /**
     * Internal options used by `#checkDOMInstanceType` when retrieving the Window reference from a Node that doesn't
     * define `ownerDocument`.
     */
    static #optionsInternalCheckDOM = { throws: false };
    /**
     * Match any DOM Document object by its default @@toStringTag.
     * - HTMLDocument (`[object HTMLDocument]` in modern browsers & JSDOM)
     * - generic Document (`[object Document]` in older or XML contexts)
     */
    static #regexTagDocument = /^\[object (HTML)?Document]$/;
    // Browser DOM Querying -------------------------------------------------------------------------------------------
    /**
     * {@link CrossRealmBrowser.API.isActiveElement}
     */
    static isActiveElement(target) {
        // Duck type if target has known defined `ownerDocument` property.
        if (this.#hasOwnerDocument(target)) {
            return target?.ownerDocument?.activeElement === target;
        }
        return false;
    }
    /**
     * {@link CrossRealmBrowser.API.getActiveElement}
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
     * {@link CrossRealmBrowser.API.getDocument}
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
     * {@link CrossRealmBrowser.API.getWindow}
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
     * {@link CrossRealmBrowser.API.isCSSImportRule}
     */
    static isCSSImportRule(target) {
        return CrossRealmUtil.isTagged(target, 'CSSImportRule');
    }
    /**
     * {@link CrossRealmBrowser.API.isCSSLayerBlockRule}
     */
    static isCSSLayerBlockRule(target) {
        return CrossRealmUtil.isTagged(target, 'CSSLayerBlockRule');
    }
    /**
     * {@link CrossRealmBrowser.API.isCSSStyleRule}
     */
    static isCSSStyleRule(target) {
        return CrossRealmUtil.isTagged(target, 'CSSStyleRule');
    }
    /**
     * {@link CrossRealmBrowser.API.isCSSStyleSheet}
     */
    static isCSSStyleSheet(target) {
        return CrossRealmUtil.isTagged(target, 'CSSStyleSheet');
    }
    /**
     * {@link CrossRealmBrowser.API.isDocument}
     */
    static isDocument(target) {
        return isObject(target) && this.#regexTagDocument.test(Object.prototype.toString.call(target));
    }
    /**
     * {@link CrossRealmBrowser.API.isURL}
     */
    static isURL(target) {
        return CrossRealmUtil.isTagged(target, 'URL');
    }
    /**
     * {@link CrossRealmBrowser.API.isWindow}
     */
    static isWindow(target) {
        return CrossRealmUtil.isTagged(target, 'Window');
    }
    // Browser DOM Element typing -------------------------------------------------------------------------------------
    /**
     * {@link CrossRealmBrowser.API.isFocusableHTMLElement}
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
     * {@link CrossRealmBrowser.API.isDocumentFragment}
     */
    static isDocumentFragment(target) {
        return this.#checkDOMInstanceType(target, Node.DOCUMENT_FRAGMENT_NODE, 'DocumentFragment');
    }
    /**
     * {@link CrossRealmBrowser.API.isElement}
     */
    static isElement(target) {
        return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'Element');
    }
    /**
     * {@link CrossRealmBrowser.API.isHTMLAnchorElement}
     */
    static isHTMLAnchorElement(target) {
        return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'HTMLAnchorElement');
    }
    /**
     * {@link CrossRealmBrowser.API.isHTMLElement}
     */
    static isHTMLElement(target) {
        return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'HTMLElement');
    }
    /**
     * {@link CrossRealmBrowser.API.isNode}
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
     * {@link CrossRealmBrowser.API.isShadowRoot}
     */
    static isShadowRoot(target) {
        // ShadowRoot is a specialized type of DocumentFragment.
        return this.#checkDOMInstanceType(target, Node.DOCUMENT_FRAGMENT_NODE, 'ShadowRoot');
    }
    /**
     * {@link CrossRealmBrowser.API.isSVGElement}
     */
    static isSVGElement(target) {
        return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'SVGElement');
    }
    // Browser Event typing -------------------------------------------------------------------------------------------
    /**
     * {@link CrossRealmBrowser.API.isEvent}
     */
    static isEvent(target, types) {
        if (typeof target?.type !== 'string' || typeof target?.defaultPrevented !== 'boolean' ||
            typeof target?.stopPropagation !== 'function') {
            return false;
        }
        return types !== void 0 ? CrossRealmLanguage.isCtorName(target, types) : true;
    }
    /**
     * {@link CrossRealmBrowser.API.isPointerEvent}
     */
    static isPointerEvent(target) {
        return this.isEvent(target, this.#PointerEventSet);
    }
    /**
     * {@link CrossRealmBrowser.API.isUIEvent}
     */
    static isUIEvent(target) {
        return this.isEvent(target, this.#UIEventSet);
    }
    /**
     * {@link CrossRealmBrowser.API.isUserInputEvent}
     */
    static isUserInputEvent(target) {
        return this.isEvent(target, this.#UserInputEventSet);
    }
    // Browser Errors -------------------------------------------------------------------------------------------------
    /**
     * {@link CrossRealmBrowser.API.isDOMException}
     */
    static isDOMException(target, name) {
        return CrossRealmUtil.isTagged(target, 'DOMException') && target.name === name;
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
class CrossRealm {
    constructor() {
        throw new Error('CrossRealm constructor: This is a static class and should not be constructed.');
    }
    /**
     * @returns Methods that perform realm-safe checks for DOM elements, browser globals, and Web Platform APIs.
     */
    static get browser() { return CrossRealmBrowser; }
    /**
     * @returns Methods that perform realm-safe checks for built-in JavaScript types and core ECMAScript language
     *          objects.
     */
    static get lang() { return CrossRealmLanguage; }
}

export { CrossRealm };
//# sourceMappingURL=index.js.map
