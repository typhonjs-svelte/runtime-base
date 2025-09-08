import { isObject } from '#runtime/util/object';

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
class CrossWindow
{
   /**
    * @private
    */
   constructor()
   {
      throw new Error('CrossWindow constructor: This is a static class and should not be constructed.');
   }

   /**
    * Class names for all focusable element types.
    */
   static #FocusableElementClassNames: string[] = ['HTMLAnchorElement', 'HTMLButtonElement', 'HTMLDetailsElement',
    'HTMLEmbedElement', 'HTMLIFrameElement', 'HTMLInputElement', 'HTMLObjectElement', 'HTMLSelectElement',
     'HTMLTextAreaElement'];

   /**
    * DOM nodes with defined `ownerDocument` property.
    */
   static #NodesWithOwnerDocument: Set<number> = new Set([Node.ELEMENT_NODE, Node.TEXT_NODE, Node.COMMENT_NODE,
    Node.DOCUMENT_FRAGMENT_NODE]);

   // Various UIEvent sets for duck typing by constructor name.

   /**
    * Duck typing class names for pointer events.
    */
   static #PointerEventSet: Set<string> = new Set(['MouseEvent', 'PointerEvent']);

   /**
    * Duck typing class names for all UIEvents.
    */
   static #UIEventSet: Set<string> = new Set(['UIEvent', 'FocusEvent', 'MouseEvent', 'WheelEvent', 'KeyboardEvent', 'PointerEvent',
    'TouchEvent', 'InputEvent', 'CompositionEvent', 'DragEvent']);

   /**
    * Duck typing class names for events considered as user input.
    */
   static #UserInputEventSet: Set<string> = new Set(['KeyboardEvent', 'MouseEvent', 'PointerEvent']);

   /**
    * Internal options used by `#checkDOMInstanceType` when retrieving the Window reference from a Node that doesn't
    * define `ownerDocument`.
    */
   static #optionsInternalCheckDOM: { throws: boolean } = { throws: false };

   // DOM Querying ---------------------------------------------------------------------------------------------------

   /**
    * Convenience method to test if the given target element is the current active element.
    *
    * @param target - Element to test as current active element.
    */
   static isActiveElement(target: Element): boolean
   {
      // Duck type if target has known defined `ownerDocument` property.
      if (this.#hasOwnerDocument(target))
      {
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
    */
   static getActiveElement(target: CrossWindow.GetTarget, { throws = true }: CrossWindow.GetOptions = {}): Element |
    null | undefined
   {
      // Duck type if target has known defined `ownerDocument` property.
      if (this.#hasOwnerDocument(target)) { return target?.ownerDocument?.activeElement ?? null; }

      // Duck type if target is a UIEvent.
      if (this.isUIEvent(target) && isObject(target?.view)) { return target?.view?.document?.activeElement ?? null; }

      // Duck type if target is a Document.
      if (this.isDocument(target)) { return target?.activeElement ?? null; }

      // Duck type if target is a Window.
      if (this.isWindow(target)) { return target?.document?.activeElement ?? null; }

      if (throws) { throw new TypeError(`'target' must be a DOM Node / Element, Document, UIEvent, or Window.`); }

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
    */
   static getDocument(target: CrossWindow.GetTarget, { throws = true } = {}): Document | undefined
   {
      // Duck type if target has known defined `ownerDocument` property.
      if (this.#hasOwnerDocument(target)) { return target?.ownerDocument; }

      // Duck type if target is a UIEvent.
      if (this.isUIEvent(target) && isObject(target?.view)) { return target?.view?.document; }

      // Duck type if target is a Document.
      if (this.isDocument(target)) { return target; }

      // Duck type if target is a Window.
      if (this.isWindow(target)) { return target?.document; }

      if (throws) { throw new TypeError(`'target' must be a DOM Node / Element, Document, UIEvent, or Window.`); }

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
    */
   static getWindow(target: CrossWindow.GetTarget, { throws = true } = {}): Window | undefined
   {
      // Duck type if target has known defined `ownerDocument` property.
      if (this.#hasOwnerDocument(target)) { return target.ownerDocument?.defaultView ?? globalThis as typeof window; }

      // Duck type if target is a UIEvent.
      if (this.isUIEvent(target) && isObject(target?.view)) { return target.view ?? globalThis as typeof window; }

      // Duck type if target is a Document.
      if (this.isDocument(target)) { return target.defaultView ?? globalThis as typeof window; }

      // Duck type if target is a Window.
      if (this.isWindow(target)) { return target; }

      if (throws) { throw new TypeError(`'target' must be a DOM Node / Element, Document, UIEvent, or Window.`); }

      return void 0;
   }

   // ES / Browser API basic prototype tests -------------------------------------------------------------------------

   /**
    * Provides basic prototype string type checking if `target` is a CSSImportRule.
    *
    * @param target - A potential CSSImportRule to test.
    *
    * @returns Is `target` a CSSImportRule.
    */
   static isCSSImportRule(target: unknown): target is CSSImportRule
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object CSSImportRule]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a CSSLayerBlockRule.
    *
    * @param target - A potential CSSLayerBlockRule to test.
    *
    * @returns Is `target` a CSSLayerBlockRule.
    */
   static isCSSLayerBlockRule(target: unknown): target is CSSLayerBlockRule
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object CSSLayerBlockRule]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a CSSStyleRule.
    *
    * @param target - A potential CSSStyleRule to test.
    *
    * @returns Is `target` a CSSStyleRule.
    */
   static isCSSStyleRule(target: unknown): target is CSSStyleRule
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object CSSStyleRule]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a CSSStyleSheet.
    *
    * @param target - A potential CSSStyleSheet to test.
    *
    * @returns Is `target` a CSSStyleSheet.
    */
   static isCSSStyleSheet(target: unknown): target is CSSStyleSheet
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object CSSStyleSheet]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a Document.
    *
    * @param target - A potential Document to test.
    *
    * @returns Is `target` a Document.
    */
   static isDocument(target: unknown): target is Document
   {
      // Match any DOM Document object by its default @@toStringTag.
      // - HTMLDocument (`[object HTMLDocument]` in modern browsers & JSDOM)
      // - generic Document (`[object Document]` in older or XML contexts)
      return isObject(target) && /^\[object (HTML)?Document]$/.test(Object.prototype.toString.call(target));
   }

   /**
    * Provides basic prototype string type checking if `target` is a Map.
    *
    * @param target - A potential Map to test.
    *
    * @returns Is `target` a Map.
    */
   static isMap(target: unknown): target is Map<unknown, unknown>
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object Map]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a Promise.
    *
    * @param target - A potential Promise to test.
    *
    * @returns Is `target` a Promise.
    */
   static isPromise(target: unknown): target is Promise<unknown>
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object Promise]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a RegExp.
    *
    * @param target - A potential RegExp to test.
    *
    * @returns Is `target` a RegExp.
    */
   static isRegExp(target: unknown): target is RegExp
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object RegExp]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a Set.
    *
    * @param target - A potential Set to test.
    *
    * @returns Is `target` a Set.
    */
   static isSet(target: unknown): target is Set<unknown>
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object Set]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a URL.
    *
    * @param target - A potential URL to test.
    *
    * @returns Is `target` a URL.
    */
   static isURL(target: unknown): target is URL
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object URL]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a Window.
    *
    * @param target - A potential Window to test.
    *
    * @returns Is `target` a Window.
    */
   static isWindow(target: unknown): target is Window
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object Window]';
   }

   // DOM Element typing ---------------------------------------------------------------------------------------------

   /**
    * Ensures that the given target is an `instanceof` all known DOM elements that are focusable. Please note that
    * additional checks are required regarding focusable state; use {@link A11yHelper.isFocusable} for a complete check.
    *
    * @param target - Target to test for `instanceof` focusable HTML element.
    *
    * @returns Is target an `instanceof` a focusable DOM element.
    */
   static isFocusableHTMLElement(target: unknown): boolean
   {
      for (let cntr = this.#FocusableElementClassNames.length; --cntr >= 0;)
      {
         if (this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, this.#FocusableElementClassNames[cntr]))
         {
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
    */
   static isDocumentFragment(target: unknown): target is DocumentFragment
   {
      return this.#checkDOMInstanceType(target, Node.DOCUMENT_FRAGMENT_NODE, 'DocumentFragment');
   }

   /**
    * Provides precise type checking if `target` is an Element.
    *
    * @param target - A potential Element to test.
    *
    * @returns Is `target` an Element.
    */
   static isElement(target: unknown): target is Element
   {
      return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'Element');
   }

   /**
    * Provides precise type checking if `target` is a HTMLAnchorElement.
    *
    * @param target - A potential HTMLAnchorElement to test.
    *
    * @returns Is `target` a HTMLAnchorElement.
    */
   static isHTMLAnchorElement(target: unknown): target is HTMLAnchorElement
   {
      return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'HTMLAnchorElement');
   }

   /**
    * Provides precise type checking if `target` is an HTMLElement.
    *
    * @param target - A potential HTMLElement to test.
    *
    * @returns Is `target` a HTMLElement.
    */
   static isHTMLElement(target: unknown): target is HTMLElement
   {
      return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'HTMLElement');
   }

   /**
    * Provides precise type checking if `target` is a Node.
    *
    * @param target - A potential Node to test.
    *
    * @returns Is `target` a DOM Node.
    */
   static isNode(target: unknown): target is Node
   {
      if (typeof (target as Node)?.nodeType !== 'number') { return false; }

      if (target instanceof globalThis.Node) { return true; }

      // Must retrieve the window by a more thorough duck type via `getWindow` as not all Nodes have `ownerDocument`
      // defined.
      const activeWindow = this.getWindow(target as Window, this.#optionsInternalCheckDOM);

      const TargetNode = (activeWindow as typeof window)?.Node;
      return TargetNode && target instanceof TargetNode;
   }

   /**
    * Provides precise type checking if `target` is a ShadowRoot.
    *
    * @param target - A potential ShadowRoot to test.
    *
    * @returns Is `target` a ShadowRoot.
    */
   static isShadowRoot(target: unknown): target is ShadowRoot
   {
      // ShadowRoot is a specialized type of DocumentFragment.
      return this.#checkDOMInstanceType(target, Node.DOCUMENT_FRAGMENT_NODE, 'ShadowRoot');
   }

   /**
    * Provides precise type checking if `target` is a SVGElement.
    *
    * @param target - A potential SVGElement to test.
    *
    * @returns Is `target` a SVGElement.
    */
   static isSVGElement(target: unknown): target is SVGElement
   {
      return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'SVGElement');
   }

   // Event typing ---------------------------------------------------------------------------------------------------

   /**
    * Provides basic duck type checking for `Event` signature and optional constructor name(s).
    *
    * @param target - A potential DOM event to test.
    *
    * @param [types] Specific constructor name or Set of constructor names to match.
    *
    * @returns Is `target` an Event with optional constructor name check.
    */
   static isEvent(target: unknown, types: string | Set<string>): target is Event
   {
      if (typeof (target as Event)?.type !== 'string' || typeof (target as Event)?.defaultPrevented !== 'boolean' ||
       typeof (target as Event)?.stopPropagation !== 'function')
      {
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
    */
   static isPointerEvent(target: unknown): target is PointerEvent
   {
      return this.isEvent(target, this.#PointerEventSet);
   }

   /**
    * Provides basic duck type checking for `Event` signature for all UI events.
    *
    * @param target - A potential DOM event to test.
    *
    * @returns Is `target` a UIEvent.
    * @see https://developer.mozilla.org/en-US/docs/Web/API/UIEvent
    */
   static isUIEvent(target: unknown): target is UIEvent
   {
      return this.isEvent(target, this.#UIEventSet);
   }

   /**
    * Provides basic duck type checking for `Event` signature for standard user input events including `KeyboardEvent`,
    * `MouseEvent`, and `PointerEvent`.
    *
    * @param target - A potential DOM event to test.
    *
    * @returns Is `target` a Keyboard, MouseEvent, or PointerEvent.
    */
   static isUserInputEvent(target: unknown): target is KeyboardEvent | MouseEvent | PointerEvent
   {
      return this.isEvent(target, this.#UserInputEventSet);
   }

   // Generic typing -------------------------------------------------------------------------------------------------

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
   static isCtorName(target: unknown, types: string | Set<string>): boolean
   {
      if (!isObject(target)) { return false; }

      if (typeof types === 'string' && target?.constructor?.name === types) { return true; }

      return !!(types as Set<string>)?.has(target?.constructor?.name);
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
   static #checkDOMInstanceType(target: unknown, nodeType: number, className: string): boolean
   {
      if (!isObject(target)) { return false; }

      if (target.nodeType !== nodeType) { return false; }

      const GlobalClass: any = (window as unknown as Record<string, unknown>)[className];

      if (GlobalClass && target instanceof GlobalClass) { return true; }

      const activeWindow: Window | undefined | null = this.#hasOwnerDocument(target) ?
         target?.ownerDocument?.defaultView :
         // @ts-ignore: Safe in this context.
         this.getWindow(target, this.#optionsInternalCheckDOM);

      const TargetClass: any = (activeWindow as unknown as Record<string, unknown>)?.[className];

      return TargetClass && target instanceof TargetClass;
   }

   static #hasOwnerDocument(target: unknown): target is Element
   {
      return typeof target === 'object' && target !== null &&
       this.#NodesWithOwnerDocument.has((target as Node)?.nodeType);
   }
}

declare namespace CrossWindow {

   /**
    * Defines the DOM API targets usable for all `get` methods.
    */
   export type GetTarget = Document | EventTarget | Node | UIEvent | Window;

   /**
    * Defines options for all `get` methods.
    */
   export interface GetOptions {
      /**
       * When `true` and the target is invalid, throw an exception. If `false` and the target is invalid `undefined`
       * is returned; default: `true`.
       *
       * @defaultValue `true`
       */
      throws?: boolean;
   }
}

export { CrossWindow }
