import { isObject } from '#runtime/util/object';

/**
 * Provides cross window checks for DOM elements, events, and essential duck typing for any class based object with a
 * constructor name. The impetus is that certain browsers such as Chrome and Firefox behave differently when
 * performing `instanceof` checks when elements are moved between browser windows. With Firefox in particular the
 * entire JS runtime can not use `instanceof` checks as the instances of fundamental DOM elements differ between
 * windows.
 *
 * TRL supports moving applications from a main central browser window and popping them out into separate standalone
 * app instances in a separate browser window. In this case for essential DOM element and event checks it is necessary to
 * employ the workarounds found in `CrossWindow`.
 */
export class CrossWindow
{
   /**
    * @private
    */
   constructor() {} // eslint-disable-line no-useless-constructor

   // Cached DOM nodes from initial `globalThis` reference / originating window.
   static #Element = globalThis.Element;
   static #HTMLElement = globalThis.HTMLElement;
   static #Node = globalThis.Node;
   static #SVGElement = globalThis.SVGElement;

   // Various UI Event sets for duck typing by constructor name.
   static #InputEventSet = new Set(['KeyboardEvent', 'MouseEvent', 'PointerEvent']);
   static #PointerEventSet = new Set(['MouseEvent', 'PointerEvent']);
   static #UIEventSet = new Set(['UIEvent', 'FocusEvent', 'MouseEvent', 'WheelEvent', 'KeyboardEvent', 'PointerEvent',
    'TouchEvent', 'InputEvent', 'CompositionEvent', 'DragEvent']);

   // ES / Browser API typing ----------------------------------------------------------------------------------------

   /**
    * Provides basic prototype string type checking if `target` is a Document.
    *
    * @param {unknown}  target - A potential Document to test.
    *
    * @returns {target is Document} Is `target` a Document.
    */
   static isDocument(target)
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object Document]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a Map.
    *
    * @param {unknown}  target - A potential Map to test.
    *
    * @returns {target is Map} Is `target` a Map.
    */
   static isMap(target)
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object Map]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a Set.
    *
    * @param {unknown}  target - A potential Set to test.
    *
    * @returns {target is Set} Is `target` a Set.
    */
   static isSet(target)
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object Set]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a URL.
    *
    * @param {unknown}  target - A potential URL to test.
    *
    * @returns {target is URL} Is `target` a URL.
    */
   static isURL(target)
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object URL]';
   }

   /**
    * Provides basic prototype string type checking if `target` is a Window.
    *
    * @param {unknown}  target - A potential Window to test.
    *
    * @returns {target is Window} Is `target` a Window.
    */
   static isWindow(target)
   {
      return isObject(target) && Object.prototype.toString.call(target) === '[object Window]';
   }

   // DOM Querying ---------------------------------------------------------------------------------------------------

   /**
    * Convenience method to retrieve the `document.activeElement` value in the current Window context of a DOM Node /
    * Element, EventTarget, Document, or Window.
    *
    * @param {Document | EventTarget | Node | UIEvent | Window}  target - DOM Node / Element, EventTarget, Document,
    *        UIEvent or Window to query.
    *
    * @returns {Element | null} Active element.
    *
    * @throws {@link TypeError} Target must be a DOM Node / Element, Document, UIEvent, or Window.
    */
   static getActiveElement(target)
   {
      // Duck type if target is a Node / Element.
      if (typeof target?.nodeType === 'number') { return target?.ownerDocument?.activeElement ?? null; }

      // Duck type if target is a UIEvent.
      if (this.isUIEvent(target) && isObject(target?.view)) { return target?.view?.document?.activeElement ?? null; }

      // Duck type if target is a Document.
      if (isObject(target?.defaultView)) { return target?.activeElement ?? null; }

      // Duck type if target is a Window.
      if (isObject(target?.document) && isObject(target?.location)) { return target?.document?.activeElement ?? null; }

      throw new TypeError(`'target' must be a DOM Node / Element, Document, UIEvent, or Window.`);
   }

   /**
    * Convenience method to retrieve the `Document` value in the current context of a DOM Node / Element, EventTarget,
    * Document, UIEvent, or Window.
    *
    * @param {Document | EventTarget | Node | UIEvent | Window}  target - DOM Node / Element, EventTarget, Document,
    *        UIEvent or Window to query.
    *
    * @returns {Document} Active document.
    *
    * @throws {@link TypeError} Target must be a DOM Node / Element, Document, UIEvent, or Window.
    */
   static getDocument(target)
   {
      // Duck type if target is a Node / Element.
      if (typeof target?.nodeType === 'number') { return target?.ownerDocument; }

      // Duck type if target is a UIEvent.
      if (this.isUIEvent(target) && isObject(target?.view)) { return target?.view?.document; }

      // Duck type if target is a Document.
      if (isObject(target?.defaultView)) { return target; }

      // Duck type if target is a Window.
      if (isObject(target?.document) && isObject(target?.location)) { return target?.document; }

      throw new TypeError(`'target' must be a DOM Node / Element, Document, UIEvent, or Window.`);
   }

   /**
    * Convenience method to retrieve the `Window` value in the current context of a DOM Node / Element, EventTarget,
    * Document, or Window.
    *
    * @param {Document | EventTarget | Node | UIEvent | Window}  target - DOM Node / Element, EventTarget, Document,
    *        UIEvent or Window to query.
    *
    * @returns {Window} Active window.
    *
    * @throws {@link TypeError} Target must be a DOM Node / Element, Document, UIEvent, or Window.
    */
   static getWindow(target)
   {
      // Duck type if target is a Node / Element.
      if (typeof target?.nodeType === 'number') { return target.ownerDocument?.defaultView ?? globalThis; }

      // Duck type if target is a UIEvent.
      if (this.isUIEvent(target) && isObject(target?.view)) { return target?.view; }

      // Duck type if target is a Document.
      if (isObject(target?.defaultView)) { return target.defaultView ?? globalThis; }

      // Duck type if target is a Window.
      if (isObject(target?.document) && isObject(target?.location)) { return target; }

      throw new TypeError(`'target' must be a DOM Node / Element, Document, UIEvent, or Window.`);
   }

   // DOM Element typing ---------------------------------------------------------------------------------------------

   /**
    * Provides precise type checking if `target` is an Element.
    *
    * @param {unknown}  target - A potential Element to test.
    *
    * @returns {target is Element} Is `target` an Element.
    */
   static isElement(target)
   {
      if (target?.nodeType !== 1) { return false; }

      if (target instanceof this.#Element) { return true; }

      const OwnerElement = target?.ownerDocument?.defaultView?.Element;

      return OwnerElement && target instanceof OwnerElement;
   }

   /**
    * Provides precise type checking if `target` is a HTMLElement.
    *
    * @param {unknown}  target - A potential HTMLElement to test.
    *
    * @returns {target is HTMLElement} Is `target` an HTMLElement.
    */
   static isHTMLElement(target)
   {
      if (target?.nodeType !== 1) { return false; }

      if (target instanceof this.#HTMLElement) { return true; }

      const OwnerHTMLElement = target?.ownerDocument?.defaultView?.HTMLElement;

      return OwnerHTMLElement && target instanceof OwnerHTMLElement;
   }

   /**
    * Provides precise type checking if `target` is a Node.
    *
    * @param {unknown}  target - A potential Node to test.
    *
    * @returns {target is Node} Is `target` a DOM Node.
    */
   static isNode(target)
   {
      if (typeof target?.nodeType !== 'number') { return false; }

      if (target instanceof this.#Node) { return true; }

      const OwnerNode = target?.ownerDocument?.defaultView?.Node;

      return OwnerNode && target instanceof OwnerNode;
   }

   /**
    * Provides precise type checking if `target` is a SVGElement.
    *
    * @param {unknown}  target - A potential SVGElement to test.
    *
    * @returns {target is SVGElement} Is `target` an SVGElement.
    */
   static isSVGElement(target)
   {
      if (target?.nodeType !== 1) { return false; }

      if (target instanceof this.#SVGElement) { return true; }

      const OwnerSVGElement = target?.ownerDocument?.defaultView?.SVGElement;

      return OwnerSVGElement && target instanceof OwnerSVGElement;
   }

   // Event typing ---------------------------------------------------------------------------------------------------

   /**
    * Provides basic duck type checking for `Event` signature and optional constructor name(s).
    *
    * @param {unknown}  target - A potential DOM event to test.
    *
    * @param {string | Set<string>} [types] Specific constructor name or Set of constructor names to match.
    *
    * @returns {target is Event} Is `target` an Event with optional constructor name check.
    */
   static isEvent(target, types)
   {
      if (typeof target?.type !== 'string' || typeof target?.defaultPrevented !== 'boolean' ||
         typeof target?.stopPropagation !== 'function')
      {
         return false;
      }

      return types !== void 0 ? this.isCtorName(target, types) : true;
   }

   /**
    * Provides basic duck type checking for `Event` signature for standard mouse / pointer events including
    * `MouseEvent` and `PointerEvent`.
    *
    * @param {unknown}  target - A potential DOM event to test.
    *
    * @returns {target is PointerEvent} Is `target` a MouseEvent or PointerEvent.
    */
   static isPointerEvent(target)
   {
      return this.isEvent(target, this.#PointerEventSet);
   }

   /**
    * Provides basic duck type checking for `Event` signature for all UI events.
    *
    * @param {unknown}  target - A potential DOM event to test.
    *
    * @returns {target is UIEvent} Is `target` a UIEvent.
    * @see https://developer.mozilla.org/en-US/docs/Web/API/UIEvent
    */
   static isUIEvent(target)
   {
      return this.isEvent(target, this.#UIEventSet);
   }

   /**
    * Provides basic duck type checking for `Event` signature for standard user input events including `KeyboardEvent`,
    * `MouseEvent`, and `PointerEvent`.
    *
    * @param {unknown}  target - A potential DOM event to test.
    *
    * @returns {target is KeyboardEvent | MouseEvent | PointerEvent} Is `target` a Keyboard, MouseEvent, or PointerEvent.
    */
   static isUserInputEvent(target)
   {
      return this.isEvent(target, this.#InputEventSet);
   }

   // Generic typing -------------------------------------------------------------------------------------------------

   /**
    * Provides basic type checking by constructor name(s) for objects. This can be useful when checking multiple
    * constructor names against a provided Set.
    *
    * @param {unknown}  target - Object to test for constructor name.
    *
    * @param {string | Set<string>} types Specific constructor name or Set of constructor names to match.
    *
    * @returns {boolean} Does the provided object constructor name match the types provided.
    */
   static isCtorName(target, types)
   {
      if (!isObject(target)) { return false; }

      if (typeof types === 'string' && target?.constructor?.name === types) { return true; }

      return !!types?.has(target?.constructor?.name);
   }
}
