import { isObject }           from '#runtime/util/object';

import { CrossRealmLanguage } from './CrossRealmLanguage';
import { CrossRealmUtil }     from './CrossRealmUtil';

/**
 * Methods that perform realm-safe checks for DOM elements, browser globals, and Web Platform APIs.
 */
abstract class CrossRealmBrowser
{
   private constructor()
   {
      throw new Error('CrossRealmBrowser constructor: This is a static class and should not be constructed.');
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
   static #UIEventSet: Set<string> = new Set(['UIEvent', 'FocusEvent', 'MouseEvent', 'WheelEvent', 'KeyboardEvent',
    'PointerEvent', 'TouchEvent', 'InputEvent', 'CompositionEvent', 'DragEvent']);

   /**
    * Duck typing class names for events considered as user input.
    */
   static #UserInputEventSet: Set<string> = new Set(['KeyboardEvent', 'MouseEvent', 'PointerEvent']);

   /**
    * Internal options used by `#checkDOMInstanceType` when retrieving the Window reference from a Node that doesn't
    * define `ownerDocument`.
    */
   static #optionsInternalCheckDOM: { throws: boolean } = { throws: false };

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
    * {@link CrossRealmBrowser.API.getActiveElement}
    */
   static getActiveElement(target: CrossRealmBrowser.Options.GetTarget,
    { throws = true }: CrossRealmBrowser.Options.GetMethod = {}): Element | null | undefined
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
    * {@link CrossRealmBrowser.API.getDocument}
    */
   static getDocument(target: CrossRealmBrowser.Options.GetTarget,
    { throws = true }: CrossRealmBrowser.Options.GetMethod = {}): Document | undefined
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
    * {@link CrossRealmBrowser.API.getWindow}
    */
   static getWindow(target: CrossRealmBrowser.Options.GetTarget,
    { throws = true }: CrossRealmBrowser.Options.GetMethod = {}): Window | undefined
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

   // Browser API basic prototype tests ------------------------------------------------------------------------------

   /**
    * {@link CrossRealmBrowser.API.isCSSImportRule}
    */
   static isCSSImportRule(target: unknown): target is CSSImportRule
   {
      return CrossRealmUtil.isTagged(target, 'CSSImportRule');
   }

   /**
    * {@link CrossRealmBrowser.API.isCSSLayerBlockRule}
    */
   static isCSSLayerBlockRule(target: unknown): target is CSSLayerBlockRule
   {
      return CrossRealmUtil.isTagged(target, 'CSSLayerBlockRule');
   }

   /**
    * {@link CrossRealmBrowser.API.isCSSStyleRule}
    */
   static isCSSStyleRule(target: unknown): target is CSSStyleRule
   {
      return CrossRealmUtil.isTagged(target, 'CSSStyleRule');
   }

   /**
    * {@link CrossRealmBrowser.API.isCSSStyleSheet}
    */
   static isCSSStyleSheet(target: unknown): target is CSSStyleSheet
   {
      return CrossRealmUtil.isTagged(target, 'CSSStyleSheet');
   }

   /**
    * {@link CrossRealmBrowser.API.isDocument}
    */
   static isDocument(target: unknown): target is Document
   {
      return isObject(target) && this.#regexTagDocument.test(Object.prototype.toString.call(target));
   }

   /**
    * {@link CrossRealmBrowser.API.isURL}
    */
   static isURL(target: unknown): target is URL
   {
      return CrossRealmUtil.isTagged(target, 'URL');
   }

   /**
    * {@link CrossRealmBrowser.API.isWindow}
    */
   static isWindow(target: unknown): target is Window
   {
      return CrossRealmUtil.isTagged(target, 'Window');
   }

   // Browser DOM Element typing -------------------------------------------------------------------------------------

   /**
    * {@link CrossRealmBrowser.API.isFocusableHTMLElement}
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
    * {@link CrossRealmBrowser.API.isDocumentFragment}
    */
   static isDocumentFragment(target: unknown): target is DocumentFragment
   {
      return this.#checkDOMInstanceType(target, Node.DOCUMENT_FRAGMENT_NODE, 'DocumentFragment');
   }

   /**
    * {@link CrossRealmBrowser.API.isElement}
    */
   static isElement(target: unknown): target is Element
   {
      return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'Element');
   }

   /**
    * {@link CrossRealmBrowser.API.isHTMLAnchorElement}
    */
   static isHTMLAnchorElement(target: unknown): target is HTMLAnchorElement
   {
      return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'HTMLAnchorElement');
   }

   /**
    * {@link CrossRealmBrowser.API.isHTMLElement}
    */
   static isHTMLElement(target: unknown): target is HTMLElement
   {
      return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'HTMLElement');
   }

   /**
    * {@link CrossRealmBrowser.API.isNode}
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
    * {@link CrossRealmBrowser.API.isShadowRoot}
    */
   static isShadowRoot(target: unknown): target is ShadowRoot
   {
      // ShadowRoot is a specialized type of DocumentFragment.
      return this.#checkDOMInstanceType(target, Node.DOCUMENT_FRAGMENT_NODE, 'ShadowRoot');
   }

   /**
    * {@link CrossRealmBrowser.API.isSVGElement}
    */
   static isSVGElement(target: unknown): target is SVGElement
   {
      return this.#checkDOMInstanceType(target, Node.ELEMENT_NODE, 'SVGElement');
   }

   // Browser Event typing -------------------------------------------------------------------------------------------

   /**
    * {@link CrossRealmBrowser.API.isEvent}
    */
   static isEvent(target: unknown, types: string | Set<string>): target is Event
   {
      if (typeof (target as Event)?.type !== 'string' || typeof (target as Event)?.defaultPrevented !== 'boolean' ||
       typeof (target as Event)?.stopPropagation !== 'function')
      {
         return false;
      }

      return types !== void 0 ? CrossRealmLanguage.isCtorName(target, types) : true;
   }

   /**
    * {@link CrossRealmBrowser.API.isPointerEvent}
    */
   static isPointerEvent(target: unknown): target is PointerEvent
   {
      return this.isEvent(target, this.#PointerEventSet);
   }

   /**
    * {@link CrossRealmBrowser.API.isUIEvent}
    */
   static isUIEvent(target: unknown): target is UIEvent
   {
      return this.isEvent(target, this.#UIEventSet);
   }

   /**
    * {@link CrossRealmBrowser.API.isUserInputEvent}
    */
   static isUserInputEvent(target: unknown): target is KeyboardEvent | MouseEvent | PointerEvent
   {
      return this.isEvent(target, this.#UserInputEventSet);
   }

   // Browser Errors -------------------------------------------------------------------------------------------------

   /**
    * {@link CrossRealmBrowser.API.isDOMException}
    */
   static isDOMException(target: unknown, name: string): boolean
   {
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
   static #checkDOMInstanceType(target: unknown, nodeType: number, className: string): boolean
   {
      if (!isObject(target)) { return false; }

      if ((target as Node).nodeType !== nodeType) { return false; }

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

declare namespace CrossRealmBrowser {
   export interface API {
      // Browser DOM Querying ----------------------------------------------------------------------------------------

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
      getActiveElement(target: CrossRealmBrowser.Options.GetTarget, options?: CrossRealmBrowser.Options.GetMethod):
       Element | null | undefined;

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
      getDocument(target: CrossRealmBrowser.Options.GetTarget, options?: CrossRealmBrowser.Options.GetMethod):
       Document | undefined;

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
      getWindow(target: CrossRealmBrowser.Options.GetTarget, options?: CrossRealmBrowser.Options.GetMethod):
       Window | undefined;

      // Browser API basic prototype tests ---------------------------------------------------------------------------

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

      // Browser DOM Element typing ----------------------------------------------------------------------------------

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

      // Browser Event typing ----------------------------------------------------------------------------------------

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

      // Browser Errors ----------------------------------------------------------------------------------------------

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

   export namespace Options {
      /**
       * Defines the DOM API targets usable for all `get` methods.
       */
      export type GetTarget = Document | EventTarget | Node | UIEvent | Window;

      /**
       * Defines options for all `get` methods.
       */
      export interface GetMethod {
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

export { CrossRealmBrowser }
